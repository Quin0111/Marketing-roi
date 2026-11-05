import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadScenarios, saveScenarios } from '../../src/services/scenarioStorage';
import { DemoScenarioService } from '../../src/services/demoScenarioService';
import { ModelProvider } from '../../src/contexts/ModelContext';
import { CompareScenariosPage } from '../../src/pages/CompareScenariosPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { ModelInsightsPage } from '../../src/pages/ModelInsightsPage';
import { ScenarioModal } from '../../src/components/scenarios/ScenarioModal';
import { formatRoiVi } from '../../src/constants/translations';
import { EXPERIMENT_RESULTS } from '../../src/data/modelResults';
import metrics from '../../backend/models/model_metrics.json';

const defaults = DemoScenarioService.getInitialScenarios;
const row = defaults()[0];
const storage = (value: string | null) => ({ getItem: vi.fn(() => value), setItem: vi.fn() });
beforeEach(() => {
  localStorage.clear(); vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
  // jsdom has no layout/ResizeObserver; actual chart layout is tested in Edge.
  vi.stubGlobal('ResizeObserver',class { observe() {} unobserve() {} disconnect() {} });
});

describe('Scenario storage recovery and migration', () => {
  it('initializes safe illustrative examples only for missing key', () => {
    expect(loadScenarios(defaults, storage(null))).toEqual({ scenarios: defaults(), notice: null });
  });
  it.each(['{broken', '', 'null', '{}', '[{}]', '42', '{"version":2,"scenarios":[]}'])('recovers without crash from %s', value => {
    const result = loadScenarios(defaults, storage(value));
    expect(result.scenarios).toEqual([]); expect(result.notice).toBeTruthy();
  });
  it.each(['[]', '{"version":1,"scenarios":[]}'])('preserves intentionally empty list %s', value => {
    expect(loadScenarios(defaults, storage(value)).scenarios).toEqual([]);
  });
  it('migrates legacy array to versioned storage without dropping valid data', () => {
    const result = loadScenarios(defaults, storage(JSON.stringify([row])));
    expect(result.scenarios).toEqual([row]); expect(result.notice).toContain('chuyển');
    const s=storage(null); expect(saveScenarios(result.scenarios,s)).toBeNull();
    expect(JSON.parse(s.setItem.mock.calls[0][1])).toEqual({version:1,scenarios:[row]});
  });
  it('reads current version without recovery notice', () => {
    expect(loadScenarios(defaults,storage(JSON.stringify({version:1,scenarios:[row]})))).toEqual({scenarios:[row],notice:null});
  });
  it('keeps valid records and removes malformed or duplicate records independently', () => {
    const result=loadScenarios(defaults,storage(JSON.stringify([{},row,row,{...row,id:'other',features:{...row.features,durationDays:0}}])));
    expect(result.scenarios).toEqual([row]);expect(result.notice).toContain('bỏ qua');
  });
  it.each(['name','id','createdAt','updatedAt','features'])('rejects missing %s', key => {
    const bad={...row};delete (bad as Record<string,unknown>)[key];
    expect(loadScenarios(defaults,storage(JSON.stringify([bad]))).scenarios).toEqual([]);
  });
  it.each(['campaignType','channelUsed','targetAudience','customerSegment','durationDays'])('rejects invalid feature %s',key=>{
    const bad={...row,features:{...row.features,[key]:key==='durationDays'?'invalid':''}};
    expect(loadScenarios(defaults,storage(JSON.stringify([bad]))).scenarios).toEqual([]);
  });
  it('does not fabricate a score for missing ROI and preserves zero ROI',()=>{
    const result=loadScenarios(defaults,storage(JSON.stringify([{...row,predictedRoi:0}])));
    expect(result.scenarios[0].predictedRoi).toBe(0);
  });
  it('survives denied reads and quota failures',()=>{
    const s={getItem:()=>{throw new DOMException('denied','SecurityError');},setItem:()=>{throw new DOMException('full','QuotaExceededError');}};
    expect(loadScenarios(defaults,s).scenarios).toEqual([]);expect(saveScenarios([row],s)).toContain('bộ nhớ');
  });
});

