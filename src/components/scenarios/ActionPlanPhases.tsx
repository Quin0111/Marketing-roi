import { ActionPlan } from '../../services/marketingActionPlan';
export function ActionPlanPhases({plan,prefix='action-plan'}:{plan:ActionPlan;prefix?:string}){
  return <div className="relative space-y-4 border-l-2 border-dusty ml-3 pl-6">{plan.phases.map((phase,index)=><article key={phase.name} className="relative border border-slate-200 bg-white rounded-xl p-4 space-y-3 min-w-0" data-testid={`${prefix}-phase-${index}`} data-start-day={phase.startDay} data-end-day={phase.endDay}>
    <span aria-hidden="true" className="absolute -left-9 top-4 w-5 h-5 rounded-full bg-dusty border-4 border-canvas" /><div><h4 className="font-semibold text-blue-700">{index+1}. {phase.name}</h4><p className="text-sm text-slate-600">Ngày {phase.startDay}–{phase.endDay}</p></div>
    <div><h5 className="font-semibold text-sm">Hoạt động</h5><ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">{phase.activities.map(a=><li key={a}>{a}</li>)}</ul></div>
    <p className="text-sm"><strong>Đầu ra mong đợi: </strong>{phase.expectedOutput}</p>
    <div><h5 className="font-semibold text-sm">Chỉ số nên theo dõi</h5><ul className="list-disc pl-5 text-xs text-slate-600">{phase.metrics.map(m=><li key={m}>{m}</li>)}</ul></div>
  </article>)}</div>;
}
