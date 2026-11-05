import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelProvider } from '../../src/contexts/ModelContext';
import { CompareScenariosPage } from '../../src/pages/CompareScenariosPage';
import { CampaignFeatures, MarketingScenario } from '../../src/types';
import http from '../../backend/tests/http_results.json';
import reference from '../../backend/models/reference_prediction.json';

const info=http.responses.find(r=>r.endpoint==='/model-info')!.response;
const result=http.responses.find(r=>r.endpoint==='/predict')!.response;
const features=(index=0)=>({campaignType:reference.cases[index].features.Campaign_Type,channelUsed:reference.cases[index].features.Channel_Used,
  targetAudience:reference.cases[index].features.Target_Audience,customerSegment:reference.cases[index].features.Customer_Segment,
  durationDays:reference.cases[index].features.Duration_days} as CampaignFeatures);
const row=(id='a',index=0):MarketingScenario=>({id,name:`Scenario ${id.toUpperCase()}`,features:features(index),createdAt:'today',updatedAt:'today',predictedRoi:99});
const ok=(body:unknown)=>new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
function seed(rows=[row()]){localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:rows}));}
function backend(predict:(body:Record<string,unknown>,signal?:AbortSignal|null)=>Promise<Response>=async()=>ok(result),metadata=info){
  const fetcher=vi.fn((url:unknown,init?:RequestInit)=>String(url).endsWith('/model-info')?Promise.resolve(ok(metadata)):predict(JSON.parse(String(init?.body)),init?.signal));
  vi.stubGlobal('fetch',fetcher);return fetcher;
}
async function mount(){const view=render(<ModelProvider><CompareScenariosPage/></ModelProvider>);await waitFor(()=>expect(within(screen.getByTestId('scenario-card-a')).getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeEnabled());return view;}
const card=(id='a')=>within(screen.getByTestId(`scenario-card-${id}`));
async function predict(id='a'){fireEvent.click(card(id).getByRole('button',{name:/Dự đoán ROI kịch bản|Dự đoán lại ROI|Thử lại dự đoán/}));}
async function success(id='a',value=String(result.predicted_roi)){await waitFor(()=>expect(card(id).getByTestId('scenario-api-roi')).toHaveAttribute('data-value',value));}
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve};}
beforeEach(()=>{localStorage.clear();vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});});

describe('Compare API source and valid prediction',()=>{
  it('posts exactly five backend features; displays real source, metadata and warning',async()=>{
    seed();const api=backend();await mount();await predict();await success();
    const call=api.mock.calls.find(([url])=>String(url).endsWith('/predict'))!;
    expect(JSON.parse(String(call[1]?.body))).toEqual(reference.cases[0].features);
    expect(card().getByText('Đã dự đoán bằng mô hình')).toBeVisible();
    expect(card().getByText(/Linear Regression · phiên bản 1.0.0 ·/)).toHaveTextContent('BASELINE_ONLY');
    expect(card().getByTestId('scenario-api-warning')).toHaveTextContent(result.warning);
    expect(screen.getByTestId('scenario-row-a')).toHaveTextContent(result.predicted_roi.toFixed(4).replace('.',','));
    expect(card().queryByText('Đã kiểm chứng chính xác')).toBeNull();
  });
  it('predicts multiple scenarios independently with API-only chart values',async()=>{
    seed([row(),row('b',1)]);backend(async body=>ok({...result,predicted_roi:body.Duration_days===30?4.9:5.1}));await mount();
    await predict();await predict('b');await success('a','4.9');await success('b','5.1');
    expect(screen.getByTestId('comparison-chart-values').children).toHaveLength(2);
    expect(screen.getByTestId('comparison-chart-values')).not.toHaveTextContent('99');
    fireEvent.change(screen.getByLabelText('Nguồn biểu đồ'),{target:{value:'demo'}});
    expect(screen.getByTestId('comparison-chart-source')).toHaveTextContent('ROI mô phỏng');
    expect(screen.getByTestId('comparison-chart-values')).toHaveTextContent('99');
    expect(screen.getByTestId('comparison-chart-values')).not.toHaveTextContent('4,9');
  });
  it('does not coerce a real zero ROI to a demo fallback',async()=>{
    seed();backend(async()=>ok({...result,predicted_roi:0}));await mount();await predict();await success('a','0');
    expect(screen.getByTestId('comparison-chart-values').firstElementChild).toHaveAttribute('data-value','0');
  });
  it('never promotes forged localStorage predictions to API results',async()=>{
    seed([{...row(),prediction:{status:'success',result},apiResult:result} as MarketingScenario]);backend();await mount();
    expect(card().getByText(/Chưa dự đoán/)).toBeVisible();expect(card().queryByTestId('scenario-api-roi')).toBeNull();
    expect(screen.getByTestId('comparison-chart-empty')).toBeVisible();
  });
  it('reload retains configuration but requires a fresh API prediction',async()=>{
    seed();backend();const view=await mount();await predict();await success();
    const saved=JSON.parse(localStorage.getItem('dm_scenarios')!);expect(saved.scenarios[0]).not.toHaveProperty('apiResult');
    expect(JSON.stringify(saved)).not.toContain('modelVersion');view.unmount();await mount();
    expect(card().queryByTestId('scenario-api-roi')).toBeNull();expect(card().getByText(/Chưa dự đoán/)).toBeVisible();
  });
});

