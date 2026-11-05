"""Phase5.3 read-only acceptance: preserve source, artifacts and old evidence."""
from pathlib import Path
import hashlib,json,shutil,sys
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/phase5/run_phase5_3'
EXCLUDE={'.venv','node_modules','__pycache__','.git','dist','build','.pytest_cache'}
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
mode=sys.argv[1];OUT.mkdir(parents=True,exist_ok=True)
if mode=='before':
    assert not (OUT/'before.json').exists()
    paths=[p for folder in ['src','backend','tests','research'] for p in (ROOT/folder).rglob('*')
        if p.is_file() and not EXCLUDE.intersection(p.relative_to(ROOT).parts) and OUT not in p.parents]
    paths += [p for p in ROOT.iterdir() if p.is_file()]
    manifest={p.relative_to(ROOT).as_posix():sha(p) for p in paths}
    (OUT/'before.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
    for folder in ['backend/tests','tests/results']:
        for p in (ROOT/folder).rglob('*'):
            if p.is_file() and '__pycache__' not in p.parts:
                target=OUT/'prior_generated'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
    print('Protected prior files:',len(manifest))
elif mode=='restore':
    for p in (OUT/'prior_generated').rglob('*'):
        if p.is_file():
            rel=p.relative_to(OUT/'prior_generated');current=ROOT/rel
            if current.exists() and sha(current)!=sha(p):
                target=OUT/'generated_current'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(current,target)
                shutil.copy2(p,current)
            elif not current.exists():
                current.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,current)
    print('Historical generated outputs restored; fresh outputs retained separately')
else:
    before=json.loads((OUT/'before.json').read_text(encoding='utf8'))
    changed=[s for s,h in before.items() if not (ROOT/s).exists() or sha(ROOT/s)!=h]
    artifacts={p.name:sha(p) for p in (ROOT/'backend/models').iterdir() if p.is_file()}
    pinned=json.loads((ROOT/'backend/app/config/artifact_sha256.json').read_text(encoding='utf8'))
    result={'status':'PASS' if not changed and artifacts==pinned else 'FAIL','protected_files':len(before),
        'changed':changed,'seven_artifacts_match_published_manifest':artifacts==pinned,'artifact_sha256':artifacts}
    (OUT/'integrity.json').write_text(json.dumps(result,indent=2),encoding='utf8')
    print(json.dumps({k:v for k,v in result.items() if k!='artifact_sha256'}));assert result['status']=='PASS'
