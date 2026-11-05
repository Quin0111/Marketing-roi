"""Run frozen repeated nested CV; checkpoint every outer/model job."""
import argparse
import json
from pathlib import Path
import sys
import time
import warnings

from common import (HERE, FEATURES, MODELS, CONFIG_PATH, PROTOCOL_PATH, runtime, load_verified,
                    make_pipeline, metrics, protected_snapshot, write_json, sha, ids_hash, prediction_hash, np, KFold)

OUTPUT = HERE / "results"


def sources():
    return {path.name: sha(path) for path in [HERE / "common.py", Path(__file__).resolve(), CONFIG_PATH, PROTOCOL_PATH]}


def fit_checked(name, candidate, config, x, y, fit, assess):
    assert np.intersect1d(fit, assess).size == 0
    pipeline = make_pipeline(name, candidate["params"], config)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        started = time.perf_counter()
        pipeline.fit(x.iloc[fit], y[fit])
        fit_seconds = time.perf_counter() - started
        assert list(pipeline.named_steps["preprocessor"].feature_names_in_) == FEATURES
        assessment_pred = pipeline.predict(x.iloc[assess])
        fit_pred = pipeline.predict(x.iloc[fit])
    return pipeline, assessment_pred, metrics(y[assess], assessment_pred), metrics(y[fit], fit_pred), fit_seconds, [str(item.message) for item in caught]


def prepare():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    config, x, y, ids, assignments, access = load_verified()
    environment = runtime()
    identity = {"sources_sha256": sources(), "protocol_id": config["protocol_id"],
                "data_access": access, "environment": environment}
    freeze = OUTPUT / "preregistered_run.json"
    if freeze.exists():
        existing = json.loads(freeze.read_text(encoding="utf-8"))
        assert existing["sources_sha256"] == identity["sources_sha256"], "Code/config changed; do not mix runs"
        assert existing["data_access"] == access, "Data/folds changed; stop"
    else:
        write_json(freeze, identity)
        write_json(OUTPUT / "protected_before.json", protected_snapshot())
    return config, x, y, ids, assignments


def preflight(config, x, y, ids, assignments):
    fit, _ = assignments[(1, 1)]
    small_fit, small_assess = fit[:10000], fit[10000:11000]
    rows = []
    for name in MODELS:
        candidate = config["models"][name][0]
        _, prediction, _, _, seconds, caught = fit_checked(name, candidate, config, x, y, small_fit, small_assess)
        rows.append({"model": name, "candidate": candidate["candidate"], "fit_rows": len(small_fit),
            "assessment_rows": len(small_assess), "fit_seconds": seconds, "finite_predictions": bool(np.isfinite(prediction).all()),
            "warnings": caught, "used_to_select_or_change_config": False})
        print(f"PREFLIGHT {name}: finite predictions, fit {seconds:.3f}s", flush=True)
    write_json(OUTPUT / "preflight.json", {"status": "PASS", "rows": rows,
        "original_config_sha256": sha(CONFIG_PATH), "outer_assessment_used": False})


