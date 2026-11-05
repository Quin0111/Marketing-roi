"""Locked train/CV/selection/final sequence on a new source. Never old ROI Test."""
import json
import time
import warnings
from common import *
import joblib
from sklearn.model_selection import StratifiedKFold


def prepare():
    path = AUDIT / 'raw/criteo-research-uplift-v2.1.csv.gz'
    assert sha(path) == PROTOCOL['dataset_sha256']
    ids = np.random.default_rng(PROTOCOL['sample_seed']).choice(PROTOCOL['dataset_rows'], PROTOCOL['sample_rows'], replace=False)
    perm = np.random.default_rng(PROTOCOL['split_seed']).permutation(len(ids))
    split = {'train': perm[:600000], 'validation': perm[600000:800000], 'test': perm[800000:]}
    np.savez_compressed(RESULTS / 'split_manifest.npz', source_row_ids=ids, **split)
    sorted_ids = np.sort(ids)
    frames, offset = [], 0
    for chunk in pd.read_csv(path, chunksize=250000):
        lo, hi = np.searchsorted(sorted_ids, [offset, offset+len(chunk)])
        local = sorted_ids[lo:hi] - offset
        if len(local):
            sub = chunk.iloc[local].copy()
            sub.index = sorted_ids[lo:hi]
            frames.append(sub)
        offset += len(chunk)
    frame = pd.concat(frames).loc[ids]
    assert len(frame) == len(ids) and frame.notna().all().all()
    np.savez_compressed(RESULTS / 'sample_data.npz', x=frame[FEATURES].to_numpy(),
        treatment=frame.treatment.to_numpy(dtype=np.int8), visit=frame.visit.to_numpy(dtype=np.int8),
        conversion=frame.conversion.to_numpy(dtype=np.int8))
    write(RESULTS / 'split_manifest.json', {'protocol': PROTOCOL['id'], 'sample_ids_sha256': array_sha(ids),
        'parts': {k: {'rows': len(v), 'source_row_ids_sha256': array_sha(ids[v])} for k,v in split.items()},
        'old_dataset_or_test_loaded': False, 'index_only_split': True,
        'manifest_file_sha256': sha(RESULTS / 'split_manifest.npz')})
    return frame, ids, split


