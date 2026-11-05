"""Data isolation, fold verification and model factories for research only."""
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform

# Set resource limits before importing numerical libraries.
os.environ["OMP_NUM_THREADS"] = "2"
os.environ["OPENBLAS_NUM_THREADS"] = "2"
os.environ["MKL_NUM_THREADS"] = "2"
os.environ["NUMEXPR_NUM_THREADS"] = "2"

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler
from sklearn.tree import DecisionTreeRegressor
import threadpoolctl

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
PREVIOUS = ROOT / "research/outputs/phase4b1a"
PROTOCOL_PATH = PREVIOUS / "phase4b2_evaluation_protocol.json"
CONFIG_PATH = HERE / "experiment_config.json"
FEATURES = ["Campaign_Type", "Channel_Used", "Target_Audience", "Customer_Segment", "Duration_days"]
MODELS = ["Dummy", "LinearRegression", "DecisionTree", "RandomForest", "HistGradientBoosting"]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def ids_hash(ids):
    return hashlib.sha256(np.asarray(ids, dtype="<i8").tobytes()).hexdigest()


def prediction_hash(values):
    return hashlib.sha256(np.asarray(values, dtype="<f8").tobytes()).hexdigest()


def write_json(path, value):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")


def runtime():
    patched = False
    try:
        pools = threadpoolctl.threadpool_info()
    except FileNotFoundError:
        # Windows snapshot paths can be corrupted for this Unicode workspace.
        # Use threadpoolctl's existing documented enumeration fallback, in memory.
        def wide_enumeration_fallback(self, kernel32):
            raise OSError("Research: use wide-character EnumProcessModulesEx fallback")
        threadpoolctl.ThreadpoolController._snapshot_loaded_modules = wide_enumeration_fallback
        patched = True
        pools = threadpoolctl.threadpool_info()
    for pool in pools:
        assert pool["num_threads"] <= 2, pool
    return {"python": platform.python_version(), "platform": platform.platform(), "logical_cpus": os.cpu_count(),
        "versions": {name: importlib.metadata.version(name) for name in
            ["numpy", "pandas", "scipy", "scikit-learn", "joblib", "threadpoolctl"]},
        "threadpool_wide_enum_fallback": patched, "threadpools": pools,
        "thread_budget": 2, "fits_parallel": False}


def protected_snapshot():
    paths = []
    for directory in [ROOT / "src", ROOT / "backend/app", ROOT / "backend/models", ROOT / "backend/tests"]:
        paths.extend(path for path in directory.rglob("*") if path.is_file() and "__pycache__" not in path.parts)
    # Preserve all previous research outputs, scripts and reports; current phase excluded.
    for path in (ROOT / "research").rglob("*"):
        if path.is_file() and not any(part in {".deps", ".mplconfig", "__pycache__", "phase4b2"} for part in path.parts):
            paths.append(path)
    paths.extend(ROOT / name for name in ["package.json", "package-lock.json", "README.md", "backend/requirements.txt", "backend/requirements.lock.txt"])
    return {str(path.relative_to(ROOT)): sha(path) for path in sorted(set(paths))}


