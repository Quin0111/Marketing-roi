"""Audit Dummy RMSE reproducibility without materializing final-Test outcomes.

Uses frozen Phase 4B.1 row membership and pandas skiprows BEFORE CSV parsing.
Fits only disposable research DummyRegressor instances. Never loads data_splits
joblib (it contains held-out targets), changes old results or fits Date features.
"""
import hashlib
import importlib.metadata
import inspect
import json
import math
from pathlib import Path
import platform
import re
import sys
import zipfile

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, root_mean_squared_error
from sklearn.model_selection import KFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parents[2]
OLD = ROOT / "research/outputs/phase4b1"
OUT = ROOT / "research/outputs/phase4b1a"
DATASET = ROOT.parent / "marketing_campaign_dataset.csv"
DOWNLOADS = Path("C:/Users/ASUS/Downloads")
NOTEBOOK = DOWNLOADS / "MachineLearningcki (8).ipynb"
FEATURES = ["Campaign_Type", "Channel_Used", "Target_Audience", "Customer_Segment", "Duration_days"]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def array_hash(values):
    return hashlib.sha256(np.asarray(values, dtype="<i8").tobytes()).hexdigest()


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def protected():
    roots = [ROOT / "src", ROOT / "backend/app", ROOT / "backend/models", ROOT / "backend/tests", OLD,
             ROOT / "research/templates"]
    files = [path for root in roots for path in root.rglob("*") if path.is_file() and "__pycache__" not in path.parts]
    files += [ROOT / name for name in ["README.md", "package.json", "package-lock.json", "vite.config.ts",
              "backend/README.md", "backend/requirements.txt", "backend/requirements.lock.txt",
              "research/phase4b1_data_audit.md", "research/phase4b1_feature_assessment.md",
              "research/phase4b1_recommendations.md", "research/README.md", "research/requirements-extra.txt"]]
    return {str(path.relative_to(ROOT)): sha(path) for path in sorted(set(files))}


def discover_sources():
    records = []
    # Restrict stored notebook snippets to source code, not output target samples.
    for folder in [DOWNLOADS, ROOT.parent]:
        for path in sorted(folder.rglob("*.ipynb") if folder == ROOT.parent else folder.glob("*.ipynb")):
            if any(part in {"node_modules", ".venv", ".deps"} for part in path.parts):
                continue
            notebook = json.loads(path.read_text(encoding="utf-8"))
            code = "\n".join("".join(cell.get("source", [])) for cell in notebook.get("cells", []) if cell.get("cell_type") == "code")
            if "marketing_campaign_dataset" not in code and "MachineLearningcki" not in path.name:
                continue
            cells = []
            for index, cell in enumerate(notebook.get("cells", [])):
                source = "".join(cell.get("source", []))
                if cell.get("cell_type") == "code" and any(term in source for term in
                    ["train_test_split(", "KFold(", "cross_validate(", "cross_val_score(",
                     "DummyRegressor", "model_metrics.json", "X_dev", "drop_duplicates(", "preprocessor"]):
                    cells.append({"index_zero_based": index, "execution_count": cell.get("execution_count"), "source": source})
            records.append({"path": str(path), "sha256": sha(path), "relevant_code_cells": cells,
                "contains_literal_historical_rmse_in_code": "1.732275" in code,
                "contains_fivefold_code": bool(re.search(r"n_splits\s*=\s*5", code)),
                "contains_development_variable": bool(re.search(r"\bX_dev\b|development_samples", code))})
    complete = DOWNLOADS / "DreamMakers_Models_Complete.zip"
    manifest = json.loads((ROOT / "backend/app/config/artifact_sha256.json").read_text())
    with zipfile.ZipFile(complete) as archive:
        archive_files = {item.filename: hashlib.sha256(archive.read(item)).hexdigest()
                         for item in archive.infolist() if not item.is_dir()}
    assert archive_files == manifest
    dataset_copies = []
    zip_candidates = set(DOWNLOADS.glob("marketing_campaign_dataset.csv*.zip"))
    zip_candidates.update(ROOT.parent.rglob("marketing_campaign_dataset*.zip"))
    for path in sorted(zip_candidates):
        with zipfile.ZipFile(path) as archive:
            for item in archive.infolist():
                if Path(item.filename).name == "marketing_campaign_dataset.csv":
                    dataset_copies.append({"archive": str(path), "member": item.filename,
                        "csv_sha256": hashlib.sha256(archive.read(item)).hexdigest(), "size": item.file_size})
    # Local agent history is provenance evidence, not an experiment execution log.
    history = []
    brain = Path("C:/Users/ASUS/.gemini/antigravity/brain")
    for path in sorted(brain.glob("*/.system_generated/logs/transcript_full.jsonl")):
        relevant = []
        algorithm_matches = 0
        for line_number, line in enumerate(path.open(encoding="utf-8"), 1):
            obj = json.loads(line)
            content = obj.get("content", "")
            if isinstance(content, str) and "1.732275" in content and not relevant:
                position = content.index("1.732275")
                relevant.append({"line": line_number, "role": obj.get("role"), "excerpt": content[max(0, position - 150):position + 300]})
            def count_algorithms(value):
                if isinstance(value, str):
                    return int(bool(re.search(r"KFold\(|cross_validate\(|cross_val_score\(|train_test_split\(", value)))
                if isinstance(value, dict): return sum(count_algorithms(v) for v in value.values())
                if isinstance(value, list): return sum(count_algorithms(v) for v in value)
                return 0
            algorithm_matches += count_algorithms(obj)
        if relevant:
            history.append({"path": str(path), "sha256": sha(path), "relevant_excerpts": relevant,
                            "algorithm_code_pattern_matches": algorithm_matches})
    discovery = {"notebooks": records, "complete_archive": {"path": str(complete), "sha256": sha(complete),
        "members_sha256": archive_files, "all_seven_match_deployed_artifacts": True,
        "contains_experiment_script_or_fold_manifest": False}, "dataset_zip_copies": dataset_copies,
        "agent_history": history,
        "local_python_search_scope": [str(ROOT.parent), str(DOWNLOADS), "C:/Users/ASUS/Documents", "C:/Users/ASUS/Desktop"],
        "local_python_search_result": "No prior ROI fivefold experiment script found in the inspected scopes; application fixtures are not experiment code.",
        "connected_drive_search": {"queries": ["MachineLearningcki", "DreamMakers"],
            "results": 0, "note": "Metadata-only connected Drive searches returned no accessible matches in this audit session."}}
    save("source_discovery.json", discovery)
    return discovery


