"""Delivery QA: reconcile fresh evidence, UC contract and runbook syntax."""
from pathlib import Path
import hashlib,json,re,socket,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/phase5/run_phase5_3';DOC=ROOT/'research/phase5'
checks=[]
def check(name,passed,detail=None):checks.append({'name':name,'status':'PASS' if passed else 'FAIL','detail':detail})
def load(path):return json.loads((OUT/path).read_text(encoding='utf8'))
for task in ['backend','frontend','build','backend_compile','pip_check','e2e','http','offline','browser_viewport']:
    record=load(f'{task}-command.json');check(f'{task} command exit0',record['exit_code']==0,record)
be=ET.parse(OUT/'backend.xml').getroot().find('testsuite').attrib
check('Backend62 current cases no failure/error/skip',int(be['tests'])==62 and all(int(be[k])==0 for k in ['failures','errors','skipped']),be)
fe=load('frontend.json');check('Frontend78 current cases no failure/skip',fe['numPassedTests']==78 and fe['numFailedTests']==0 and fe['numPendingTests']==0)
stats=load('e2e.json')['stats'];check('E2E31 current cases no fail/skip/flaky',stats['expected']==31 and all(stats[k]==0 for k in ['unexpected','skipped','flaky']),stats)
for path in ['e2e/e2e-cleanup.json','browser/e2e-cleanup.json']:
    cleanup=load(path);check(path+' graceful cleanup',cleanup['backendExitCode']==0 and not cleanup['backendStillAlive'] and cleanup['backendSignal'] is None and not any(cleanup['portsOpen'].values()),cleanup)
browser=load('browser-acceptance.json');check('Final browser46 assertions and20captures',browser['counts']=={'pass':46,'fail':0} and len(browser['images'])==20)
refs=json.loads((ROOT/'backend/models/reference_prediction.json').read_text(encoding='utf8'))['cases']
for record in browser['api']:
    expected=next(r['expected_predictions']['Linear Regression'] for r in refs if r['name']==record['case'])
    check(f"{record['case']} {record['viewport']['width']} exact real prediction",record['status']==200 and record['absolute_error']==0 and record['response']['predicted_roi']==expected and record['response']['quality_status']=='BASELINE_ONLY' and record['response']['is_research_only'] is True)
http=load('generated_current/backend/tests/http_results.json')
check('HTTP9requests and exact references current',http['status']=='PASS' and len(http['responses'])==9 and all(p['absolute_error']==0 for p in http['predictions']))
info=next(r['response'] for r in http['responses'] if r['endpoint']=='/model-info')
check('Gate remains BASELINE_ONLY, no ranking/optimize',info['quality_status']=='BASELINE_ONLY' and info['quality_gate_rules']=={'allow_prediction':True,'allow_automatic_ranking':False,'allow_optimization_recommendation':False})
offline=load('backend-offline.json');check('Real offline no fake ROI',offline['status']=='PASS' and offline['displayed_roi'] is None and not offline['backend_running'] and not offline['request_interception'])
model=load('generated_current/backend/tests/phase1_results.json');check('33 nested model verification checks pass',len(model['checks'])==33 and all(c['status']=='PASS' for c in model['checks']))
integrity=load('integrity.json');check('1970 prior files and seven published artifacts protected',integrity['status']=='PASS' and integrity['protected_files']==1970 and not integrity['changed'] and integrity['seven_artifacts_match_published_manifest'])
manifest=json.loads((DOC/'evidence/phase5_3/manifest.json').read_text(encoding='utf8'))
check('All20actual PNG hashes valid',len(manifest['images'])==20 and all(hashlib.sha256((DOC/v['file']).read_bytes()).hexdigest()==v['sha256'] for v in manifest['images']))
check('Mobile result image full page includes below-fold content',next(v['height'] for v in manifest['images'] if v['file'].endswith('mobile-prediction-a.png'))>844)
documents=['phase5_3_final_acceptance.md','phase5_3_demo_script.md','phase5_3_user_guide.md','phase5_3_report_evidence.md','uc_acceptance_matrix.md']
for name in documents:
    missing=[]
    for target in re.findall(r'\]\(([^)]+)\)',(DOC/name).read_text(encoding='utf8')):
        if not target.startswith(('http:','https:','#')) and not (DOC/target.split('#')[0]).exists():missing.append(target)
    check(name+' all local links resolve',not missing,missing)
