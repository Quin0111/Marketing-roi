import { useId, useRef, useState } from 'react';
import { MarketingScenario } from '../../types';
import { createMarketingActionPlan } from '../../services/marketingActionPlan';
import { MarketingContext, INDUSTRIES, MARKETING_GOALS } from '../../services/marketingContext';
import { ActionPlanPhases } from './ActionPlanPhases';
import { CampaignSuggestions } from './CampaignSuggestions';
import { SuggestedCampaign } from '../../services/campaignSuggestions';
export interface ActionPlanChoice { scenario: MarketingScenario; reasons: string[] }
export function MarketingActionPlan({ choices, context = {}, onCreateCampaign }: { choices: ActionPlanChoice[]; context?:MarketingContext; onCreateCampaign?:(scenario:MarketingScenario,context:MarketingContext,suggestion?:SuggestedCampaign)=>void }) {
  const [selectedId,setSelectedId]=useState(choices.length===1?choices[0].scenario.id:'');
  const [open,setOpen]=useState(false);
  const body=useRef<HTMLDivElement>(null), bodyId=useId();
  const selected=choices.find(c=>c.scenario.id===selectedId);
  const plan=selected?createMarketingActionPlan(selected.scenario.features,context):null;
  return <section aria-labelledby={`${bodyId}-title`} className="border border-slate-200 bg-white rounded-xl p-4 space-y-4" data-testid="marketing-action-plan">
    <h3 id={`${bodyId}-title`} className="font-semibold text-slate-900">CHIẾN DỊCH MARKETING ĐỀ XUẤT</h3>
    {!choices.length && <p className="text-sm text-slate-600" data-testid="action-plan-empty">Chưa có phương án phù hợp để lập kế hoạch. Hãy chọn/điều chỉnh tiêu chí hoặc tạo kịch bản mới.</p>}
    {choices.length>1 && <label className="block text-sm text-slate-700">Phương án đồng hạng để xem kế hoạch<select aria-label="Phương án đồng hạng để xem kế hoạch" value={selectedId} onChange={e=>{setSelectedId(e.target.value);setOpen(false);}} className="block w-full border rounded-lg p-2 mt-2 bg-white"><option value="">Chọn phương án — không tự chọn trong nhóm đồng hạng</option>{choices.map(c=><option key={c.scenario.id} value={c.scenario.id}>{c.scenario.name}</option>)}</select></label>}
    <CampaignSuggestions key={JSON.stringify([selected?.scenario.id,selected?.scenario.features,context])} features={selected?.scenario.features} context={context} reasons={selected?.reasons??[]} onCreate={selected&&onCreateCampaign?suggestion=>onCreateCampaign(selected.scenario,context,suggestion):undefined}/>
    {selected && plan && <>
      <h4 className="font-semibold">Kế hoạch chung theo cấu hình phương án</h4>
      <p className="font-semibold" data-testid="action-plan-scenario">{selected.scenario.name}</p><p className="text-sm text-slate-600">{plan.brief}</p>
      {(context.industry||context.goal)&&<p className="text-sm">{context.industry?INDUSTRIES[context.industry]:'Chưa chọn lĩnh vực'} · {context.goal?MARKETING_GOALS[context.goal]:'Chưa chọn mục tiêu'}</p>}
      {onCreateCampaign&&<button type="button" onClick={()=>onCreateCampaign(selected.scenario,context)} className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm">Tạo chiến dịch từ phương án</button>}
      <details className="text-sm text-slate-600"><summary className="cursor-pointer">Lý do lựa chọn theo tiêu chí</summary><ul className="list-disc pl-5 mt-2">{selected.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></details>
      <p className="text-xs text-slate-600">4 giai đoạn · {plan.features.durationDays} ngày · Template {plan.templateVersion}. Kế hoạch theo quy tắc, không phải kết quả Machine Learning tối ưu ROI.</p>
      {plan.configurationReviewRequired && <p className="text-sm border rounded-lg p-3" data-testid="action-plan-review">Bản nháp cần xác nhận loại chiến dịch/kênh trước khi khởi chạy.</p>}
      <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={()=>{setOpen(true);requestAnimationFrame(()=>{body.current?.focus({preventScroll:true});body.current?.scrollIntoView({block:'start'});});}} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-200 text-slate-800 text-sm font-semibold">Xem kế hoạch triển khai</button>
      {open && <div id={bodyId} ref={body} tabIndex={-1} className="space-y-4 scroll-mt-24" data-testid="action-plan-details">
        <h4 className="font-semibold">Kế hoạch cho {selected.scenario.name}</h4>
        <ActionPlanPhases plan={plan}/>
        <details className="text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Nguồn kế hoạch và điều kiện thực hiện</summary><ul className="list-disc pl-5 mt-2">{plan.notes.map(n=><li key={n}>{n}</li>)}</ul><p className="mt-2">Quality Gate của predictor ROI vẫn BASELINE_ONLY. Kế hoạch chưa có ngân sách hoặc kết quả hiệu quả thực tế.</p></details>
        <button type="button" onClick={()=>setOpen(false)} className="text-sm text-blue-700 underline">Thu gọn kế hoạch</button>
      </div>}
    </>}
    {choices.length>1 && !selected && <p className="text-sm text-slate-600">Hãy chọn một phương án đồng hạng để xem kế hoạch; không dùng ROI để chọn thay bạn.</p>}
  </section>;
}