describe('Compare page recovery and behavior',()=>{
  it.each(['{broken','[{}]','[]'])('renders recovery or empty state for %s', async raw=>{
    localStorage.setItem('dm_scenarios',raw);
    render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
    expect(screen.getByRole('button',{name:'Thêm kịch bản',exact:true})).toBeVisible();
    expect(screen.getByText('Bạn chưa tạo kịch bản nào.')).toBeVisible();
    await act(async()=>{});
  });
  it('renders even when browser storage access is denied',async()=>{
    vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new DOMException('denied');});
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('denied');});
    render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
    expect(screen.getByRole('button',{name:'Thêm kịch bản',exact:true})).toBeVisible();
    await waitFor(()=>expect(screen.getByRole('status',{name:'Thông báo lưu trữ kịch bản'})).toHaveTextContent('bộ nhớ'));
  });
  it('deletes final scenario and persists empty versioned list',async()=>{
    localStorage.setItem('dm_scenarios',JSON.stringify([row]));vi.spyOn(window,'confirm').mockReturnValue(true);
    render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
    fireEvent.click(screen.getByRole('button',{name:'Xóa kịch bản',exact:true}));
    expect(screen.getByText('Bạn chưa tạo kịch bản nào.')).toBeVisible();
    await waitFor(()=>expect(JSON.parse(localStorage.getItem('dm_scenarios')!).scenarios).toEqual([]));
  });
  it('clicking ROI header never sorts scores and never calls predict',async()=>{
    render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
    const order=()=>screen.getAllByRole('row').slice(1).map(el=>el.textContent);
    const before=order();fireEvent.click(screen.getByRole('columnheader',{name:'ROI mô phỏng',exact:true}));
    expect(order()).toEqual(before);
    expect(screen.getByText(/ROI mô phỏng là dữ liệu minh họa cũ, không phải kết quả mô hình/)).toBeVisible();
    await act(async()=>{});
    expect(vi.mocked(fetch).mock.calls.every(([url])=>!String(url).endsWith('/predict'))).toBe(true);
  });
});

describe('Scientific provenance',()=>{
  it('keeps ROI on the dataset scale with no invented unit',()=>{
    expect(formatRoiVi(5.0024)).toBe('5,0024');
    render(<DashboardPage/>);
    expect(screen.getByText(/Thống kê đã đối soát trên Development/)).toBeVisible();
    expect(screen.getByTestId('verified-distributions')).toHaveTextContent('170.000 bản ghi');
    expect(screen.getByText(/12 bản ghi hardcode/)).toBeVisible();
    expect(screen.queryByText('ROI Thực tế')).toBeNull();
  });
  it('separates historical ROI, Phase4B2 and Criteo visit evidence',async()=>{
    render(<ModelProvider><ModelInsightsPage/></ModelProvider>);
    expect(screen.getByTestId('historical-provenance')).toHaveTextContent('giới hạn tái lập');
    expect(screen.getByTestId('research-evidence')).toHaveTextContent('RESEARCH_LIMITED');
    expect(screen.getByTestId('research-evidence')).toHaveTextContent('visit, không phải ROI');
    expect(screen.queryByText('0/5 Fold')).toBeNull();
    fireEvent.click(screen.getByText('Nghiên cứu bổ sung · RESEARCH_LIMITED'));
    fireEvent.click(screen.getByText('Chi tiết nguồn bảng'));
    expect(screen.getByText(/Development 170.000/)).toBeVisible();
    await act(async()=>{});
  });
  it('retains all published aggregate historical metrics unchanged',()=>{
    const historical=Object.values(metrics).find(v=>v && typeof v==='object' && 'Dummy Regressor' in v) as Record<string,{MAE_mean:number;RMSE_mean:number;R2_mean:number}>;
    expect(historical).toBeDefined();
    const names=['Dummy Regressor','Linear Regression','Decision Tree','Random Forest'];
    EXPERIMENT_RESULTS.forEach((m,i)=>{
      expect([m.meanMae,m.meanRmse,m.meanR2]).toEqual([historical[names[i]].MAE_mean,historical[names[i]].RMSE_mean,historical[names[i]].R2_mean]);
    });
  });
});

describe('Scenario dialog keyboard and validation',()=>{
  it('provides labeled fields, blocks whitespace, closes on Escape and restores focus',()=>{
    const onClose=vi.fn(),onSave=vi.fn();const opener=document.createElement('button');document.body.append(opener);opener.focus();
    const view=render(<ScenarioModal isOpen onClose={onClose} onSave={onSave}/>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal','true');
    fireEvent.change(screen.getByLabelText(/Tên kịch bản/),{target:{value:'   '}});
    fireEvent.click(screen.getByRole('button',{name:'Lưu kịch bản',exact:true}));
    expect(onSave).not.toHaveBeenCalled();expect(screen.getByText(/không được chỉ chứa khoảng trắng/)).toBeVisible();
    fireEvent.keyDown(document,{key:'Escape'});expect(onClose).toHaveBeenCalledOnce();
    view.unmount();expect(document.activeElement).toBe(opener);opener.remove();
  });
});