matrix=(DOC/'uc_acceptance_matrix.md').read_text(encoding='utf8')
expected_ids={'UC-01':('FR-01','DEMO_ONLY'),'UC-02':('FR-02','IMPLEMENTED'),'UC-03':('FR-04','IMPLEMENTED'),'UC-04':('FR-05','IMPLEMENTED'),'UC-05':('FR-06','IMPLEMENTED'),'UC-06':('FR-07','DEMO_ONLY'),'UC-07':('FR-08','IMPLEMENTED'),'UC-08':('FR-10','NOT_IMPLEMENTED')}
for uc,(fr,status) in expected_ids.items():
    row=next((s for s in matrix.splitlines() if s.startswith(f'| {uc} |')),'')
    check(uc+' mapping/status follows contract',fr in row and f'**{status}**' in row)
check('FR03 and FR09 explicitly covered','FR-03' in matrix and 'FR-09' in matrix)
check('UC06 and08 full acceptance still blocked',all('**BLOCKED**' in next(s for s in matrix.splitlines() if s.startswith(f'| {uc} |')) for uc in ['UC-06','UC-08']))
demo=(DOC/'phase5_3_demo_script.md').read_text(encoding='utf8')
intervals=re.findall(r'\*\*(\d{2}):(\d{2})–(\d{2}):(\d{2})\*\*',demo)
times=[(int(a)*60+int(b),int(c)*60+int(d)) for a,b,c,d in intervals]
check('Demo nine contiguous steps total7minutes',len(times)==9 and times[0][0]==0 and times[-1][1]==420 and all(times[i][1]==times[i+1][0] for i in range(8)),times)
guide=(DOC/'phase5_3_user_guide.md').read_text(encoding='utf8')
blocks=re.findall(r'```powershell\n(.*?)```',guide,re.S)
syntax=[]
for i,block in enumerate(blocks):
    path=OUT/f'runbook-command-block-{i+1}.ps1';path.write_text(block,encoding='utf-8-sig')
    quoted=path.as_posix().replace("'","''")
    command=f"$dmTokens=$null; $dmErrors=$null; [void][System.Management.Automation.Language.Parser]::ParseFile('{quoted}',[ref]$dmTokens,[ref]$dmErrors); [pscustomobject]@{{count=@($dmErrors).Count;messages=@($dmErrors | ForEach-Object Message)}} | ConvertTo-Json -Compress"
    result=subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',command],capture_output=True,text=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    parsed=json.loads(result.stdout);syntax.append({'block':i+1,'parser_exit':result.returncode,**parsed})
check('Runbook PowerShell blocks syntax parse; not cold-install claim',bool(blocks) and all(v['parser_exit']==0 and v['count']==0 for v in syntax),syntax)
ports={}
for port in [8000,5173,4173]:
    with socket.socket() as s:s.settimeout(1);ports[port]=s.connect_ex(('127.0.0.1',port))!=0
check('All acceptance server ports released',all(ports.values()),ports)
result={'scope':'Delivery verification only, not extra independent product test cases or scientific validation',
 'product_test_cases':{'pass':171,'fail':0,'skip':0,'blocked':0},'browser_assertions':browser['counts'],
 'uc_acceptance':{'pass':6,'fail':0,'blocked':2,'uc08':'NOT_IMPLEMENTED'},
 'checks':checks,'counts':{s:sum(c['status']==s for c in checks) for s in ['PASS','FAIL']}}
(OUT/'delivery_checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result['counts']));assert result['counts']['FAIL']==0
