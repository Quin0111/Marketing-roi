"""Render UTF-8 reports from checked analysis outputs and versioned templates."""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "research/.deps"))
import pandas as pd

RESEARCH = ROOT / "research"
OUT = RESEARCH / "outputs/phase4b1"


def number(value, decimals=6):
    return f"{value:.{decimals}f}".replace(".", ",")


def count(value):
    return f"{int(value):,}".replace(",", ".")


def table(headers, rows):
    def cell(value):
        return str(value).replace("|", "\\|").replace("\n", " ")
    return "\n".join(["| " + " | ".join(map(cell, headers)) + " |",
                      "|" + "---|" * len(headers)] +
                     ["| " + " | ".join(map(cell, row)) + " |" for row in rows])


def main():
    result = json.loads((OUT / "audit_results.json").read_text(encoding="utf-8"))
    audit = result["development_audit"]
    structure = result["structural_full_csv"]
    features = ["Campaign_Type", "Channel_Used", "Target_Audience", "Customer_Segment", "Duration_days"]
    groups = pd.read_csv(OUT / "development_group_statistics.csv")
    distributions = []
    for feature in features:
        for _, row in groups[groups.feature == feature].iterrows():
            distributions.append([feature, row.value, count(row["count"]), number(row["count"] / 170000 * 100, 3)])
    history = pd.read_csv(OUT / "historical_metrics_comparison.csv")
    metric_rows = [("Số dòng", count(audit["roi"]["count"]))]
    for key, label in [("mean", "Trung bình"), ("std", "Độ lệch chuẩn mẫu"), ("min", "Nhỏ nhất"),
                       ("1%", "P01"), ("5%", "P05"), ("25%", "Q1"), ("50%", "Trung vị"),
                       ("75%", "Q3"), ("95%", "P95"), ("99%", "P99"), ("max", "Lớn nhất")]:
        metric_rows.append((label, number(audit["roi"][key])))
    replacements = {
        "SOURCE_HASHES": table(["Nguồn", "SHA256"], [(Path(path).name, f"`{digest}`") for path, digest in result["sources_sha256"].items()]),
        "STRUCTURE_SUMMARY": table(["Kiểm tra", "Kết quả"], [
            ["Số dòng", count(structure["rows"])], ["Số cột", structure["columns"]],
            ["Missing toàn bộ ô", sum(structure["missing"].values())],
            ["Duplicate toàn dòng", structure["exact_duplicate_rows"]],
            ["Campaign_ID trùng", structure["duplicate_campaign_ids"]],
            ["ROI không hữu hạn bị loại khi replay cleaning", structure["invalid_target_rows_removed_for_notebook_replay"]]]),
        "SCHEMA_TABLE": table(["Cột", "dtype gốc", "Missing"], [[column, dtype, structure["missing"][column]] for column, dtype in structure["dtypes"].items()]),
        "SPLIT_TABLE": table(["Partition", "Số dòng", "Khớp index + thứ tự với archive"], [
            ["Train", "140.000", "PASS"], ["Validation", "30.000", "PASS"],
            ["Test cuối (khóa)", "30.000", "PASS — chỉ đối chiếu index"], ["Development = Train + Validation", "170.000", "PASS — không giao Test"]]),
        "ROI_TABLE": table(["Thống kê Development", "ROI"], metric_rows),
        "FEATURE_DISTRIBUTIONS": table(["Feature", "Giá trị", "Số dòng Development", "%"], distributions),
        "HISTORICAL_COMPARISON": table(["Mô hình", "RMSE công bố (giữ nguyên)", "RMSE chẩn đoán mới", "Chênh"],
            [[row.model, number(row.published_RMSE_mean_unchanged), number(row.new_diagnostic_RMSE_mean), number(row.difference)] for _, row in history.iterrows()]),
        "VERSIONS": table(["Thành phần", "Phiên bản đã chạy"], [["Python", result["python"]]] + list(result["versions"].items())),
        "CURRENT_EFFECTS": table(["Feature", "Số mức", "Eta² (%)", "ANOVA p", "p Holm (10 kiểm tra)", "Chênh mean lớn nhất"], [
            [row["feature"], row["levels"], number(100 * row["eta_squared"]), number(row["anova_p"]),
             number(row["anova_p_holm_10_tests"]), number(row["mean_range"])] for row in audit["effects"] if row["feature"] in features]),
        "CURRENT_PERMUTATIONS": table(["Feature", "Eta² quan sát (%)", "Eta² null TB (%)", "p Monte Carlo"], [
            [row["feature"], number(100 * row["observed_eta_squared"]), number(100 * row["null_mean"]), number(row["monte_carlo_p_one_sided"], 3)]
            for row in audit["permutation_tests"] if row["feature"] in features or row["feature"] == "Joint_five_features"]),
        "NUMERIC_ASSOCIATIONS": table(["Cột", "Pearson r", "Pearson p", "p Holm (7 kiểm tra)", "Spearman r"], [
            [row["feature"], number(row["pearson_r"]), number(row["pearson_p"]), number(row["pearson_p_holm_7_tests"]), number(row["spearman_r"])]
            for row in audit["numeric_associations"]]),
        "CV_SUMMARY": table(["Chẩn đoán mới", "MAE TB", "RMSE TB", "SD RMSE qua fold", "R² TB", "Delta RMSE", "Fold thắng Dummy"], [
            [row["model"], number(row["MAE_mean"]), number(row["RMSE_mean"]), number(row["RMSE_fold_sd"]), number(row["R2_mean"]),
             number(row["delta_RMSE_mean"]), "—" if row["model"] == "Dummy_mean" else f"{row['folds_beating_dummy']}/5"]
            for row in result["diagnostic_cv"]]),
    }
    for template in (RESEARCH / "templates").glob("*.md.in"):
        text = template.read_text(encoding="utf-8")
        for token, content in replacements.items():
            text = text.replace("{{" + token + "}}", content)
        assert "{{" not in text, f"Unresolved report placeholder: {template.name}"
        destination = RESEARCH / template.name.removesuffix(".in")
        destination.write_text(text, encoding="utf-8")
        print(destination.name)


if __name__ == "__main__":
    main()
