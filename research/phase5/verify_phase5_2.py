"""Assemble acceptance evidence; no fitting or changes to published results."""
from pathlib import Path
import json,re,socket,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/phase5/run_phase5_2'
if not (OUT/'acceptance_checks.json').exists():
    (OUT/'acceptance_checks.json').write_text('{}',encoding='utf8')
checks=[]
def load(p):return json.loads((OUT/p).read_text(encoding='utf-8-sig'))
def check(name,passed,detail=None):checks.append({'name':name,'status':'PASS' if passed else 'FAIL','detail':detail})
be=ET.parse(OUT/'backend-tests.xml').getroot().find('testsuite').attrib
fe=load('frontend-acceptance.json')
check('Backend current 62 cases pass',int(be['tests'])==62 and all(int(be[k])==0 for k in ['failures','errors','skipped']),be)
check('Frontend current 78 cases pass',fe['numPassedTests']==78 and fe['numFailedTests']==0 and fe['numPendingTests']==0)
for run in [2,3]:
    report=load(f'e2e-run{run}.json');stats=report['stats'];cleanup=load(f'e2e-run{run}/e2e-cleanup.json')
    check(f'E2E run{run} 31 passes, no fail/skip/flaky',stats['expected']==31 and all(stats[k]==0 for k in ['unexpected','skipped','flaky']),stats)
    check(f'E2E run{run} real graceful cleanup',cleanup['backendExitCode']==0 and not cleanup['backendStillAlive'] and not cleanup['backendSignal'] and not any(cleanup['portsOpen'].values()),cleanup)
http=load('generated_current/backend/tests/http_results.json')
check('HTTP verification passes nine requests and reference errors zero',http['status']=='PASS' and len(http['responses'])==9 and all(p['absolute_error']==0 for p in http['predictions']))
info=next(r['response'] for r in http['responses'] if r['endpoint']=='/model-info')
check('Gate and production model preserved',info['model_name']=='Linear Regression' and info['quality_status']=='BASELINE_ONLY' and info['quality_gate_rules']=={'allow_prediction':True,'allow_automatic_ranking':False,'allow_optimization_recommendation':False})
integrity=load('integrity.json');check('Protected research and seven artifacts unchanged',integrity['status']=='PASS' and len(integrity['original_artifacts'])==7 and not integrity['protected_changed'])
offline=load('backend-offline.json');check('Actual backend outage no fake ROI',offline['status']=='PASS' and not offline['backend_running'] and not offline['request_interception'] and offline['displayed_roi'] is None)
check('No ROI sort handler',"handleSort('roi')" not in (ROOT/'src/components/scenarios/ScenarioComparisonTable.tsx').read_text(encoding='utf8'))
check('No unsupported ROI unit in formatter or result card',' lần`' not in (ROOT/'src/constants/translations.ts').read_text(encoding='utf8') and 'lần ROI' not in (ROOT/'src/components/prediction/PredictionResultCard.tsx').read_text(encoding='utf8'))
ports={}
for port in [8000,5173,4173]:
    with socket.socket() as s:s.settimeout(1);ports[port]=s.connect_ex(('127.0.0.1',port))!=0
check('All demo/test ports released',all(ports.values()),ports)
for name in ['phase5_2_implementation_report.md','phase5_2_test_results.md','phase5_2_remaining_issues.md']:
    p=ROOT/'research/phase5'/name;missing=[]
    for target in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8-sig')):
        if not target.startswith(('http:','https:','#')) and not (p.parent/target.split('#')[0]).exists():missing.append(target)
    check(f'{name} links resolve',not missing,missing)
result={'scope':'Acceptance evidence consistency, not additional independent product test cases',
 'unique_product_cases':{'backend':62,'frontend':78,'e2e':31,'total_pass':171,'fail':0,'skip':0},
 'checks':checks,'counts':{s:sum(c['status']==s for c in checks) for s in ['PASS','FAIL']}}
(OUT/'acceptance_checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result['counts']));assert not result['counts']['FAIL']
