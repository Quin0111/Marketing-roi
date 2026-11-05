"""Verify trusted team artifacts without fitting or modifying any model.

Run: backend/.venv/Scripts/python.exe backend/tests/verify_models.py
"""
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import platform
import sys
import warnings
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.utils.validation import check_is_fitted

BACKEND = Path(__file__).resolve().parents[1]
MODELS = BACKEND / "models"
FEATURES = ["Campaign_Type", "Channel_Used", "Target_Audience",
            "Customer_Segment", "Duration_days"]
FILES = {
    "Dummy Regressor": "dummy_regressor_pipeline.joblib",
    "Linear Regression": "linear_regression_pipeline.joblib",
    "Decision Tree": "decision_tree_pipeline.joblib",
    "Random Forest": "random_forest_pipeline.joblib",
}
TOLERANCE = 1e-6


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    report = {"executed_at": datetime.now(timezone.utc).isoformat(),
              "python": platform.python_version(), "executable": sys.executable,
              "versions": {p: importlib.metadata.version(p) for p in
                           ["scikit-learn", "numpy", "pandas", "joblib", "scipy"]},
              "checks": [], "predictions": [], "runtime_differences": {}}

    def check(name, condition, detail=""):
        report["checks"].append({"check": name, "status": "PASS" if condition else "FAIL",
                                 "detail": detail})

    def hashes():
        return {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted(MODELS.iterdir()) if p.is_file()}

    before = hashes()
    metadata = json.loads((MODELS / "model_metadata.json").read_text(encoding="utf-8"))
    reference = json.loads((MODELS / "reference_prediction.json").read_text(encoding="utf-8"))
    metrics = json.loads((MODELS / "model_metrics.json").read_text(encoding="utf-8"))
    check("Python 3.13", sys.version_info[:2] == (3, 13))
    for key, package in [("scikit_learn", "scikit-learn"), ("numpy", "numpy"),
                         ("pandas", "pandas"), ("joblib", "joblib")]:
        expected = metadata["runtime_versions"][key]
        check(f"Version {package}", report["versions"][package] == expected, expected)
    if report["python"] != metadata["runtime_versions"]["python"]:
        report["runtime_differences"]["python"] = {
            "actual": report["python"], "export": metadata["runtime_versions"]["python"],
            "note": "Patch version differs; numerical compatibility checked below."}
    check("Feature contract", metadata["features"] == reference["feature_names"] == FEATURES)
    check("Target ROI", metadata["target"] == "ROI")
    check("Quality gate", all(v == "BASELINE_ONLY" for v in
          [metadata["model_quality_status"], reference["quality_gate"], metrics["quality_gate"]]))
    check("No ranking or optimization", metadata["quality_gate_rules"] == {
        "allow_prediction": True, "allow_automatic_ranking": False,
        "allow_optimization_recommendation": False})
    check("Illustration model", metadata["deployed_model"] == "Linear Regression")
    check("Artifact file contract", metadata["model_files"] == FILES)
    check("Two reference campaigns", len(reference["cases"]) == 2)
    for name, filename in FILES.items():
        try:
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                pipeline = joblib.load(MODELS / filename)
                if not isinstance(pipeline, Pipeline):
                    raise TypeError("Artifact is not a sklearn Pipeline")
                check_is_fitted(pipeline)
                check_is_fitted(pipeline.steps[-1][1])
                check_is_fitted(pipeline.steps[0][1])
                check(f"{name}: fitted Pipeline", True)
                check(f"{name}: five input features",
                      list(pipeline.feature_names_in_) == FEATURES and pipeline.n_features_in_ == 5)
                for case in reference["cases"]:
                    if set(case["features"]) != set(FEATURES):
                        raise ValueError("Reference case has unexpected features")
                    frame = pd.DataFrame([case["features"]], columns=FEATURES)
                    actual = float(pipeline.predict(frame)[0])
                    expected = float(case["expected_predictions"][name])
                    error = abs(actual - expected)
                    passed = math.isfinite(actual) and math.isfinite(expected) and error <= TOLERANCE
                    report["predictions"].append({"model": name, "case": case["name"],
                        "prediction": actual, "reference": expected, "absolute_error": error,
                        "status": "PASS" if passed else "FAIL"})
                    check(f"{name}: {case['name']}", passed, f"absolute_error={error:.12g}")
                check(f"{name}: no load/predict warnings", not caught,
                      "; ".join(str(w.message) for w in caught))
        except Exception as exc:
            check(f"{name}: verification", False, f"{type(exc).__name__}: {exc}")
    after = hashes()
    check("Original artifacts unchanged (SHA256)", before == after)
    report["artifact_sha256"] = after
    report["status"] = "PASS" if all(c["status"] == "PASS" for c in report["checks"]) else "FAIL"
    destination = BACKEND / "tests" / "phase1_results.json"
    destination.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Python {report['python']} | {report['versions']}")
    for row in report["checks"]:
        print(f"{row['status']:4} | {row['check']} | {row['detail']}")
    print("\nModel | Campaign | Prediction | Reference | Absolute error | Status")
    for row in report["predictions"]:
        print(f"{row['model']} | {row['case']} | {row['prediction']:.15f} | "
              f"{row['reference']:.15f} | {row['absolute_error']:.12g} | {row['status']}")
    print(f"\nPHASE 1: {report['status']}\nReport: {destination}")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