def load_development():
    prior = json.loads((OLD / "audit_results.json").read_text(encoding="utf-8"))
    expected = next(value for path, value in prior["sources_sha256"].items() if path.endswith(".csv"))
    assert sha(DATASET) == expected
    membership = pd.read_csv(OLD / "split_membership.csv")
    train = membership.loc[membership.partition == "train", "csv_row_index_zero_based"].to_numpy()
    validation = membership.loc[membership.partition == "validation", "csv_row_index_zero_based"].to_numpy()
    test = membership.loc[membership.partition == "final_test_LOCKED", "csv_row_index_zero_based"].to_numpy()
    replay_train, temporary = train_test_split(np.arange(200000), test_size=.30, random_state=42)
    replay_val, replay_test = train_test_split(temporary, test_size=.50, random_state=42)
    assert all(np.array_equal(a, b) for a, b in [(train, replay_train), (validation, replay_val), (test, replay_test)])
    dev_ids = np.concatenate([train, validation])
    retained = set(dev_ids.tolist())
    assert retained.isdisjoint(test) and len(retained) == 170000
    requested_raw = ["Campaign_ID", "Campaign_Type", "Channel_Used", "Target_Audience", "Customer_Segment", "Duration", "ROI", "Date"]
    parsed = pd.read_csv(DATASET, usecols=requested_raw,
                         skiprows=lambda line: line > 0 and line - 1 not in retained)
    assert len(parsed) == 170000
    parsed.index = np.sort(dev_ids)
    parsed = parsed.loc[dev_ids].copy()
    assert len(parsed.index.intersection(test)) == 0
    assert np.isfinite(parsed.ROI).all()
    parsed["Duration_days"] = parsed.Duration.str.extract(r"(\d+)").astype(int)
    save("data_access.json", {"csv_sha256": expected, "membership_sha256": sha(OLD / "split_membership.csv"),
        "development_row_order_sha256_int64_le": array_hash(dev_ids),
        "parsed_rows": len(parsed), "heldout_rows_excluded_before_parsing": len(test),
        "skiprows_before_roi_materialization": True, "test_roi_read_for_analysis": False,
        "split_joblib_loaded": False, "date_used_for_fitting": False,
        "csv_bytes_hashed_without_interpreting_test_targets": True})
    return parsed, train, validation, test


