"""Independent refits, metric algebra and research integrity checks."""
from common import *
import joblib
from sklearn.model_selection import StratifiedKFold


def main():
    environment = runtime()
    checks = []
    def require(name, valid):
        checks.append({'check': name, 'status': 'PASS' if valid else 'FAIL'})
        assert valid, name
    lock = json.loads((RESULTS / 'run_lock.json').read_text(encoding='utf-8'))
    completion = json.loads((RESULTS / 'completion.json').read_text(encoding='utf-8'))
    for name, value in lock['sources_sha256'].items():
        require('Locked source hash: ' + name, sha(HERE / name) == value)
    require('Locked protocol hash', sha(AUDIT / 'evaluation_protocol_compat.json') == lock['protocol_sha256'])
    require('Locked gate hash', sha(AUDIT / 'phase_gate.json') == lock['gate_sha256'])
    require('Run completed exact budget', completion['status'] == 'COMPLETE' and completion['classifier_fits'] == 21 and completion['inner_trials'] == 12)
    with np.load(RESULTS / 'split_manifest.npz') as manifest:
        ids = manifest['source_row_ids'].copy()
        split = {k: manifest[k].copy() for k in ['train','validation','test']}
    require('Uniform sample unique IDs', len(ids) == len(np.unique(ids)) == 1000000)
    require('Exact disjoint train/selection/test partitions', [len(split[k]) for k in ['train','validation','test']] == [600000,200000,200000] and len(np.unique(np.concatenate(list(split.values())))) == 1000000)
    with np.load(RESULTS / 'sample_data.npz') as data:
        x = pd.DataFrame(data['x'], columns=FEATURES)
        t, y = data['treatment'].copy(), data['visit'].copy()
    train, test = split['train'], split['test']
    trials = json.loads((RESULTS / 'inner_trials.json').read_text(encoding='utf-8'))
    folds = list(StratifiedKFold(3,shuffle=True,random_state=741104).split(train,2*t[train]+y[train]))
    for trial in trials:
        fit, assess = folds[trial['fold']-1]
        require('Inner fit scope ' + str((trial['model'],trial['C'],trial['fold'])),
            trial['fit_ids_sha256'] == array_sha(ids[train[fit]]) and trial['assessment_ids_sha256'] == array_sha(ids[train[assess]]) and all(w == 'Unknown solver options: iprint' for w in trial['warnings']))
    selected = json.loads((RESULTS / 'selection_results.json').read_text(encoding='utf-8'))
    for row in selected:
        means = [float(np.mean([v['Qini'] for v in trials if v['model'] == row['model'] and v['C'] == c])) for c in row['inner_Cs']]
        require('Inner-only hyperparameter selection ' + row['model'], row['selected_C'] == row['inner_Cs'][int(np.argmax(means))])
    frozen = json.loads((RESULTS / 'frozen_policy.json').read_text(encoding='utf-8'))
    require('Validation-only frozen policy selection', frozen['selected_model'] == max(selected,key=lambda r:r['validation']['Qini'])['model'] and not frozen['test_outcomes_used_for_selection'])
    replays = []
    scores = json.loads((RESULTS / 'final_scores.json').read_text(encoding='utf-8'))
    for row in selected:
        model = fit_model(row['model'], row['selected_C'], x.iloc[train],t[train],y[train])
        p0,p1 = predict(model,x.iloc[test])
        with np.load(RESULTS / (row['model'] + '_final_predictions.npz')) as saved:
            error = max(float(np.max(np.abs(saved['p0']-p0))),float(np.max(np.abs(saved['p1']-p1))))
            require('Prediction rows/outcome match frozen evaluation ' + row['model'], np.array_equal(ids[test],saved['ids']) and np.array_equal(y[test],saved['visit']))
        require('Independent refit predictions ' + row['model'], error <= 1e-10)
        observed = qini(y[test],t[test],p1-p0,ids[test])
        original = next(v for v in scores if v['model']==row['model'])
        require('Raw final metrics recompute ' + row['model'], all(abs(observed[k]-original[k])<1e-10 for k in observed))
        for arm,(pre,learner) in enumerate(model['parts']):
            subset = x.iloc[train if row['model']=='S_Learner' else train[t[train]==arm]]
            stats = pre.named_transformers_['continuous'].named_steps['imputer'].statistics_
            require('Fit-only numeric preprocessing ' + row['model']+str(arm),np.allclose(stats,subset[PROTOCOL['continuous']].median().to_numpy(),atol=1e-12,rtol=0))
        replays.append({'model':row['model'],'max_abs_probability_error':error,'classifier_refits':len(model['parts'])})
    policy = json.loads((RESULTS / 'policy_results.json').read_text(encoding='utf-8'))
    require('Policy frozen file unchanged', sha(RESULTS / 'frozen_policy.json') == completion['frozen_policy_sha256'])
    require('Bootstrap exact budget', len(pd.read_csv(RESULTS / 'policy_bootstrap.csv')) == policy['bootstrap_replicates'] == 400)
    require('Policy target capacity exact', sum(v['rows'] for v in policy['policy_cells'] if v['targeted']==1) == 40000)
    require('Sensitivity predeclared full grid', len(pd.read_csv(RESULTS / 'policy_sensitivity.csv')) == 9)
    # Algebraic independent identities on observed heldout data, no synthetic marketing data.
    with np.load(RESULTS / (frozen['selected_model']+'_final_predictions.npz')) as saved:
        yt,tt = saved['visit'],saved['treatment']
        require('Treat-all value identity',abs(policy['primary_visit']['V_all']-float(np.mean(yt*tt/.85)))<1e-12)
        require('No-treatment value identity',abs(policy['primary_visit']['V_none']-float(np.mean(yt*(1-tt)/.15)))<1e-12)
        require('Random20 policy mixture identity',abs(policy['primary_visit']['V_random_20pct']-(.2*policy['primary_visit']['V_all']+.8*policy['primary_visit']['V_none']))<1e-12)
    before=json.loads((AUDIT/'evidence/protected_before.json').read_text(encoding='utf-8'))
    changed=[name for name,value in before.items() if sha(ROOT/name)!=value]
    require('All preexisting source/artifact/research files unchanged',not changed)
    require('Seven original artifacts included',len([name for name in before if name.startswith('backend/models/')])==7)
    meta=json.loads((ROOT/'backend/models/model_metadata.json').read_text(encoding='utf-8'))
    require('Production BASELINE_ONLY no rank/optimize',meta['model_quality_status']=='BASELINE_ONLY' and not meta['quality_gate_rules']['allow_optimization_recommendation'] and not meta['quality_gate_rules']['allow_automatic_ranking'])
    write(RESULTS/'verification_results.json',{'status':'PASS','count':len(checks),'checks':checks,'independent_replays':replays,
        'protected_files':len(before),'changed':changed,'environment':environment,'old_roi_test_loaded':False,
        'scope':'Independent selected refits (3 classifiers), not a repeat of all 18 CV fits; no causal-assumption proof',
        'scientific_status':'RESEARCH_LIMITED','production_quality_gate':'BASELINE_ONLY'})
    print(f'PASS {len(checks)} checks; independent refits and {len(before)} protected files',flush=True)


if __name__=='__main__':
    main()
