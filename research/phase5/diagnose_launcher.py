import subprocess,sys,time,httpx
from pathlib import Path
out=Path('research/phase5/run_phase5_2')
with (out/'launcher-diagnostic.log').open('w') as log:
    p=subprocess.Popen([sys.executable,'-X','utf8','tests/support/serve_backend.py'],stdin=subprocess.PIPE,stdout=log,stderr=subprocess.STDOUT)
    started=time.monotonic()
    try:
        with httpx.Client(trust_env=False,timeout=1) as client:
            for i in range(10):
                try:
                    r=client.get('http://127.0.0.1:8000/health');print(i,r.status_code,r.text,flush=True);break
                except Exception as e:print(i,type(e).__name__,flush=True)
                time.sleep(1)
        print('seconds',time.monotonic()-started,flush=True)
    finally:p.communicate(timeout=10);print('exit',p.returncode,flush=True)