def profile(label, ids, dev, n_splits=5, shuffle=True, seed=42, pipeline_preprocessor=None):
    frame = dev.loc[ids]
    y = frame.ROI.to_numpy(dtype=np.float64)
    x = frame[FEATURES]
    cv = KFold(n_splits=n_splits, shuffle=shuffle, random_state=seed if shuffle else None)
    splits = list(cv.split(x))
    rows, oof, manual_gaps, float32_gaps = [], np.empty(len(frame)), [], []
    for fold, (fit, assess) in enumerate(splits, 1):
        dummy = DummyRegressor(strategy="mean").fit(x.iloc[fit], y[fit])
        prediction = dummy.predict(x.iloc[assess])
        oof[assess] = prediction
        fsum_mean = math.fsum(map(float, y[fit])) / len(fit)
        fsum_rmse = math.sqrt(math.fsum((float(value) - fsum_mean) ** 2 for value in y[assess]) / len(assess))
        rmse = float(root_mean_squared_error(y[assess], prediction))
        mse = float(mean_squared_error(y[assess], prediction))
        manual_gaps.append(abs(fsum_rmse - rmse))
        mean32 = np.mean(y[fit].astype(np.float32), dtype=np.float32)
        rmse32 = np.sqrt(np.mean((y[assess].astype(np.float32) - mean32) ** 2, dtype=np.float32))
        float32_gaps.append(abs(float(rmse32) - rmse))
        rows.append({"profile": label, "fold": fold, "fit_rows": len(fit), "assessment_rows": len(assess),
            "fit_mean": float(dummy.constant_[0, 0]), "MSE": mse, "RMSE": rmse,
            "MAE": float(mean_absolute_error(y[assess], prediction)), "R2": float(r2_score(y[assess], prediction)),
            "fit_row_ids_sha256_int64_le": array_hash(ids[fit]),
            "assessment_row_ids_sha256_int64_le": array_hash(ids[assess])})
    aggregate = {"profile": label, "rows": len(frame), "n_splits": n_splits, "shuffle": shuffle,
        "random_state": seed if shuffle else None, "mean_fold_RMSE": float(np.mean([r["RMSE"] for r in rows])),
        "pooled_OOF_RMSE": float(root_mean_squared_error(y, oof)),
        "sqrt_weighted_fold_MSE": math.sqrt(sum(r["assessment_rows"] * r["MSE"] for r in rows) / len(frame)),
        "population_target_std": float(np.std(y, ddof=0)),
        "max_fsum_vs_sklearn_RMSE_difference": max(manual_gaps),
        "max_float32_vs_float64_RMSE_difference": max(float32_gaps)}
    aggregate["pooled_minus_mean_fold_RMSE"] = aggregate["pooled_OOF_RMSE"] - aggregate["mean_fold_RMSE"]
    if pipeline_preprocessor is not None:
        check_scores = cross_validate(DummyRegressor(strategy="mean"), x, y, cv=splits,
            scoring="neg_root_mean_squared_error", n_jobs=1, error_score="raise")
        aggregate["cross_validate_mean_fold_RMSE"] = float(-check_scores["test_score"].mean())
        # Fit a disposable copy, never the original production preprocessor/model.
        pipe = Pipeline([("preprocessor", clone(pipeline_preprocessor)), ("model", DummyRegressor(strategy="mean"))])
        pipe_scores = cross_validate(pipe, x, y, cv=splits,
            scoring="neg_root_mean_squared_error", n_jobs=1, error_score="raise")
        aggregate["pipeline_cross_validate_mean_fold_RMSE"] = float(-pipe_scores["test_score"].mean())
        aggregate["pipeline_vs_plain_max_fold_difference"] = float(np.max(np.abs(pipe_scores["test_score"] - check_scores["test_score"])))
    return aggregate, rows, splits


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    before = protected()
    discovery = discover_sources()
    dev, train, validation, test = load_development()
    manifest = json.loads((ROOT / "backend/app/config/artifact_sha256.json").read_text())
    artifact = ROOT / "backend/models/dummy_regressor_pipeline.joblib"
    assert sha(artifact) == manifest[artifact.name]
    original = joblib.load(artifact)
    deployed = {"strategy": original.named_steps["model"].strategy,
        "constant": float(original.named_steps["model"].constant_[0, 0]),
        "train140k_mean": float(dev.loc[train, "ROI"].mean()),
        "preprocessor_repr": repr(original.named_steps["preprocessor"]),
        "preprocessor_parameters_note": "Categorical most_frequent imputation + OHE; numeric median imputation; no target transform"}
    assert deployed["constant"] == deployed["train140k_mean"]
    dev_ids = dev.index.to_numpy()
    specifications = [
        ("dev_train_then_validation_shuffle42", dev_ids, 5, True),
        ("dev_sorted_csv_order_shuffle42", np.sort(dev_ids), 5, True),
        ("dev_train_then_validation_no_shuffle", dev_ids, 5, False),
        ("dev_sorted_csv_order_no_shuffle", np.sort(dev_ids), 5, False),
        ("original_train140k_fivefold_shuffle42", train, 5, True),
        ("original_train140k_threefold_notebook147", train, 3, True),
    ]
    summaries, fold_rows, canonical_splits = [], [], None
    for label, ids, n_splits, shuffle in specifications:
        summary, rows, splits = profile(label, ids, dev, n_splits, shuffle,
            pipeline_preprocessor=original.named_steps["preprocessor"] if label == specifications[0][0] else None)
        summaries.append(summary)
        fold_rows.extend(rows)
        if label == specifications[0][0]: canonical_splits = splits
        print(label, summary["mean_fold_RMSE"], flush=True)
    prior_folds = pd.read_csv(OLD / "development_fold_membership.csv")
    prior_scores = pd.read_csv(OLD / "diagnostic_cv_folds.csv")
    for fold, (fit, assess) in enumerate(canonical_splits, 1):
        assert np.array_equal(dev_ids[assess], prior_folds.loc[
            prior_folds.assessment_fold == fold, "csv_row_index_zero_based"].to_numpy())
        expected = prior_scores.loc[(prior_scores.model == "Dummy_mean") & (prior_scores.fold == fold), "RMSE"].iloc[0]
        assert abs(fold_rows[fold - 1]["RMSE"] - expected) < 1e-12
    pd.DataFrame(fold_rows).to_csv(OUT / "dummy_fold_metrics.csv", index=False)
    save("profile_summaries.json", summaries)
    # Counterfactual split recipes are examined with IDs only, NEVER their ROI.
    one_step_dev, _ = train_test_split(np.arange(200000), test_size=.15, random_state=42)
    alternate = {"one_step_85_15_seed42_development_rows": len(one_step_dev),
        "overlap_with_locked_original_test_indices": len(set(one_step_dev).intersection(test)),
        "outcomes_loaded_or_scored": False,
        "reason_not_evaluated": "Different membership includes original final-Test rows; prohibited for this audit"}
    # Verify Date strictly on retained Development; never include Date in X.
    actual_dates = pd.to_datetime(dev.Date, format="%Y-%m-%d")
    expected_dates = pd.Timestamp("2021-01-01") + pd.to_timedelta((dev.Campaign_ID - 1) % 365, unit="D")
    date_check = {"development_rows": len(dev), "exact_matches": int((actual_dates == expected_dates).sum()),
        "mismatches": int((actual_dates != expected_dates).sum()),
        "formula": "2021-01-01 + ((Campaign_ID - 1) mod 365) days", "used_for_training": False}
    # Freeze a future protocol and target-independent fold schedule, not Phase 4B.2 training.
    schedule = []
    seeds = [42, 2026, 20261103]
    for repeat, seed in enumerate(seeds, 1):
        for fold, (_, assess) in enumerate(KFold(5, shuffle=True, random_state=seed).split(dev_ids), 1):
            schedule.extend({"repeat": repeat, "outer_seed": seed, "assessment_fold": fold,
                "csv_row_index_zero_based": int(index)} for index in dev_ids[assess])
    schedule_path = OUT / "frozen_outer_fold_schedule.csv"
    pd.DataFrame(schedule).to_csv(schedule_path, index=False)
    protocol = {"protocol_id": "DM-DEV-170K-v1", "status": "FROZEN_FOR_REVIEW_NOT_EXECUTED_PHASE4B2",
        "dataset_sha256": sha(DATASET), "original_membership_sha256": sha(OLD / "split_membership.csv"),
        "development_order": "original Train140000 then original Validation30000, order preserved",
        "development_row_order_sha256_int64_le": array_hash(dev_ids),
        "outer_cv": {"n_splits": 5, "shuffle": True, "seeds": seeds,
                     "schedule_file": schedule_path.name, "schedule_sha256": sha(schedule_path)},
        "inner_cv": {"n_splits": 3, "shuffle": True,
                     "seed_rule": "100000 * repeat_1based + 1000 * outer_fold_1based + 17",
                     "scope": "outer fit rows only; fresh preprocessing per inner fit"},
        "dummy": {"strategy": "mean", "sample_weight": None, "fit_scope": "fit fold only", "target_transform": None},
        "aggregation": {"primary_per_repeat": "arithmetic mean of five fold RMSEs",
            "primary_over_repeats": "arithmetic mean of three per-repeat means",
            "secondary": ["pooled OOF RMSE per repeat", "MAE", "R2", "paired delta_RMSE", "fold SD (descriptive only)"]},
        "candidate_input_columns": FEATURES,
        "excluded_inputs": ["Date", "Month", "Weekday", "Campaign_ID", "Conversion_Rate", "Clicks", "Impressions", "Engagement_Score", "Acquisition_Cost"],
        "duration_condition": "planned Duration must be confirmed before business use; current5 is a research benchmark only",
        "fitting_rules": ["all learned preprocessing inside fit folds", "no target/sample weighting or target transforms unless separately preregistered",
            "same fold schedule for every candidate", "all trials recorded; no seed/split search for matching historical metrics",
            "no final-Test targets loaded or evaluated during Phase4B2", "Date blocked until timing and provenance verified"],
        "quality_gate": "BASELINE_ONLY", "optimization_allowed": False}
    save("phase4b2_evaluation_protocol.json", protocol)
    metadata = json.loads((ROOT / "backend/models/model_metadata.json").read_text(encoding="utf-8"))
    historical = json.loads((ROOT / "backend/models/model_metrics.json").read_text(encoding="utf-8"))
    canonical = summaries[0]
    historical_value = historical["results"]["Dummy Regressor"]["RMSE_mean"]
    source_files = {"DummyRegressor.fit": inspect.getsourcefile(inspect.unwrap(DummyRegressor.fit)),
                    "root_mean_squared_error": inspect.getsourcefile(inspect.unwrap(root_mean_squared_error))}
    source_hashes = {name: {"path": path, "sha256": sha(path)} for name, path in source_files.items()}
    (OUT / "installed_sklearn_source_extract.txt").write_text(
        inspect.getsource(DummyRegressor.fit) + "\n\n" + inspect.getsource(root_mean_squared_error), encoding="utf-8")
    static_ui = (ROOT / "src/data/modelResults.ts").read_text(encoding="utf-8")
    ui_scores = [float(value) for value in re.findall(r"dummyRmse:\s*([\d.]+)", static_ui)]
    assert len(ui_scores) == 5
    result = {"audit_execution": "PASS", "historical_reproduction": "FAIL_NOT_REPRODUCED_MISSING_PROVENANCE",
        "historical_rmse_preserved": historical_value, "canonical_new_rmse": canonical["mean_fold_RMSE"],
        "difference_from_historical": canonical["mean_fold_RMSE"] - historical_value,
        "mean_vs_pooled_gap": canonical["pooled_minus_mean_fold_RMSE"],
        "historical_gap_divided_by_aggregation_gap": (canonical["mean_fold_RMSE"] - historical_value) / canonical["pooled_minus_mean_fold_RMSE"],
        "versions": {"python": platform.python_version(), **{name: importlib.metadata.version(name) for name in ["numpy", "pandas", "scikit-learn", "scipy", "joblib"]}},
        "export_runtime_versions": metadata["runtime_versions"], "library_source_hashes": source_hashes,
        "deployed_dummy": deployed, "profiles": summaries, "alternate_split_index_only": alternate,
        "date_check": date_check, "complete_archive_verified": discovery["complete_archive"]["all_seven_match_deployed_artifacts"],
        "original_fold_indices_recovered": False, "phase4b1_diagnostic_fold_indices_recovered": True,
        "static_ui_dummy_fold_values": ui_scores, "static_ui_dummy_fold_arithmetic_mean": float(np.mean(ui_scores)),
        "final_test_roi_read": False, "phase4b2_started": False, "quality_gate": metadata["model_quality_status"]}
    after = protected()
    assert before == after
    save("protected_integrity.json", {"status": "PASS", "protected_files": len(before), "before": before, "after": after})
    save("audit_results.json", result)
    print(json.dumps({"audit_execution": result["audit_execution"], "historical_reproduction": result["historical_reproduction"],
        "new_rmse": result["canonical_new_rmse"], "aggregation_gap": result["mean_vs_pooled_gap"],
        "date_check": date_check, "protected_files_unchanged": len(before)}, indent=2), flush=True)


if __name__ == "__main__":
    main()
