"""Recompute raw/summary metrics directly from Development-only OOF files."""
import json
from pathlib import Path
import sys

from common import HERE, ROOT, MODELS, metrics, write_json, np, pd

OUTPUT = HERE / "results"


def main():
    paths = sorted((OUTPUT / "jobs").glob("*/completed.json"))
    jobs = [json.loads(path.read_text(encoding="utf-8")) for path in paths]
    assert len(jobs) == 75, "PARTIAL: missing outer jobs"
    rows, inner_rows = [], []
    for path, job in zip(paths, jobs):
        with np.load(path.parent / "outer_predictions.npz", allow_pickle=False) as data:
            values = metrics(data["y_development"], data["prediction"])
            assert max(abs(values[key] - job["assessment_metrics"][key]) for key in values) <= 1e-12
        baseline = next(row for row in jobs if row["repeat"] == job["repeat"] and row["outer_fold"] == job["outer_fold"] and row["model"] == "Dummy")
        rows.append({"repeat": job["repeat"], "outer_seed": job["outer_seed"], "outer_fold": job["outer_fold"], "model": job["model"],
            "selected_candidate": job["selected"]["candidate"], **values,
            **{"train_" + key: value for key, value in job["train_metrics"].items()},
            "delta_RMSE_vs_Dummy": values["RMSE"] - baseline["assessment_metrics"]["RMSE"],
            "RMSE_improvement_pct_vs_Dummy": 100 * (baseline["assessment_metrics"]["RMSE"] - values["RMSE"]) / baseline["assessment_metrics"]["RMSE"],
            "train_assessment_RMSE_gap": job["train_assessment_RMSE_gap"],
            "outer_refit_seconds": job["outer_refit_seconds"], "inner_total_fit_seconds": job["inner_total_fit_seconds"],
            "inner_selected_mean_RMSE": job["selected"]["mean_inner_RMSE"]})
        for trial in json.loads((path.parent / "inner_trials.json").read_text(encoding="utf-8")):
            inner_rows.append({**{key: trial[key] for key in ["repeat", "outer_fold", "model", "candidate", "candidate_order", "inner_fold", "inner_seed", "fit_rows", "assessment_rows", "fit_ids_sha256", "assessment_ids_sha256", "fit_seconds"]},
                "params_json": json.dumps(trial["params"], sort_keys=True), **trial["metrics"],
                "warnings_json": json.dumps(trial["warnings"], ensure_ascii=False)})
    frame = pd.DataFrame(rows).sort_values(["repeat", "outer_fold", "model"])
    frame.to_csv(OUTPUT / "outer_fold_scores.csv", index=False)
    pd.DataFrame(inner_rows).to_csv(OUTPUT / "all_inner_trials.csv", index=False)
    repeats = []
    for name in MODELS:
        for repeat in [1, 2, 3]:
            subset = frame[(frame.model == name) & (frame["repeat"] == repeat)]
            arrays = []
            for fold in range(1, 6):
                path = OUTPUT / "jobs" / f"r{repeat}_f{fold}_{name}/outer_predictions.npz"
                with np.load(path, allow_pickle=False) as data:
                    arrays.append((data["y_development"].copy(), data["prediction"].copy()))
            pooled = metrics(np.concatenate([a for a, _ in arrays]), np.concatenate([b for _, b in arrays]))
            repeats.append({"model": name, "repeat": repeat,
                **{key + "_mean_fold": float(subset[key].mean()) for key in ["MAE", "MSE", "RMSE", "R2"]},
                "RMSE_fold_sd": float(subset.RMSE.std(ddof=1)), "folds_beating_Dummy": int((subset.delta_RMSE_vs_Dummy < 0).sum()) if name != "Dummy" else 0,
                "delta_RMSE_mean": float(subset.delta_RMSE_vs_Dummy.mean()),
                **{"pooled_OOF_" + key: value for key, value in pooled.items()}})
    pd.DataFrame(repeats).to_csv(OUTPUT / "repeat_summary.csv", index=False)
    summaries = []
    for name in MODELS:
        subset = frame[frame.model == name]
        repeat_rows = [row for row in repeats if row["model"] == name]
        summaries.append({"model": name, "outer_folds_completed": len(subset),
            **{key + "_mean": float(np.mean([row[key + "_mean_fold"] for row in repeat_rows])) for key in ["MAE", "MSE", "RMSE", "R2"]},
            "RMSE_fold_sd_descriptive_15": float(subset.RMSE.std(ddof=1)),
            "delta_RMSE_mean": float(subset.delta_RMSE_vs_Dummy.mean()),
            "RMSE_improvement_pct_mean": float(subset.RMSE_improvement_pct_vs_Dummy.mean()),
            "folds_beating_Dummy": int((subset.delta_RMSE_vs_Dummy < 0).sum()) if name != "Dummy" else 0,
            "folds_beating_Dummy_per_repeat": [row["folds_beating_Dummy"] for row in repeat_rows],
            "train_RMSE_mean": float(subset.train_RMSE.mean()), "train_assessment_RMSE_gap_mean": float(subset.train_assessment_RMSE_gap.mean()),
            "mean_outer_refit_seconds": float(subset.outer_refit_seconds.mean()),
            "total_inner_fit_seconds": float(subset.inner_total_fit_seconds.sum()),
            "selected_candidate_counts": {str(key): int(value) for key, value in subset.selected_candidate.value_counts().items()},
            "passes_proposed_5pct_and_4of5_each_repeat": name != "Dummy" and all(row["folds_beating_Dummy"] >= 4 and
                row["delta_RMSE_mean"] <= -.05 * next(b["RMSE_mean_fold"] for b in repeats if b["model"] == "Dummy" and b["repeat"] == row["repeat"]) for row in repeat_rows)})
    write_json(OUTPUT / "model_summary.json", summaries)
    pd.DataFrame([{key: value for key, value in row.items() if not isinstance(value, (dict, list))} for row in summaries]).to_csv(OUTPUT / "model_summary.csv", index=False)
    summary = {"status": "COMPLETE", "model_count": 5, "outer_scores": len(frame), "inner_fit_scores": len(inner_rows),
        "total_experiment_fits": len(frame) + len(inner_rows), "feature_group": "current5",
        "extended_features": "NOT_RUN", "quality_gate": "BASELINE_ONLY",
        "all_models_pass_stability_gate": all(row["passes_proposed_5pct_and_4of5_each_repeat"] for row in summaries if row["model"] != "Dummy"),
        "any_model_passes_proposed_gate": any(row["passes_proposed_5pct_and_4of5_each_repeat"] for row in summaries),
        "timing": {"inner_fit_seconds_total": sum(row["total_inner_fit_seconds"] for row in summaries),
                   "outer_refit_seconds_total": float(frame.outer_refit_seconds.sum()), "fit_parallelism": "one fit at a time, two thread budget"}}
    assert len(frame) == 75 and len(inner_rows) == 360
    write_json(OUTPUT / "experiment_summary.json", summary)
    # Standalone publication figures use isolated plotting dependencies from prior research.
    sys.path.insert(0, str(ROOT / "research/.deps"))
    import os
    os.environ["MPLCONFIGDIR"] = str(HERE / ".mplconfig")
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(1, 2, figsize=(13, 4.5), layout="constrained")
    for name in MODELS[1:]:
        subset = frame[frame.model == name].sort_values(["repeat", "outer_fold"])
        axes[0].plot(range(1, 16), subset.delta_RMSE_vs_Dummy, marker="o", markersize=3, label=name)
    axes[0].axhline(0, color="black", linestyle="--")
    axes[0].set(xlabel="Outer assessment fold (3 repeats x 5)", ylabel="RMSE(model) - RMSE(Dummy)", title="Paired OOF differences; lower is better")
    axes[0].legend(fontsize=7)
    axes[1].barh(MODELS, [row["train_assessment_RMSE_gap_mean"] for row in summaries], color="#6366f1")
    axes[1].set(xlabel="Mean assessment RMSE - fit RMSE", title="Generalization gap (Development only)")
    fig.savefig(OUTPUT / "outer_deltas_and_train_gap.png", dpi=180)
    plt.close(fig)
    print(json.dumps(summaries, indent=2), flush=True)


if __name__ == "__main__":
    main()
