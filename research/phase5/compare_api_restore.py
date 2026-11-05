"""Restore generated history only; retain deliberately upgraded test source."""
from pathlib import Path
import hashlib,shutil
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/phase5/run_compare_api'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for original in (OUT/'prior_generated').rglob('*'):
    if original.is_file() and original.suffix not in {'.py','.ts','.tsx','.mjs'}:
        rel=original.relative_to(OUT/'prior_generated');current=ROOT/rel
        if current.exists() and sha(current)!=sha(original):
            dest=OUT/'generated_current'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(current,dest);shutil.copy2(original,current)
print('Generated historical outputs restored; implementation source retained')
