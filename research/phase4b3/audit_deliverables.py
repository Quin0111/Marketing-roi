"""Integrity/document checks only. Never load a dataset, pipeline or Test labels."""
import argparse
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SKIP = {'.deps', '.mplconfig', '__pycache__', '.venv', 'node_modules', '.git', 'dist'}


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def snapshot():
    paths = []
    for name in ['src', 'backend', 'tests', 'research']:
        for path in (ROOT / name).rglob('*'):
            rel = path.relative_to(ROOT)
            if path.is_file() and HERE not in path.parents and not SKIP.intersection(rel.parts):
                paths.append(path)
    paths += [p for p in ROOT.iterdir() if p.is_file()]
    return {str(p.relative_to(ROOT)).replace('\\', '/'): digest(p) for p in sorted(set(paths))}


def write(name, value):
    (HERE / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', action='store_true')
    args = parser.parse_args()
    if args.snapshot:
        assert not (HERE / 'protected_before.json').exists(), 'Never overwrite original snapshot'
        before = snapshot()
        write('protected_before.json', before)
        print(f'Snapshotted {len(before)} prior files; no dataset/labels loaded.')
        return
    # Reports link to this generated output; materialize its path before link QA.
    write('verification_results.json', {'status': 'RUNNING', 'scope': 'Integrity/document checks only'})
    checks = []
    def require(name, condition):
        checks.append({'name': name, 'status': 'PASS' if condition else 'FAIL'})
    before = json.loads((HERE / 'protected_before.json').read_text(encoding='utf-8'))
    after = snapshot()
    require('All protected files byte-identical and no new files outside Phase4B3 in guarded scope', before == after)
    require('Seven original artifacts included in snapshot', len([p for p in before if p.startswith('backend/models/')]) == 7)
    metadata = json.loads((ROOT / 'backend/models/model_metadata.json').read_text(encoding='utf-8'))
    require('BASELINE_ONLY and ranking/optimization disabled', metadata['model_quality_status'] == 'BASELINE_ONLY' and
            not metadata['quality_gate_rules']['allow_automatic_ranking'] and not metadata['quality_gate_rules']['allow_optimization_recommendation'])
    reports = ['dataset_feasibility_report.md', 'dataset_comparison.md', 'recommended_research_plan.md']
    for name in reports:
        text = (HERE / name).read_text(encoding='utf-8')
        require('Nonempty UTF8 report: ' + name, len(text) > 2000 and '\ufffd' not in text)
        require('No unresolved template placeholders: ' + name, '{{' not in text and '}}' not in text)
        links = re.findall(r'\]\(([^)]+)\)', text)
        local = [v.split('#')[0] for v in links if not v.startswith(('https://', 'http://', '#'))]
        require('All relative evidence links resolve: ' + name, all((HERE / v).exists() for v in local))
    sources = json.loads((HERE / 'source_evidence.json').read_text(encoding='utf-8'))
    require('Unique source IDs and dated primary evidence', len({r['id'] for r in sources}) == len(sources) and
            all(r['checked_on'] == '2026-11-03' and r['url'].startswith('https://') and r['status'] in ['READ', 'UNAVAILABLE'] for r in sources))
    require('Unverified Kaggle origin remains unresolved', any(r['id'] == 'S00' and r['status'] == 'UNAVAILABLE' for r in sources))
    result = {'status': 'PASS' if all(r['status'] == 'PASS' for r in checks) else 'FAIL', 'checks': checks,
              'count': len(checks), 'protected_files': len(before), 'before': before, 'after': after,
              'scope': 'Integrity and document checks, not independent verification of downloaded datasets, licenses or policy value.',
              'dataset_loaded': False, 'test_roi_loaded': False, 'training_run': False,
              'scientific_release_status': 'BLOCKED_INSUFFICIENT_EVIDENCE', 'quality_gate': 'BASELINE_ONLY'}
    write('verification_results.json', result)
    print(f"{result['status']}: {len(checks)} checks; {len(before)} protected files unchanged={before == after}")
    assert result['status'] == 'PASS'


if __name__ == '__main__':
    main()
