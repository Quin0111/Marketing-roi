import { useId, useRef, useState } from 'react';
import { CampaignFeatures } from '../../types';
import { MarketingContext } from '../../services/marketingContext';
import { createCampaignSuggestions, SuggestedCampaign } from '../../services/campaignSuggestions';
import { ActionPlanPhases } from './ActionPlanPhases';
function CampaignSuggestionCard({campaign:c,onCreate}:{campaign:SuggestedCampaign;onCreate?:(c:SuggestedCampaign)=>void}){
  const [open,setOpen]=useState(false),id=useId(),body=useRef<HTMLDivElement>(null);
  return <article className="border border-blue-100 bg-white rounded-xl p-4 space-y-3 min-w-0 break-words" data-testid={`suggested-campaign-${c.id}`}>
    <h4 className="font-semibold text-blue-800">{c.name}</h4><p className="text-sm"><strong>Mục tiêu cụ thể: </strong>{c.objective}</p>
    <p className="text-xs text-slate-600">Đối tượng: {c.audience} · Kênh: {c.channel} · {c.plan.features.durationDays} ngày · Bản nháp theo quy tắc</p>
    <p className="text-sm text-slate-600"><strong>Lý do phù hợp: </strong>{c.reasons[c.reasons.length-1]}</p>
    <details className="text-sm text-slate-600"><summary className="cursor-pointer">Lý do phù hợp và điều kiện triển khai</summary>
      <ul className="list-disc pl-5 mt-2">{c.reasons.map(r=><li key={r}>{r}</li>)}</ul>
      <h5 className="font-semibold mt-3">Điều kiện/nguồn dữ liệu còn thiếu</h5><ul className="list-disc pl-5">{c.requirements.map(r=><li key={r}>{r}</li>)}</ul>
    </details>
    <p className="text-sm text-slate-600"><strong>Hoạt động chính: </strong>{c.plan.phases[1].activities[0]}</p>
    <div className="flex flex-wrap gap-3"><button type="button" aria-expanded={open} aria-controls={id} onClick={()=>{setOpen(!open);if(!open)requestAnimationFrame(()=>{body.current?.focus({preventScroll:true});body.current?.scrollIntoView({block:'start'});});}} className="bg-blue-600 text-slate-800 px-4 py-2 rounded-lg text-sm">{open?'Thu gọn kế hoạch chi tiết':'Xem kế hoạch chi tiết'}</button>
      {onCreate&&<button type="button" onClick={()=>onCreate(c)} className="border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">Lưu chiến dịch đề xuất</button>}
    </div>
    {open&&<div id={id} ref={body} tabIndex={-1} className="space-y-4 scroll-mt-24" data-testid={`suggested-plan-${c.id}`}>
      <h5 className="font-semibold">Kế hoạch: {c.name}</h5><p className="text-xs text-slate-600">Lịch tham khảo tính từ ngày 1; các phương án có thể chạy song song nếu đủ nguồn lực, không cộng thời lượng nối tiếp.</p>
      <ActionPlanPhases plan={c.plan} prefix={`suggested-${c.id}`}/>
      <details className="text-xs text-slate-600"><summary className="cursor-pointer">Giả định và giới hạn kế hoạch</summary><ul className="list-disc pl-5 mt-2">{c.plan.notes.map(n=><li key={n}>{n}</li>)}</ul></details>
    </div>}
  </article>;
}
export function CampaignSuggestions({features,context,reasons,onCreate}:{features?:CampaignFeatures;context:MarketingContext;reasons:readonly string[];onCreate?:(c:SuggestedCampaign)=>void}){
  const output=features?createCampaignSuggestions(features,context,reasons):{campaigns:[],issues:['Chưa có phương án được chọn. Chọn tiêu chí hợp lệ hoặc chọn rõ một phương án đồng hạng để xem chiến dịch.']};
  return <div data-testid="campaign-suggestions" className="space-y-4">
    <p className="text-sm text-slate-600">Đề xuất tự động từ template/quy tắc, không dùng ROI để chọn. Linear Regression chỉ dự đoán ROI; Quality Gate = BASELINE_ONLY. Cần duyệt brief và điều kiện trước triển khai.</p>
    {!output.campaigns.length?<ul data-testid="campaign-suggestions-empty" className="text-sm text-slate-600 list-disc pl-5">{output.issues.map(s=><li key={s}>{s}</li>)}</ul>:<>
      <p className="text-xs text-slate-600">{output.campaigns.length} chiến dịch tham khảo · {output.campaigns[0].ruleVersion}. Các lựa chọn không là thứ hạng hiệu quả và có thể chạy riêng hoặc song song sau khi kiểm tra nguồn lực.</p>
      <div className="grid grid-cols-1 gap-4">{output.campaigns.map(c=><CampaignSuggestionCard key={c.id} campaign={c} onCreate={onCreate}/>)}</div>
    </>}
  </div>;
}
