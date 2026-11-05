import { ReactNode, useRef, useState } from 'react';
import { MarketingScenario, ScenarioPredictionState } from '../../types';
import { INDUSTRIES, MARKETING_GOALS, MarketingContext } from '../../services/marketingContext';
import { SuitabilityEvaluation } from '../../services/scenarioSuitability';
export function IndustryEvaluation({context,onChange,scenarios,evaluation,predictionFor,children}: {
 context:MarketingContext;onChange:(context:MarketingContext)=>void;scenarios:MarketingScenario[];evaluation:SuitabilityEvaluation;predictionFor:(scenario:MarketingScenario)=>ScenarioPredictionState;children?:ReactNode;
}){
 const [requested,setRequested]=useState(false);const result=useRef<HTMLDivElement>(null);
 const ready=Boolean(context.industry&&context.goal);
 return <section className="border rounded-xl p-4 space-y-4 bg-white" data-testid="industry-evaluation">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
   <label className="text-sm">Lĩnh vực kinh doanh<select aria-label="Lĩnh vực kinh doanh" value={context.industry||''} onChange={e=>onChange({...context,industry:(e.target.value||undefined) as MarketingContext['industry']})} className="block w-full border rounded-lg p-2 mt-1 bg-white"><option value="">Chưa chọn</option>{Object.entries(INDUSTRIES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label className="text-sm">Mục tiêu Marketing<select aria-label="Mục tiêu Marketing" value={context.goal||''} onChange={e=>onChange({...context,goal:(e.target.value||undefined) as MarketingContext['goal']})} className="block w-full border rounded-lg p-2 mt-1 bg-white"><option value="">Chưa chọn</option>{Object.entries(MARKETING_GOALS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  </div>
  <p className="text-xs text-slate-600">Lĩnh vực/mục tiêu dùng làm brief kế hoạch. Chưa có chứng cứ để cộng điểm ngành hoặc xếp ưu thế kênh. Điểm chỉ từ điều kiện và ưu tiên bạn chọn bên dưới.</p>
  {children}
  <button type="button" onClick={()=>{setRequested(true);requestAnimationFrame(()=>{result.current?.focus({preventScroll:true});result.current?.scrollIntoView({block:'start'});});}} className="px-4 py-2 bg-blue-600 hover:bg-blue-200 text-slate-800 rounded-lg text-sm">Đánh giá phương án theo lĩnh vực</button>
  {requested&&<div ref={result} tabIndex={-1} className="space-y-3 scroll-mt-24" data-testid="industry-results">
   <h3 className="font-semibold">KẾT QUẢ ĐÁNH GIÁ THEO LĨNH VỰC</h3>
   {!ready||!evaluation.selectedIds.length?<p>{evaluation.status==='no_eligible'?'Không có phương án đạt điều kiện bắt buộc. ':''}Chưa đủ thông tin để xác định phương án phù hợp nhất.</p>:<p className="font-semibold">{evaluation.status==='unique'?'Phương án phù hợp nhất theo tiêu chí':'Các phương án đồng hạng theo tiêu chí'}: {evaluation.selectedIds.map(id=>scenarios.find(s=>s.id===id)?.name).join('; ')}.</p>}
   <div className="overflow-x-auto"><table className="min-w-[1000px] w-full text-sm text-left"><thead><tr>{['Kịch bản','Kênh Marketing','Lĩnh vực đang xét','Mục tiêu','Điều kiện bắt buộc','Điểm theo tiêu chí','ROI API tham khảo','Lý do'].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{scenarios.map(s=>{const assessment=evaluation.assessments.find(a=>a.id===s.id)!;const p=predictionFor(s);return <tr key={s.id} className="border-t"><th className="p-2">{s.name}</th><td className="p-2">{s.features.channelUsed}</td><td className="p-2">{context.industry?INDUSTRIES[context.industry]:'Chưa chọn'}</td><td className="p-2">{context.goal?MARKETING_GOALS[context.goal]:'Chưa chọn'}</td><td className="p-2">{assessment.eligible?'Đáp ứng điều kiện đã chọn':'Không đáp ứng'}</td><td className="p-2">{evaluation.status==='needs_criteria'?'Chưa có tiêu chí':`${assessment.score}/${evaluation.preferenceCount} điểm ưu tiên`}</td><td className="p-2">{p.status==='success'?`${p.result.predictedRoi.toFixed(4)} · ${p.result.qualityStatus}`:'Chưa có kết quả API hiện hành'}</td><td className="p-2">{!assessment.eligible?'Bị loại do ràng buộc. ':ready&&evaluation.selectedIds.includes(s.id)?'Khớp tiêu chí minh bạch. ':'Chưa được đề xuất theo tiêu chí. '}Liên hệ ngành/mục tiêu với hiệu quả: Chưa đủ thông tin.{assessment.matches.filter(m=>!m.matched).map(m=>` Không khớp ${m.criterion.field}.`).join('')}</td></tr>;})}</tbody></table></div>
  </div>}
 </section>;
}
