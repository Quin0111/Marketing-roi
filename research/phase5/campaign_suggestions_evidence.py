from pathlib import Path
import hashlib,json,shutil
R=Path(__file__).resolve().parents[2]; O=R/'research/phase5/run_campaign_suggestions'
read=lambda n:json.loads((O/n).read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records={n:read(n+'-command.json') for n in ['backend-final','frontend-expanded','build-default','build-isolated-final','e2e-isolated-final','http-isolated-final','offline-isolated-final']}
assert all(r['exit_code']==0 for r in records.values())
f=read('frontend-expanded.json');assert f['numPassedTests']==322 and f['numFailedTests']==0 and f['numPendingTests']==0
e=read('e2e-isolated-final.json')['stats'];assert e['expected']==89 and e['unexpected']==e['skipped']==e['flaky']==0
assert '62 passed' in (O/'backend-final.log').read_text(encoding='utf8')
audit=read('browser_audit/checks.json');assert audit['status']=='PASS' and len(audit['checks'])==2
assert all(c['proposalName'] for c in audit['checks'])
assert all(not c['pageerrors'] and not c['console_errors'] and not c['unexpected_network'] and not c['overflow'] for c in audit['checks'])
http=json.loads((R/'backend/tests/http_results.json').read_text(encoding='utf8'));assert len(http['responses'])==9 and all(p['absolute_error']==0 for p in http['predictions'])
offline=json.loads((R/'tests/results/backend-offline.json').read_text(encoding='utf8'));assert offline['status']=='PASS' and offline['displayed_roi'] is None and offline['compare_api_roi'] is None
cleanup=read('e2e-isolated-final/e2e-cleanup.json');assert cleanup['backendExitCode']==0 and not cleanup['backendStillAlive'] and not any(cleanup['portsOpen'].values())
# Preserve current generated evidence, then restore pre-task generated JSON.
for folder in ['backend/tests','tests/results']:
 for p in (R/folder).rglob('*'):
  if p.is_file() and p.suffix in ['.json','.png']:
   d=O/'generated_current'/p.relative_to(R);d.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,d)
for p in (O/'prior_generated').rglob('*'):
 if p.is_file():shutil.copy2(p,R/p.relative_to(O/'prior_generated'))
b=read('before.json');changed=[p for p,h in b.items() if not (R/p).exists() or sha(R/p)!=h]
protected=[p for p in changed if p.startswith(('backend/','research/'))];assert not protected,protected
assert set(p for p in changed if p.startswith('src/'))=={'src/pages/CompareScenariosPage.tsx','src/components/scenarios/MarketingActionPlan.tsx','src/components/scenarios/ScenarioSuitability.tsx','src/hooks/useCampaignWorkspace.ts','src/services/campaigns.ts'}
artifacts={p.name:sha(p) for p in (R/'backend/models').iterdir() if p.is_file()}
pinned=json.loads((R/'backend/app/config/artifact_sha256.json').read_text(encoding='utf8'));assert artifacts==pinned
result={'status':'PASS','decision':'READY_FOR_DEMO_RESEARCH_ONLY','suites':{'backend':{'pass':62,'fail':0,'skip':0},'frontend':{'pass':322,'fail':0,'skip':0},'e2e':{'pass':89,'fail':0,'skip':0,'flaky':0}},'total_unique_tests':473,'quality_gate':'BASELINE_ONLY','commands':records,'reference_predictions':http['predictions'],'browser_audit':audit,'offline':offline,'cleanup':cleanup,'protected_changed':protected,'artifact_sha256':artifacts,'modified_existing_source':[p for p in changed if p.startswith('src/')],'modified_tests':[p for p in changed if p.startswith('tests/')],'new_tests':[p.relative_to(R).as_posix() for p in (R/'tests').rglob('*') if p.is_file() and p.suffix in ['.ts','.tsx','.mjs'] and p.relative_to(R).as_posix() not in b],'new_source':[p.relative_to(R).as_posix() for p in (R/'src').rglob('*') if p.is_file() and p.relative_to(R).as_posix() not in b],'source_sha256':{p.relative_to(R).as_posix():sha(p) for p in (R/'src').rglob('*') if p.is_file()},'screenshots':{p.relative_to(O).as_posix():sha(p) for folder in ['e2e-isolated-final-artifacts','browser_audit'] for p in (O/folder).rglob('*.png')}}
(O/'acceptance_summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'status':result['status'],'tests':473,'protected_changed':protected,'artifacts_unchanged':len(artifacts),'screenshots':len(result['screenshots'])}))