def main():
    assert json.loads((AUDIT / 'phase_gate.json').read_text(encoding='utf-8'))['decision'] == 'GO'
    assert not (RESULTS / 'run_lock.json').exists(), 'Do not overwrite or mix a completed/partial run'
    environment = runtime()
    lock = {'protocol': PROTOCOL, 'environment': environment,
        'sources_sha256': {name: sha(HERE / name) for name in ['common.py', 'run.py']},
        'protocol_sha256': sha(AUDIT / 'evaluation_protocol.json'), 'gate_sha256': sha(AUDIT / 'phase_gate.json')}
    write(RESULTS / 'run_lock.json', lock)
    frame, ids, split = prepare()
    x = frame[FEATURES]
    t, y = frame.treatment.to_numpy(), frame.visit.to_numpy()
    train, validation, test = [split[k] for k in ['train', 'validation', 'test']]
    assert not np.intersect1d(train, validation).size and not np.intersect1d(train, test).size and not np.intersect1d(validation, test).size
    inner = list(StratifiedKFold(3, shuffle=True, random_state=741104).split(train, 2*t[train]+y[train]))
    trials, models, selections = [], {}, []
    classifier_fits = 0
    for name, grid in PROTOCOL['models'].items():
        means = []
        for c in grid:
            values = []
            for fold, (fit, assess) in enumerate(inner, 1):
                fit_ids, assess_ids = train[fit], train[assess]
                start = time.perf_counter()
                with warnings.catch_warnings(record=True) as caught:
                    warnings.simplefilter('always')
                    model = fit_model(name, c, x.iloc[fit_ids], t[fit_ids], y[fit_ids])
                assert not caught, [str(w.message) for w in caught]
                seconds = time.perf_counter()-start
                p0, p1 = predict(model, x.iloc[assess_ids])
                score = qini(y[assess_ids], t[assess_ids], p1-p0, ids[assess_ids])
                values.append(score['Qini'])
                classifier_fits += len(model['parts'])
                trials.append({'model': name, 'C': c, 'fold': fold, 'fit_rows': len(fit_ids),
                    'assessment_rows': len(assess_ids), 'fit_ids_sha256': array_sha(ids[fit_ids]),
                    'assessment_ids_sha256': array_sha(ids[assess_ids]), 'fit_seconds': seconds,
                    **score, **response_metrics(y[assess_ids], t[assess_ids], p0, p1),
                    'warnings': [str(w.message) for w in caught]})
                write(RESULTS / 'inner_trials.json', trials)
                print(name, c, fold, 'Qini', score['Qini'], 'fit_seconds', seconds, flush=True)
            means.append(float(np.mean(values)))
        selected = int(np.argmax(means))
        c = grid[selected]
        start = time.perf_counter()
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter('always')
            model = fit_model(name, c, x.iloc[train], t[train], y[train])
        assert not caught, [str(w.message) for w in caught]
        seconds = time.perf_counter()-start
        classifier_fits += len(model['parts'])
        models[name] = model
        joblib.dump(model, RESULTS / (name + '.joblib'))
        p0, p1 = predict(model, x.iloc[validation])
        score = qini(y[validation], t[validation], p1-p0, ids[validation])
        selections.append({'model': name, 'selected_C': c, 'inner_Cs': grid, 'inner_mean_Qini': means,
            'validation': score, 'outer_fit_seconds': seconds, 'fit_rows': len(train)})
    selected = max(selections, key=lambda row: row['validation']['Qini'])
    write(RESULTS / 'selection_results.json', selections)
    frozen = {'selected_model': selected['model'], 'selected_C': selected['selected_C'],
        'capacity': .2, 'primary_outcome': 'visit', 'propensity': .85,
        'selected_by': 'Validation Qini only, prior to any final evaluation metric',
        'model_sha256': sha(RESULTS / (selected['model'] + '.joblib')),
        'validation_selection_sha256': sha(RESULTS / 'selection_results.json'),
        'protocol_sha256': lock['protocol_sha256'], 'test_rows': len(test), 'test_outcomes_used_for_selection': False}
    write(RESULTS / 'frozen_policy.json', frozen)
    # Only now compute metrics on final partition; policy/config already fixed.
    results = []
    for name in PROTOCOL['models']:
        p0, p1 = predict(models[name], x.iloc[test])
        np.savez_compressed(RESULTS / (name + '_final_predictions.npz'), ids=ids[test], treatment=t[test],
            visit=y[test], conversion=frame.conversion.to_numpy()[test], p0=p0, p1=p1)
        results.append({'model': name, **qini(y[test], t[test], p1-p0, ids[test]),
            **response_metrics(y[test], t[test], p0, p1)})
    means = [float(y[train][t[train] == arm].mean()) for arm in [0, 1]]
    baseline = {'model': 'Constant_arm_means', 'train_arm_means': means,
        **qini(y[test], t[test], np.full(len(test), means[1]-means[0]), ids[test]),
        **response_metrics(y[test], t[test], np.full(len(test), means[0]), np.full(len(test), means[1]))}
    results.append(baseline)
    assert classifier_fits == 21
    write(RESULTS / 'final_scores.json', results)
    pd.DataFrame(trials).to_csv(RESULTS / 'inner_trials.csv', index=False)
    write(RESULTS / 'completion.json', {'status': 'COMPLETE', 'inner_trials': len(trials), 'classifier_fits': classifier_fits,
        'models': list(models), 'warnings': 0, 'old_dataset_or_test_loaded': False,
        'production_quality_gate': 'BASELINE_ONLY', 'frozen_policy_sha256': sha(RESULTS / 'frozen_policy.json')})
    print('PHASE4B5 COMPLETE', json.dumps(results), flush=True)


if __name__ == '__main__':
    main()
