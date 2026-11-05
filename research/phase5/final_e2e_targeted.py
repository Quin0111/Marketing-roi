from pathlib import Path
import os,json,subprocess,time
root=Path(__file__).resolve().parents[2];out=root/'research/phase5/run_final_handoff'
command="npm.cmd run test:e2e -- --grep 'P01 actual API.*Instagram' --reporter=list,json --output=research/phase5/run_final_handoff/targeted-e2e-artifacts"
env={**os.environ,'DM_TEST_API_PORT':'18000','DM_TEST_RESULTS_DIR':str(out/'targeted-e2e'),'DM_TEST_BUILD_DIR':str(out/'build-isolated-acceptance'),'PLAYWRIGHT_JSON_OUTPUT_NAME':str(out/'targeted-e2e.json')}
assert not (out/'targeted-e2e-command.json').exists();started=time.monotonic()
with (out/'targeted-e2e.log').open('wb') as log:
 result=subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',command+'; exit $LASTEXITCODE'],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
(out/'targeted-e2e-command.json').write_text(json.dumps({'command':command,'exit_code':result.returncode,'duration_seconds':time.monotonic()-started},indent=2),encoding='utf8')
print('Targeted E2E exit:',result.returncode);raise SystemExit(result.returncode)
