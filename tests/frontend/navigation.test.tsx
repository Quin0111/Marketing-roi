import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { resolveRoute } from '../../src/services/navigation';
import { ModelProvider } from '../../src/contexts/ModelContext';
import { ModelInformation } from '../../src/components/prediction/ModelInformation';
import { EXPERIMENT_RESULTS } from '../../src/data/modelResults';
import http from '../../backend/tests/http_results.json';
const metadata=http.responses.find(r=>r.endpoint==='/model-info')!.response;
beforeEach(()=>{
  window.history.replaceState(null,'','/#dashboard');localStorage.clear();
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(metadata),{status:200})));
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>setTimeout(()=>callback(0),0));
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
  Element.prototype.scrollIntoView=vi.fn();
});
describe('three-page route contract',()=>{
  it.each(['dashboard','predict','scenarios'] as const)('keeps #%s as a primary page',page=>{
    expect(resolveRoute('#'+page)).toEqual({page,modelInfo:false,legacyInsights:false});
  });
  it.each([['#insights','/'],['#/insights','/'],['','/insights'],['','/insights/']])('redirects legacy %s %s to model information',(hash,path)=>{
    expect(resolveRoute(hash,path)).toEqual({page:'predict',modelInfo:true,legacyInsights:true});
  });
  it('recognizes the canonical model information anchor without a fourth page',()=>{
    expect(resolveRoute('#predict/model-info')).toEqual({page:'predict',modelInfo:true,legacyInsights:false});
    expect(resolveRoute('#not-a-page').page).toBe('dashboard');
  });
});
describe('navigation and preserved quality evidence',()=>{
  it('has exactly three desktop navigation controls and the renamed Dashboard action',async()=>{
    render(<App/>);const nav=within(screen.getByRole('navigation',{name:'Điều hướng chính'}));
    expect(nav.getAllByRole('button')).toHaveLength(3);
    expect(nav.getByRole('button',{name:'Đi đến So sánh & Đề xuất'})).toBeVisible();
    expect(nav.queryByRole('button',{name:/Phân tích mô hình/})).toBeNull();
    expect(screen.getByRole('link',{name:'So sánh & Đề xuất'})).toHaveAttribute('href','#scenarios');
    fireEvent.click(nav.getByRole('button',{name:'Đi đến So sánh & Đề xuất'}));
    await waitFor(()=>expect(screen.getByRole('heading',{level:1})).toHaveTextContent('So sánh & Đề xuất'));
    expect(screen.getByTestId('scenario-suitability')).toBeVisible();
  });
  it('keeps the compact model panel collapsed and displays exact sourced historical metrics when opened',async()=>{
    render(<ModelProvider><ModelInformation/></ModelProvider>);
    const panel=screen.getByTestId('model-information');expect(panel).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText('Thông tin mô hình',{exact:true}));
    expect(panel).toHaveAttribute('open');
    const linear=EXPERIMENT_RESULTS.find(row=>row.id==='linear-regression')!;
    for(const value of [linear.meanMae,linear.meanRmse,linear.meanR2])expect(screen.getByTestId('model-summary-metrics').querySelector(`[data-value="${value}"]`)).not.toBeNull();
    expect(screen.getByTestId('model-summary-source')).toHaveTextContent('1.0.0');
    expect(screen.getByTestId('model-summary-source')).toHaveTextContent('5-Fold trên Development 170.000');
    await waitFor(()=>expect(panel).toHaveTextContent('Quality Gate = BASELINE_ONLY'));
    fireEvent.click(screen.getByText('Bảng đánh giá và nghiên cứu chi tiết',{exact:true}));
    expect(await screen.findByTestId('historical-metrics-table')).toHaveTextContent('1,732275');
    expect(screen.getByTestId('research-evidence')).toHaveTextContent('visit, không phải ROI');
  });
  it('opens and focuses model information for a legacy bookmark, without adding a navigation entry',async()=>{
    window.history.replaceState(null,'','/#insights');render(<App/>);
    await waitFor(()=>expect(window.location.hash).toBe('#predict/model-info'));
    await waitFor(()=>expect(screen.getByTestId('model-information')).toHaveAttribute('open'));
    await waitFor(()=>expect(screen.getByText('Thông tin mô hình',{exact:true})).toHaveFocus());
    expect(within(screen.getByRole('navigation',{name:'Điều hướng chính'})).getAllByRole('button')).toHaveLength(3);
  });
  it('processes a hash change to legacy insights while Predict is already mounted',async()=>{
    window.history.replaceState(null,'','/#predict');render(<App/>);
    expect(screen.getByTestId('model-information')).not.toHaveAttribute('open');
    await act(async()=>{window.location.hash='insights';window.dispatchEvent(new HashChangeEvent('hashchange'));});
    await waitFor(()=>expect(screen.getByTestId('model-information')).toHaveAttribute('open'));
    expect(window.location.hash).toBe('#predict/model-info');
  });
  it('makes metadata outage explicit without erasing historical MAE/RMSE/R²',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('offline')));
    render(<ModelProvider><ModelInformation/></ModelProvider>);
    fireEvent.click(screen.getByText('Thông tin mô hình',{exact:true}));
    await waitFor(()=>expect(screen.getByTestId('model-information')).toHaveTextContent('Chưa xác minh được metadata API'));
    expect(screen.getByTestId('model-summary-metrics')).toHaveTextContent('-0,000171');
    expect(screen.getByTestId('model-summary-source')).toHaveTextContent('snapshot lịch sử');
  });
});
