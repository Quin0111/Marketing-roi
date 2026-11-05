"""Render the report from verified observations, without rerunning training."""
import json
import re
from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent
OUT = HERE / 'results'


def read(name):
    return json.loads((OUT / name).read_text(encoding='utf-8'))


def table(headers, rows):
    def cell(value):
        return str(value).replace('|', '\\|').replace('\n', ' ')
    return '\n'.join(['| ' + ' | '.join(map(cell, headers)) + ' |',
                      '| ' + ' | '.join(['---'] * len(headers)) + ' |'] +
                     ['| ' + ' | '.join(map(cell, row)) + ' |' for row in rows])


def main():
    check, replay, frozen = read('verification_checks.json'), read('reproducibility.json'), read('preregistered_run.json')
    assert check['status'] == replay['status'] == 'PASS'
    config = json.loads((HERE / 'experiment_config.json').read_text(encoding='utf-8'))
    summary = read('model_summary.json')
    outer = pd.read_csv(OUT / 'outer_fold_scores.csv')
    inner = pd.read_csv(OUT / 'all_inner_trials.csv')
    values = {}
    provenance = {**frozen['sources_sha256'], **{k: v for k, v in frozen['data_access'].items() if k.endswith('sha256')}}
    values['PROVENANCE_TABLE'] = table(['Evidence', 'SHA256'], provenance.items())
    values['CONFIGURATION_TABLE'] = table(['Model', 'Candidate', 'Parameters'],
        [(m, c['candidate'], '`' + json.dumps(c['params'], sort_keys=True) + '`') for m, candidates in config['models'].items() for c in candidates])
    values['MODEL_METRICS_TABLE'] = table(['Model', 'MAE mean', 'MSE mean', 'RMSE mean', 'R2 mean', 'RMSE SD (15 folds)', 'Delta RMSE', 'Wins /15'],
        [[s['model']] + [f'{s[k]:.9f}' for k in ['MAE_mean', 'MSE_mean', 'RMSE_mean', 'R2_mean', 'RMSE_fold_sd_descriptive_15', 'delta_RMSE_mean']] + [s['folds_beating_Dummy']] for s in summary])
    names = list(config['models'])
    def pivot(column, selected):
        rows = []
        for (repeat, seed, fold), group in outer.groupby(['repeat', 'outer_seed', 'outer_fold']):
            rows.append([repeat, seed, fold] + [f'{group.loc[group.model == m, column].iloc[0]:.9f}' for m in selected])
        return table(['Repeat', 'Seed', 'Fold'] + selected, rows)
    values['OUTER_RMSE_TABLE'] = pivot('RMSE', names)
    values['PAIRED_DELTA_TABLE'] = pivot('delta_RMSE_vs_Dummy', names[1:])
    values['STABILITY_TABLE'] = table(['Model', 'Wins repeat 1/2/3', 'Mean improvement %', 'Proposed gate'],
        [[s['model'], str(s['folds_beating_Dummy_per_repeat']), f"{s['RMSE_improvement_pct_mean']:.6f}", 'NOT_MET'] for s in summary if s['model'] != 'Dummy'])
    values['MAX_SINGLE_FOLD_GAIN'] = f"{-outer.delta_RMSE_vs_Dummy.min():.9f}"
    values['ALL_INNER_CANDIDATES'] = table(['Model', 'Candidate', 'Inner fits', 'Mean inner RMSE', 'Mean fit seconds'],
        [[m, c, len(g), f'{g.RMSE.mean():.9f}', f'{g.fit_seconds.mean():.6f}'] for (m, c), g in inner.groupby(['model', 'candidate'])])
    values['SELECTION_COUNTS'] = table(['Model', 'Selected candidate counts'], [[s['model'], json.dumps(s['selected_candidate_counts'])] for s in summary])
    values['TRAIN_GAP_AND_TIMING'] = table(['Model', 'Train RMSE', 'Outer RMSE', 'Gap', 'Mean outer fit seconds', 'Total inner fit seconds'],
        [[s['model']] + [f'{s[k]:.9f}' for k in ['train_RMSE_mean', 'RMSE_mean', 'train_assessment_RMSE_gap_mean', 'mean_outer_refit_seconds', 'total_inner_fit_seconds']] for s in summary])
    timing = read('experiment_summary.json')['timing']
    values['COMPUTE_COST'] = (f"Main experiment: 360 inner + 75 outer = 435 fits; measured inner fit time {timing['inner_fit_seconds_total']:.3f}s, "
        f"outer refit time {timing['outer_refit_seconds_total']:.3f}s. Preflight: 5 fits. Independent replay: 75 outer + 24 inner fits. "
        'Total: 539 fits. These fit times exclude loading, prediction, checks and report generation; no complete wall-clock runtime is inferred.')
    values['VERIFICATION_SUMMARY'] = (f"**PASS: {check['count']} checks.** Independent replay: 75/75 outer refits and 24/24 first-outer-fold inner fits. "
        f"Maximum outer prediction error: {replay['max_abs_prediction_error']:.17g}; maximum outer metric error: {replay['max_metric_error']:.17g}; "
        f"bitwise prediction hashes equal: {sum(r['bitwise_prediction_hash_equal'] for r in replay['outer'])}/75. Tolerance: 1e-12. "
        'The full 360-fit inner search was not executed a second time. '
        f"Protected prior files unchanged: {read('final_integrity.json')['protected_files']}. "
        'Procedure verification PASS does not establish model predictive or causal validity. '
        'Raw evidence: [verification_checks.json](results/verification_checks.json), [reproducibility.json](results/reproducibility.json), '
        '[final_integrity.json](results/final_integrity.json).')
    env = frozen['environment']
    values['ENVIRONMENT_TABLE'] = table(['Setting', 'Value'], list(env['versions'].items()) +
        [[k, env[k]] for k in ['python', 'platform', 'logical_cpus', 'thread_budget', 'fits_parallel', 'threadpool_wide_enum_fallback']])
    report = (HERE / 'report_template.md.in').read_text(encoding='utf-8')
    for key, value in values.items():
        report = report.replace('{{' + key + '}}', value)
    assert not re.search(r'\{\{.*?\}\}', report)
    (HERE / 'model_experiment_report.md').write_text(report, encoding='utf-8')
    print('Report rendered from verified results.')


if __name__ == '__main__':
    main()
