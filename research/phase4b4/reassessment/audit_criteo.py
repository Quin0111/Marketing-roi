"""Streaming schema/feasibility audit of Criteo only. No fit or policy evaluation."""
import hashlib
import json
import math
import platform
import time
from pathlib import Path
from statistics import NormalDist

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
PATH = HERE / 'raw/criteo-research-uplift-v2.1.csv.gz'
EXPECTED = '2716e1bf0fd157a93b5bf86924d9088419dfbac2022c6cd90030220634f616dc'
COLS = [f'f{i}' for i in range(12)] + ['treatment', 'conversion', 'visit', 'exposure']


def main():
    start = time.perf_counter()
    with PATH.open('rb') as stream:
        actual = hashlib.file_digest(stream, 'sha256').hexdigest()
    assert actual == EXPECTED
    rows = missing = nonfinite = invalid_binary = control_exposed = conversion_without_visit = 0
    groups = {str(a): {'rows': 0, 'conversion': 0, 'visit': 0, 'exposure': 0} for a in [0, 1]}
    schema = None
    for index, frame in enumerate(pd.read_csv(PATH, chunksize=250000)):
        assert list(frame.columns) == COLS
        if schema is None:
            schema = {k: str(v) for k, v in frame.dtypes.items()}
        rows += len(frame)
        missing += int(frame.isna().sum().sum())
        nonfinite += int((~np.isfinite(frame.to_numpy(dtype=float))).sum())
        invalid_binary += int((~frame[COLS[-4:]].isin([0, 1])).sum().sum())
        control_exposed += int(((frame.treatment == 0) & (frame.exposure != 0)).sum())
        conversion_without_visit += int(((frame.conversion == 1) & (frame.visit == 0)).sum())
        for a in [0, 1]:
            group = frame[frame.treatment == a]
            groups[str(a)]['rows'] += len(group)
            for name in ['conversion', 'visit', 'exposure']:
                groups[str(a)][name] += int(group[name].sum())
        if index % 10 == 0:
            print(f'Audited {rows} rows', flush=True)
    assert rows == 13979592
    assert missing == nonfinite == invalid_binary == control_exposed == conversion_without_visit == 0
    for group in groups.values():
        for name in ['conversion', 'visit', 'exposure']:
            group[name + '_rate_descriptive'] = group[name] / group['rows']
    # Prospective normal approximation under a hypothetical valid IID RCT.
    # Does not estimate power for unidentified causal effects in selected data.
    p_treat = groups['1']['rows'] / rows
    z = NormalDist().inv_cdf(.975) + NormalDist().inv_cdf(.8)
    power_rows = []
    for total in [200000, rows]:
        for fraction in [1., .2, .02]:
            n = math.floor(total * fraction)
            n1, n0 = n * p_treat, n * (1 - p_treat)
            for p in [.003, .05]:
                se = math.sqrt(p * (1-p) * (1/n1 + 1/n0))
                power_rows.append({'source_rows': total, 'evaluation_fraction': fraction,
                    'expected_evaluation_rows': n, 'expected_treated': n1, 'expected_control': n0,
                    'assumed_common_rate': p, 'alpha_two_sided': .05, 'power': .8,
                    'approx_MDE_probability': z * se, 'approx_MDE_percentage_points': 100*z*se,
                    'expected_control_events_under_null': n0*p,
                    'normal_approximation_fragile': n0*p < 20})
    pd.DataFrame(power_rows).to_csv(HERE / 'evidence/prospective_power.csv', index=False)
    result = {'status': 'PASS_STRUCTURAL_AUDIT_ONLY', 'rows': rows, 'columns': COLS, 'schema': schema,
        'sha256': actual, 'bytes_compressed': PATH.stat().st_size,
        'missing_cells': missing, 'nonfinite_cells': nonfinite, 'invalid_binary_cells': invalid_binary,
        'control_exposed_rows': control_exposed, 'conversion_without_visit_rows': conversion_without_visit,
        'groups_descriptive_not_causal': groups, 'treatment_ratio_descriptive': p_treat,
        'whole_release_aggregate_audited': True, 'evaluation_holdout_created': False,
        'old_dataset_or_test_loaded': False, 'models_fitted': 0, 'policy_evaluated': False,
        'limitations': ['No user/advertiser IDs or timestamps to independently check identity/dependence/timing.',
                        'No selection probabilities: aggregate group differences are not asserted causal.',
                        'Power table is IID-RCT design sensitivity, not achieved causal power or policy-model power.',
                        'Feature-tuple duplicates are not automatically duplicate users; no identity-based deduplication invented.'],
        'versions': {'python': platform.python_version(), 'numpy': np.__version__, 'pandas': pd.__version__},
        'elapsed_seconds': time.perf_counter() - start}
    (HERE / 'evidence/criteo_schema_audit.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2), flush=True)


if __name__ == '__main__':
    main()
