"""Fresh command exit codes for the comparison API upgrade."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,json,os,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/phase5/run_suitability'
parser=argparse.ArgumentParser();parser.add_argument('task',choices=['backend','frontend','build','e2e','offline','http','compile','pip_check']);parser.add_argument('--attempt',default='final');args=parser.parse_args()
label=f'{args.task}-{args.attempt}';resultfile=OUT/f'{label}-command.json';assert not resultfile.exists()
build_dir=('build-'+args.attempt) if args.attempt.startswith('isolated') else 'build'
commands={
 'backend':f'backend/.venv/Scripts/python.exe -X utf8 -m pytest backend -c backend/pytest.ini --junitxml=research/phase5/run_suitability/{label}.xml',
 'frontend':f'npm.cmd test -- --reporter=default --reporter=json --outputFile.json=research/phase5/run_suitability/{label}.json',
 'build':f'npm.cmd run build -- --outDir research/phase5/run_suitability/{build_dir}',
 'e2e':f'npm.cmd run test:e2e -- --reporter=list,json --output=research/phase5/run_suitability/{label}-artifacts',
 'offline':'npm.cmd run test:offline',
 'http':'backend/.venv/Scripts/python.exe -X utf8 backend/tests/verify_http.py',
 'compile':'backend/.venv/Scripts/python.exe -m compileall -q backend/app',
 'pip_check':'backend/.venv/Scripts/python.exe -m pip check',
}
env={**os.environ,'PYTHONUTF8':'1'}
if args.attempt.startswith('isolated'):
    env['DM_TEST_API_PORT']='18000'
    if args.task=='build':env.update(VITE_API_BASE_URL='http://127.0.0.1:18000',VITE_API_TIMEOUT_MS='10000')
if args.task=='e2e':env.update(DM_TEST_RESULTS_DIR=str(OUT/label),DM_TEST_BUILD_DIR=str(OUT/build_dir),PLAYWRIGHT_JSON_OUTPUT_NAME=str(OUT/f'{label}.json'))
started=datetime.now(timezone.utc).isoformat();clock=time.monotonic()
with (OUT/f'{label}.log').open('wb') as log:
    result=subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',commands[args.task]+'; exit $LASTEXITCODE'],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
record={'task':args.task,'command':commands[args.task],'exit_code':result.returncode,'started_at_utc':started,'duration_seconds':time.monotonic()-clock,
 'environment_overrides':{k:env[k] for k in ['DM_TEST_API_PORT','DM_TEST_RESULTS_DIR','DM_TEST_BUILD_DIR','PLAYWRIGHT_JSON_OUTPUT_NAME','VITE_API_BASE_URL'] if k in env}}
resultfile.write_text(json.dumps(record,indent=2),encoding='utf8');print(json.dumps(record));sys.exit(result.returncode)