def load_verified():
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    protocol = json.loads(PROTOCOL_PATH.read_text(encoding="utf-8"))
    assert config["protocol_id"] == protocol["protocol_id"] == "DM-DEV-170K-v1"
    assert config["outer_seeds"] == protocol["outer_cv"]["seeds"] == [42, 2026, 20261103]
    assert config["outer_folds"] == protocol["outer_cv"]["n_splits"] == 5
    assert config["inner_folds"] == protocol["inner_cv"]["n_splits"] == 3
    assert config["inner_seed_rule"] == protocol["inner_cv"]["seed_rule"]
    assert config["features"] == protocol["candidate_input_columns"] == FEATURES
    assert protocol["outer_cv"]["shuffle"] is True and protocol["inner_cv"]["shuffle"] is True
    assert protocol["quality_gate"] == config["quality_gate"] == "BASELINE_ONLY"
    dataset = ROOT.parent / "marketing_campaign_dataset.csv"
    assert sha(dataset) == protocol["dataset_sha256"], "BLOCKER: dataset hash mismatch"
    member_path = ROOT / "research/outputs/phase4b1/split_membership.csv"
    assert sha(member_path) == protocol["original_membership_sha256"], "BLOCKER: original membership hash mismatch"
    schedule_path = PREVIOUS / protocol["outer_cv"]["schedule_file"]
    assert sha(schedule_path) == protocol["outer_cv"]["schedule_sha256"], "BLOCKER: frozen fold schedule hash mismatch"
    membership = pd.read_csv(member_path)
    train = membership.loc[membership.partition == "train", "csv_row_index_zero_based"].to_numpy()
    validation = membership.loc[membership.partition == "validation", "csv_row_index_zero_based"].to_numpy()
    heldout = membership.loc[membership.partition == "final_test_LOCKED", "csv_row_index_zero_based"].to_numpy()
    a, temp = train_test_split(np.arange(200000), test_size=.30, random_state=42)
    b, c = train_test_split(temp, test_size=.50, random_state=42)
    assert np.array_equal(a, train) and np.array_equal(b, validation) and np.array_equal(c, heldout)
    ids = np.concatenate([train, validation])
    assert ids_hash(ids) == protocol["development_row_order_sha256_int64_le"]
    keep = set(ids.tolist())
    assert len(keep) == 170000 and len(heldout) == 30000 and keep.isdisjoint(heldout)
    # No Date/ID/post-campaign columns and NO held-out target materialization.
    raw = pd.read_csv(dataset, usecols=FEATURES[:-1] + ["Duration", "ROI"],
                      skiprows=lambda line: line > 0 and line - 1 not in keep)
    assert len(raw) == 170000
    raw.index = np.sort(ids)
    raw = raw.loc[ids].copy()
    raw["Duration_days"] = raw.Duration.str.extract(r"(\d+)").astype(int)
    x, y = raw[FEATURES].copy(), raw.ROI.to_numpy(dtype=np.float64)
    assert list(x.columns) == FEATURES and np.isfinite(y).all() and not x.isna().any().any()
    schedule = pd.read_csv(schedule_path)
    assignments = {}
    outer_manifest, inner_manifest = [], []
    for repeat, seed in enumerate(config["outer_seeds"], 1):
        rows = schedule[schedule["repeat"] == repeat]
        assert len(rows) == rows.csv_row_index_zero_based.nunique() == 170000
        assert set(rows.csv_row_index_zero_based) == keep
        for fold, (fit, assess) in enumerate(KFold(5, shuffle=True, random_state=seed).split(ids), 1):
            frozen_ids = rows.loc[rows.assessment_fold == fold, "csv_row_index_zero_based"].to_numpy()
            assert np.array_equal(ids[assess], frozen_ids), "BLOCKER: ordered fold indices mismatch"
            assignments[(repeat, fold)] = (fit, assess)
            outer_manifest.append({"repeat": repeat, "seed": seed, "fold": fold,
                "fit_rows": len(fit), "assessment_rows": len(assess),
                "fit_ids_sha256": ids_hash(ids[fit]), "assessment_ids_sha256": ids_hash(ids[assess])})
            inner_seed = 100000 * repeat + 1000 * fold + 17
            for inner_fold, (inner_fit, inner_assess) in enumerate(KFold(3, shuffle=True, random_state=inner_seed).split(fit), 1):
                inner_manifest.append({"repeat": repeat, "outer_fold": fold, "inner_seed": inner_seed, "inner_fold": inner_fold,
                    "fit_rows": len(inner_fit), "assessment_rows": len(inner_assess),
                    "fit_ids_sha256": ids_hash(ids[fit[inner_fit]]), "assessment_ids_sha256": ids_hash(ids[fit[inner_assess]])})
    access = {"status": "PASS", "protocol_sha256": sha(PROTOCOL_PATH), "config_sha256": sha(CONFIG_PATH),
        "dataset_sha256": sha(dataset), "membership_sha256": sha(member_path), "schedule_sha256": sha(schedule_path),
        "development_order_sha256": ids_hash(ids), "parsed_rows": len(raw), "test_rows_excluded_before_parsing": len(heldout),
        "test_roi_materialized": False, "split_joblib_loaded": False, "feature_columns": list(x.columns),
        "outer_manifest": outer_manifest, "inner_manifest": inner_manifest}
    return config, x, y, ids, assignments, access


def make_pipeline(name, params, config):
    native = name == "HistGradientBoosting"
    category = Pipeline([("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1) if native
         else OneHotEncoder(handle_unknown="ignore", sparse_output=False))])
    numeric_steps = [("imputer", SimpleImputer(strategy="median"))]
    if name == "LinearRegression": numeric_steps.append(("scaler", StandardScaler()))
    prep = ColumnTransformer([("categorical", category, FEATURES[:-1]),
                              ("numeric", Pipeline(numeric_steps), ["Duration_days"])])
    seed = config["model_random_state"]
    if name == "Dummy": estimator = DummyRegressor(**params)
    elif name == "LinearRegression": estimator = LinearRegression(**params)
    elif name == "DecisionTree": estimator = DecisionTreeRegressor(random_state=seed, **params)
    elif name == "RandomForest": estimator = RandomForestRegressor(random_state=seed, n_jobs=2, **params)
    elif native: estimator = HistGradientBoostingRegressor(random_state=seed,
        categorical_features=[True, True, True, True, False], **params)
    else: raise ValueError(name)
    return Pipeline([("preprocessor", prep), ("model", estimator)])


def metrics(y, pred):
    assert len(y) == len(pred) and np.isfinite(pred).all()
    mse = float(mean_squared_error(y, pred))
    return {"MAE": float(mean_absolute_error(y, pred)), "MSE": mse,
            "RMSE": float(np.sqrt(mse)), "R2": float(r2_score(y, pred))}