def run_model(repeat, fold, name, config, x, y, ids, assignments):
    directory = OUTPUT / "jobs" / f"r{repeat}_f{fold}_{name}"
    checkpoint = directory / "completed.json"
    if checkpoint.exists():
        result = json.loads(checkpoint.read_text(encoding="utf-8"))
        assert result["sources_sha256"] == sources()
        return
    directory.mkdir(parents=True, exist_ok=True)
    fit, assess = assignments[(repeat, fold)]
    inner_seed = 100000 * repeat + 1000 * fold + 17
    inner_splits = list(KFold(3, shuffle=True, random_state=inner_seed).split(fit))
    trial_rows = []
    for order, candidate in enumerate(config["models"][name]):
        for inner_fold, (inner_fit, inner_assess) in enumerate(inner_splits, 1):
            fitted_ids, validation_ids = fit[inner_fit], fit[inner_assess]
            assert np.intersect1d(fitted_ids, assess).size == np.intersect1d(validation_ids, assess).size == 0
            _, _, value, train_value, seconds, caught = fit_checked(name, candidate, config, x, y, fitted_ids, validation_ids)
            trial_rows.append({"repeat": repeat, "outer_fold": fold, "model": name,
                "candidate_order": order, "candidate": candidate["candidate"], "params": candidate["params"],
                "inner_fold": inner_fold, "inner_seed": inner_seed, "fit_rows": len(fitted_ids), "assessment_rows": len(validation_ids),
                "fit_ids_sha256": ids_hash(ids[fitted_ids]), "assessment_ids_sha256": ids_hash(ids[validation_ids]),
                "metrics": value, "train_metrics": train_value, "fit_seconds": seconds, "warnings": caught})
            write_json(directory / "inner_trials.json", trial_rows)
    candidate_means = []
    for order, candidate in enumerate(config["models"][name]):
        scores = [row["metrics"]["RMSE"] for row in trial_rows if row["candidate"] == candidate["candidate"]]
        assert len(scores) == 3
        candidate_means.append({"candidate_order": order, "candidate": candidate["candidate"],
            "mean_inner_RMSE": float(np.mean(scores)), "params": candidate["params"]})
    selected = min(candidate_means, key=lambda row: (row["mean_inner_RMSE"], row["candidate_order"]))
    _, pred, assessment_metrics, train_metrics, fit_seconds, caught = fit_checked(name, selected, config, x, y, fit, assess)
    pred_path = directory / "outer_predictions.npz"
    np.savez_compressed(pred_path, row_ids=ids[assess], y_development=y[assess], prediction=pred)
    result = {"status": "COMPLETE", "sources_sha256": sources(), "repeat": repeat,
        "outer_seed": config["outer_seeds"][repeat - 1], "outer_fold": fold, "model": name,
        "feature_group": "current5", "selected": selected, "all_candidate_means": candidate_means,
        "inner_trials": len(trial_rows), "inner_total_fit_seconds": sum(row["fit_seconds"] for row in trial_rows),
        "fit_rows": len(fit), "assessment_rows": len(assess), "fit_ids_sha256": ids_hash(ids[fit]),
        "assessment_ids_sha256": ids_hash(ids[assess]), "train_metrics": train_metrics,
        "assessment_metrics": assessment_metrics, "train_assessment_RMSE_gap": assessment_metrics["RMSE"] - train_metrics["RMSE"],
        "outer_refit_seconds": fit_seconds, "prediction_sha256_f64_le": prediction_hash(pred),
        "prediction_file_sha256": sha(pred_path), "warnings": caught}
    write_json(checkpoint, result)
    print(f"OUTER r{repeat}/f{fold} {name}: RMSE={assessment_metrics['RMSE']:.9f}; {selected['candidate']}", flush=True)
    completed = len(list((OUTPUT / "jobs").glob("*/completed.json")))
    write_json(OUTPUT / "progress.json", {"status": "COMPLETE" if completed == 75 else "PARTIAL",
        "outer_jobs_completed": completed, "outer_jobs_required": 75,
        "last_completed": f"r{repeat}_f{fold}_{name}"})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args()
    config, x, y, ids, assignments = prepare()
    if not (OUTPUT / "preflight.json").exists(): preflight(config, x, y, ids, assignments)
    if args.preflight_only: return
    for repeat in range(1, 4):
        for fold in range(1, 6):
            for name in MODELS: run_model(repeat, fold, name, config, x, y, ids, assignments)
    before = json.loads((OUTPUT / "protected_before.json").read_text(encoding="utf-8"))
    after = protected_snapshot()
    assert before == after, "Protected original source/artifacts changed"
    write_json(OUTPUT / "integrity_after_experiment.json", {"status": "PASS", "protected_files": len(before),
        "before": before, "after": after})
    print("EXPERIMENT COMPLETE: 75 outer evaluations; 360 inner fits; protected originals unchanged", flush=True)


if __name__ == "__main__":
    try: main()
    except Exception:
        import traceback
        OUTPUT.mkdir(parents=True, exist_ok=True)
        (OUTPUT / "failure.log").write_text(traceback.format_exc(), encoding="utf-8")
        raise
