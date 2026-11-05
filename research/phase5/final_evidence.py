"""Finalize evidence from real command records. Never converts a failed run to PASS."""
from pathlib import Path
import json,hashlib,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/phase5/run_final_handoff';DOC=ROOT/'research/phase5'
def read(name):return json.loads((OUT/name).read_text(encoding='utf-8-sig'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
labels=['backend-final','frontend-acceptance','e2e-isolated-release','build-isolated-acceptance','build-default-acceptance','compile-acceptance','pip_check-acceptance','offline-isolated-coldfix','http-isolated-release','targeted-fixed','targeted-e2e']
commands={name:read(name+'-command.json') for name in labels};assert all(c['exit_code']==0 for c in commands.values())
cases=ET.parse(OUT/'backend-final.xml').getroot().findall('.//testcase');assert len(cases)==62 and not any(c.find(t) is not None for c in cases for t in ['failure','error','skipped'])
f=read('frontend-acceptance.json');assert (f['numPassedTests'],f['numFailedTests'],f['numPendingTests'])==(236,0,0)
e=read('e2e-isolated-release.json');assert (e['stats']['expected'],e['stats']['unexpected'],e['stats']['skipped'],e['stats']['flaky'])==(80,0,0,0)
integrity=read('integrity.json');assert integrity['status']=='PASS' and not integrity['protected_changed'] and integrity['seven_original_artifacts_unchanged']
cleanup=read('e2e-isolated-release/e2e-cleanup.json');assert cleanup['backendExitCode']==0 and not cleanup['backendStillAlive'] and not any(cleanup['portsOpen'].values())
http=read('generated_current/backend/tests/http_results.json');assert len(http['responses'])==9 and all(p['absolute_error']==0 for p in http['predictions'])
offline=read('generated_current/tests/results/backend-offline.json');assert offline['status']=='PASS' and not offline['backend_running'] and offline['displayed_roi'] is None and offline['compare_api_roi'] is None
assert read('release-bundle.json')['status']=='PASS'
# Inventory against the beginning of the action-plan task, before the final expansion.
baseline=json.loads((DOC/'run_action_plan/before.json').read_text(encoding='utf8'))
changed=[p for p,h in baseline.items() if p.startswith(('src/','tests/')) and (not (ROOT/p).exists() or sha(ROOT/p)!=h)]
changed_source=[p for p in changed if Path(p).suffix in {'.ts','.tsx','.mjs','.css'}]
new_source=[p.relative_to(ROOT).as_posix() for folder in ['src','tests'] for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in {'.ts','.tsx','.mjs','.css'} and p.relative_to(ROOT).as_posix() not in baseline]
summary={'status':'PASS','decision':'READY_FOR_DEMO_RESEARCH_ONLY','feature_groups_complete':5,'fixed_functional_defects':6,'p0_p1_remaining':0,
 'suites':{'backend':{'pass':62,'fail':0,'skip':0},'frontend':{'pass':236,'fail':0,'skip':0},'e2e':{'pass':80,'fail':0,'skip':0,'flaky':0}},'total_unique_tests':378,
 'quality_gate':'BASELINE_ONLY','research_status':'RESEARCH_LIMITED','uc08_verified_roi_optimization':'NOT_IMPLEMENTED',
 'commands':commands,'integrity':integrity,'cleanup':cleanup,'reference_predictions':http['predictions'],'offline':offline,
 'modified_existing_source':changed_source,'added_source':sorted(new_source),
 'source_sha256':{p.relative_to(ROOT).as_posix():sha(p) for p in (ROOT/'src').rglob('*') if p.is_file()},
 'screenshots':{p.relative_to(OUT).as_posix():sha(p) for p in (OUT/'e2e-isolated-release-artifacts').rglob('*.png')}}
(OUT/'acceptance_summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
inventory=['# File inventory — action-plan, industry, lifecycle và final fixes','', '## File source có trước đã sửa','']+[f'- `{p}`' for p in changed_source]+['','## Source mới','']+[f'- `{p}`' for p in sorted(new_source)]+['','## Reports / QA','',
 '- `marketing_action_plan_upgrade.md`, `industry_marketing_recommendation.md`, `campaign_lifecycle_upgrade.md`.',
 '- `FINAL_PROJECT_HANDOFF.md`, `FINAL_ACCEPTANCE_REPORT.md`, `FINAL_TEST_RESULTS.md`, `FINAL_REMAINING_ISSUES.md`.',
 '- `action_plan_{guard,restore,run}.py`, `final_{guard,restore,run}.py`, `final_e2e_targeted.py`, `final_evidence.py`.',
 '- Raw logs/records/bundles/images ở `run_action_plan/` và `run_final_handoff/`; checkpoint history giữ riêng.',
 '', 'Không có Git repository; inventory dùng hash manifest đầu task. Generated reports test được phân loại riêng, không coi là source sửa production.']
(OUT/'changed_files.md').write_text('\n'.join(inventory),encoding='utf8')
table='''**READY_FOR_DEMO — bản local có giới hạn nghiên cứu.** Hoàn thành 5/5 luồng chức năng trong phạm vi, 6 lỗi chức năng đã xử lý, không còn P0/P1 theo code review và kiểm thử cuối. Không phải chứng minh hiệu quả kinh doanh.

| Suite thực sự chạy | PASS | FAIL | SKIP | Exit | Evidence |
|---|---:|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | 0 | [JUnit](run_final_handoff/backend-final.xml), [record](run_final_handoff/backend-final-command.json) |
| Frontend Vitest / integration | 236 | 0 | 0 | 0 | [JSON](run_final_handoff/frontend-acceptance.json), [record](run_final_handoff/frontend-acceptance-command.json) |
| Browser E2E | 80 | 0 | 0 | 0 | [JSON](run_final_handoff/e2e-isolated-release.json), [record](run_final_handoff/e2e-isolated-release-command.json) |

**Tổng 378 ca duy nhất PASS, 0 FAIL, 0 SKIP, 0 BLOCKED ở nghiệm thu cuối; E2E flaky=0.** So baseline trước action-plan263: thêm96 FE +19 E2E; không cộng targeted hoặc nested matrix assertions thành ca mới.

| Kiểm bổ trợ | Kết quả / evidence |
|---|---|
| TypeScript và production build default | PASS/exit0, `tsc && vite build`; [log](run_final_handoff/build-default-acceptance.log), [record](run_final_handoff/build-default-acceptance-command.json). JS707.61kB/gzip199.64kB, còn warning>500kB |
| Build isolated preview | PASS/exit0; [record](run_final_handoff/build-isolated-acceptance-command.json). Lượt E2E release tái dùng byte-identical bundle, [hash](run_final_handoff/release-bundle.json) |
| Backend compile / pip | PASS/exit0; [compile](run_final_handoff/compile-acceptance-command.json), [pip check](run_final_handoff/pip_check-acceptance-command.json) |
| Startup + health/model-info/predict HTTP | PASS/exit0,9requests thật; [record](run_final_handoff/http-isolated-release-command.json), [responses](run_final_handoff/generated_current/backend/tests/http_results.json) |
| Reference A/B | Raw4.991136884533976 và4.997267870097019, absolute error0 cả hai; cùng responses HTTP và I01/S06/C01 trong E2E |
| Real outage | PASS/exit0, không interception, server18000 thực sự tắt, Predict/Compare không sinh ROI giả; [record](run_final_handoff/offline-isolated-coldfix-command.json), [JSON](run_final_handoff/generated_current/tests/results/backend-offline.json) |
| Targeted sau sửa | FE67 PASS/exit0 và E2E1 PASS/exit0; [FE](run_final_handoff/targeted-fixed-command.json), [E2E](run_final_handoff/targeted-e2e-command.json); không cộng vào378 |
| SHA-256 / bảo toàn | PASS,7artifact đúng manifest gốc, protected_changed rỗng; [integrity](run_final_handoff/integrity.json) |
| E2E teardown | Backend exit0, không còn process/cổng test; [cleanup](run_final_handoff/e2e-isolated-release/e2e-cleanup.json), không force-exit |
| Git inspection | N/A: workspace không phải Git repository, exit128 được giữ; [record](run_final_handoff/git-status-command.json). Không init/commit/push |

QA dùng Backend18000, dev5173/preview4173 riêng; không dừng hoặc dùng server8000 của người dùng làm bằng chứng. CORS/dev-preview/reference/model loading/gate nằm trong suite, không dựa vào UI mock. Test-generated history được backup/restore, output mới lưu riêng.

[Tổng hợp máy đọc được](run_final_handoff/acceptance_summary.json) ghi command/source/ảnh hashes; [file inventory](run_final_handoff/changed_files.md) liệt kê source đã sửa/thêm và QA/reports. Giữ BASELINE_ONLY, RESEARCH_LIMITED; UC-08 tối ưu đã kiểm chứng NOT_IMPLEMENTED. Các số tài chính trong tests/ảnh là fixtures được automation nhập, không phải business actuals.
'''
for name in ['FINAL_PROJECT_HANDOFF.md','FINAL_ACCEPTANCE_REPORT.md','FINAL_TEST_RESULTS.md']:
 p=DOC/name;body=p.read_text(encoding='utf8');assert 'PENDING_FINAL_EVIDENCE' in body;body=body.replace('PENDING_FINAL_EVIDENCE',table)
 if name=='FINAL_ACCEPTANCE_REPORT.md':
  body+='\n## Ảnh nghiệm thu mới\n\n'
  for label,pattern in [('Kế hoạch theo ngành/mục tiêu','plan-context'),('Toàn trang workspace','full-workspace'),('ROI tài chính từ fixtures','financial-roi')]:
   for width in [1440,390]:
    found=list((OUT/'e2e-isolated-release-artifacts').rglob(f'{pattern}-{width}.png'));assert len(found)==1
    body+=f'- [{label} {width}px]({found[0].relative_to(DOC).as_posix()})\n'
  body+=f'\nTổng {len(summary["screenshots"])} ảnh E2E. Đã xem trực tiếp ảnh mobile kế hoạch/ledger; toàn bộ viewport/các lỗi console nghiêm trọng kiểm trong E2E.\n'
 p.write_text(body,encoding='utf8')
# Replace staging notes with final, current facts.
p=DOC/'FINAL_REMAINING_ISSUES.md';body=p.read_text(encoding='utf8').replace('Kết luận P0/P1 chỉ chốt sau suite/HTTP/hash cuối tại FINAL_ACCEPTANCE_REPORT.md.','Kết luận cuối: **0 P0/P1 còn mở**, 378 ca PASS và HTTP/offline/hash/teardown đều PASS; phạm vi local research theo FINAL_ACCEPTANCE_REPORT.md.')
body=body.replace('full regression sau sửa phải được đọc ở FINAL_TEST_RESULTS.','full regression sau sửa80/80 PASS. Offline verifier cũng tăng riêng page-load budget45s sau cùng lỗi cold-load30s; không thay10s API timeout hoặc assertion. Log lỗi offline đầu giữ ở offline-isolated-release.log, lượt sửa PASS ở offline-isolated-coldfix.')
p.write_text(body,encoding='utf8')
p=DOC/'FINAL_TEST_RESULTS.md';body=p.read_text(encoding='utf8');body+='\n4. Offline verifier lần đầu timeout page.goto30s do Vite cold-load; giữ log offline-isolated-release. Sửa riêng budget navigation45s, không sửa10s API timeout/assertion. Lượt offline-isolated-coldfix PASS với Backend18000 thực sự tắt. Thay đổi chỉ ở test helper độc lập, không đổi runtime hoặc bundle đã qua236 FE/80 E2E.\n';p.write_text(body,encoding='utf8')
print(json.dumps({'status':'PASS','total_unique_tests':378,'feature_groups':5,'fixed_functional_defects':6,'p0_p1_open':0,'screenshots':len(summary['screenshots'])}))