describe('Compare validation and safe errors',()=>{
  it('rejects values outside the actual backend domain before POST',async()=>{
    seed();const api=backend(async()=>ok(result),{...info,allowed_categories:{...info.allowed_categories,Campaign_Type:['Search']}});render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
    await waitFor(()=>expect(card().getByText(/chưa được mô hình hỗ trợ/)).toBeVisible());
    const button=card().getByRole('button',{name:'Dự đoán ROI kịch bản'});expect(button).toBeDisabled();fireEvent.click(button);
    expect(api.mock.calls.filter(([url])=>String(url).endsWith('/predict'))).toHaveLength(0);
  });
  it('disables predictions without verified metadata',async()=>{
    seed();vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('offline')));
    render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
    await waitFor(()=>expect(card().getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeDisabled());
    expect(card().queryByTestId('scenario-api-roi')).toBeNull();
  });
  it.each([422,503,500])('clears old ROI on HTTP%s, never uses mock and supports retry',async status=>{
    seed();let fail=false;backend(async()=>fail?new Response('{"detail":"private path traceback"}',{status}):ok(result));await mount();
    await predict();await success();fail=true;await predict();
    await waitFor(()=>expect(card().getByText('Dự đoán thất bại')).toBeVisible());
    expect(card().getByRole('alert')).not.toHaveTextContent('private');expect(card().queryByTestId('scenario-api-roi')).toBeNull();
    expect(screen.getByTestId('comparison-chart-values').children).toHaveLength(0);
    expect(screen.getByTestId('scenario-card-a')).not.toHaveTextContent('99');fail=false;await predict();await success();
  });
  it('handles network failure without fallback and retries successfully',async()=>{
    seed();let fail=true;backend(async()=>{if(fail)throw new TypeError('network');return ok(result);});await mount();await predict();
    await waitFor(()=>expect(card().getByRole('alert')).toHaveTextContent('Không kết nối'));
    expect(card().queryByTestId('scenario-api-roi')).toBeNull();fail=false;await predict();await success();
  });
  it.each([{predicted_roi:99},{...result,quality_status:'VALIDATED'},{...result,best_campaign:'fake'},{...result,model_version:'other'}])('rejects malformed or promoted API response',async bad=>{
    seed();backend(async()=>ok(bad));await mount();await predict();
    await waitFor(()=>expect(card().getByRole('alert')).toHaveTextContent('không hợp lệ'));
    expect(card().queryByTestId('scenario-api-roi')).toBeNull();
  });
  it('one failed scenario does not replace another successful scenario result',async()=>{
    seed([row(),row('b',1)]);backend(async body=>body.Duration_days===30?ok(result):new Response('{}',{status:503}));await mount();
    await predict();await success();await predict('b');await waitFor(()=>expect(card('b').getByRole('alert')).toBeVisible());
    await success();expect(screen.getByTestId('comparison-chart-values').children).toHaveLength(1);
  });
});

