"""Phase4B6: frozen-policy benchmark evaluation, no policy/model selection here."""
from common import *


def compute(y, t, score, response, ids, e=.85, capacity=.2):
    pi = top(score, ids, capacity)
    response_pi = top(response, ids, capacity)
    policies = {'candidate': pi, 'none': np.zeros(len(y)), 'all': np.ones(len(y)),
        'random_20pct': np.full(len(y), .2), 'response_20pct': response_pi}
    values = {name: policy_value(y, t, value, e) for name, value in policies.items()}
    return {**{'V_' + k: v for k,v in values.items()},
        'gain_vs_random20': values['candidate']-values['random_20pct'],
        'gain_vs_response20': values['candidate']-values['response_20pct'],
        'gain_vs_none': values['candidate']-values['none'],
        **qini(y, t, score, ids, e)}


def main():
    completion = json.loads((RESULTS / 'completion.json').read_text(encoding='utf-8'))
    frozen = json.loads((RESULTS / 'frozen_policy.json').read_text(encoding='utf-8'))
    assert sha(RESULTS / 'frozen_policy.json') == completion['frozen_policy_sha256']
    assert sha(RESULTS / (frozen['selected_model'] + '.joblib')) == frozen['model_sha256']
    assert sha(AUDIT / 'evaluation_protocol_compat.json') == frozen['protocol_sha256']
    with np.load(RESULTS / (frozen['selected_model'] + '_final_predictions.npz')) as saved:
        values = {k: saved[k].copy() for k in saved.files}
    y, t, ids = values['visit'], values['treatment'], values['ids']
    score, response = values['p1']-values['p0'], values['p1']
    primary = compute(y,t,score,response,ids)
    secondary = compute(values['conversion'],t,score,response,ids)
    # Bootstrap entire evaluation units with paired models/policies/outcomes.
    rng = np.random.default_rng(62061104)
    replicates = []
    for b in range(400):
        chosen = rng.integers(0, len(ids), len(ids))
        row = {'replicate': b,
            **compute(y[chosen],t[chosen],score[chosen],response[chosen],ids[chosen])}
        row['Qini_constant_arm_baseline'] = qini(y[chosen], t[chosen], np.zeros(len(chosen)), ids[chosen])['Qini']
        row['Qini_delta_vs_constant'] = row['Qini'] - row['Qini_constant_arm_baseline']
        row['secondary_conversion_gain_vs_random20'] = compute(values['conversion'][chosen],t[chosen],score[chosen],response[chosen],ids[chosen])['gain_vs_random20']
        replicates.append(row)
        if (b+1) % 50 == 0:
            print(f'Bootstrap {b+1}/400', flush=True)
    frame = pd.DataFrame(replicates)
    frame.to_csv(RESULTS / 'policy_bootstrap.csv', index=False)
    intervals = {col: {'lower_95': float(frame[col].quantile(.025)), 'upper_95': float(frame[col].quantile(.975))}
        for col in frame.columns if col != 'replicate'}
    sensitivity = []
    for e in [.8, .85, .9]:
        for q in [.1, .2, .3]:
            sensitivity.append({'e_weight': e, 'capacity': q, **compute(y,t,score,response,ids,e,q)})
    pd.DataFrame(sensitivity).to_csv(RESULTS / 'policy_sensitivity.csv', index=False)
    pi = top(score, ids)
    counts = []
    for targeted in [0, 1]:
        for arm in [0, 1]:
            include = (pi == targeted) & (t == arm)
            counts.append({'targeted': targeted, 'logged_treatment': arm, 'rows': int(include.sum()),
                'visit_events': int(y[include].sum()), 'conversion_events': int(values['conversion'][include].sum())})
    success = intervals['gain_vs_random20']['lower_95'] > 0 and intervals['Qini']['lower_95'] > 0
    result = {'status': 'COMPLETE_CONDITIONAL_BENCHMARK_ONLY', 'selected_policy_frozen_before_test': frozen,
        'primary_visit': primary, 'secondary_conversion_same_visit_policy': secondary,
        'bootstrap_replicates': 400, 'intervals': intervals, 'policy_cells': counts,
        'benchmark_success_by_preregistered_rule': success,
        'recommendation_validation': 'NOT_VALIDATED_FOR_REAL_MARKETING',
        'inference_assumptions': ['Publisher RCT-compatible released benchmark', 'IID rows', 'No hidden dependence/interference'],
        'sampling_sensitivity_resolves_original_causal_scale': False,
        'limitations': ['No released label-selection probabilities: no original-population lift or profit claim.',
            'No user/advertiser IDs: cluster-robust or repeated-user checks unavailable.',
            'Bootstrap is conditional on fitted/frozen models and excludes training/model-selection uncertainty.',
            'Sensitivity comparisons are descriptive, not new policy selection or confirmatory tests.',
            'Secondary outcomes/comparisons not multiplicity-adjusted; no secondary significance claim.'],
        'production_quality_gate': 'BASELINE_ONLY'}
    write(RESULTS / 'policy_results.json', result)
    print(json.dumps({'benchmark_success': success, 'primary': primary, 'gain_CI': intervals['gain_vs_random20']}, indent=2), flush=True)


if __name__ == '__main__':
    main()
