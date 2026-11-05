import { useEffect, useRef, useState } from 'react';
import { CampaignFeatures } from '../../types';
import { Campaign, CampaignTask, CAMPAIGN_STATUSES, CURRENCIES, campaignFinancials, campaignReview, buildCampaign } from '../../services/campaigns';
import { CampaignWorkspace } from '../../hooks/useCampaignWorkspace';
import { MarketingContext, INDUSTRIES, MARKETING_GOALS } from '../../services/marketingContext';
import { validDescription } from '../../services/campaignInput';
import { CampaignDescriptionFields } from '../prediction/CampaignDescriptionFields';
const defaults:CampaignFeatures={campaignType:'Social Media',channelUsed:'Instagram',targetAudience:'All Ages',customerSegment:'Fashionistas',durationDays:30};
function Configuration({features,onChange,disabled=false}:{features:CampaignFeatures;onChange:(f:CampaignFeatures)=>void;disabled?:boolean}){
 return <CampaignDescriptionFields prefix="campaign" features={features} onChange={onChange} disabled={disabled}/>;
}
function ContextFields({context,onChange,disabled=false}:{context:MarketingContext;onChange:(c:MarketingContext)=>void;disabled?:boolean}){
 return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{([['industry',INDUSTRIES],['goal',MARKETING_GOALS]] as const).map(([field,options])=><label className="text-xs" key={field}>{field==='industry'?'Lĩnh vực chiến dịch':'Mục tiêu chiến dịch'}<select aria-label={field==='industry'?'Lĩnh vực chiến dịch':'Mục tiêu chiến dịch'} disabled={disabled} value={context[field]||''} onChange={e=>onChange({...context,[field]:e.target.value||undefined})} className="block w-full border rounded-lg p-2 bg-white"><option value="">Chưa chọn</option>{Object.entries(options).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>)}</div>;
}
function TaskEditor({task,duration,onSave,onRemove,disabled}:{task:CampaignTask;duration:number;onSave:(t:CampaignTask)=>void;onRemove:()=>void;disabled:boolean}){
 const [title,setTitle]=useState(task.title),[start,setStart]=useState(String(task.startDay)),[end,setEnd]=useState(String(task.endDay));
 return <li className="border rounded-lg p-3 space-y-2"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={task.done} disabled={disabled} onChange={e=>onSave({...task,done:e.target.checked})}/><span className="break-words">{task.title} · Ngày {task.startDay}–{task.endDay}</span></label>
  {!disabled&&<details><summary className="text-xs cursor-pointer text-blue-700">Sửa hoạt động</summary><form className="grid gap-2 mt-2" onSubmit={e=>{e.preventDefault();onSave({...task,title,startDay:/^\d+$/.test(start)?Number(start):NaN,endDay:/^\d+$/.test(end)?Number(end):NaN});}}><label className="text-xs">Nội dung<input aria-label="Nội dung hoạt động" value={title} onChange={e=>setTitle(e.target.value)} className="block border rounded p-2 w-full"/></label><label className="text-xs">Ngày bắt đầu<input aria-label="Ngày bắt đầu hoạt động" value={start} onChange={e=>setStart(e.target.value)} inputMode="numeric" className="block border rounded p-2 w-full"/></label><label className="text-xs">Ngày kết thúc (≤ {duration})<input aria-label="Ngày kết thúc hoạt động" value={end} onChange={e=>setEnd(e.target.value)} inputMode="numeric" className="block border rounded p-2 w-full"/></label><button className="text-blue-700 text-sm" type="submit">Lưu hoạt động</button><button className="text-rose-700 text-sm" type="button" onClick={onRemove}>Xóa hoạt động</button></form></details>}
 </li>;
}
function CampaignEditor({campaign:c,workspace}:{campaign:Campaign;workspace:CampaignWorkspace}){
 const [name,setName]=useState(c.name),[notes,setNotes]=useState(c.notes),[features,setFeatures]=useState(c.features),[context,setContext]=useState(c.context),[status,setStatus]=useState(c.status);
 const [revenue,setRevenue]=useState(c.revenue),[currency,setCurrency]=useState(c.currency),[revenueCurrency,setRevenueCurrency]=useState(c.revenueCurrency);
 const [expense,setExpense]=useState({label:'',amount:'',currency:c.currency}),[error,setError]=useState<string|null>(null);
 const ended=c.status==='completed'||c.status==='cancelled',f=campaignFinancials(c),done=c.tasks.filter(t=>t.done).length;
 const financialDirty=c.status!=='cancelled'&&(revenue!==c.revenue||currency!==c.currency||revenueCurrency!==c.revenueCurrency||Boolean(expense.label||expense.amount));
 const save=(next:Campaign)=>{const failure=workspace.update(next);setError(failure);return !failure;};
 return <div className="space-y-5" data-testid="campaign-editor">
  <p className="text-sm text-slate-600">{c.sourceScenarioId?'Bản chụp độc lập từ kịch bản; sửa/xóa kịch bản không sửa chiến dịch đã tạo.':'Chiến dịch tạo thủ công.'} Kế hoạch phiên bản {c.planVersion} · {c.features.durationDays} ngày. Tiến độ: {done}/{c.tasks.length} hoạt động ({c.tasks.length?Math.round(done/c.tasks.length*100):0}%).</p>
  {error&&<p role="alert" className="text-rose-700 text-sm">{error}</p>}
  <form className="space-y-3 border rounded-xl p-4" onSubmit={e=>{e.preventDefault();if(!validDescription(features)){setError("Nhập đầy đủ mô tả và thời lượng nguyên dương.");return;}let next={...c,name,notes,status};if(JSON.stringify([features,context])!==JSON.stringify([c.features,c.context])){if(!window.confirm('Đổi cấu hình bản nháp sẽ tạo lại kế hoạch và bỏ tiến độ hoạt động cũ. Tiếp tục?'))return;const regenerated=buildCampaign({id:c.sourceScenarioId||'',name,features},context);next={...next,features:regenerated.features,context:regenerated.context,tasks:regenerated.tasks,planVersion:c.planVersion+1};}if(status==='cancelled'&&c.status!=='cancelled'&&!window.confirm('Hủy chiến dịch? Dữ liệu được giữ để đối soát và ngừng tính ROI.'))return;save(next);}}>
   <h3 className="font-semibold">Thông tin và trạng thái chiến dịch</h3><label className="block text-sm">Tên chiến dịch<input aria-label="Tên chiến dịch đang quản lý" maxLength={160} value={name} onChange={e=>setName(e.target.value)} className="block w-full border rounded-lg p-2"/></label>
   <label className="block text-sm">Ghi chú<textarea aria-label="Ghi chú chiến dịch" value={notes} onChange={e=>setNotes(e.target.value)} className="block w-full border rounded-lg p-2"/></label>
   <Configuration features={features} onChange={setFeatures} disabled={c.status!=='draft'}/><ContextFields context={context} onChange={setContext} disabled={c.status!=='draft'}/>
   <label className="block text-sm">Trạng thái chiến dịch<select aria-label="Trạng thái chiến dịch" value={status} onChange={e=>setStatus(e.target.value as Campaign['status'])} className="block w-full border rounded-lg p-2 bg-white">{Object.entries(CAMPAIGN_STATUSES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <button className="px-4 py-2 bg-blue-600 text-slate-800 rounded-lg text-sm" type="submit">Lưu chiến dịch</button>
  </form>
  <details className="border rounded-xl p-4"><summary className="font-semibold cursor-pointer">Hoạt động và tiến độ ({done}/{c.tasks.length})</summary><p className="text-xs text-slate-600 my-2">Chỉ đánh dấu công việc thực sự đã làm. Ngày tương đối trong thời lượng chiến dịch; không phải số liệu hiệu quả thực tế.</p>
   {!ended&&<button type="button" className="text-sm text-blue-700 underline mb-3" onClick={()=>{if(window.confirm('Xác nhận tất cả hoạt động đã thực hiện?'))save({...c,tasks:c.tasks.map(t=>({...t,done:true}))});}}>Xác nhận tất cả hoạt động đã làm</button>}
   <ul className="space-y-2">{c.tasks.map(task=><TaskEditor key={`${task.id}-${task.title}-${task.done}`} task={task} duration={c.features.durationDays} disabled={ended} onSave={next=>save({...c,tasks:c.tasks.map(t=>t.id===next.id?next:t)})} onRemove={()=>save({...c,tasks:c.tasks.filter(t=>t.id!==task.id)})}/>)}</ul>
   {!ended&&<button type="button" className="text-sm text-blue-700 underline mt-3" onClick={()=>save({...c,tasks:[...c.tasks,{id:crypto.randomUUID(),title:'Hoạt động bổ sung — mở sửa để nhập nội dung',startDay:1,endDay:c.features.durationDays,done:false}]})}>Thêm hoạt động</button>}
  </details>
  <section className="border rounded-xl p-4 space-y-3"><h3 className="font-semibold">Kết quả tài chính người dùng nhập</h3><p className="text-xs text-slate-600">ROI quy ước (%) = (doanh thu − tổng chi phí) / tổng chi phí × 100. Chi phí phải dương, cùng tiền tệ; không quy đổi tỷ giá. Cần nhập đầy đủ chi phí liên quan; chưa phải lợi nhuận kiểm toán hay tác động nhân quả. Không so/trừ với predicted_roi thang dataset.</p>
   <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={e=>{e.preventDefault();save({...c,revenue,currency,revenueCurrency});}}>
    <label className="text-sm">Đơn vị chiến dịch<select aria-label="Đơn vị tiền chiến dịch" value={currency} disabled={c.status==='cancelled'} onChange={e=>setCurrency(e.target.value as Campaign['currency'])} className="block border rounded-lg p-2 w-full bg-white">{CURRENCIES.map(v=><option key={v}>{v}</option>)}</select></label>
    <label className="text-sm">Doanh thu<input aria-label="Doanh thu thực tế" inputMode="decimal" value={revenue} disabled={c.status==='cancelled'} onChange={e=>setRevenue(e.target.value)} className="block w-full border rounded-lg p-2"/></label>
    <label className="text-sm">Tiền tệ doanh thu<select aria-label="Tiền tệ doanh thu" value={revenueCurrency} disabled={c.status==='cancelled'} onChange={e=>setRevenueCurrency(e.target.value as Campaign['currency'])} className="block border rounded-lg p-2 w-full bg-white">{CURRENCIES.map(v=><option key={v}>{v}</option>)}</select></label>
    <button type="submit" disabled={c.status==='cancelled'} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Lưu số liệu tài chính</button>
   </form>
   <ul className="text-sm space-y-2">{c.expenses.map(row=><li key={row.id} className="flex flex-wrap gap-2 justify-between border-b pb-2"><span>{row.label}: {row.amount} {row.currency}</span><button type="button" disabled={c.status==='cancelled'} onClick={()=>save({...c,expenses:c.expenses.filter(e=>e.id!==row.id)})} className="text-rose-700">Xóa khoản chi</button></li>)}</ul>
   <form className="grid grid-cols-1 md:grid-cols-4 gap-2" onSubmit={e=>{e.preventDefault();if(save({...c,expenses:[...c.expenses,{id:crypto.randomUUID(),...expense}]}))setExpense({label:'',amount:'',currency:c.currency});}}>
    <label className="text-xs">Nội dung chi<input aria-label="Nội dung khoản chi" disabled={c.status==='cancelled'} value={expense.label} onChange={e=>setExpense({...expense,label:e.target.value})} className="block w-full border rounded p-2"/></label>
    <label className="text-xs">Số tiền<input aria-label="Số tiền khoản chi" inputMode="decimal" disabled={c.status==='cancelled'} value={expense.amount} onChange={e=>setExpense({...expense,amount:e.target.value})} className="block w-full border rounded p-2"/></label>
    <label className="text-xs">Tiền tệ<select aria-label="Tiền tệ khoản chi" disabled={c.status==='cancelled'} value={expense.currency} onChange={e=>setExpense({...expense,currency:e.target.value as Campaign['currency']})} className="block w-full border rounded p-2 bg-white">{CURRENCIES.map(v=><option key={v}>{v}</option>)}</select></label>
    <button type="submit" disabled={c.status==='cancelled'} className="px-3 py-2 border rounded text-sm">Thêm khoản chi</button>
   </form>
   <p data-testid="campaign-actual-roi" className="font-semibold">{financialDirty?'Số liệu đang thay đổi, lưu thông tin/khoản chi để tính lại ROI.':f.valid?`ROI tài chính quy ước: ${f.roiPercent!.toFixed(2)}% · ${c.currency}`:f.reason}</p>
   <ul data-testid="campaign-review" className="text-sm text-slate-600 list-disc pl-5">{(financialDirty?['Chưa tổng kết số liệu chưa lưu.']:campaignReview(c)).map(n=><li key={n}>{n}</li>)}</ul>
  </section>
 </div>;
}
export function CampaignManagement({workspace,requestedId}:{workspace:CampaignWorkspace;requestedId?:string}){
 const [selectedId,setSelectedId]=useState(requestedId||''),[manual,setManual]=useState(false),[name,setName]=useState(''),[features,setFeatures]=useState(defaults),[context,setContext]=useState<MarketingContext>({}),[error,setError]=useState('');const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(requestedId){setSelectedId(requestedId);requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start'});});}},[requestedId]);
 const c=workspace.campaigns.find(c=>c.id===selectedId);
 return <section className="bg-white border rounded-xl p-5 space-y-4 min-w-0 break-words" data-testid="campaign-management"><h2 ref={heading} tabIndex={-1} className="font-semibold text-lg scroll-mt-24">Quản lý chiến dịch</h2>
  <p className="text-xs text-slate-600">Dữ liệu người dùng trên trình duyệt này, chưa đồng bộ server. Không có số liệu thực tế tự sinh. Nên sao lưu trước khi xóa dữ liệu trình duyệt.</p>
  {workspace.notice&&<p role="status" aria-label="Thông báo lưu chiến dịch" className="text-sm text-slate-700">{workspace.notice}</p>}
  <button type="button" onClick={()=>setManual(!manual)} className="px-4 py-2 bg-blue-600 text-slate-800 rounded-lg text-sm">Tạo chiến dịch thủ công</button>
  {manual&&<form className="border rounded-lg p-4 space-y-3" onSubmit={e=>{e.preventDefault();if(!name.trim()||name.length>160){setError('Tên chiến dịch không hợp lệ.');return;}try{setSelectedId(workspace.create({id:'',name:name.trim(),features},context));setManual(false);setError('');}catch{setError('Cấu hình chiến dịch không hợp lệ.');}}}>
   <label className="text-sm">Tên chiến dịch mới<input aria-label="Tên chiến dịch mới" value={name} maxLength={160} onChange={e=>setName(e.target.value)} className="block w-full border rounded p-2"/></label><Configuration features={features} onChange={setFeatures}/><ContextFields context={context} onChange={setContext}/><button type="submit" className="px-4 py-2 border rounded-lg text-sm">Tạo chiến dịch</button>{error&&<p role="alert">{error}</p>}
  </form>}
  {!workspace.campaigns.length?<p>Chưa có chiến dịch. Tạo thủ công hoặc từ phương án được gợi ý.</p>:<label className="block text-sm">Chiến dịch đang quản lý<select aria-label="Chiến dịch đang quản lý" value={c?.id||''} onChange={e=>setSelectedId(e.target.value)} className="block w-full border rounded-lg p-2 bg-white"><option value="">Chọn chiến dịch</option>{workspace.campaigns.map(c=><option key={c.id} value={c.id}>{c.name} · {CAMPAIGN_STATUSES[c.status]}</option>)}</select></label>}
  {c&&<><CampaignEditor key={c.id} campaign={c} workspace={workspace}/><button type="button" onClick={()=>{if(window.confirm('Xóa chiến dịch và dữ liệu trên trình duyệt?')){workspace.remove(c.id);setSelectedId('');}}} className="text-rose-700 underline text-sm">Xóa chiến dịch</button></>}
 </section>;
}
