import { useState } from 'react';
import { RotateCcw, Sliders, Calculator } from 'lucide-react';
import { CampaignFeatures, ModelInfo } from '../../types';
import { INPUT_FIELDS, resolveModelInput } from '../../services/campaignInput';
interface Props {
  onSubmit:(features:CampaignFeatures)=>void;
  isLoading:boolean;
  modelInfo:ModelInfo|null;
  onChange:()=>void;
  onReset:()=>void;
  onSave?:(features:CampaignFeatures)=>string|null;
}
const defaults:CampaignFeatures={campaignType:'Search',channelUsed:'Google Ads',targetAudience:'Men 25-34',customerSegment:'Tech Enthusiasts',durationDays:30};
const durations=[15,30,45,60];
export function PredictionForm({onSubmit,isLoading,modelInfo,onChange,onReset,onSave}:Props){
  const [features,setFeatures]=useState<CampaignFeatures>({...defaults});
  const [message,setMessage]=useState<string|null>(null);
  // Select values must be exact metadata values. No substitution on refresh/reset.
  const supported=Boolean(modelInfo && INPUT_FIELDS.every(({key,api})=>(modelInfo.allowed_categories[api] as string[]).includes(features[key]))
    && durations.includes(features.durationDays) && (modelInfo.allowed_duration_days as number[]).includes(features.durationDays));
  const update=(next:CampaignFeatures)=>{onChange();setMessage(null);setFeatures(next);};
  const issues=resolveModelInput(features,modelInfo).issues;
  return <form className="space-y-6" onSubmit={e=>{
    e.preventDefault();
    if(isLoading||!modelInfo?.model_ready||!supported)return;
    onSubmit({...features});
  }}>
    <p className="text-sm text-slate-600">Chọn năm thuộc tính trong danh sách được xác minh từ /model-info. Kết quả chỉ phục vụ nghiên cứu.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {INPUT_FIELDS.map(({key,api,label,labels},index)=>{
        const options=modelInfo?.allowed_categories[api]??[];
        return <div key={key} className="space-y-2">
          <label htmlFor={`predict-${key}`} className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
            <span>{index+1}. {label} ({api})</span><span className="text-[11px] font-normal text-slate-400">{options.length} lựa chọn</span>
          </label>
          <select id={`predict-${key}`} value={(options as string[]).includes(features[key])?features[key]:''} disabled={!modelInfo?.model_ready}
            onChange={e=>update({...features,[key]:e.target.value})}
            className="w-full min-w-0 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60">
            <option value="">Chọn {label.toLocaleLowerCase('vi')}</option>
            {options.map(v=><option key={v} value={v}>{labels[v]||v}</option>)}
          </select>
        </div>;
      })}
      <fieldset className="space-y-3 md:col-span-2">
        <legend className="text-xs font-semibold text-slate-700 mb-2">5. Thời lượng chiến dịch (Duration_days)</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{durations.map(days=>{
          const allowed=Boolean(modelInfo && (modelInfo.allowed_duration_days as number[]).includes(days));
          const selected=allowed&&features.durationDays===days;
          return <button type="button" key={days} aria-label={`${days} ngày`} aria-pressed={selected}
            disabled={!modelInfo?.model_ready||!allowed} onClick={()=>update({...features,durationDays:days})}
            className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1 disabled:opacity-50 ${selected?'bg-blue-600 border-blue-600 text-slate-800 shadow-md shadow-none':'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
            <span>{days} ngày</span><span className={`text-[10px] font-normal ${selected?'text-slate-700':'text-slate-400'}`}>{allowed?`Chu kỳ ${days<=30?'ngắn hạn':'dài hạn'}`:'Chưa được mô hình hỗ trợ'}</span>
          </button>;
        })}</div>
      </fieldset>
    </div>
    <section data-testid="prediction-config-summary" className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-slate-700"><Sliders className="w-3.5 h-3.5 text-ink"/>Thuộc tính cấu hình đang chọn:</h3>
      <div className="flex flex-wrap gap-2">{INPUT_FIELDS.map(({key,label,labels})=><span key={key} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 break-words">{label}: <strong>{features[key]?(labels[features[key]]||features[key]):'Chưa chọn'}</strong></span>)}
        <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">Thời lượng: <strong>{features.durationDays} ngày</strong></span>
      </div>
      <p>Quality Gate = BASELINE_ONLY. Không dùng ROI để khẳng định phương án tối ưu.</p>
    </section>
    {!supported&&<div data-testid="model-input-compatibility" className="text-sm text-slate-600 border rounded-xl p-3">
      <p>Chưa đủ năm thuộc tính tương thích với mô hình. Không gọi /predict.</p>
      <ul className="list-disc pl-5">{issues.map(issue=><li key={issue}>{issue}</li>)}</ul>
    </div>}
    {message&&<p role="status" className="text-sm text-slate-700">{message}</p>}
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button type="button" onClick={()=>{onReset();setFeatures({...defaults});setMessage(null);}} className="flex items-center gap-2 border border-slate-200 text-slate-600 rounded-xl px-4 py-3 text-sm"><RotateCcw className="w-4 h-4"/>Làm mới</button>
      {onSave&&<button type="button" disabled={!supported} onClick={()=>setMessage(onSave({...features})||'Đã lưu kịch bản. Mở So sánh & Đề xuất để lập kế hoạch.')} className="border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm disabled:opacity-50">Lưu kịch bản để lập kế hoạch</button>}
      <button type="submit" disabled={isLoading||!modelInfo?.model_ready||!supported} className="flex items-center gap-2 bg-blue-600 text-slate-800 rounded-xl px-5 py-3 font-semibold text-sm disabled:opacity-50"><Calculator className="w-4 h-4"/>{isLoading?'Đang xử lý yêu cầu dự đoán...':'Dự đoán ROI'}</button>
    </div>
  </form>;
}
