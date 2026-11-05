"""Isolated CRITEO academic benchmark; never imports production app or old data."""
import os
for key in ['OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'NUMEXPR_NUM_THREADS']:
    os.environ[key] = '2'
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, brier_score_loss, roc_auc_score, average_precision_score

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
AUDIT = ROOT / 'research/phase4b4/reassessment'
RESULTS = HERE / 'results'
RESULTS.mkdir(parents=True, exist_ok=True)
FEATURES = [f'f{i}' for i in range(12)]
PROTOCOL = json.loads((AUDIT / 'evaluation_protocol_compat.json').read_text(encoding='utf-8'))


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def array_sha(value):
    return hashlib.sha256(np.asarray(value, dtype='<i8').tobytes()).hexdigest()


def write(path, value):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def runtime():
    import platform, importlib.metadata
    from threadpoolctl import ThreadpoolController, threadpool_info
    fallback = False
    try:
        pools = threadpool_info()
    except FileNotFoundError:
        def unsupported(self, *args):
            raise OSError('Use existing wide EnumProcessModulesEx fallback for Unicode workspace')
        ThreadpoolController._snapshot_loaded_modules = unsupported
        pools = threadpool_info()
        fallback = True
    assert all(p['num_threads'] <= 2 for p in pools)
    return {'python': platform.python_version(), 'versions': {p: importlib.metadata.version(p) for p in
        ['numpy', 'pandas', 'scipy', 'scikit-learn', 'joblib', 'threadpoolctl']},
        'threadpools': pools, 'unicode_wide_module_fallback': fallback}


def tie_keys(ids):
    # Invertible deterministic uint64 mixing; no treatment or outcome used.
    with np.errstate(over='ignore'):
        keys = np.asarray(ids, dtype=np.uint64) + np.uint64(0x9e3779b97f4a7c15)
        keys = (keys ^ (keys >> np.uint64(30))) * np.uint64(0xbf58476d1ce4e5b9)
        keys = (keys ^ (keys >> np.uint64(27))) * np.uint64(0x94d049bb133111eb)
        return keys ^ (keys >> np.uint64(31))


def rank(score, ids):
    return np.lexsort((tie_keys(ids), -np.asarray(score)))


def qini(y, t, score, ids, e=.85):
    z = t*y/e - (1-t)*y/(1-e)
    ordered = z[rank(score, ids)]
    n = len(z)
    weights = 1 - (np.arange(n) + .5)/n
    auuc = float(np.dot(ordered, weights)/n)
    return {'AUUC': auuc, 'Qini': auuc - float(z.mean())/2,
            'U1_descriptive_benchmark_contrast': float(z.mean())}


def top(score, ids, capacity=.2):
    result = np.zeros(len(score), dtype=float)
    result[rank(score, ids)[:int(np.floor(capacity*len(score)))]] = 1
    return result


def policy_value(y, t, policy, e=.85):
    return float(np.mean(y*(t*policy/e + (1-t)*(1-policy)/(1-e))))


def response_metrics(y, t, p0, p1):
    p = np.clip(np.where(t == 1, p1, p0), 1e-12, 1-1e-12)
    return {'log_loss': float(log_loss(y, p, labels=[0, 1])),
        'Brier': float(brier_score_loss(y, p)), 'ROC_AUC': float(roc_auc_score(y, p)),
        'average_precision': float(average_precision_score(y, p))}


def preprocessing():
    return ColumnTransformer([
        ('continuous', Pipeline([('imputer', SimpleImputer(strategy='median')), ('scale', StandardScaler())]), PROTOCOL['continuous']),
        ('categorical', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(min_frequency=200, max_categories=64,
                handle_unknown='infrequent_if_exist', sparse_output=True))]), PROTOCOL['categorical'])], sparse_threshold=1.)


def fit_model(name, c, x, t, y):
    def estimator():
        return LogisticRegression(C=c, solver='lbfgs', max_iter=300, random_state=20261104)
    if name == 'S_Learner':
        pre = preprocessing()
        encoded = pre.fit_transform(x)
        model = estimator().fit(sparse.hstack([encoded, t[:, None]], format='csr'), y)
        return {'name': name, 'C': c, 'parts': [(pre, model)]}
    parts = []
    for arm in [0, 1]:
        choose = t == arm
        pre = preprocessing()
        encoded = pre.fit_transform(x.iloc[np.flatnonzero(choose)])
        model = estimator().fit(encoded, y[choose])
        parts.append((pre, model))
    return {'name': name, 'C': c, 'parts': parts}


def predict(model, x):
    if model['name'] == 'S_Learner':
        pre, learner = model['parts'][0]
        z = pre.transform(x)
        return [learner.predict_proba(sparse.hstack([z, np.full((len(x), 1), arm)], format='csr'))[:, 1] for arm in [0, 1]]
    return [learner.predict_proba(pre.transform(x))[:, 1] for pre, learner in model['parts']]
