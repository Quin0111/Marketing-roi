"""Validate Phase 5.1 delivery/evidence only; no training or product edits."""
import json
from pathlib import Path
import re
import shutil
import socket
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/phase5/run_20261104'
checks=[]


def check(name, passed, detail=None):
    checks.append({'name':name,'status':'PASS' if passed else 'FAIL','detail':detail})


for filename in ['website_audit.md','feature_status_matrix.md','implementation_plan.md']:
    path=ROOT/'research/phase5'/filename
    contents=path.read_text(encoding='utf-8-sig')
    missing=[]
    for target in re.findall(r'\]\(([^)]+)\)',contents):
        if not target.startswith(('http:','https:','#')) and not (path.parent/target.split('#')[0]).exists():
            missing.append(target)
    check(f'{filename} exists and local links resolve',bool(contents.strip()) and not missing,missing)

suite=ET.parse(OUT/'backend-pytest.xml').getroot().find('testsuite')
be={k:int(suite.attrib[k]) for k in ['tests','failures','errors','skipped']}
fe_raw=json.loads((OUT/'frontend-tests.json').read_text(encoding='utf-8'))
fe={k:fe_raw[k] for k in ['numTotalTests','numPassedTests','numFailedTests','numPendingTests']}
check('Backend counts match report',be=={'tests':52,'failures':0,'errors':0,'skipped':0},be)
check('Frontend counts match report',fe=={'numTotalTests':43,'numPassedTests':43,'numFailedTests':0,'numPendingTests':0},fe)
rawlog=(OUT/'browser-tests.log').read_bytes()
browserlog=rawlog.decode('utf-16' if rawlog.startswith(b'\xff\xfe') else 'utf-8-sig')
e2e_ok=len(re.findall(r'^\s+ok\s+\d+\s+tests',browserlog,re.M))
check('15 observed E2E case passes; completion explicitly blocked',e2e_ok==15 and not (OUT/'browser-results.json').exists(),{'case_passes':e2e_ok,'completion':'BLOCKED: runner interrupted during teardown; no final JSON'})
audit=json.loads((OUT/'browser_audit.json').read_text(encoding='utf-8'))
check('Audit probe counts match report',audit['counts']=={'pass':57,'fail':9,'blocked':0},audit['counts'])
refs=json.loads((OUT/'live_reference.json').read_text(encoding='utf-8'))
check('Two live reference errors exactly zero',len(refs)==2 and all(c['status']==200 and c['error']==0 for c in refs),refs)
info=json.loads((OUT/'live_model_info.json').read_text(encoding='utf-8'))
check('Quality Gate unchanged and recommendations disabled',info['quality_status']=='BASELINE_ONLY' and info['is_research_only'] and info['quality_gate_rules']=={'allow_prediction':True,'allow_automatic_ranking':False,'allow_optimization_recommendation':False})
check('HTTP verification passed nine requests',len(json.loads((OUT/'generated_current/backend/tests/http_results.json').read_text(encoding='utf-8'))['responses'])==9)
for name in ['website_predictions.json','backend-offline.json']:
    shutil.copy2(ROOT/'tests/results'/name,OUT/name)
check('Current browser prediction evidence matches reference',all(v['absolute_error']==0 for v in json.loads((OUT/'website_predictions.json').read_text(encoding='utf-8'))['evidence']))
offline=json.loads((OUT/'backend-offline.json').read_text(encoding='utf-8'))
check('Real backend outage script passed without interception',offline['status']=='PASS' and not offline['backend_running'] and not offline['request_interception'] and offline['displayed_roi'] is None)
ports={}
for port in [8000,5173,4173]:
    with socket.socket() as probe:
        probe.settimeout(1);ports[str(port)]=probe.connect_ex(('127.0.0.1',port))!=0
check('Audit-owned server ports released',all(ports.values()),ports)
integrity=json.loads((OUT/'final_integrity.json').read_text(encoding='utf-8'))
check('484 protected files and seven artifacts unchanged',integrity['status']=='PASS' and integrity['protected_files']==484 and not integrity['changed'] and len(integrity['seven_artifacts'])==7)
result={'scope':'Delivery QA only; does not turn product findings or runner blockage into PASS',
        'counts':{s:sum(c['status']==s for c in checks) for s in ['PASS','FAIL']},'checks':checks}
(OUT/'audit_delivery_checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result['counts']))
assert not result['counts']['FAIL']
