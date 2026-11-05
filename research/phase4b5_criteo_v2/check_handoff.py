"""Final document/hash verification; deliberately no training or model loading."""
import hashlib
import json
import re
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
RESULTS=HERE/'results'


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()


def main():
    checks=[]
    def require(name,valid):
        checks.append({'check':name,'status':'PASS' if valid else 'FAIL'})
    before=json.loads((ROOT/'research/phase4b4/reassessment/evidence/protected_before.json').read_text(encoding='utf-8'))
    require('All 433 preexisting files byte-identical',len(before)==433 and all(sha(ROOT/name)==value for name,value in before.items()))
    replay=json.loads((RESULTS/'verification_results.json').read_text(encoding='utf-8'))
    require('Executed research checks PASS',replay['status']=='PASS' and replay['count']==41)
    require('Three fresh classifier refits reproduced',sum(v['classifier_refits'] for v in replay['independent_replays'])==3 and all(v['max_abs_probability_error']<=1e-10 for v in replay['independent_replays']))
    policy=json.loads((RESULTS/'policy_results.json').read_text(encoding='utf-8'))
    require('Real-marketing recommendation remains NOT VALIDATED',policy['recommendation_validation']=='NOT_VALIDATED_FOR_REAL_MARKETING')
    require('Honest zero gain vs response baseline recorded',policy['primary_visit']['gain_vs_response20']==0)
    files=[ROOT/'research'/name for name in ['final_ml_research_summary.md','final_ml_experiment_results.md','ml_to_website_handoff.md']]
    files.append(ROOT/'research/phase4b4/reassessment/dataset_readiness_report.md')
    for path in files:
        content=path.read_text(encoding='utf-8')
        require('UTF8 populated: '+path.name,len(content)>3000 and '\ufffd' not in content)
        links=re.findall(r'\]\(([^)]+)\)',content)
        require('Local evidence links resolve: '+path.name,all((path.parent/link.split('#')[0]).exists() for link in links if not link.startswith(('http:','https:','#'))))
        require('No unresolved placeholders: '+path.name,'{{' not in content and '}}' not in content)
    require('Final status RESEARCH_LIMITED in all handoff reports',all('RESEARCH_LIMITED' in p.read_text(encoding='utf-8') for p in files[:3]))
    artifact=json.loads((ROOT/'backend/app/config/artifact_sha256.json').read_text(encoding='utf-8'))
    require('All seven artifacts match trusted production manifest',len(artifact)==7 and all(sha(ROOT/'backend/models'/name)==value for name,value in artifact.items()))
    model_meta=json.loads((ROOT/'backend/models/model_metadata.json').read_text(encoding='utf-8'))
    require('BASELINE_ONLY and no automatic ranking/optimization',model_meta['model_quality_status']=='BASELINE_ONLY' and not model_meta['quality_gate_rules']['allow_automatic_ranking'] and not model_meta['quality_gate_rules']['allow_optimization_recommendation'])
    result={'status':'PASS' if all(c['status']=='PASS' for c in checks) else 'FAIL','count':len(checks),'checks':checks,
        'protected_files':len(before),'scientific_status':'RESEARCH_LIMITED','production_quality_gate':'BASELINE_ONLY',
        'models_fitted_in_this_check':0,'old_test_loaded':False,
        'deliverable_sha256':{str(p.relative_to(ROOT)):sha(p) for p in files},
        'scope':'Document and integrity checks; separate from 41 executed model/protocol checks and causal-assumption validity.'}
    (RESULTS/'handoff_checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(result['status'],len(checks),'handoff checks; 433 protected files; BASELINE_ONLY')
    assert result['status']=='PASS'


if __name__=='__main__':main()
