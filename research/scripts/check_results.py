"""Check split isolation, scientific output invariants and source integrity."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "research/.deps"))
import pandas as pd

OUT = ROOT / "research/outputs/phase4b1"


def main():
    result = json.loads((OUT / "audit_results.json").read_text(encoding="utf-8"))
    integrity = json.loads((OUT / "integrity.json").read_text(encoding="utf-8"))
    split = pd.read_csv(OUT / "split_membership.csv")
    folds = pd.read_csv(OUT / "development_fold_membership.csv")
    groups = pd.read_csv(OUT / "development_group_statistics.csv")
    cv = pd.read_csv(OUT / "diagnostic_cv_folds.csv")
    checks = []

    def require(name, condition):
        if not condition:
            raise AssertionError(name)
        checks.append({"check": name, "status": "PASS"})

    key = "csv_row_index_zero_based"
    development_ids = set(split.loc[split.partition != "final_test_LOCKED", key])
    final_test_ids = set(split.loc[split.partition == "final_test_LOCKED", key])
    require("Original archived split index/order matched", all(result["split_protocol"]["archive_index_order_matches"].values()))
    require("Exactly 200000 unique row IDs partitioned", len(split) == split[key].nunique() == 200000)
    require("Original 170000 Development and 30000 final Test", len(development_ids) == 170000 and len(final_test_ids) == 30000)
    require("All assessment rows are Development; no final Test", set(folds[key]) == development_ids and set(folds[key]).isdisjoint(final_test_ids))
    require("Each Development row assessed exactly once", len(folds) == folds[key].nunique() == 170000)
    require("Exactly five assessment folds of 34000", folds.groupby("assessment_fold").size().tolist() == [34000] * 5)
    require("Each feature group count sums to Development only", (groups.groupby("feature")["count"].sum() == 170000).all())
    require("All CV fits/assessments use 136000/34000", (cv.fit_rows == 136000).all() and (cv.assessment_rows == 34000).all())
    require("Each diagnostic model has five folds", (cv.groupby("model").size() == 5).all())
    require("Historical metrics not represented as reproduction", result["split_protocol"]["historical_5fold_code_found"] is False)
    require("Production models not fitted; no Test outcome research", result["production_models_fitted"] is False and result["test_outcomes_used_for_research"] is False)
    for row in result["development_audit"]["effects"]:
        require("Holm adjusted p >= raw: " + row["feature"], row["anova_p_holm_10_tests"] >= row["anova_p"])
    for row in result["diagnostic_cv"]:
        frame = cv[cv.model == row["model"]]
        require("Fold mean aggregation: " + row["model"], abs(frame.RMSE.mean() - row["RMSE_mean"]) < 1e-12)
    require("Protected before/after snapshots identical", integrity["before"] == integrity["after"])
    for relative_path, expected in integrity["before"].items():
        actual = hashlib.sha256((ROOT / relative_path).read_bytes()).hexdigest()
        if actual != expected:
            raise AssertionError("Protected file changed: " + relative_path)
    require("All 66 original protected files still byte-identical", len(integrity["before"]) == 66)
    for path, expected in result["sources_sha256"].items():
        require("Source unchanged: " + Path(path).name, hashlib.sha256(Path(path).read_bytes()).hexdigest() == expected)
    metadata = json.loads((ROOT / "backend/models/model_metadata.json").read_text(encoding="utf-8"))
    require("Quality gate still BASELINE_ONLY", metadata["model_quality_status"] == result["quality_gate"] == "BASELINE_ONLY")
    for filename in ["phase4b1_data_audit.md", "phase4b1_feature_assessment.md", "phase4b1_recommendations.md"]:
        text = (ROOT / "research" / filename).read_text(encoding="utf-8")
        require("Report rendered UTF-8: " + filename, "{{" not in text and "\ufffd" not in text and "nghiên" in text.lower())
    (OUT / "verification_checks.json").write_text(json.dumps({"status": "PASS", "checks": checks}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"PASS: {len(checks)} verification checks; original Test isolated and protected project unchanged")


if __name__ == "__main__":
    main()
