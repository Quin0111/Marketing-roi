"""Protect published artifacts/research while tracking allowed UI/test changes."""
from pathlib import Path
import hashlib,json,shutil,sys
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/phase5/run_navigation'
EXCLUDE={'.venv','node_modules','__pycache__','.git','dist','build','.pytest_cache'}
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
mode=sys.argv[1];OUT.mkdir(parents=True,exist_ok=True)
if mode=='before':
    assert not (OUT/'before.json').exists()
    files=[p for folder in ['src','backend','tests','research'] for p in (ROOT/folder).rglob('*') if p.is_file() and not EXCLUDE.intersection(p.relative_to(ROOT).parts) and OUT not in p.parents]
    files += [p for p in ROOT.iterdir() if p.is_file()]
    manifest={p.relative_to(ROOT).as_posix():sha(p) for p in files}
    (OUT/'before.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
    for folder in ['backend/tests','tests/results']:
        for p in (ROOT/folder).rglob('*'):
            if p.is_file() and '__pycache__' not in p.parts:
                dest=OUT/'prior_generated'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
    print('Protected baseline files:',len(manifest))
elif mode=='restore':
    for p in (OUT/'prior_generated').rglob('*'):
        if p.is_file():
            rel=p.relative_to(OUT/'prior_generated');current=ROOT/rel
            if current.exists() and sha(current)!=sha(p):
                dest=OUT/'generated_current'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(current,dest);shutil.copy2(p,current)
    print('Historical generated outputs restored')
else:
    baseline=json.loads((OUT/'before.json').read_text(encoding='utf8'))
    changed=[s for s,h in baseline.items() if not (ROOT/s).exists() or sha(ROOT/s)!=h]
    prohibited=[s for s in changed if s.startswith(('backend/app/','backend/models/','research/'))]
    artifacts={p.name:sha(p) for p in (ROOT/'backend/models').iterdir() if p.is_file()}
    pinned=json.loads((ROOT/'backend/app/config/artifact_sha256.json').read_text(encoding='utf8'))
    result={'status':'PASS' if not prohibited and artifacts==pinned else 'FAIL','changed_files':changed,'protected_changed':prohibited,'artifact_sha256':artifacts,'seven_original_artifacts_unchanged':artifacts==pinned}
    (OUT/'integrity.json').write_text(json.dumps(result,indent=2),encoding='utf8');print(json.dumps(result,ensure_ascii=False));assert result['status']=='PASS'
