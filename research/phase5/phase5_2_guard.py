"""Protect published research/artifacts; record implementation changes separately."""
import hashlib,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/phase5/run_phase5_2'
EXCLUDED={'.venv','node_modules','__pycache__','.git','dist','build','.pytest_cache'}
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def files():
    return [p for folder in ['src','backend','tests','research'] for p in (ROOT/folder).rglob('*') if p.is_file() and not EXCLUDED.intersection(p.relative_to(ROOT).parts) and OUT not in p.parents]+[p for p in ROOT.iterdir() if p.is_file()]
mode=sys.argv[1];OUT.mkdir(exist_ok=True,parents=True)
if mode=='before':
    assert not (OUT/'before.json').exists()
    manifest={p.relative_to(ROOT).as_posix():sha(p) for p in files()}
    (OUT/'before.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
    for folder in ['backend/tests','tests/results']:
        for p in (ROOT/folder).rglob('*'):
            if p.is_file() and p.suffix in ['.json','.xml','.log','.png','.md','.zip']:
                target=OUT/'prior_generated'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
    print('Snapshot',len(manifest))
elif mode=='restore':
    for p in (OUT/'prior_generated').rglob('*'):
        if p.is_file():
            current=ROOT/p.relative_to(OUT/'prior_generated')
            if current.exists() and sha(current)!=sha(p):
                target=OUT/'generated_current'/current.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(current,target);shutil.copy2(p,current)
    print('Historical generated outputs restored')
else:
    before=json.loads((OUT/'before.json').read_text(encoding='utf8'))
    changed=[s for s,h in before.items() if not (ROOT/s).exists() or sha(ROOT/s)!=h]
    def protected(s):return s.startswith(('backend/models/','research/')) and s!='research/phase5/phase5_2_guard.py'
    violations=[s for s in changed if protected(s)]
    result={'status':'FAIL' if violations else 'PASS','protected_changed':violations,'changed_files':changed,'original_artifacts':{p.name:sha(p) for p in (ROOT/'backend/models').iterdir() if p.is_file()}}
    (OUT/'integrity.json').write_text(json.dumps(result,indent=2),encoding='utf8');print(json.dumps(result,ensure_ascii=False));assert not violations
