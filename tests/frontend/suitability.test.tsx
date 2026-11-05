import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateScenarioSuitability, SuitabilityCriterion } from '../../src/services/scenarioSuitability';
import { MarketingScenario } from '../../src/types';
import { ScenarioSuitability } from '../../src/components/scenarios/ScenarioSuitability';
import { CompareScenariosPage } from '../../src/pages/CompareScenariosPage';
import { ModelProvider } from '../../src/contexts/ModelContext';
import http from '../../backend/tests/http_results.json';
const a:MarketingScenario={id:'a',name:'Scenario A',features:{campaignType:'Search',channelUsed:'Google Ads',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30},createdAt:'now',updatedAt:'now',predictedRoi:99};
const b:MarketingScenario={...a,id:'b',name:'Scenario B',features:{...a.features,channelUsed:'Facebook',durationDays:60},predictedRoi:1000};
const channel=(value='Google Ads',mode:'preferred'|'required'='preferred'):SuitabilityCriterion=>({field:'channelUsed',value,mode});
const duration:SuitabilityCriterion={field:'durationDays',value:30,mode:'required',comparison:'maximum'};
const evaluate=evaluateScenarioSuitability;
beforeEach(()=>{localStorage.clear();vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});});
describe('rules-v1 suitability without ROI',()=>{
  it('selects a unique preference match',()=>expect(evaluate([a,b],[channel()]).selectedIds).toEqual(['a']));
  it('preserves all ties and never breaks them by ROI or order',()=>{
    const rows=[a,{...b,features:a.features}];
    expect(evaluate(rows,[channel()]).selectedIds).toEqual(['a','b']);
    expect(evaluate([...rows].reverse(),[channel()]).selectedIds).toEqual(['b','a']);
  });
  it('returns no eligible scenario when required channel is absent',()=>expect(evaluate([a,b],[channel('YouTube','required')]).status).toBe('no_eligible'));
  it('does not select with no criteria',()=>expect(evaluate([a,b],[])).toMatchObject({status:'needs_criteria',selectedIds:[]}));
  it('handles empty scenarios',()=>expect(evaluate([],[channel()]).status).toBe('empty'));
  it('never lets a high preference score compensate a failed mandatory constraint',()=>{
    const result=evaluate([a,b],[duration,channel('Facebook')]);
    expect(result.status).toBe('no_preference_match');expect(result.selectedIds).toEqual([]);
    expect(result.assessments[1]).toMatchObject({eligible:false,score:1});
  });
  it('uses required-only filtering and ties all eligible candidates at zero preference points',()=>{
    expect(evaluate([a,b],[{...duration,value:60}])).toMatchObject({status:'tie',selectedIds:['a','b'],preferenceCount:0});
  });
  it('distinguishes exact and maximum duration, including the boundary',()=>{
    expect(evaluate([a,b],[{...duration,value:60,comparison:'exact'}]).selectedIds).toEqual(['b']);
    expect(evaluate([a,b],[{...duration,value:60}]).selectedIds).toEqual(['a','b']);
    expect(evaluate([a,b],[duration]).selectedIds).toEqual(['a']);
  });
  it('sums equal weight priorities with auditable individual matches',()=>{
    const criteria:SuitabilityCriterion[]=[channel(),{field:'targetAudience',value:'Women 25-34',mode:'preferred'},{field:'customerSegment',value:'Fashionistas',mode:'preferred'}];
    const result=evaluate([a,b],criteria);expect(result.assessments.map(s=>s.score)).toEqual([3,2]);
    expect(result.assessments[1].matches[0]).toMatchObject({actual:'Facebook',matched:false});
  });
  it('cannot read ROI, model output, budget or unobserved outcomes',()=>{
    const guarded={...a};Object.defineProperty(guarded,'predictedRoi',{get(){throw Error('ROI must not be read');}});
    expect(evaluate([guarded,b],[channel()]).selectedIds).toEqual(['a']);
    expect(evaluate([{...a,predictedRoi:-999999},{...b,predictedRoi:999999}],[channel()]).selectedIds).toEqual(['a']);
  });
});
describe('suitability UI and live integration',()=>{
  it('explains no criteria, missing evidence, weights, and displays shared/different features',()=>{
    render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    expect(screen.getByTestId('suitability-result')).toHaveTextContent('Hãy chọn tiêu chí');
    expect(screen.getByText(/trọng số bằng nhau/)).toBeVisible();
    fireEvent.click(screen.getByText('Điểm giống và khác nhau của cấu hình'));
    expect(screen.getByText(/Kênh Marketing — Khác nhau/)).toBeVisible();
    expect(screen.getByText(/Nhóm khách hàng — Giống nhau/)).toBeVisible();
    expect(screen.getByText(/Chưa có dữ liệu chi phí, doanh thu/)).toBeVisible();
  });
  it('updates selections when criteria change and resets without choosing by ROI',()=>{
    render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Google Ads'}});
    expect(screen.getByTestId('suitability-choice-a')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Facebook'}});
    expect(screen.queryByTestId('suitability-choice-a')).toBeNull();expect(screen.getByTestId('suitability-choice-b')).toBeVisible();
    expect(screen.getByTestId('suitability-roi-b')).not.toHaveTextContent('1000');
    fireEvent.click(screen.getByRole('button',{name:'Xóa tiêu chí'}));expect(screen.getByTestId('suitability-result')).toHaveTextContent('Hãy chọn tiêu chí');
  });
  it('recomputes on scenario edits/deletions without stale selected IDs',()=>{
    const view=render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Google Ads'}});
    expect(screen.getByTestId('suitability-choice-a')).toBeVisible();
    view.rerender(<ScenarioSuitability scenarios={[{...a,features:b.features},b]} predictionFor={()=>({status:'idle'})}/>);
    expect(screen.getByTestId('suitability-result')).toHaveTextContent('chưa có cơ sở');
    view.rerender(<ScenarioSuitability scenarios={[]} predictionFor={()=>({status:'idle'})}/>);
    expect(screen.getByTestId('suitability-result')).toHaveTextContent('Chưa có kịch bản');
  });
  it('reports ties, required mismatches and each reason without inventing conversion/revenue claims',()=>{
    render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Nhóm khách hàng mong muốn'),{target:{value:'Women 25-34'}});
    expect(screen.getByTestId('suitability-result')).toHaveTextContent('Đồng hạng');
    expect(screen.getAllByTestId(/suitability-choice-/)).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'YouTube'}});
    fireEvent.change(screen.getByLabelText('Vai trò: Kênh Marketing'),{target:{value:'required'}});
    expect(screen.getByTestId('suitability-result')).toHaveTextContent('Không có phương án');
    expect(screen.getByTestId('suitability-analysis')).toHaveTextContent('Không đáp ứng');
    expect(screen.queryByText(/tăng doanh thu|conversion cao|tiếp cận tốt hơn/i)).toBeNull();
  });
  it('preserves real API provenance, clears stale ROI on edit, and issues no suitability HTTP call',async()=>{
    localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:[a,b]}));
    const info=http.responses.find(r=>r.endpoint==='/model-info')!.response;
    const response=http.responses.find(r=>r.endpoint==='/predict')!.response;
    const api=vi.fn(async(url:unknown)=>new Response(JSON.stringify(String(url).endsWith('/model-info')?info:response),{status:200}));
    vi.stubGlobal('fetch',api);render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Google Ads'}});
    const card=within(screen.getByTestId('scenario-card-a'));
    await waitFor(()=>expect(card.getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeEnabled());
    fireEvent.click(card.getByRole('button',{name:'Dự đoán ROI kịch bản'}));
    await waitFor(()=>expect(screen.getByTestId('suitability-roi-a')).toHaveTextContent('API /predict'));
    expect(screen.getByTestId('suitability-roi-a')).toHaveTextContent('BASELINE_ONLY');
    fireEvent.click(card.getByRole('button',{name:'Chỉnh sửa kịch bản'}));
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText(/5. Thời lượng/),{target:{value:'45'}});
    fireEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}));
    expect(screen.getByTestId('suitability-roi-a')).toHaveTextContent('chưa có kết quả API hiện hành');
    expect(api.mock.calls.filter(([url])=>!String(url).endsWith('/predict')&&!String(url).endsWith('/model-info'))).toHaveLength(0);
    expect(api.mock.calls.filter(([url])=>String(url).endsWith('/predict'))).toHaveLength(1);
    await act(async()=>{});
  });
});
