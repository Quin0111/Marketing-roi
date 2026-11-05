"""Reproducible feasibility audit. Never fits/overwrites deployed artifacts.

The held-out set is used ONLY for index identity checking. Its feature/target
values are not inspected, described, predicted or scored. Full-CSV inspection
is restricted to schema, missingness, duplicates and notebook cleaning checks.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import io
import json
import os
from pathlib import Path
import platform
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
RESEARCH = ROOT / "research"
sys.path.insert(0, str(RESEARCH / ".deps"))
os.environ.setdefault("MPLCONFIGDIR", str(RESEARCH / ".mplconfig"))
os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
os.environ.setdefault("OMP_NUM_THREADS", "2")

import joblib
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

FEATURES = ["Campaign_Type", "Channel_Used", "Target_Audience", "Customer_Segment", "Duration_days"]
EXPECTED_DATASET_HASH = "f06c1b95a8207b4631c35e6b83b4a2a7872892a8bfa133967e1e7ec401c7bb60"
EXPECTED_NOTEBOOK_HASH = "f66eace5d41e3a09b1b44ea51d2402ad8cee729551547b2aa3c2db56b2c22469"
EXPECTED_SPLIT_HASH = "578a792a63aed7e9787edab351f9301547908952b2293619146587d413ee6f84"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")


def protected_snapshot():
    files = list((ROOT / "src").rglob("*")) + list((ROOT / "backend/app").rglob("*"))
    files += list((ROOT / "backend/models").glob("*"))
    files += [ROOT / name for name in ["package.json", "package-lock.json", "README.md",
              "backend/tests/phase1_results.json", "backend/requirements.txt", "backend/requirements.lock.txt"]]
    return {str(p.relative_to(ROOT)): sha(p) for p in sorted(files)
            if p.is_file() and "__pycache__" not in p.parts and p.suffix != ".pyc"}


def holm(values):
    order = np.argsort(values)
    result = np.empty(len(values))
    previous = 0.0
    for rank, index in enumerate(order):
        previous = max(previous, min(1.0, (len(values) - rank) * values[index]))
        result[index] = previous
    return result


def eta(codes, y):
    counts = np.bincount(codes)
    sums = np.bincount(codes, weights=y)
    means = np.divide(sums, counts, out=np.zeros_like(sums), where=counts > 0)
    return float(np.sum(counts * (means - y.mean()) ** 2) / np.sum((y - y.mean()) ** 2))


def score(y, prediction):
    return {"MAE": float(mean_absolute_error(y, prediction)),
            "RMSE": float(np.sqrt(mean_squared_error(y, prediction))), "R2": float(r2_score(y, prediction))}


def fresh_linear(categorical):
    # New, disposable research object. No deployed pipeline is fitted or cloned.
    return Pipeline([
        ("preprocess", ColumnTransformer([
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
            ("num", StandardScaler(), ["Duration_days"]),
        ])), ("regression", LinearRegression()),
    ])


def prepare(args, output):
    manifest = json.loads((ROOT / "backend/app/config/artifact_sha256.json").read_text())
    assert {p.name: sha(p) for p in (ROOT / "backend/models").iterdir() if p.is_file()} == manifest
    assert sha(args.dataset) == EXPECTED_DATASET_HASH, "Dataset changed: stop; do not silently resplit"
    assert sha(args.notebook) == EXPECTED_NOTEBOOK_HASH, "Notebook changed: review protocol provenance before proceeding"
    notebook = json.loads(args.notebook.read_text(encoding="utf-8"))
    cells = {str(i): "".join(notebook["cells"][i].get("source", [])) for i in [34, 86, 91, 98, 101, 104, 115, 117, 131, 147]}
    assert "test_size=0.30" in cells["117"] and "test_size=0.50" in cells["117"]
    assert "random_state=RANDOM_STATE" in cells["117"] and "RANDOM_STATE = 42" in cells["115"]
    save_json(output / "notebook_protocol_extract.json", {"notebook_sha256": sha(args.notebook), "zero_based_cells": cells})
    raw = pd.read_csv(args.dataset)
    structural = {"rows": len(raw), "columns": len(raw.columns),
        "dtypes": {c: str(t) for c, t in raw.dtypes.items()},
        "missing": {c: int(v) for c, v in raw.isna().sum().items()},
        "exact_duplicate_rows": int(raw.duplicated().sum()),
        "duplicate_campaign_ids": int(raw["Campaign_ID"].duplicated().sum())}
    clean = raw.drop_duplicates().copy()
    clean["ROI"] = pd.to_numeric(clean["ROI"], errors="coerce")
    valid = np.isfinite(clean["ROI"])
    structural["invalid_target_rows_removed_for_notebook_replay"] = int((~valid).sum())
    clean = clean.loc[valid].copy()
    clean["Duration_days"] = clean["Duration"].str.extract(r"(\d+)").astype(int)
    train, temporary = train_test_split(clean.index.to_numpy(), test_size=.30, random_state=42)
    validation, final_test = train_test_split(temporary, test_size=.50, random_state=42)
    # Trusted team archive is linked to deployed models by all three model hashes.
    with zipfile.ZipFile(args.archive) as archive:
        for filename in ["linear_regression_pipeline.joblib", "decision_tree_pipeline.joblib", "random_forest_pipeline.joblib"]:
            assert hashlib.sha256(archive.read(filename)).hexdigest() == manifest[filename]
        data = archive.read("splits/data_splits.joblib")
        assert hashlib.sha256(data).hexdigest() == EXPECTED_SPLIT_HASH
        archived = joblib.load(io.BytesIO(data))
    matches = {}
    for partition, indices in [("train", train), ("val", validation), ("test", final_test)]:
        matches[partition] = np.array_equal(archived[f"X_{partition}"].index.to_numpy(), indices)
        assert matches[partition], "Archived split indices mismatch: analysis blocked"
    # Do not inspect archived X_test/y_test values. Discard immediately after index check.
    del archived["X_test"], archived["y_test"]
    for name, indices in [("train", train), ("val", validation)]:
        # Notebook assigned a display-only name to the columns axis ("Thuoc tinh").
        # Ignore that label; still compare row IDs/order, column labels, dtypes and values.
        pd.testing.assert_frame_equal(clean.loc[indices, FEATURES], archived[f"X_{name}"], check_names=False)
        pd.testing.assert_series_equal(clean.loc[indices, "ROI"], archived[f"y_{name}"])
    assert set(train).isdisjoint(validation) and set(train).isdisjoint(final_test) and set(validation).isdisjoint(final_test)
    dev_ids = np.concatenate([train, validation])  # Explicit order for NEW diagnostic CV.
    assert len(dev_ids) == 170000 and len(final_test) == 30000
    assert set(dev_ids).isdisjoint(final_test)
    development = clean.loc[dev_ids].copy()
    del raw, clean, archived
    development["Acquisition_Cost_USD"] = pd.to_numeric(development["Acquisition_Cost"].str.replace(r"[$,\s]", "", regex=True))
    development["Date_parsed"] = pd.to_datetime(development["Date"], errors="raise")
    development["Month"] = development["Date_parsed"].dt.month
    development["Weekday"] = development["Date_parsed"].dt.dayofweek
    pd.DataFrame({"csv_row_index_zero_based": np.concatenate([train, validation, final_test]),
        "partition": ["train"] * len(train) + ["validation"] * len(validation) + ["final_test_LOCKED"] * len(final_test)
    }).to_csv(output / "split_membership.csv", index=False)
    protocol = {"status": "PASS", "train_rows": len(train), "validation_rows": len(validation),
        "development_rows": len(dev_ids), "final_test_rows": len(final_test), "archive_index_order_matches": matches,
        "train_validation_feature_and_target_values_match": True,
        "archived_split_sha256": EXPECTED_SPLIT_HASH,
        "development_order": "concatenate original Train then original Validation; NEW diagnostic CV only",
        "test_access": "index identity only; no held-out feature/target summaries, fits, predictions, scores or optimization",
        "historical_5fold_code_found": False,
        "note": "Notebook contains 3-fold tuning. Historical metrics are preserved, not claimed to be reproduced by new diagnostics."}
    return development, structural, protocol


def audit_development(dev, output, permutations):
    y = dev["ROI"].to_numpy()
    summary = {"scope": "original Development only (170000 rows)",
        "roi": {k: float(v) for k, v in dev["ROI"].describe(percentiles=[.01, .05, .25, .5, .75, .95, .99]).items()},
        "roi_skew": float(stats.skew(y)), "roi_excess_kurtosis": float(stats.kurtosis(y)),
        "roi_unique": int(dev["ROI"].nunique()),
        "roi_two_decimal_fraction": float(np.mean(np.isclose(y * 100, np.round(y * 100)))),
        "date_min": str(dev["Date_parsed"].min().date()), "date_max": str(dev["Date_parsed"].max().date()),
        "date_unique": int(dev["Date_parsed"].nunique()),
        "development_missing": {k: int(v) for k, v in dev.isna().sum().items()}}
    counts = np.histogram(y, bins=np.linspace(2, 8, 13))[0]
    summary["roi_histogram_12bins"] = counts.tolist()
    summary["uniform_2_8_reference_std"] = float(6 / np.sqrt(12))
    summary["uniform_2_8_bin_chisquare"] = {"statistic": float(stats.chisquare(counts).statistic), "p_value": float(stats.chisquare(counts).pvalue)}
    date_offset = (dev["Date_parsed"] - pd.Timestamp("2021-01-01")).dt.days
    summary["date_equals_id_minus_one_mod365_fraction"] = float(np.mean(date_offset == (dev["Campaign_ID"] - 1) % 365))
    summary["numeric_ranges"] = {c: {"min": float(dev[c].min()), "max": float(dev[c].max())} for c in
        ["ROI", "Duration_days", "Conversion_Rate", "Acquisition_Cost_USD", "Clicks", "Impressions", "Engagement_Score"]}
    grouped_rows, effects, codes_by_name = [], [], {}
    categorical = FEATURES + ["Company", "Location", "Language", "Month", "Weekday"]
    for column in categorical:
        grouped = dev.groupby(column, observed=True)["ROI"].agg(["count", "mean", "std", "median", "min", "max"])
        grouped["sem"] = grouped["std"] / np.sqrt(grouped["count"])
        grouped["mean_ci95_low_pointwise"] = grouped["mean"] - 1.96 * grouped["sem"]
        grouped["mean_ci95_high_pointwise"] = grouped["mean"] + 1.96 * grouped["sem"]
        for label, row in grouped.iterrows():
            grouped_rows.append({"feature": column, "value": str(label), **{k: float(v) for k, v in row.items()}})
        codes = pd.factorize(dev[column], sort=True)[0]
        codes_by_name[column] = codes
        f = stats.f_oneway(*[g["ROI"].to_numpy() for _, g in dev.groupby(column, observed=True)])
        effects.append({"feature": column, "levels": len(grouped), "eta_squared": eta(codes, y),
            "anova_F": float(f.statistic), "anova_p": float(f.pvalue),
            "mean_range": float(grouped["mean"].max() - grouped["mean"].min()),
            "eta_null_expected_iid_approx": (len(grouped) - 1) / (len(dev) - 1)})
    codes_by_name["Joint_five_features"] = pd.factorize(pd.MultiIndex.from_frame(dev[FEATURES]), sort=True)[0]
    joint_counts = np.bincount(codes_by_name["Joint_five_features"])
    summary["joint_five_feature_cells"] = {"observed_cells": len(joint_counts), "possible_cells": 3000,
        "min_count": int(joint_counts.min()), "median_count": float(np.median(joint_counts)),
        "max_count": int(joint_counts.max()), "in_sample_eta_squared": eta(codes_by_name["Joint_five_features"], y),
        "null_expected_iid_approx": (len(joint_counts) - 1) / (len(dev) - 1)}
    adjusted = holm([e["anova_p"] for e in effects])
    for row, value in zip(effects, adjusted): row["anova_p_holm_10_tests"] = float(value)
    print(f"Development descriptives complete; running {permutations} label permutations", flush=True)
    rng = np.random.default_rng(20261103)
    observed = {name: eta(codes, y) for name, codes in codes_by_name.items()}
    null = {name: [] for name in codes_by_name}
    for _ in range(permutations):
        permuted = rng.permutation(y)
        for name, codes in codes_by_name.items(): null[name].append(eta(codes, permuted))
    permutation_rows = [{"feature": name, "observed_eta_squared": observed[name],
        "null_mean": float(np.mean(values)), "null_95_percentile": float(np.quantile(values, .95)),
        "monte_carlo_p_one_sided": (1 + int(np.sum(np.asarray(values) >= observed[name]))) / (permutations + 1),
        "permutations": permutations} for name, values in null.items()]
    numeric_rows = []
    for column in ["Duration_days", "Conversion_Rate", "Acquisition_Cost_USD", "Clicks", "Impressions", "Engagement_Score", "Campaign_ID"]:
        pearson = stats.pearsonr(dev[column], y)
        spearman = stats.spearmanr(dev[column], y)
        numeric_rows.append({"feature": column, "pearson_r": float(pearson.statistic), "pearson_p": float(pearson.pvalue),
            "spearman_r": float(spearman.statistic), "spearman_p": float(spearman.pvalue)})
    for row, p in zip(numeric_rows, holm([r["pearson_p"] for r in numeric_rows])):
        row["pearson_p_holm_7_tests"] = float(p)
    pd.DataFrame(grouped_rows).to_csv(output / "development_group_statistics.csv", index=False)
    pd.DataFrame(effects).to_csv(output / "development_effect_sizes.csv", index=False)
    pd.DataFrame(permutation_rows).to_csv(output / "development_permutation_tests.csv", index=False)
    pd.DataFrame(numeric_rows).to_csv(output / "development_numeric_associations.csv", index=False)
    summary["effects"] = effects
    summary["numeric_associations"] = numeric_rows
    summary["permutation_tests"] = permutation_rows
    return summary


def diagnose_cv(dev, output):
    y = dev["ROI"].to_numpy()
    split = KFold(n_splits=5, shuffle=True, random_state=42)
    folds = list(split.split(dev))
    results, memberships = [], []
    oof = {}
    current = FEATURES[:-1]
    for fold, (fit_ids, assess_ids) in enumerate(folds, 1):
        train, assess = dev.iloc[fit_ids], dev.iloc[assess_ids]
        memberships.extend({"csv_row_index_zero_based": int(index), "assessment_fold": fold} for index in assess.index)
        mean = float(train["ROI"].mean())
        predictions = {"Dummy_mean": np.full(len(assess), mean)}
        for name, columns in [("Fresh_linear_current5", current),
                              ("Fresh_linear_plus_Company_Location_Language", current + ["Company", "Location", "Language"])]:
            model = fresh_linear(columns)
            model.fit(train[columns + ["Duration_days"]], train["ROI"])
            predictions[name] = model.predict(assess[columns + ["Duration_days"]])
        for column in FEATURES:
            group_mean = train.groupby(column)["ROI"].mean()
            predictions[f"GroupMean_{column}"] = assess[column].map(group_mean).fillna(mean).to_numpy()
        group_mean = train.groupby(FEATURES)["ROI"].mean()
        keys = pd.MultiIndex.from_frame(assess[FEATURES])
        predictions["GroupMean_joint_current5"] = group_mean.reindex(keys).fillna(mean).to_numpy()
        baseline_rmse = score(y[assess_ids], predictions["Dummy_mean"])["RMSE"]
        for name, prediction in predictions.items():
            assert np.isfinite(prediction).all()
            if name not in oof: oof[name] = np.empty(len(dev))
            oof[name][assess_ids] = prediction
            metrics = score(y[assess_ids], prediction)
            results.append({"model": name, "fold": fold, **metrics, "delta_RMSE_vs_dummy": metrics["RMSE"] - baseline_rmse,
                            "fit_rows": len(fit_ids), "assessment_rows": len(assess_ids)})
        print(f"Diagnostic development fold {fold}/5 complete", flush=True)
    table = pd.DataFrame(results)
    summaries = []
    for name, group in table.groupby("model", sort=False):
        summaries.append({"model": name, "MAE_mean": float(group.MAE.mean()), "RMSE_mean": float(group.RMSE.mean()),
            "RMSE_fold_sd": float(group.RMSE.std(ddof=1)), "R2_mean": float(group.R2.mean()),
            "delta_RMSE_mean": float(group.delta_RMSE_vs_dummy.mean()),
            "folds_beating_dummy": int((group.delta_RMSE_vs_dummy < 0).sum()),
            "OOF_metrics": score(y, oof[name])})
    table.to_csv(output / "diagnostic_cv_folds.csv", index=False)
    pd.DataFrame(memberships).to_csv(output / "development_fold_membership.csv", index=False)
    save_json(output / "diagnostic_cv_summary.json", summaries)
    return summaries


def plots(dev, summary, cv, output):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5), layout="constrained")
    axes[0].hist(dev.ROI, bins=np.linspace(2, 8, 31), color="#6366f1", edgecolor="white")
    axes[0].set(xlabel="ROI", ylabel="Development rows", title="ROI distribution: Development only (n=170,000)")
    values = [e for e in summary["effects"] if e["feature"] in FEATURES]
    axes[1].barh([e["feature"] for e in values], [100 * e["eta_squared"] for e in values], color="#0891b2")
    axes[1].set(xlabel="In-sample variance explained (%)", title="Univariate effect sizes; not predictive accuracy")
    fig.savefig(output / "development_distribution_and_effects.png", dpi=180)
    plt.close(fig)
    fig, axes = plt.subplots(2, 3, figsize=(13, 8), layout="constrained")
    for ax, column in zip(axes.ravel(), FEATURES):
        group = dev.groupby(column)["ROI"].agg(["mean", "std", "count"])
        ax.errorbar(range(len(group)), group["mean"], yerr=1.96 * group["std"] / np.sqrt(group["count"]), fmt="o", capsize=3, color="#4338ca")
        ax.axhline(dev.ROI.mean(), color="#64748b", linestyle="--")
        ax.set_xticks(range(len(group)), [str(x) for x in group.index], rotation=25, ha="right", fontsize=8)
        ax.set(title=column, ylabel="Mean ROI (pointwise 95% CI)")
    axes.ravel()[-1].axis("off")
    axes.ravel()[-1].text(0, .6, "Mean confidence intervals only.\nNot prediction intervals for campaigns.\nNo multiplicity adjustment in displayed CIs.\nNo causal interpretation.", wrap=True)
    fig.savefig(output / "development_group_means.png", dpi=180)
    plt.close(fig)
    table = pd.read_csv(output / "diagnostic_cv_folds.csv")
    fig, ax = plt.subplots(figsize=(10, 5), layout="constrained")
    for name in ["Fresh_linear_current5", "Fresh_linear_plus_Company_Location_Language", "GroupMean_joint_current5"]:
        subset = table[table.model == name]
        ax.plot(subset.fold, subset.delta_RMSE_vs_dummy, "o-", label=name)
    ax.axhline(0, color="black", linestyle="--")
    ax.set(xlabel="NEW development assessment fold", ylabel="RMSE(model) - RMSE(Dummy); lower is better",
           title="Diagnostic CV only; original final Test locked")
    ax.legend(fontsize=8)
    fig.savefig(output / "development_cv_deltas.png", dpi=180)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, default=ROOT.parent / "marketing_campaign_dataset.csv")
    parser.add_argument("--notebook", type=Path, default=Path("C:/Users/ASUS/Downloads/MachineLearningcki (8).ipynb"))
    parser.add_argument("--archive", type=Path, default=Path("C:/Users/ASUS/Downloads/models_roi (4).zip"))
    parser.add_argument("--permutations", type=int, default=199)
    args = parser.parse_args()
    if args.permutations < 99: parser.error("Use at least 99 permutations")
    output = RESEARCH / "outputs/phase4b1"
    output.mkdir(parents=True, exist_ok=True)
    before = protected_snapshot()
    sources = {str(p): sha(p) for p in [args.dataset, args.notebook, args.archive]}
    dev, structural, protocol = prepare(args, output)
    print("Exact archived split identity verified; final Test excluded", flush=True)
    summary = audit_development(dev, output, args.permutations)
    cv = diagnose_cv(dev, output)
    plots(dev, summary, cv, output)
    result = {"status": "PASS", "python": platform.python_version(),
        "versions": {p: importlib.metadata.version(p) for p in ["numpy", "pandas", "scipy", "scikit-learn", "joblib", "matplotlib"]},
        "sources_sha256": sources, "structural_full_csv": structural, "split_protocol": protocol,
        "development_audit": summary, "diagnostic_cv": cv,
        "quality_gate": "BASELINE_ONLY", "production_models_fitted": False,
        "test_outcomes_used_for_research": False}
    after = protected_snapshot()
    assert before == after, "Protected project files changed"
    assert all(sha(path) == value for path, value in sources.items()), "Source files changed"
    save_json(output / "audit_results.json", result)
    save_json(output / "integrity.json", {"status": "PASS", "protected_files": len(before),
        "before": before, "after": after, "sources_before_after_equal": True})
    print(json.dumps({"status": "PASS", "split": protocol, "cv": cv,
                      "unchanged_protected_files": len(before)}, indent=2), flush=True)


if __name__ == "__main__":
    main()
