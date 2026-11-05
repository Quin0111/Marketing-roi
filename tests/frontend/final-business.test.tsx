import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INDUSTRIES, MARKETING_GOALS, contextActivities } from '../../src/services/marketingContext';
import { createMarketingActionPlan } from '../../src/services/marketingActionPlan';
import { buildCampaign, campaignFinancials, campaignReview, campaignUpdateError, CURRENCIES, loadCampaigns, parseMoney, saveCampaigns, validateCampaign } from '../../src/services/campaigns';
import { evaluateScenarioSuitability } from '../../src/services/scenarioSuitability';
import { ScenarioSuitability } from '../../src/components/scenarios/ScenarioSuitability';
import { CampaignManagement } from '../../src/components/scenarios/CampaignManagement';
import { useCampaignWorkspace } from '../../src/hooks/useCampaignWorkspace';
import { CampaignFeatures, MarketingScenario } from '../../src/types';
import { CompareScenariosPage } from '../../src/pages/CompareScenariosPage';
import { ModelProvider } from '../../src/contexts/ModelContext';
import { useLayoutEffect } from 'react';
import { useScenarioPredictions } from '../../src/hooks/useScenarioPredictions';
import { ModelInfo } from '../../src/types';
import { parseModelInfo } from '../../src/services/modelInfoService';
import http from '../../backend/tests/http_results.json';
const features:CampaignFeatures={campaignType:'Social Media',channelUsed:'Instagram',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30};
const scenario:MarketingScenario={id:'source',name:'Nguồn',features,createdAt:'now',updatedAt:'now',predictedRoi:9999};
const fresh=()=>buildCampaign(scenario,{industry:'fashion',goal:'leads'});
function Harness(){const workspace=useCampaignWorkspace();return <CampaignManagement workspace={workspace}/>;}
beforeEach(()=>{localStorage.clear();vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});Element.prototype.scrollIntoView=vi.fn();vi.stubGlobal('requestAnimationFrame',(f:FrameRequestCallback)=>setTimeout(()=>f(0),0));});
describe('industry and goal evidence boundary',()=>{
 it.each(Object.keys(INDUSTRIES) as (keyof typeof INDUSTRIES)[])('supports %s with every goal without inventing industry scoring',industry=>{
  for(const goal of Object.keys(MARKETING_GOALS) as (keyof typeof MARKETING_GOALS)[]){const p=createMarketingActionPlan(features,{industry,goal});expect(p.phases[0].activities.length).toBeGreaterThan(5);expect(p.phases[2].activities.length).toBeGreaterThan(2);expect(p.phases[3].endDay).toBe(30);expect(contextActivities({industry,goal}).preparation).toHaveLength(2);}
  const c=evaluateScenarioSuitability([scenario,{...scenario,id:'b',predictedRoi:-9999}],[{field:'channelUsed',value:'Instagram',mode:'preferred'}]);expect(c.selectedIds).toEqual(['source','b']);
 });
 it('does not choose by industry alone and recomputes after context/criteria changes',async()=>{
  render(<ScenarioSuitability scenarios={[scenario]} predictionFor={()=>({status:'idle'})}/>);
  fireEvent.change(screen.getByLabelText('Lĩnh vực kinh doanh'),{target:{value:'fashion'}});fireEvent.change(screen.getByLabelText('Mục tiêu Marketing'),{target:{value:'leads'}});
  fireEvent.click(screen.getByRole('button',{name:'Đánh giá phương án theo lĩnh vực'}));await waitFor(()=>expect(screen.getByTestId('industry-results')).toHaveFocus());
  expect(screen.getByTestId('industry-results')).toHaveTextContent('Chưa đủ thông tin');expect(screen.queryByTestId('action-plan-scenario')).toBeNull();
  fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Instagram'}});expect(screen.getByTestId('industry-results')).toHaveTextContent('Phương án phù hợp nhất theo tiêu chí: Nguồn');
  fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));expect(screen.getByTestId('action-plan-details')).toHaveTextContent('phối đồ');
  fireEvent.change(screen.getByLabelText('Lĩnh vực kinh doanh'),{target:{value:'technology'}});expect(screen.queryByTestId('action-plan-details')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));expect(screen.getByTestId('action-plan-details')).toHaveTextContent('bảng thông số');
 });
 it('rejects invalid context values including prototype names',()=>{expect(()=>contextActivities({industry:'constructor'} as never)).toThrow();expect(()=>contextActivities({goal:'unknown'} as never)).toThrow();});
});
describe('financial arithmetic and lifecycle',()=>{
 it.each(['','-1','-0','NaN','Infinity','1e309','abc','1,000','0.001','1000000000001',true,undefined,100])('rejects malformed or unbounded money %s',value=>expect(parseMoney(value as string)).toBeNull());
 it.each([['0',0],['100',100],['0.10',0.1],['1000000000000',1e12]])('parses finite bounded %s', (value,expected)=>expect(parseMoney(String(value))).toBe(expected));
 it.each([['0',-100],['50',-50],['100',0],['150',50]])('calculates ROI from revenue %s and cost 100 without dataset ROI', (revenue,roi)=>{
  const c={...fresh(),revenue,expenses:[{id:'e',label:'Thực chi',amount:'100',currency:'VND' as const}]};Object.defineProperty(c,'predictedRoi',{get(){throw Error('do not read predicted ROI');}});
  expect(campaignFinancials(c)).toMatchObject({valid:true,roiPercent:roi,cost:100});expect(campaignReview(c).join(' ')).not.toContain('9999');
 });
 it.each(CURRENCIES)('handles %s without exchange-rate assumptions',currency=>{const c={...fresh(),currency,revenueCurrency:currency,revenue:'150',expenses:[{id:'e',label:'Chi phí',amount:'100',currency}]};expect(campaignFinancials(c).roiPercent).toBe(50);expect(campaignFinancials({...c,revenueCurrency:currency==='VND'?'USD':'VND'}).valid).toBe(false);});
 it('does not divide by zero, invent missing revenue, accept negative costs or overflow totals',()=>{
  const c=fresh();expect(campaignFinancials(c).valid).toBe(false);expect(campaignFinancials({...c,revenue:'100'}).roiPercent).toBeNull();
  expect(campaignFinancials({...c,revenue:'100',expenses:[{id:'e',label:'Bad',amount:'-1',currency:'VND'}]}).valid).toBe(false);
  expect(campaignFinancials({...c,revenue:'100',expenses:[{id:'e',label:'x',amount:'1000000000000',currency:'VND'},{id:'e2',label:'x',amount:'1',currency:'VND'}]}).valid).toBe(false);
 });
 it('uses integer minor units to avoid a false negative ROI for 0.1+0.2',()=>{
  const c={...fresh(),revenue:'0.30',expenses:[{id:'1',label:'a',amount:'0.10',currency:'VND' as const},{id:'2',label:'b',amount:'0.20',currency:'VND' as const}]};expect(campaignFinancials(c).roiPercent).toBe(0);
 });
 it('keeps independent campaign snapshots, bounded activities and valid transitions',()=>{
  const c=fresh();expect(validateCampaign(c)).toBeNull();expect(c).not.toHaveProperty('predictedRoi');
  const changed={...scenario,features:{...features,durationDays:60 as const}};expect(c.features.durationDays).toBe(30);expect(buildCampaign(changed).features.durationDays).toBe(60);
  const active={...c,status:'active' as const};expect(campaignUpdateError(c,active)).toBeNull();
  expect(campaignUpdateError(active,{...active,status:'completed'})).toBeTruthy();
  const completed={...active,status:'completed' as const,tasks:active.tasks.map(t=>({...t,done:true}))};expect(campaignUpdateError(active,completed)).toBeNull();
  expect(campaignUpdateError(completed,{...completed,status:'active'})).toBeTruthy();expect(campaignUpdateError(active,{...active,features:{...features,durationDays:60}})).toBeTruthy();
  expect(validateCampaign({...c,tasks:[{...c.tasks[0],endDay:31}]})).toBeTruthy();
  expect(campaignFinancials({...c,status:'cancelled'}).roiPercent).toBeNull();expect(campaignUpdateError({...c,status:'cancelled'},{...c,status:'active'})).toBeTruthy();
 });
 it('preserves raw corrupt/versioned/partial storage and reports quota failures',()=>{
  for(const raw of ['bad','{}','{"version":2,"campaigns":[]}',JSON.stringify({version:1,campaigns:[fresh(),{}]})]){const storage={getItem:vi.fn(()=>raw),setItem:vi.fn()};const loaded=loadCampaigns(storage);expect(loaded.writable).toBe(false);expect(storage.setItem).not.toHaveBeenCalled();}
  const c=fresh(),storage={getItem:vi.fn(()=>null),setItem:vi.fn()};expect(saveCampaigns([c],storage)).toBeNull();expect(loadCampaigns({getItem:()=>storage.setItem.mock.calls[0][1]}).campaigns[0].id).toBe(c.id);
  expect(saveCampaigns([c],{setItem:()=>{throw Error('quota');}})).toContain('bộ nhớ');
 });
});
describe('campaign and storage UI',()=>{
 it('catches denied access to the localStorage property itself, not just getItem/setItem calls',()=>{
  vi.spyOn(window,'localStorage','get').mockImplementation(()=>{throw new DOMException('denied','SecurityError');});
  expect(loadCampaigns().writable).toBe(false);expect(saveCampaigns([fresh()])).toContain('bộ nhớ');
 });
 it('keeps a request started immediately after metadata becomes ready instead of aborting it in a late passive effect',async()=>{
  const metadata=parseModelInfo(http.responses.find(r=>r.endpoint==='/model-info')!.response);const response=http.responses.find(r=>r.endpoint==='/predict')!.response;
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(response),{status:200})));
  function Auto({info}:{info:ModelInfo|null}){const predictions=useScenarioPredictions(info);useLayoutEffect(()=>{if(info)void predictions.predict(scenario);},[info]);return <p data-testid="immediate-prediction">{predictions.stateFor(scenario).status}</p>;}
  const view=render(<Auto info={null}/>);view.rerender(<Auto info={metadata}/>);await waitFor(()=>expect(screen.getByTestId('immediate-prediction')).toHaveTextContent('success'));
 });
 it('creates manually, enters financial data, hides dirty ROI, recomputes and deletes',async()=>{
  vi.spyOn(window,'confirm').mockReturnValue(true);render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Tạo chiến dịch thủ công'}));fireEvent.change(screen.getByLabelText('Tên chiến dịch mới'),{target:{value:'Demo thực tế'}});fireEvent.click(screen.getByRole('button',{name:'Tạo chiến dịch',exact:true}));
  expect(screen.getByTestId('campaign-editor')).toBeVisible();fireEvent.change(screen.getByLabelText('Nội dung khoản chi'),{target:{value:'Hóa đơn đã nhập'}});fireEvent.change(screen.getByLabelText('Số tiền khoản chi'),{target:{value:'100'}});fireEvent.click(screen.getByRole('button',{name:'Thêm khoản chi'}));
  fireEvent.change(screen.getByLabelText('Doanh thu thực tế'),{target:{value:'150'}});fireEvent.click(screen.getByRole('button',{name:'Lưu số liệu tài chính'}));expect(screen.getByTestId('campaign-actual-roi')).toHaveTextContent('50.00%');
  fireEvent.change(screen.getByLabelText('Doanh thu thực tế'),{target:{value:'50'}});expect(screen.getByTestId('campaign-actual-roi')).not.toHaveTextContent('50.00%');fireEvent.click(screen.getByRole('button',{name:'Lưu số liệu tài chính'}));expect(screen.getByTestId('campaign-actual-roi')).toHaveTextContent('-50.00%');
  fireEvent.click(screen.getByRole('button',{name:'Xóa chiến dịch',exact:true}));expect(screen.queryByTestId('campaign-editor')).toBeNull();expect(JSON.parse(localStorage.getItem('dm_campaigns')!).campaigns).toEqual([]);
 });
 it('keeps corrupt campaign data while allowing memory-only manual work',()=>{
  localStorage.setItem('dm_campaigns','raw-corrupt');render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Tạo chiến dịch thủ công'}));fireEvent.change(screen.getByLabelText('Tên chiến dịch mới'),{target:{value:'Trong bộ nhớ'}});fireEvent.click(screen.getByRole('button',{name:'Tạo chiến dịch',exact:true}));
  expect(screen.getByTestId('campaign-editor')).toBeVisible();expect(localStorage.getItem('dm_campaigns')).toBe('raw-corrupt');expect(screen.getByRole('status',{name:'Thông báo lưu chiến dịch'})).toHaveTextContent('bộ nhớ');
 });
 it('does not overwrite corrupt scenario storage on mount or memory-only creation',async()=>{
  localStorage.setItem('dm_scenarios','bad-json');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));render(<ModelProvider><CompareScenariosPage/></ModelProvider>);
  await waitFor(()=>expect(screen.getByRole('button',{name:'Thêm kịch bản',exact:true})).toBeVisible());expect(localStorage.getItem('dm_scenarios')).toBe('bad-json');
 });
});
