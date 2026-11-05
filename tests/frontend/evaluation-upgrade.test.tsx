import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { App } from '../../src/App';
import { PredictionResultCard } from '../../src/components/prediction/PredictionResultCard';
import { parseModelInfo } from '../../src/services/modelInfoService';
import { PredictionService } from '../../src/services/predictionService';
import { DashboardPage } from '../../src/pages/DashboardPage';
import stats from '../../src/data/verifiedDataset.json';
import http from '../../backend/tests/http_results.json';
import reference from '../../backend/models/reference_prediction.json';
const metadata=parseModelInfo(http.responses.find(r=>r.endpoint==='/model-info')!.response);
const response=http.responses.find(r=>r.endpoint==='/predict')!.response;
const features={campaignType:'Social Media',channelUsed:'Facebook',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30} as const;
const ok=(data:unknown)=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
beforeEach(()=>{
  localStorage.clear();window.location.hash='predict';
  vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  vi.stubGlobal('fetch',vi.fn(async(url:unknown)=>ok(String(url).endsWith('/model-info')?metadata:response)));
});
async function predict() {
  await waitFor(()=>expect(screen.getByRole('button',{name:'Dự đoán ROI',exact:true})).toBeEnabled());
  fireEvent.change(screen.getByLabelText(/1. Loại chiến dịch/),{target:{value:'Social Media'}});
  fireEvent.change(screen.getByLabelText(/2. Kênh Marketing/),{target:{value:'Facebook'}});
  fireEvent.change(screen.getByLabelText(/3. Đối tượng mục tiêu/),{target:{value:'Women 25-34'}});
  fireEvent.change(screen.getByLabelText(/4. Phân khúc khách hàng/),{target:{value:'Fashionistas'}});
  fireEvent.click(screen.getByRole('button',{name:'30 ngày',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Dự đoán ROI',exact:true}));
  await screen.findByTestId('predicted-roi');
}
describe('Evaluation website upgrade',()=>{
  it('uses byte-verifiable published Development counts without raw Test access',()=>{
    const bytes=readFileSync(stats.source);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(stats.source_sha256);
    const rows=bytes.toString('utf8').trim().split(/\r?\n/).slice(1).map(line=>line.split(','));
    for(const feature of ['Campaign_Type','Channel_Used'] as const){
      expect(stats[feature]).toEqual(rows.filter(r=>r[0]===feature).map(r=>({name:r[1],count:Number(r[2])})));
      expect(stats[feature].reduce((a,r)=>a+r.count,0)).toBe(170000);
    }
    expect(stats.dataset_rows).toBe(200000);
  });
  it('distinguishes verified distributions from twelve illustrative rows and provides navigation',()=>{
    render(<DashboardPage/>);
    expect(screen.getByTestId('verified-distributions')).toHaveTextContent('Development');
    expect(screen.getByText(/DEMO_DATA · Bảng mẫu riêng/)).toBeVisible();
    expect(screen.getByRole('link',{name:'Dự đoán ROI'})).toHaveAttribute('href','#predict');
    expect(screen.getByRole('link',{name:'So sánh & Đề xuất'})).toHaveAttribute('href','#scenarios');
  });
  it.each(reference.cases)('rounds $name for display only and preserves exact reference precision',async row=>{
    const raw=row.expected_predictions['Linear Regression'];
    vi.stubGlobal('fetch',vi.fn(async()=>ok({...response,predicted_roi:raw})));
    const result=await PredictionService.predictRoi({features},metadata);
    render(<PredictionResultCard result={result} isLoading={false}/>);
    expect(screen.getByTestId('predicted-roi')).toHaveTextContent(raw.toFixed(4).replace('.',','));
    expect(screen.getByTestId('predicted-roi')).toHaveAttribute('data-value',String(raw));
    expect(screen.getByTestId('raw-predicted-roi')).toHaveTextContent(String(raw));
    expect(result.predictedRoi).toBe(raw);
  });
  it('saves configuration without losing existing scenarios; hands off actual response only in memory',async()=>{
    localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:[{id:'existing',name:'Existing',features,createdAt:'today',updatedAt:'today'}]}));
    render(<App/>);await predict();
    fireEvent.click(screen.getByRole('button',{name:'Lưu thành kịch bản so sánh'}));
    const result=await screen.findAllByTestId('scenario-api-roi');
    expect(result).toHaveLength(2); // card + table; no additional predict call
    result.forEach(el=>expect(el).toHaveAttribute('data-value',String(response.predicted_roi)));
    expect(screen.getByTestId('scenario-card-existing')).toHaveTextContent('Chưa dự đoán');
    const saved=JSON.parse(localStorage.getItem('dm_scenarios')!);
    expect(saved.scenarios).toHaveLength(2);expect(saved.scenarios[1].features).toEqual(features);
    expect(saved.scenarios[1]).not.toHaveProperty('predictedRoi');
    expect(JSON.stringify(saved)).not.toContain('modelVersion');
    expect(vi.mocked(fetch).mock.calls.filter(([url])=>String(url).endsWith('/predict'))).toHaveLength(1);
    expect(screen.getAllByTestId('scenario-api-result')[0]).toHaveAttribute('data-source','MODEL_PREDICTION');
  });
  it('does not silently overwrite unreadable scenario data when saving a prediction',async()=>{
    localStorage.setItem('dm_scenarios','broken-json');render(<App/>);await predict();
    fireEvent.click(screen.getByRole('button',{name:'Lưu thành kịch bản so sánh'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa thể lưu an toàn');
    expect(localStorage.getItem('dm_scenarios')).toBe('broken-json');
    expect(window.location.hash).toBe('#predict');
  });
  it('reports storage write failure without claiming a saved comparison',async()=>{
    render(<App/>);await predict();
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('denied');});
    fireEvent.click(screen.getByRole('button',{name:'Lưu thành kịch bản so sánh'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được');
    expect(window.location.hash).toBe('#predict');
  });
  it('shows one global gate, configured fallback name and keyboard-accessible limits',async()=>{
    render(<App/>);await predict();
    expect(screen.getAllByRole('button',{name:'Quality Gate: BASELINE_ONLY'})).toHaveLength(1);
    expect(screen.getByTestId('display-name')).toHaveTextContent('Người dùng DreamMakers');
    fireEvent.click(screen.getByRole('button',{name:'Quality Gate: BASELINE_ONLY'}));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Quality Gate');
    fireEvent.keyDown(window,{key:'Escape'});expect(screen.queryByRole('tooltip')).toBeNull();
    await act(async()=>{});
  });
});