describe('Compare request lifecycle and scenario revisions',()=>{
  it('blocks repeated submissions while pending and exposes loading',async()=>{
    seed();const gate=deferred<Response>();const api=backend(()=>gate.promise);await mount();await predict();
    const button=card().getByRole('button',{name:'Đang dự đoán…'});expect(button).toBeDisabled();fireEvent.click(button);
    expect(api.mock.calls.filter(([url])=>String(url).endsWith('/predict'))).toHaveLength(1);
    await act(async()=>gate.resolve(ok(result)));await success();
  });
  it('editing after success removes stale result from card, table and chart',async()=>{
    seed();backend();await mount();await predict();await success();
    fireEvent.click(card().getByRole('button',{name:'Chỉnh sửa kịch bản'}));
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText(/5. Thời lượng/),{target:{value:'45'}});
    fireEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}));
    expect(card().queryByTestId('scenario-api-roi')).toBeNull();expect(screen.getByTestId('scenario-row-a')).not.toHaveTextContent('Đã dự đoán bằng mô hình');
    expect(screen.getByTestId('comparison-chart-values').children).toHaveLength(0);await predict();await success();
  });
  it('ignores an old response after editing even when transport ignores abort',async()=>{
    seed();const gate=deferred<Response>();backend(()=>gate.promise);await mount();await predict();
    fireEvent.click(card().getByRole('button',{name:'Chỉnh sửa kịch bản'}));fireEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}));
    await act(async()=>gate.resolve(ok(result)));expect(card().queryByTestId('scenario-api-roi')).toBeNull();
  });
  it('deleting a pending scenario cannot resurrect its result',async()=>{
    seed();const gate=deferred<Response>();backend(()=>gate.promise);vi.spyOn(window,'confirm').mockReturnValue(true);await mount();await predict();
    fireEvent.click(card().getByRole('button',{name:'Xóa kịch bản'}));await act(async()=>gate.resolve(ok(result)));
    expect(screen.queryByTestId('scenario-card-a')).toBeNull();expect(screen.queryByTestId('scenario-api-roi')).toBeNull();
  });
  it('duplication keeps configuration but never copies an API prediction',async()=>{
    seed();backend();await mount();await predict();await success();fireEvent.click(card().getByRole('button',{name:'Nhân bản kịch bản'}));
    const cards=screen.getAllByTestId(/^scenario-card-/);expect(cards).toHaveLength(2);
    const clone=cards.find(el=>el.getAttribute('data-testid')!=='scenario-card-a')!;
    expect(within(clone).queryByTestId('scenario-api-roi')).toBeNull();expect(clone).toHaveTextContent('Chưa dự đoán');
  });
  it('a late old response cannot overwrite a newer successful prediction',async()=>{
    seed();const old=deferred<Response>();let calls=0;backend(()=>++calls===1?old.promise:Promise.resolve(ok({...result,predicted_roi:7})));await mount();await predict();
    fireEvent.click(card().getByRole('button',{name:'Chỉnh sửa kịch bản'}));fireEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}));
    await predict();await success('a','7');await act(async()=>old.resolve(ok({...result,predicted_roi:123})));
    await success('a','7');expect(screen.getByTestId('comparison-chart-values')).not.toHaveTextContent('123');
  });
  it('metadata refresh aborts pending requests and suppresses their late results',async()=>{
    seed();const old=deferred<Response>();let signal:AbortSignal|null|undefined;
    backend((_body,s)=>{signal=s;return old.promise;});await mount();await predict();
    fireEvent.click(screen.getByRole('button',{name:'Xác minh lại mô hình'}));await waitFor(()=>expect(signal?.aborted).toBe(true));
    await act(async()=>old.resolve(ok(result)));expect(card().queryByTestId('scenario-api-roi')).toBeNull();
  });
  it('metadata refresh invalidates cached results before they can be used again',async()=>{
    seed();backend();await mount();await predict();await success();fireEvent.click(screen.getByRole('button',{name:'Xác minh lại mô hình'}));
    await waitFor(()=>expect(card().queryByTestId('scenario-api-roi')).toBeNull());
    expect(screen.getByTestId('comparison-chart-values').children).toHaveLength(0);
  });
  it('unmount aborts requests and late success has no UI result',async()=>{
    seed();const gate=deferred<Response>();let signal:AbortSignal|null|undefined;
    backend((_body,s)=>{signal=s;return gate.promise;});const view=await mount();await predict();view.unmount();
    expect(signal?.aborted).toBe(true);await act(async()=>gate.resolve(ok(result)));
  });
  it('API values are never used to reorder or recommend scenarios',async()=>{
    seed([row(),row('b',1)]);backend(async body=>ok({...result,predicted_roi:body.Duration_days===30?5:9}));await mount();
    await predict();await predict('b');await success('a','5');await success('b','9');
    const rows=()=>screen.getAllByTestId(/^scenario-row-/).map(el=>el.getAttribute('data-testid'));
    const before=rows();fireEvent.click(screen.getByRole('columnheader',{name:'ROI dự đoán · API /predict'}));expect(rows()).toEqual(before);
    expect(screen.getByText(/Không xếp hạng hoặc chọn kịch bản tốt nhất/)).toBeVisible();
  });
});
