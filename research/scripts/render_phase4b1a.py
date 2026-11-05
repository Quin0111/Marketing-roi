"""Render the audit with exact measured values and honest PASS/FAIL states."""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "research/outputs/phase4b1a"


def table(headers, rows):
    def clean(value): return str(value).replace("|", "\\|").replace("\n", " ")
    return "\n".join(["| " + " | ".join(map(clean, headers)) + " |", "|" + "---|" * len(headers)] +
                     ["| " + " | ".join(map(clean, row)) + " |" for row in rows])


def fmt(value):
    return f"{value:.16g}".replace(".", ",")


def main():
    result = json.loads((OUT / "audit_results.json").read_text(encoding="utf-8"))
    checks = json.loads((OUT / "verification_checks.json").read_text(encoding="utf-8"))
    integrity = json.loads((OUT / "protected_integrity.json").read_text(encoding="utf-8"))
    fold_metrics = pd.read_csv(OUT / "dummy_fold_metrics.csv")
    canonical = result["profiles"][0]
    first = fold_metrics[fold_metrics.profile == canonical["profile"]]
    export = result["export_runtime_versions"]
    version_rows = [["Python", export["python"], result["versions"]["python"]],
                    ["NumPy", export["numpy"], result["versions"]["numpy"]],
                    ["pandas", export["pandas"], result["versions"]["pandas"]],
                    ["scikit-learn", export["scikit_learn"], result["versions"]["scikit-learn"]],
                    ["joblib", export["joblib"], result["versions"]["joblib"]],
                    ["SciPy", "Không ghi", result["versions"]["scipy"]]]
    replacements = {
        "CANONICAL_FOLDS": table(["Fold", "Fit rows", "Assessment rows", "Mean ROI fit", "RMSE assessment"],
            [[int(row.fold), int(row.fit_rows), int(row.assessment_rows), fmt(row.fit_mean), fmt(row.RMSE)] for _, row in first.iterrows()]),
        "AGGREGATION_TABLE": table(["Đại lượng", "Giá trị"], [
            ["RMSE lịch sử giữ nguyên", fmt(result["historical_rmse_preserved"])],
            ["Mean RMSE năm fold hiện tại", fmt(canonical["mean_fold_RMSE"])],
            ["Pooled OOF RMSE hiện tại", fmt(canonical["pooled_OOF_RMSE"])],
            ["sqrt(weighted mean fold MSE)", fmt(canonical["sqrt_weighted_fold_MSE"])],
            ["Pooled − mean-fold", fmt(result["mean_vs_pooled_gap"])],
            ["Mean-fold hiện tại − lịch sử", fmt(result["difference_from_historical"])]]),
        "PROFILE_TABLE": table(["Profile", "Số dòng", "KFold", "Shuffle/seed", "Mean RMSE", "Khớp lịch sử <=1e-6"], [
            [row["profile"], row["rows"], row["n_splits"], f"{row['shuffle']}/{row['random_state']}", fmt(row["mean_fold_RMSE"]), "Không"]
            for row in result["profiles"]]),
        "VERSION_TABLE": table(["Thành phần", "Metadata lúc xuất", "Đối soát hiện tại"], version_rows),
        "CHECKS_TABLE": table(["Mã", "Kiểm tra", "Kết quả", "Bằng chứng"],
            [[row["id"], row["check"], row["status"], row["evidence"]] for row in checks["checks"]])
            + f"\n\n**{checks['pass_count']} PASS, {checks['fail_count']} FAIL chưa giải quyết được về provenance/tái lập lịch sử.**",
        "PROTECTED_COUNT": str(integrity["protected_files"]),
    }
    template = ROOT / "research/templates/phase4b1a_reproducibility_audit.md.in"
    text = template.read_text(encoding="utf-8")
    for token, value in replacements.items(): text = text.replace("{{" + token + "}}", value)
    assert "{{" not in text
    report = ROOT / "research/phase4b1a_reproducibility_audit.md"
    report.write_text(text, encoding="utf-8")
    print(report.name, "written with measured values and explicit unresolved FAILs")


if __name__ == "__main__":
    main()
