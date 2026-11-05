"""Phase5.1 source/history protection and generated-test-output preservation."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/phase5/run_20261104'
EXCLUDE={'.venv','node_modules','__pycache__','.git','.deps','.mplconfig','dist','build'}


def sha(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()


def main():
    mode=argparse.ArgumentParser();mode.add_argument('mode',choices=['before','restore','check']);args=mode.parse_args()
    OUT.mkdir(parents=True,exist_ok=True)
    snapshot=OUT/'protected_before.json'
    if args.mode=='before':
        assert not snapshot.exists()
        paths=[p for name in ['src','backend','tests','research'] for p in (ROOT/name).rglob('*') if p.is_file()
            and ROOT/'research/phase5' not in p.parents and not EXCLUDE.intersection(p.relative_to(ROOT).parts)]
        paths += [p for p in ROOT.iterdir() if p.is_file()]
        manifest={str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for p in sorted(set(paths))}
        snapshot.write_text(json.dumps(manifest,indent=2),encoding='utf-8')
        for folder in ['backend/tests','tests/results']:
            for p in (ROOT/folder).rglob('*'):
                if p.is_file() and p.suffix in ['.json','.xml','.log','.md','.png','.zip']:
                    target=OUT/'prior_generated'/p.relative_to(ROOT)
                    target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
        sources=sorted([p for folder in ['src','backend/app','backend/tests','tests/frontend','tests/browser'] for p in (ROOT/folder).rglob('*')
            if p.is_file() and p.suffix in ['.ts','.tsx','.css','.py'] and '__pycache__' not in p.parts])
        (OUT/'source_review.txt').write_text('\n\n'.join('FILE '+str(p.relative_to(ROOT))+'\n'+
            '\n'.join(f'{i}: {line}' for i,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1)) for p in sources),encoding='utf-8')
        (OUT/'source_inventory.json').write_text(json.dumps({'count':len(sources),'files':[str(p.relative_to(ROOT)) for p in sources]},indent=2),encoding='utf-8')
        print(len(manifest),'prior files protected;',len(sources),'source files indexed')
    elif args.mode=='restore':
        for p in (OUT/'prior_generated').rglob('*'):
            if p.is_file():
                rel=p.relative_to(OUT/'prior_generated'); current=ROOT/rel
                if current.exists() and sha(p)!=sha(current):
                    target=OUT/'generated_current'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(current,target)
                    shutil.copy2(p,current)
        print('Historical generated outputs restored; new evidence retained under generated_current')
    else:
        before=json.loads(snapshot.read_text(encoding='utf-8'))
        changed=[name for name,value in before.items() if not (ROOT/name).exists() or sha(ROOT/name)!=value]
        result={'status':'PASS' if not changed else 'FAIL','protected_files':len(before),'changed':changed,
            'seven_artifacts':{name:sha(ROOT/'backend/models'/name) for name in sorted(p.name for p in (ROOT/'backend/models').iterdir() if p.is_file())}}
        (OUT/'final_integrity.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
        print(json.dumps({k:v for k,v in result.items() if k!='seven_artifacts'}))
        assert not changed


if __name__=='__main__':main()
