"""Summarize completed runs; never infer a pass from an unexecuted test."""
from pathlib import Path
import hashlib, json, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'research/phase5/run_compare_api'
def read(path): return json.loads((OUT / path).read_text(encoding='utf8'))
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

commands = ['backend-evaluation', 'frontend-delivery', 'e2e-isolated-delivery',
            'build-isolated-delivery', 'build-default-delivery', 'offline-isolated-final',
            'http-isolated-final', 'compile-evaluation', 'pip_check-evaluation']
records = {name: read(name + '-command.json') for name in commands}
assert all(record['exit_code'] == 0 for record in records.values())
xml = ET.parse(OUT / 'backend-evaluation.xml').getroot()
cases = xml.findall('.//testcase')
backend = {'pass': sum(not list(case) or not any(case.find(tag) is not None for tag in ['failure', 'error', 'skipped']) for case in cases),
           'fail': sum(any(case.find(tag) is not None for tag in ['failure', 'error']) for case in cases),
           'skip': sum(case.find('skipped') is not None for case in cases)}
fe = read('frontend-delivery.json')
frontend = dict(zip(['pass', 'fail', 'skip'], [fe['numPassedTests'], fe['numFailedTests'], fe['numPendingTests']]))
e2e = read('e2e-isolated-delivery.json')
browser = dict(zip(['pass', 'fail', 'skip'], [e2e['stats']['expected'], e2e['stats']['unexpected'], e2e['stats']['skipped']]))
assert e2e['stats']['flaky'] == 0
assert backend == {'pass': 62, 'fail': 0, 'skip': 0}
assert frontend == {'pass': 112, 'fail': 0, 'skip': 0}
assert browser == {'pass': 48, 'fail': 0, 'skip': 0}
cleanup = read('e2e-isolated-delivery/e2e-cleanup.json')
assert cleanup['backendExitCode'] == 0 and not cleanup['backendStillAlive'] and not any(cleanup['portsOpen'].values())
integrity = read('integrity.json')
assert integrity['status'] == 'PASS'
before = read('before.json')
modified = integrity['changed_files']
new_sources = []
for folder in ['src', 'tests', 'backend/tests', 'research/phase5']:
    for p in (ROOT / folder).rglob('*'):
        if not p.is_file() or OUT in p.parents or '__pycache__' in p.parts: continue
        name = p.relative_to(ROOT).as_posix()
        if name not in before and p.suffix in {'.ts', '.tsx', '.py', '.mjs', '.json', '.md'}:
            new_sources.append(name)
snapshot = {p.relative_to(ROOT).as_posix(): sha(p) for p in (ROOT / 'src').rglob('*') if p.is_file()}
evidence = {'status': 'PASS', 'decision': 'READY_FOR_DEMO_RESEARCH_ONLY', 'quality_gate': 'BASELINE_ONLY',
            'research_status': 'RESEARCH_LIMITED', 'suites': {'backend': backend, 'frontend': frontend, 'e2e': browser},
            'total_unique_tests': 222, 'commands': records, 'cleanup': cleanup,
            'seven_original_artifacts_unchanged': integrity['seven_original_artifacts_unchanged'],
            'protected_changed': integrity['protected_changed'],
            'modified_prior_files': modified, 'new_delivery_files': sorted(set(new_sources)),
            'source_sha256': snapshot,
            'screenshots': {p.relative_to(OUT).as_posix(): sha(p) for p in (OUT / 'e2e-isolated-delivery-artifacts').rglob('*.png')}}
(OUT / 'acceptance_summary.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding='utf8')
lines = ['# Danh mục file thay đổi trong lượt nâng cấp', '',
         'Đối chiếu snapshot trước khi sửa; không dùng Git hoặc sửa lịch sử để lập danh mục.', '',
         '## File đã có và được sửa', '']
lines += [f'- `{name}`' for name in modified]
lines += ['', '## File mới của lượt bàn giao (không liệt kê từng log/bundle/ảnh)', '']
lines += [f'- `{name}`' for name in sorted(set(new_sources))]
lines += ['', 'Logs, JSON, JUnit, screenshot và bundle kiểm thử: `run_compare_api/`. Hash source và ảnh trong `acceptance_summary.json`.', '']
(OUT / 'changed_files.md').write_text('\n'.join(lines), encoding='utf8')
print(json.dumps({'status': evidence['status'], 'suites': evidence['suites'], 'total_unique_tests': 222,
                  'modified_files': len(modified), 'new_delivery_files': len(set(new_sources)),
                  'screenshots': len(evidence['screenshots'])}, ensure_ascii=False))
