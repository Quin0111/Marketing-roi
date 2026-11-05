"""Independently repeat all selected outer refits and the first full inner search."""
import json
from pathlib import Path
import time

from common import (HERE, MODELS, runtime, load_verified, make_pipeline, metrics, write_json,
                    sha, prediction_hash, np, KFold, FEATURES)

OUTPUT = HERE / "results"


def check_preprocessor(pipeline, x_fit):
    prep = pipeline.named_steps["preprocessor"]
    assert list(prep.feature_names_in_) == FEATURES
    cat = prep.named_transformers_["categorical"]
    expected_mode = [x_fit[column].mode().iloc[0] for column in FEATURES[:-1]]
    assert list(cat.named_steps["imputer"].statistics_) == expected_mode
    assert float(prep.named_transformers_["numeric"].named_steps["imputer"].statistics_[0]) == float(np.median(x_fit.Duration_days))
    for column, categories in zip(FEATURES[:-1], cat.named_steps["encoder"].categories_):
        assert list(categories) == sorted(x_fit[column].unique().tolist())
    num = prep.named_transformers_["numeric"]
    if "scaler" in num.named_steps:
        assert abs(float(num.named_steps["scaler"].mean_[0]) - float(x_fit.Duration_days.mean())) < 1e-12


def main():
    config, x, y, ids, assignments, access = load_verified()
    environment = runtime()
    jobs = sorted((OUTPUT / "jobs").glob("*/completed.json"))
    assert len(jobs) == 75, "PARTIAL: cannot verify a full experiment before 75 jobs finish"
    rows = []
    partial_path = OUTPUT / "reproduction_progress.json"
    for path in jobs:
        job = json.loads(path.read_text(encoding="utf-8"))
        fit, assess = assignments[(job["repeat"], job["outer_fold"])]
        model = make_pipeline(job["model"], job["selected"]["params"], config)
        started = time.perf_counter()
        model.fit(x.iloc[fit], y[fit])
        seconds = time.perf_counter() - started
        check_preprocessor(model, x.iloc[fit])
        prediction = model.predict(x.iloc[assess])
        with np.load(path.parent / "outer_predictions.npz", allow_pickle=False) as old:
            assert np.array_equal(old["row_ids"], ids[assess])
            assert np.array_equal(old["y_development"], y[assess])
            max_error = float(np.max(np.abs(old["prediction"] - prediction)))
        value = metrics(y[assess], prediction)
        metric_error = max(abs(value[key] - job["assessment_metrics"][key]) for key in value)
        assert max_error <= 1e-12 and metric_error <= 1e-12, (path, max_error, metric_error)
        rows.append({"repeat": job["repeat"], "outer_fold": job["outer_fold"], "model": job["model"],
            "max_abs_prediction_error": max_error, "max_metric_error": metric_error,
            "bitwise_prediction_hash_equal": prediction_hash(prediction) == job["prediction_sha256_f64_le"],
            "replay_fit_seconds": seconds, "preprocessor_statistics_match_fit_only": True, "status": "PASS"})
        write_json(partial_path, {"status": "PARTIAL", "outer_refits_reproduced": len(rows), "required": 75})
        if len(rows) % 5 == 0: print(f"REPLAY outer refits {len(rows)}/75", flush=True)
    inner_rows = []
    fit, assess = assignments[(1, 1)]
    for name in MODELS:
        job_path = OUTPUT / "jobs" / f"r1_f1_{name}"
        trials = json.loads((job_path / "inner_trials.json").read_text(encoding="utf-8"))
        for candidate in config["models"][name]:
            for fold, (inner_fit, inner_assess) in enumerate(KFold(3, shuffle=True, random_state=101017).split(fit), 1):
                fit_pos, val_pos = fit[inner_fit], fit[inner_assess]
                assert np.intersect1d(fit_pos, assess).size == np.intersect1d(val_pos, assess).size == 0
                model = make_pipeline(name, candidate["params"], config)
                model.fit(x.iloc[fit_pos], y[fit_pos])
                check_preprocessor(model, x.iloc[fit_pos])
                value = metrics(y[val_pos], model.predict(x.iloc[val_pos]))
                original = next(row for row in trials if row["candidate"] == candidate["candidate"] and row["inner_fold"] == fold)
                error = max(abs(value[key] - original["metrics"][key]) for key in value)
                assert error <= 1e-12
                inner_rows.append({"model": name, "candidate": candidate["candidate"], "inner_fold": fold,
                    "max_metric_error": error, "status": "PASS"})
    assert len(inner_rows) == 24
    summary = {"status": "PASS", "outer_refits_repeated": 75, "outer_refits_required": 75,
        "inner_fits_repeated": 24, "inner_fits_original_experiment": 360,
        "scope": "All selected outer refits independently repeated; all first-outer-fold inner trials repeated. Not a second full 360-fit nested search.",
        "prediction_tolerance": 1e-12, "metric_tolerance": 1e-12,
        "max_abs_prediction_error": max(row["max_abs_prediction_error"] for row in rows),
        "max_metric_error": max(row["max_metric_error"] for row in rows),
        "outer": rows, "inner_first_outer_fold": inner_rows, "environment": environment,
        "verifier_source_sha256": sha(Path(__file__).resolve()), "test_roi_materialized": access["test_roi_materialized"]}
    write_json(OUTPUT / "reproducibility.json", summary)
    write_json(partial_path, {"status": "COMPLETE", "outer_refits_reproduced": 75, "inner_fits_reproduced": 24})
    print("REPRODUCTION PASS: all 75 selected outer refits and 24 first-fold inner fits", flush=True)


if __name__ == "__main__":
    main()
