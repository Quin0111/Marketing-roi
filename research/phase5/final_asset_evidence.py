"""Close the final asset/console audit only after the fresh regression passes."""
from pathlib import Path
import json,hashlib,xml.etree.ElementTree as ET,re
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'research/phase5';O=D/'run_final_handoff'
def read(name):return json.loads((O/name).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
names=['backend-assetfix','frontend-assetfix','e2e-isolated-assetfix','build-isolated-assetfix','build-default-assetfix','offline-isolated-assetfix','http-isolated-assetfix','browser-audit-assetfix']
records={n:read(n+'-command.json') for n in names};assert all(r['exit_code']==0 for r in records.values())
f=read('frontend-assetfix.json');e=read('e2e-isolated-assetfix.json');assert (f['numPassedTests'],f['numFailedTests'],f['numPendingTests'])==(236,0,0);assert (e['stats']['expected'],e['stats']['unexpected'],e['stats']['skipped'],e['stats']['flaky'])==(80,0,0,0)
cases=ET.parse(O/'backend-assetfix.xml').getroot().findall('.//testcase');assert len(cases)==62 and not any(c.find(t) is not None for c in cases for t in ['error','failure','skipped'])
i=read('integrity.json');assert i['status']=='PASS' and not i['protected_changed'] and i['seven_original_artifacts_unchanged']
audit=read('browser_audit_assetfix/checks.json');assert audit['status']=='PASS' and len(audit['checks'])==2
for row in audit['checks']:assert not row['pageerrors'] and not row['console_errors'] and not row['unexpected_network'] and not row['overflow']
for name in ['browser_audit_assetfix/e2e-cleanup.json','e2e-isolated-assetfix/e2e-cleanup.json']:
 c=read(name);assert c['backendExitCode']==0 and not c['backendStillAlive'] and not any(c['portsOpen'].values())
http=read('generated_current/backend/tests/http_results.json');assert len(http['responses'])==9 and all(p['absolute_error']==0 for p in http['predictions'])
offline=read('generated_current/tests/results/backend-offline.json');assert offline['status']=='PASS' and offline['displayed_roi'] is None and offline['compare_api_roi'] is None and not offline['backend_running']
s=read('acceptance_summary.json');s.update(status='PASS',decision='READY_FOR_DEMO_RESEARCH_ONLY',fixed_functional_defects=6,fixed_asset_defects=1,total_fixed_defects=7,p0_p1_remaining=0,commands={**s['commands'],**records},reference_predictions=http['predictions'],offline=offline,browser_audit=audit,integrity=i,cleanup=read('e2e-isolated-assetfix/e2e-cleanup.json'))
s['source_sha256']={p.relative_to(ROOT).as_posix():sha(p) for p in (ROOT/'src').rglob('*') if p.is_file()};s['source_sha256']['index.html']=sha(ROOT/'index.html')
s['screenshots']={p.relative_to(O).as_posix():sha(p) for folder in ['e2e-isolated-assetfix-artifacts','browser_audit_assetfix'] for p in (O/folder).rglob('*.png')}
if 'index.html' not in s['modified_existing_source']:s['modified_existing_source'].append('index.html')
(O/'acceptance_summary.json').write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf8')
replacements={'frontend-acceptance':'frontend-assetfix','backend-final':'backend-assetfix','e2e-isolated-release':'e2e-isolated-assetfix','build-isolated-acceptance':'build-isolated-assetfix','build-default-acceptance':'build-default-assetfix','offline-isolated-coldfix':'offline-isolated-assetfix','http-isolated-release':'http-isolated-assetfix'}
for name in ['FINAL_PROJECT_HANDOFF.md','FINAL_ACCEPTANCE_REPORT.md','FINAL_TEST_RESULTS.md']:
 p=D/name;body=p.read_text(encoding='utf8');body=re.sub(r'\*\*CHECKPOINT:.*?\*\*\n\n','',body,flags=re.S)
 for old,new in replacements.items():body=body.replace(old,new)
 body=body.replace('FIX-01…06','FIX-01…07');body=body.replace('6 lỗi chức năng đã xử lý','7 lỗi đã xử lý (6 logic/dữ liệu +1 tài nguyên)').replace('Sáu lỗi chức năng xử lý','Sáu lỗi chức năng và một lỗi tài nguyên xử lý').replace('Sáu lỗi chức năng đã sửa có regression.','Sáu lỗi chức năng và một lỗi tài nguyên đã sửa, có regression.')
 body=body.replace('Lượt E2E release tái dùng byte-identical bundle, [hash](run_final_handoff/release-bundle.json)','Lượt E2E assetfix dùng đúng bundle build-isolated-assetfix mới; record release-bundle.json chỉ mô tả lượt trước sửa favicon')
 body+='\n## Audit console/network và asset cuối\n\n'
 body+='Phát hiện 404 `/favicon.ico` trong luồng bình thường ở audit riêng, có URL trong [diagnostic](run_final_handoff/browser_diagnostic/diagnostic.json). Đã thêm favicon SVG data URI tại index.html, bỏ preconnect font ngoài không dùng và chuyển selection color sang blue. Không lọc bỏ lỗi hoặc tắt console assertion.\n\n'
 body+='[Targeted audit sau sửa](run_final_handoff/browser-audit-assetfix-command.json) exit0: [checks](run_final_handoff/browser_audit_assetfix/checks.json), hai viewport, Dashboard/Predict/Compare/plan/campaign, **0 pageerror, 0 console.error, 0 unexpected network error**, không interception. Sau đó chạy lại Backend62/Frontend236/E2E80 và production build trên bundle đã sửa, đều PASS. Các fault-injection tests có lỗi network mong đợi được đánh giá riêng, không gọi đó là lỗi console của flow bình thường.\n\n'
 body+='Ảnh production audit mới: [Dashboard desktop](run_final_handoff/browser_audit_assetfix/dashboard-1440.png), [Predict mobile](run_final_handoff/browser_audit_assetfix/predict-390.png), [Compare/plan desktop](run_final_handoff/browser_audit_assetfix/compare-plan-1440.png), [Campaign mobile](run_final_handoff/browser_audit_assetfix/campaign-390.png). Các số100/150/50% trong ảnh là fixtures do automation nhập, không phải business actuals.\n'
 p.write_text(body,encoding='utf8')
p=D/'FINAL_REMAINING_ISSUES.md';body=p.read_text(encoding='utf8');body=body.replace('\n\n## QA/environment được giải quyết','\n| FIX-07 | Browser tự tải favicon.ico không tồn tại, sinh console404; còn preconnect font ngoài không dùng | Khai báo SVG data URI, bỏ preconnect, dùng selection blue; diagnostic URL404 và production audit zero-errors + full regression |\n\n## QA/environment được giải quyết');body+='\nAudit console/network cuối hai viewport đã PASS zero-errors trên production preview; favicon404 không còn trong flow bình thường. Toàn bộ regression378 tiếp tục PASS sau assetfix.\n';p.write_text(body,encoding='utf8')
p=O/'changed_files.md';p.write_text(p.read_text(encoding='utf8')+'\n- `index.html`: FIX-07 favicon/preconnect/selection palette.\n- `final_browser_audit.mjs`, `final_asset_evidence.py`: targeted console/network audit và chốt evidence sau full regression.\n',encoding='utf8')
print(json.dumps({'status':'PASS','total_unique_tests':378,'fixed_defects':7,'positive_audit_errors':0,'screenshots':len(s['screenshots'])}))
