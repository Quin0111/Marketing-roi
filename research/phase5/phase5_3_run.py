"""Record real command output/exit codes for final acceptance; no training."""
import argparse,json,os,subprocess,sys,time
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/phase5/run_phase5_3'
parser=argparse.ArgumentParser();parser.add_argument('task',choices=['backend','frontend','build','backend_compile','pip_check','e2e','http','offline','browser','browser_final','browser_settled','browser_viewport']);args=parser.parse_args()
commands={
 'backend':'backend/.venv/Scripts/python.exe -X utf8 -m pytest backend -c backend/pytest.ini --junitxml=research/phase5/run_phase5_3/backend.xml',
 'frontend':'npm.cmd test -- --reporter=default --reporter=json --outputFile.json=research/phase5/run_phase5_3/frontend.json',
 'build':'npm.cmd run build -- --outDir research/phase5/run_phase5_3/build',
 'backend_compile':'backend/.venv/Scripts/python.exe -m compileall -q backend/app',
 'pip_check':'backend/.venv/Scripts/python.exe -m pip check',
 'e2e':'npm.cmd run test:e2e -- --reporter=list,json --output=research/phase5/run_phase5_3/e2e-artifacts',
 'http':'backend/.venv/Scripts/python.exe -X utf8 backend/tests/verify_http.py',
 'offline':'npm.cmd run test:offline',
 'browser':'node research/phase5/phase5_3_browser.mjs',
 'browser_final':'node research/phase5/phase5_3_browser.mjs',
 'browser_settled':'node research/phase5/phase5_3_browser.mjs',
 'browser_viewport':'node research/phase5/phase5_3_browser.mjs',
}
OUT.mkdir(exist_ok=True,parents=True);resultfile=OUT/f'{args.task}-command.json'
assert not resultfile.exists(),'Preserve prior command result; inspect before retrying'
env={**os.environ,'PYTHONUTF8':'1'}
if args.task=='e2e':env.update(DM_TEST_RESULTS_DIR=str(OUT/'e2e'),DM_TEST_BUILD_DIR=str(OUT/'build'),PLAYWRIGHT_JSON_OUTPUT_NAME=str(OUT/'e2e.json'))
started=datetime.now(timezone.utc).isoformat();clock=time.monotonic()
with (OUT/f'{args.task}.log').open('wb') as log:
    result=subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',commands[args.task]+'; exit $LASTEXITCODE'],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
record={'task':args.task,'command':commands[args.task],'exit_code':result.returncode,'started_at_utc':started,'duration_seconds':time.monotonic()-clock,
 'environment_overrides':{k:env[k] for k in ['DM_TEST_RESULTS_DIR','DM_TEST_BUILD_DIR','PLAYWRIGHT_JSON_OUTPUT_NAME'] if args.task=='e2e'}}
resultfile.write_text(json.dumps(record,indent=2),encoding='utf8');print(json.dumps(record));sys.exit(result.returncode)
