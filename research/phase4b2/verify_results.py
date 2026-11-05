"""Verify complete nested CV, quarantine, selection and independent replay."""
import json
from pathlib import Path

from common import HERE, ROOT, CONFIG_PATH, PROTOCOL_PATH, FEATURES, MODELS, runtime, load_verified, protected_snapshot, sha, ids_hash, metrics, write_json, np, pd

OUTPUT = HERE / "results"


def main():
    config, x, y, ids, assignments, access = load_verified()
    runtime()
    checks = []

    def require(label, condition, detail=""):
        if not condition: raise AssertionError(label + ": " + detail)
        checks.append({"check": label, "status": "PASS", "detail": detail})

    frozen = json.loads((OUTPUT / "preregistered_run.json").read_text(encoding="utf-8"))
    require("Frozen protocol/config/data/schedule hashes match", frozen["data_access"] == access)
    for name, path in [("common.py", HERE / "common.py"), ("run_experiment.py", HERE / "run_experiment.py"),
                       (CONFIG_PATH.name, CONFIG_PATH), (PROTOCOL_PATH.name, PROTOCOL_PATH)]:
        require("Experiment source unchanged: " + name, sha(path) == frozen["sources_sha256"][name])
    require("Exactly current5; no outcome/ID/Date/post-campaign inputs", list(x.columns) == FEATURES and x.shape == (170000, 5))
    require("No final-Test ROI materialized", access["test_roi_materialized"] is False and not access["split_joblib_loaded"])
    preflight = json.loads((OUTPUT / "preflight.json").read_text(encoding="utf-8"))
    require("All five preflight pipelines passed before full evaluation", preflight["status"] == "PASS"
            and len(preflight["rows"]) == 5 and all(row["finite_predictions"] for row in preflight["rows"])
            and not preflight["outer_assessment_used"])
    jobs = list((OUTPUT / "jobs").glob("*/completed.json"))
    require("All 75 outer jobs complete", len(jobs) == 75)
    trial_count, warning_count = 0, 0
    trial_ids = set()
    predictions_seen = {name: {repeat: set() for repeat in [1, 2, 3]} for name in MODELS}
    for path in jobs:
        job = json.loads(path.read_text(encoding="utf-8"))
        repeat, fold, name = job["repeat"], job["outer_fold"], job["model"]
        fit, assess = assignments[(repeat, fold)]
        require(f"Outer membership r{repeat} f{fold} {name}", job["fit_rows"] == 136000 and job["assessment_rows"] == 34000
                and job["fit_ids_sha256"] == ids_hash(ids[fit]) and job["assessment_ids_sha256"] == ids_hash(ids[assess]))
        with np.load(path.parent / "outer_predictions.npz", allow_pickle=False) as data:
            require(f"OOF identity/finite r{repeat} f{fold} {name}", np.array_equal(data["row_ids"], ids[assess])
                    and np.array_equal(data["y_development"], y[assess]) and np.isfinite(data["prediction"]).all())
            value = metrics(data["y_development"], data["prediction"])
            require(f"Raw metrics recompute r{repeat} f{fold} {name}", max(abs(value[key] - job["assessment_metrics"][key]) for key in value) <= 1e-12)
            if name == "Dummy":
                require(f"Dummy mean fit-only r{repeat} f{fold}", np.max(np.abs(data["prediction"] - y[fit].mean())) < 1e-12)
            existing = predictions_seen[name][repeat]
            require(f"No duplicate assessment rows per repeat {repeat}/{name}/fold{fold}", existing.isdisjoint(data["row_ids"]))
            existing.update(data["row_ids"].tolist())
        trials = json.loads((path.parent / "inner_trials.json").read_text(encoding="utf-8"))
        require(f"Complete candidate grid r{repeat} f{fold} {name}", len(trials) == 3 * len(config["models"][name])
                and {row["candidate"] for row in trials} == {row["candidate"] for row in config["models"][name]})
        means = []
        for candidate_order, candidate in enumerate(config["models"][name]):
            selected_rows = [row for row in trials if row["candidate"] == candidate["candidate"]]
            require(f"Three inner folds r{repeat} f{fold} {name}/{candidate['candidate']}", {row["inner_fold"] for row in selected_rows} == {1, 2, 3})
            means.append((float(np.mean([row["metrics"]["RMSE"] for row in selected_rows])), candidate_order, candidate["candidate"]))
        winner = min(means)
        require(f"Inner-only deterministic selection r{repeat} f{fold} {name}", winner[2] == job["selected"]["candidate"]
                and abs(winner[0] - job["selected"]["mean_inner_RMSE"]) < 1e-12)
        for trial in trials:
            identity = (repeat, fold, name, trial["candidate"], trial["inner_fold"])
            assert identity not in trial_ids
            trial_ids.add(identity)
            expected = next(row for row in access["inner_manifest"] if row["repeat"] == repeat
                            and row["outer_fold"] == fold and row["inner_fold"] == trial["inner_fold"])
            require("Inner fit/validation scope " + str(identity), trial["fit_ids_sha256"] == expected["fit_ids_sha256"]
                    and trial["assessment_ids_sha256"] == expected["assessment_ids_sha256"]
                    and trial["fit_rows"] == expected["fit_rows"] and trial["assessment_rows"] == expected["assessment_rows"])
            trial_count += 1
            warning_count += len(trial["warnings"])
        warning_count += len(job["warnings"])
    require("Exactly 360 inner fits recorded, no missing/duplicate trials", trial_count == config["expected_inner_fits"] == 360)
    require("Each model assesses all Development once per repeat", all(rows == set(ids) for by_repeat in predictions_seen.values() for rows in by_repeat.values()))
    require("All experiment fits completed without warnings", warning_count == 0, f"warning_count={warning_count}")
    # Recalculate paired deltas and primary aggregation, not pooled-RMSE substitution.
    outer = pd.read_csv(OUTPUT / "outer_fold_scores.csv")
    summary = json.loads((OUTPUT / "model_summary.json").read_text(encoding="utf-8"))
    for row in outer.itertuples():
        baseline = outer[(outer.model == "Dummy") & (outer["repeat"] == row.repeat) & (outer.outer_fold == row.outer_fold)].iloc[0]
        assert abs(row.delta_RMSE_vs_Dummy - (row.RMSE - baseline.RMSE)) < 1e-12
    require("Paired Dummy deltas use identical outer folds", True)
    for value in summary:
        subset = outer[outer.model == value["model"]]
        means = subset.groupby("repeat").RMSE.mean()
        require("Primary mean-of-repeat fold means: " + value["model"], len(subset) == 15 and abs(means.mean() - value["RMSE_mean"]) < 1e-12)
    previous = json.loads((ROOT / "research/outputs/phase4b1a/audit_results.json").read_text(encoding="utf-8"))
    dummy_first = outer[(outer.model == "Dummy") & (outer["repeat"] == 1)].RMSE.mean()
    require("Seed42 Dummy agrees with Phase4B1A new baseline", abs(dummy_first - previous["canonical_new_rmse"]) < 1e-12)
    replay = json.loads((OUTPUT / "reproducibility.json").read_text(encoding="utf-8"))
    require("All 75 outer refits reproduced independently", replay["status"] == "PASS" and replay["outer_refits_repeated"] == 75
            and replay["max_abs_prediction_error"] <= 1e-12 and replay["max_metric_error"] <= 1e-12)
    require("First-fold complete inner searches reproduced (24 fits)", replay["inner_fits_repeated"] == 24 and all(row["status"] == "PASS" for row in replay["inner_first_outer_fold"]))
    require("All 75 replay preprocessors match fit-only statistics", all(row["preprocessor_statistics_match_fit_only"] for row in replay["outer"]))
    before = json.loads((OUTPUT / "protected_before.json").read_text(encoding="utf-8"))
    after = protected_snapshot()
    require("Production and all prior research unchanged", before == after, f"{len(before)} protected files")
    metadata = json.loads((ROOT / "backend/models/model_metadata.json").read_text(encoding="utf-8"))
    require("Quality gate and recommendation restrictions unchanged", metadata["model_quality_status"] == "BASELINE_ONLY"
            and not metadata["quality_gate_rules"]["allow_optimization_recommendation"])
    write_json(OUTPUT / "final_integrity.json", {"status": "PASS", "protected_files": len(before), "before": before, "after": after})
    write_json(OUTPUT / "verification_checks.json", {"status": "PASS", "count": len(checks), "checks": checks,
        "model_validation_status": "NOT_VALIDATED: research verification does not establish predictive or causal benefit"})
    print(f"PASS: {len(checks)} checks; 75 outer, 360 inner; Development-only and prior files unchanged", flush=True)


if __name__ == "__main__":
    main()
