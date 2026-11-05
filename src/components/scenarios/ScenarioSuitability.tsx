import { useState } from 'react';
import { MarketingScenario, ScenarioPredictionState } from '../../types';
import { CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS, CAMPAIGN_TYPE_LABELS } from '../../constants/translations';
import { CriterionField, CriterionMode, evaluateScenarioSuitability, SUITABILITY_FIELDS, SuitabilityCriterion } from '../../services/scenarioSuitability';
import { MarketingActionPlan } from './MarketingActionPlan';
import { MarketingContext } from '../../services/marketingContext';
import { SuggestedCampaign } from '../../services/campaignSuggestions';
import { IndustryEvaluation } from './IndustryEvaluation';

const labels: Record<string, string> = Object.assign(Object.create(null), CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS, CAMPAIGN_TYPE_LABELS);
const display = (value: string | number) => typeof value === 'number' ? `${value} ngày` : labels[value] || value;
const options = { channelUsed: CHANNEL_LABELS, targetAudience: TARGET_AUDIENCE_LABELS, customerSegment: CUSTOMER_SEGMENT_LABELS };
const fields = SUITABILITY_FIELDS.filter(f => f.field !== 'campaignType') as { field: CriterionField; label: string }[];
export function ScenarioSuitability({ scenarios, predictionFor, onCreateCampaign }: {
  scenarios: MarketingScenario[]; predictionFor: (scenario: MarketingScenario) => ScenarioPredictionState; onCreateCampaign?:(scenario:MarketingScenario,context:MarketingContext,suggestion?:SuggestedCampaign)=>void;
}) {
  const [context,setContext]=useState<MarketingContext>({});
  const [values, setValues] = useState<Record<CriterionField, string>>({ channelUsed: '', durationDays: '', targetAudience: '', customerSegment: '' });
  const [modes, setModes] = useState<Record<CriterionField, CriterionMode>>({ channelUsed: 'preferred', durationDays: 'required', targetAudience: 'preferred', customerSegment: 'preferred' });
  const [comparison, setComparison] = useState<'exact' | 'maximum'>('maximum');
  const criteria: SuitabilityCriterion[] = fields.flatMap(({ field }) => !values[field] ? [] : field === 'durationDays'
    ? [{ field, value: Number(values[field]), mode: modes[field], comparison } as SuitabilityCriterion]
    : [{ field, value: values[field], mode: modes[field] } as SuitabilityCriterion]);
  const evaluation = evaluateScenarioSuitability(scenarios, criteria);
  const planChoices = evaluation.selectedIds.map(id => ({
    scenario: scenarios.find(scenario => scenario.id === id)!,
    reasons: evaluation.assessments.find(assessment => assessment.id === id)!.matches.filter(match => match.matched)
      .map(match => `${fields.find(field => field.field === match.criterion.field)!.label}: ${display(match.actual)} — khớp ${match.criterion.mode === 'required' ? 'điều kiện bắt buộc' : 'ưu tiên'}${match.criterion.field === 'durationDays' && match.criterion.comparison === 'maximum' ? ` tối đa ${match.criterion.value} ngày` : ''}.`),
  }));
  return <section aria-labelledby="suitability-title" className="bg-white border border-slate-200 rounded-xl p-5 space-y-5" data-testid="scenario-suitability">
    <div><h2 id="suitability-title" className="text-lg font-semibold">Gợi ý phương án Marketing phù hợp</h2>
      <p className="text-sm text-slate-600 mt-1">Bắt buộc: phải đáp ứng tất cả. Ưu tiên: mỗi tiêu chí khớp được 1 điểm, trọng số bằng nhau. Không dùng ROI để chọn hoặc phá đồng hạng.</p></div>
    <IndustryEvaluation context={context} onChange={setContext} scenarios={scenarios} evaluation={evaluation} predictionFor={predictionFor}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{fields.map(({ field, label }) => <fieldset key={field} className="border rounded-lg p-3 min-w-0 space-y-2">
      <legend className="text-sm font-semibold px-1">{label}</legend>
      <label className="block text-xs text-slate-600">{label} mong muốn
        <select aria-label={`${label} mong muốn`} value={values[field]} onChange={e => setValues({ ...values, [field]: e.target.value })} className="block w-full rounded-lg border bg-white p-2 mt-1 text-sm">
          <option value="">Không chọn</option>{field === 'durationDays' ? Array.from(new Set([15,30,45,60,...scenarios.map(s=>s.features.durationDays)])).sort((a,b)=>a-b).map(v => <option key={v} value={v}>{v} ngày</option>) : Object.entries({...options[field],...Object.fromEntries(scenarios.map(s=>[s.features[field],(options[field] as Record<string,string>)[s.features[field]]||s.features[field]]))}).map(([value,text]) => <option key={value} value={value}>{text}</option>)}
        </select></label>
      <div className="flex flex-wrap gap-2"><label className="text-xs text-slate-600 flex-1">Vai trò: {label}
        <select aria-label={`Vai trò: ${label}`} value={modes[field]} onChange={e => setModes({ ...modes, [field]: e.target.value as CriterionMode })} className="block w-full border bg-white rounded-lg p-2 mt-1 text-sm"><option value="preferred">Ưu tiên · 1 điểm</option><option value="required">Bắt buộc</option></select></label>
        {field === 'durationDays' && <label className="text-xs text-slate-600 flex-1">Cách đối chiếu thời lượng<select aria-label="Cách đối chiếu thời lượng" value={comparison} onChange={e => setComparison(e.target.value as 'exact' | 'maximum')} className="block w-full border bg-white rounded-lg p-2 mt-1 text-sm"><option value="maximum">Tối đa</option><option value="exact">Đúng thời lượng</option></select></label>}</div>
    </fieldset>)}</div>
    <button type="button" onClick={() => setValues({channelUsed:'',durationDays:'',targetAudience:'',customerSegment:''})} className="text-sm text-blue-700 underline">Xóa tiêu chí</button>
    </IndustryEvaluation>
    <div role="status" aria-label="Kết quả gợi ý theo tiêu chí" aria-live="polite" className="bg-slate-50 rounded-lg p-4 text-sm" data-testid="suitability-result">
      {evaluation.status === 'needs_criteria' && 'Hãy chọn tiêu chí để xác định nhu cầu; chưa gợi ý phương án.'}
      {evaluation.status === 'empty' && 'Chưa có kịch bản để đối chiếu. Hãy tạo kịch bản trước.'}
      {evaluation.status === 'no_eligible' && 'Không có phương án đáp ứng tất cả tiêu chí bắt buộc.'}
      {evaluation.status === 'no_preference_match' && 'Không phương án đủ điều kiện nào khớp ưu tiên đã chọn; chưa có cơ sở gợi ý.'}
      {evaluation.status === 'tie' && <p className="font-semibold">Đồng hạng theo tiêu chí: không chọn riêng một phương án.</p>}
      {evaluation.selectedIds.map(id => {
        const assessment = evaluation.assessments.find(s => s.id === id)!;
        const scenario = scenarios.find(s => s.id === id)!;
        const prediction = predictionFor(scenario);
        return <div key={id} className="mt-2 space-y-2" data-testid={`suitability-choice-${id}`}>
          <h3 className="font-semibold">{evaluation.status === 'unique' ? 'Gợi ý theo tiêu chí' : 'Phương án đồng hạng'}: {scenario.name}</h3>
          <p>{assessment.score}/{evaluation.preferenceCount} điểm ưu tiên · đáp ứng mọi tiêu chí bắt buộc đã chọn.</p>
          <ul className="list-disc pl-5">{assessment.matches.filter(m => m.matched).map(m => <li key={m.criterion.field}>{fields.find(f => f.field === m.criterion.field)!.label}: {display(m.actual)} — khớp {m.criterion.mode === 'required' ? 'điều kiện bắt buộc' : 'ưu tiên'}{m.criterion.field === 'durationDays' && m.criterion.comparison === 'maximum' ? ` tối đa ${m.criterion.value} ngày` : ''}.</li>)}</ul>
          <p data-testid={`suitability-roi-${id}`}>{prediction.status === 'success' ? `ROI dự đoán: ${prediction.result.predictedRoi.toFixed(4).replace('.', ',')} (tham khảo · API /predict · ${prediction.result.modelUsed} ${prediction.result.modelVersion} · ${prediction.result.qualityStatus})` : 'ROI tham khảo: chưa có kết quả API hiện hành.'}</p>
        </div>;
      })}
    </div>
    <MarketingActionPlan key={JSON.stringify({ criteria, context, choices: planChoices.map(choice => ({ id: choice.scenario.id, name: choice.scenario.name, features: choice.scenario.features })) })} choices={planChoices} context={context} onCreateCampaign={onCreateCampaign} />
    {criteria.length > 0 && evaluation.assessments.length > 0 && <div className="overflow-x-auto"><table className="text-sm w-full min-w-[560px] text-left" data-testid="suitability-analysis"><caption className="text-left font-semibold pb-2">Đối chiếu từng tiêu chí</caption><thead><tr><th className="p-2">Kịch bản</th><th className="p-2">Điều kiện và điểm</th><th className="p-2">Đáp ứng / không đáp ứng</th></tr></thead><tbody>{evaluation.assessments.map(s => <tr key={s.id} className="border-t"><th className="p-2 font-medium">{s.name}</th><td className="p-2">{s.eligible ? 'Đủ điều kiện' : 'Không đủ điều kiện'} · {s.score}/{evaluation.preferenceCount} điểm ưu tiên</td><td className="p-2"><ul>{s.matches.map(m => <li key={m.criterion.field}>{fields.find(f => f.field === m.criterion.field)!.label}: {display(m.actual)} / yêu cầu {m.criterion.field === 'durationDays' && m.criterion.comparison === 'maximum' ? '≤ ' : ''}{display(m.criterion.value)} ({m.criterion.mode === 'required' ? 'bắt buộc' : 'ưu tiên'}) — {m.matched ? 'Đáp ứng' : 'Không đáp ứng'}</li>)}</ul></td></tr>)}</tbody></table></div>}
    {scenarios.length > 1 && <details className="text-sm text-slate-600"><summary className="cursor-pointer">Điểm giống và khác nhau của cấu hình</summary><ul className="mt-2 space-y-1">{SUITABILITY_FIELDS.map(({field,label}) => { const distinct=[...new Set(scenarios.map(s => s.features[field]))]; return <li key={field}>{label} — {distinct.length === 1 ? 'Giống nhau' : 'Khác nhau'}: {distinct.map(display).join('; ')}.</li>; })}</ul></details>}
    <p className="text-xs text-slate-600">Đây là gợi ý theo tiêu chí, không xác nhận hiệu quả kinh doanh tối ưu. Chưa có dữ liệu chi phí, doanh thu, khả năng tiếp cận hoặc tác động nhân quả để kết luận. Quality Gate ROI vẫn BASELINE_ONLY.</p>
  </section>;
}
