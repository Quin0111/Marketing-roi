"""Index actual PNG captures without changing pixels or inventing evidence."""
from pathlib import Path
from datetime import datetime,timezone,timedelta
import hashlib,json,struct
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/phase5/run_phase5_3'
capture=json.loads((OUT/'browser-acceptance.json').read_text(encoding='utf8'))
entries=[]
for item in capture['images']:
    p=ROOT/'research/phase5'/item['file'];data=p.read_bytes()
    assert data[:8]==b'\x89PNG\r\n\x1a\n'
    width,height=struct.unpack('>II',data[16:24])
    entries.append({**item,'width':width,'height':height,'sha256':hashlib.sha256(data).hexdigest(),
      'captured_at_bangkok':datetime.fromtimestamp(p.stat().st_mtime,timezone(timedelta(hours=7))).isoformat()})
result={'method':capture['method'],'count':len(entries),'images':entries}
(ROOT/'research/phase5/evidence/phase5_3/manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
assert len(entries)==20
assert next(x for x in entries if x['file'].endswith('mobile-prediction-a.png'))['height']>844
print(json.dumps({'images':len(entries),'mobile_prediction_full_page':True}))
