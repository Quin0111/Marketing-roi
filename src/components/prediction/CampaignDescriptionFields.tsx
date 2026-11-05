import { CampaignFeatures, ModelInfo } from '../../types';
import { INPUT_FIELDS } from '../../services/campaignInput';

export function CampaignDescriptionFields({features,onChange,info,prefix,disabled=false}: {
  features:CampaignFeatures; onChange:(f:CampaignFeatures)=>void; info?:ModelInfo|null; prefix:string; disabled?:boolean;
}) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{INPUT_FIELDS.map(({key,api,label,labels},i)=><label key={key} className="text-xs font-semibold text-slate-700" htmlFor={`${prefix}-${key}`}>
    {prefix==='predict'?`${i+1}. ${label} (${api})`:label}
    <input id={`${prefix}-${key}`} aria-label={prefix==='campaign'?`Chiến dịch ${key}`:undefined} list={`${prefix}-${key}-options`} value={features[key]} maxLength={500} disabled={disabled}
      onChange={e=>onChange({...features,[key]:e.target.value})} className="block w-full min-w-0 border border-slate-200 bg-slate-50 rounded-xl p-3 mt-2 text-sm font-normal"/>
    <datalist id={`${prefix}-${key}-options`}>{info?.allowed_categories[api].map(v=><option key={v} value={v}>{labels[v]||v}</option>)}</datalist>
  </label>)}<label className="text-xs font-semibold text-slate-700" htmlFor={`${prefix}-durationDays`}>5. Thời lượng chiến dịch (Duration_days)
    <input id={`${prefix}-durationDays`} aria-label={prefix==='campaign'?'Chiến dịch durationDays':undefined} type="number" min="1" step="1" value={Number.isFinite(features.durationDays)?features.durationDays:''} disabled={disabled}
      onChange={e=>onChange({...features,durationDays:e.target.value===''?NaN:Number(e.target.value)})} className="block w-full border border-slate-200 bg-slate-50 rounded-xl p-3 mt-2 text-sm font-normal"/>
  </label><p className="text-xs text-slate-500 self-center">Nhập mô tả của bạn hoặc dùng gợi ý từ /model-info. Lưu và lập kế hoạch độc lập với khả năng dự đoán ROI.</p></div>;
}
