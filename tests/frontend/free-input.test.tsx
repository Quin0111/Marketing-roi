import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import http from '../../backend/tests/http_results.json';
import { parseModelInfo } from '../../src/services/modelInfoService';
import { resolveModelInput, validDescription } from '../../src/services/campaignInput';
import { PredictionService, toApiFeatures } from '../../src/services/predictionService';
import { createMarketingActionPlan } from '../../src/services/marketingActionPlan';
import { buildCampaign, loadCampaigns, saveCampaigns, validateCampaign } from '../../src/services/campaigns';
import { loadScenarios, saveScenarios } from '../../src/services/scenarioStorage';
import { ModelProvider } from '../../src/contexts/ModelContext';
import { PredictRoiPage } from '../../src/pages/PredictRoiPage';
const info=parseModelInfo(http.responses.find(r=>r.endpoint==='/model-info')!.response);
const response=http.responses.find(r=>r.endpoint==='/predict')!.response;
const base={campaignType:'Search',channelUsed:'Google Ads',targetAudience:'Men 25-34',customerSegment:'Tech Enthusiasts',durationDays:30};
const custom={campaignType:'Ra mắt sách',channelUsed:'Hội chợ địa phương',targetAudience:'Gia đình tại Đà Nẵng',customerSegment:'Độc giả yêu sách',durationDays:21};
const ok=(data:unknown)=>new Response(JSON.stringify(data),{status:200});
describe('description and verified model input remain independent',()=>{
 it('maps exact Vietnamese labels, NFC, whitespace and case to metadata values without changing the brief',()=>{
  const f={...base,campaignType:' Quảng cáo tìm kiếm '.normalize('NFD'),channelUsed:' google   ads ',targetAudience:'Nam từ 25–34 tuổi',customerSegment:'Người yêu thích công nghệ'};
  expect(resolveModelInput(f,info).features).toEqual(base);
  expect(toApiFeatures(f,info)).toEqual({Campaign_Type:'Search',Channel_Used:'Google Ads',Target_Audience:'Men 25-34',Customer_Segment:'Tech Enthusiasts',Duration_days:30});
  expect(f.channelUsed).toBe(' google   ads ');
 });
 it.each(['Ra mắt sách','Quang cao tim kiem','Search Ads','constructor'])('never infers an unsupported type %s or sends HTTP',async campaignType=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);const f={...base,campaignType};
  expect(validDescription(f)).toBe(true);expect(resolveModelInput(f,info).features).toBeNull();
  await expect(PredictionService.predictRoi({features:f},info)).rejects.toMatchObject({code:'input'});expect(fetch).not.toHaveBeenCalled();
 });
 it('does not map a label excluded by actual metadata',()=>{
  expect(resolveModelInput(base,{...info,allowed_categories:{...info.allowed_categories,Campaign_Type:['Email']}}).features).toBeNull();
 });
 it.each([1,2,3,4,7,21,31,90,365])('plans and persists %s days while declining model-unsupported duration',durationDays=>{
  const f={...custom,durationDays};const plan=createMarketingActionPlan(f);
  expect(plan.phases).toHaveLength(4);expect(plan.phases[0].startDay).toBe(1);expect(plan.phases[3].endDay).toBe(durationDays);
  expect(plan.phases.every(p=>p.startDay>=1&&p.endDay>=p.startDay&&p.endDay<=durationDays)).toBe(true);
  expect(resolveModelInput(f,info).features).toBeNull();
  const c=buildCampaign({id:'custom',name:'Chiến dịch sách',features:f});expect(validateCampaign(c)).toBeNull();expect(saveCampaigns([c])).toBeNull();expect(loadCampaigns().campaigns[0]).toEqual(c);
 });
 it.each([0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])('rejects invalid duration %s for storage and planning',durationDays=>{
  expect(validDescription({...custom,durationDays})).toBe(false);expect(()=>createMarketingActionPlan({...custom,durationDays})).toThrow();
 });
 it.each(['campaignType','channelUsed','targetAudience','customerSegment'] as const)('rejects blank %s without preventing editing',key=>{
  expect(validDescription({...custom,[key]:'  '})).toBe(false);expect(resolveModelInput({...custom,[key]:''},info).issues.join()).toContain('chưa nhập');
 });
 it('preserves unsupported Vietnamese descriptions across scenario storage and uses an explicit generic plan',()=>{
  const scenario={id:'vn',name:'Chiến dịch sách',features:custom,createdAt:'now',updatedAt:'now'};
  expect(saveScenarios([scenario])).toBeNull();expect(loadScenarios(()=>[]).scenarios).toEqual([scenario]);
  const plan=createMarketingActionPlan(custom);expect(plan.features).toEqual(custom);expect(plan.configurationReviewRequired).toBe(true);
  expect(plan.notes.join()).toContain('chưa có template chuyên biệt');expect(plan.brief).toContain(custom.channelUsed);
  expect(JSON.stringify(plan)).not.toMatch(/undefined|NaN|ngân sách:|doanh thu:/);
 });
 it('retains the no-metadata boundary while allowing local descriptions',()=>{
  expect(resolveModelInput(base,null).features).toBeNull();expect(validDescription(custom)).toBe(true);
 });
 it('clears real results on dropdown change and saves supported configuration without a second POST',async()=>{
  const fetch=vi.fn(async(url:unknown)=>ok(String(url).endsWith('/model-info')?info:response));vi.stubGlobal('fetch',fetch);
  render(<ModelProvider><PredictRoiPage/></ModelProvider>);
  const predict=screen.getByRole('button',{name:'Dự đoán ROI',exact:true});await waitFor(()=>expect(predict).toBeEnabled());fireEvent.click(predict);
  await waitFor(()=>expect(screen.getByTestId('predicted-roi')).toBeVisible());
  fireEvent.change(screen.getByLabelText(/2. Kênh Marketing/),{target:{value:'Facebook'}});
  expect(screen.queryByTestId('predicted-roi')).toBeNull();expect(predict).toBeEnabled();
  fireEvent.click(screen.getByRole('button',{name:'45 ngày',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Lưu kịch bản để lập kế hoạch'}));
  expect(loadScenarios(()=>[]).scenarios.at(-1)?.features.channelUsed).toBe('Facebook');
  expect(loadScenarios(()=>[]).scenarios.at(-1)?.features.durationDays).toBe(45);
  expect(fetch.mock.calls.filter(([url])=>String(url).endsWith('/predict'))).toHaveLength(1);
 });
});
