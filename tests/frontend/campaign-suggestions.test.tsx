import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createCampaignSuggestions } from '../../src/services/campaignSuggestions';
import { INDUSTRIES, MARKETING_GOALS, MarketingContext } from '../../src/services/marketingContext';
import { buildCampaign, loadCampaigns, saveCampaigns, validateCampaign } from '../../src/services/campaigns';
import { ScenarioSuitability } from '../../src/components/scenarios/ScenarioSuitability';
import { CampaignFeatures, MarketingScenario } from '../../src/types';
const features:CampaignFeatures={campaignType:'Social Media',channelUsed:'Instagram',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30};
const context:MarketingContext={industry:'fashion',goal:'awareness'};
const a:MarketingScenario={id:'a',name:'Instagram A',features,createdAt:'now',updatedAt:'now'};
const b:MarketingScenario={...a,id:'b',name:'Google B',features:{...features,campaignType:'Search',channelUsed:'Google Ads'}};
const generate=(f=features,c=context)=>createCampaignSuggestions(f,c,['Kênh khớp tiêu chí ưu tiên.']);
const channels=[['Instagram','Social Media','Reels'],['Facebook','Social Media','Page'],['Google Ads','Search','từ khóa'],['Email','Email','hủy đăng ký'],['Website','Display','biểu mẫu'],['YouTube','Social Media','thumbnail']];
function chooseContext(){fireEvent.change(screen.getByLabelText('Lĩnh vực kinh doanh'),{target:{value:'fashion'}});fireEvent.change(screen.getByLabelText('Mục tiêu Marketing'),{target:{value:'awareness'}});}
function chooseChannel(){fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Instagram'}});}
describe('transparent concrete campaign rules',()=>{
 it.each(channels.flatMap(([channelUsed,campaignType,keyword])=>[15,30,45,60].map(durationDays=>({channelUsed,campaignType,keyword,durationDays}))))('builds channel-specific $channelUsed plans for $durationDays days',({keyword,...input})=>{
  const f={...features,...input},out=generate(f);expect(out.issues).toEqual([]);expect(out.campaigns.length).toBeGreaterThan(0);
  expect(JSON.stringify(out.campaigns)).toContain(keyword);expect(new Set(out.campaigns.map(c=>c.id)).size).toBe(out.campaigns.length);
  for(const c of out.campaigns){let end=0;expect(c.name).toBeTruthy();expect(c.objective).toBeTruthy();expect(c.audience).toContain('Nữ từ 25–34 tuổi');expect(c.plan.features).toEqual(f);
   for(const p of c.plan.phases){expect(p.startDay).toBe(end+1);expect(p.endDay).toBeGreaterThanOrEqual(p.startDay);expect(p.endDay).toBeLessThanOrEqual(input.durationDays);expect(p.activities.length).toBeGreaterThan(1);expect(p.metrics.length).toBeGreaterThan(0);end=p.endDay;}
   expect(end).toBe(input.durationDays);expect(c.requirements.length).toBeGreaterThan(0);expect(c.plan.notes.join()).toContain('song song');
   expect(JSON.stringify(c)).not.toMatch(/\d+\s*(%|VND|USD|EUR)|predictedRoi|predicted_roi/);
  }
 });
 it.each(Object.keys(INDUSTRIES) as NonNullable<MarketingContext['industry']>[])('personalizes %s assets without assigning an industry advantage',industry=>{
  const outputs=Object.keys(MARKETING_GOALS).map(goal=>generate(features,{industry,goal:goal as MarketingContext['goal']}).campaigns[0]);
  expect(new Set(outputs.map(c=>c.objective)).size).toBe(4);expect(outputs.every(c=>c.plan.features.customerSegment==='Fashionistas')).toBe(true);
  if(industry!=='fashion')expect(outputs[0].plan.phases[0].activities[0]).not.toBe(generate().campaigns[0].plan.phases[0].activities[0]);
  expect(outputs[0].reasons.join()).toContain(INDUSTRIES[industry]);expect(outputs[0].reasons.join()).toContain('Không phải bằng chứng hiệu quả');
 });
 it.each(Object.keys(MARKETING_GOALS) as NonNullable<MarketingContext['goal']>[])('makes goal %s change CTA, objective and metrics',goal=>{
  const c=generate({...features,campaignType:'Search',channelUsed:'Google Ads'},{industry:'technology',goal}).campaigns[0];
  expect(c.name).toContain('sản phẩm công nghệ');expect(c.plan.phases[0].activities[0]).toContain('từ khóa');expect(c.plan.phases[1].activities[0]).toContain('CTA');
  expect(c.plan.phases[2].metrics[0]).not.toBe(generate(features,{...context,goal:goal==='awareness'?'leads':'awareness'}).campaigns[0].plan.phases[2].metrics[0]);
 });
 it.each([
  {f:features,c:{goal:'awareness'}},{f:features,c:{industry:'fashion'}},{f:features,c:{industry:'constructor',goal:'awareness'}},
  {f:{...features,channelUsed:'TikTok'},c:context},{f:{...features,campaignType:'Email'},c:context},{f:{...features,durationDays:0},c:context},
 ])('returns missing evidence instead of inventing campaigns %#',({f,c})=>{const out=generate(f,c as MarketingContext);expect(out.campaigns).toEqual([]);expect(out.issues.length).toBeGreaterThan(0);});
 it('varies counts and only offers creator collaboration for an explicit compatible Influencer brief',()=>{
  expect(generate().campaigns).toHaveLength(2);expect(generate({...features,campaignType:'Display'}).campaigns).toHaveLength(1);
  const creators=generate({...features,campaignType:'Influencer'}).campaigns;expect(creators).toHaveLength(3);expect(creators[2].requirements.join()).toContain('Chưa có đối tác');
  expect(generate({...features,campaignType:'Influencer'},{...context,goal:'leads'}).campaigns.some(c=>c.id==='creator-collaboration')).toBe(false);
  expect(generate({...features,campaignType:'Search',channelUsed:'Google Ads'}).campaigns).toHaveLength(1);
  expect(generate({...features,campaignType:'Search',channelUsed:'Google Ads'},{industry:'technology',goal:'leads'}).campaigns).toHaveLength(2);
 });
 it('never reads ROI or economics, is deterministic, and keeps source input immutable',()=>{
  const f={...features};Object.defineProperty(f,'predicted_roi',{get(){throw Error('must not read ROI');},enumerable:true});
  const out=generate(f);expect(out).toEqual(generate(features));expect(features.durationDays).toBe(30);
  expect(out.campaigns[0].plan.features).not.toHaveProperty('predicted_roi');
 });
 it('stores the chosen concrete plan as an independent campaign, not the generic activities',()=>{
  const proposal=generate().campaigns.find(c=>c.id==='instagram-reels')!,c=buildCampaign(a,context,proposal);
  expect(c.name).toBe(proposal.name);expect(c.notes).toContain(proposal.objective);expect(c.features).toEqual(features);
  expect(c.tasks.map(t=>t.title)).toEqual(proposal.plan.phases.flatMap(p=>p.activities));expect(c.revenue).toBe('');expect(c.expenses).toEqual([]);expect(validateCampaign(c)).toBeNull();
  expect(saveCampaigns([c])).toBeNull();expect(loadCampaigns().campaigns[0]).toEqual(c);c.tasks[0].title='User edit';expect(proposal.plan.phases[0].activities[0]).not.toBe('User edit');
 });
 it('rejects a proposed plan for a different source feature snapshot or invalid task ranges',()=>{
  const proposal=generate().campaigns[0];expect(()=>buildCampaign({...a,features:{...features,durationDays:60}},context,proposal)).toThrow('không khớp');
  expect(()=>buildCampaign(a,context,{...proposal,plan:{...proposal.plan,phases:proposal.plan.phases.map(p=>({...p,endDay:31}))}})).toThrow('vượt thời lượng');
 });
 it('uses bounded reference phases even for short or arbitrary legacy durations',()=>{
  for(const durationDays of [1,2,3,7,21,365])for(const c of generate({...features,durationDays}).campaigns){
   expect(c.plan.phases[3].endDay).toBe(durationDays);expect(c.plan.phases.every(p=>p.startDay>=1&&p.startDay<=p.endDay&&p.endDay<=durationDays)).toBe(true);
  }
 });
});
describe('automatic campaign cards linked to suitability state',()=>{
 it('automatically shows concrete campaigns for the unique choice, opens only requested details and creates the chosen draft',()=>{
  const create=vi.fn();render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})} onCreateCampaign={create}/>);chooseContext();chooseChannel();
  const card=within(screen.getByTestId('suggested-campaign-instagram-reels'));expect(card.getByText(/Reels: giới thiệu bộ sưu tập/)).toBeVisible();expect(screen.queryByTestId('suggested-plan-instagram-reels')).toBeNull();
  fireEvent.click(card.getByRole('button',{name:'Xem kế hoạch chi tiết'}));expect(screen.getByTestId('suggested-plan-instagram-reels')).toHaveTextContent('quay tư liệu');
  expect(screen.getByTestId('suggested-instagram-reels-phase-3')).toHaveAttribute('data-end-day','30');
  fireEvent.click(card.getByRole('button',{name:'Lưu chiến dịch đề xuất'}));expect(create).toHaveBeenCalledWith(a,context,expect.objectContaining({id:'instagram-reels'}));
 });
 it('keeps ties unselected, lists all choices, and replaces details after explicit selection changes',()=>{
  render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);chooseContext();
  fireEvent.change(screen.getByLabelText('Nhóm khách hàng mong muốn'),{target:{value:features.targetAudience}});
  expect(screen.queryByTestId('suggested-campaign-instagram-reels')).toBeNull();const select=screen.getByLabelText('Phương án đồng hạng để xem kế hoạch');expect(select).toHaveValue('');expect(within(select).getAllByRole('option')).toHaveLength(3);
  fireEvent.change(select,{target:{value:'a'}});fireEvent.click(within(screen.getByTestId('suggested-campaign-instagram-reels')).getByRole('button',{name:'Xem kế hoạch chi tiết'}));
  fireEvent.change(select,{target:{value:'b'}});expect(screen.queryByTestId('suggested-plan-instagram-reels')).toBeNull();expect(screen.getByTestId('suggested-campaign-google-search')).toBeVisible();
 });
 it('does not issue a concrete campaign without context, criteria or an eligible match',()=>{
  render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);chooseChannel();expect(screen.getByTestId('campaign-suggestions-empty')).toHaveTextContent('Chọn lĩnh vực');
  chooseContext();fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'YouTube'}});fireEvent.change(screen.getByLabelText('Vai trò: Kênh Marketing'),{target:{value:'required'}});
  expect(screen.getByTestId('suitability-result')).toHaveTextContent('Không có phương án');expect(screen.getByTestId('campaign-suggestions-empty')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Xóa tiêu chí'}));expect(screen.getByTestId('campaign-suggestions-empty')).toBeVisible();
 });
 it('clears details after industry/goal/criteria changes, scenario edits and deletion',()=>{
  const v=render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);chooseContext();chooseChannel();
  const open=()=>fireEvent.click(within(screen.getByTestId('suggested-campaign-instagram-reels')).getByRole('button',{name:'Xem kế hoạch chi tiết'}));open();
  fireEvent.change(screen.getByLabelText('Lĩnh vực kinh doanh'),{target:{value:'education'}});expect(screen.queryByTestId('suggested-plan-instagram-reels')).toBeNull();expect(screen.getByTestId('suggested-campaign-instagram-reels')).toHaveTextContent('chương trình học');open();
  fireEvent.change(screen.getByLabelText('Mục tiêu Marketing'),{target:{value:'leads'}});expect(screen.queryByTestId('suggested-plan-instagram-reels')).toBeNull();open();
  fireEvent.change(screen.getByLabelText('Vai trò: Kênh Marketing'),{target:{value:'required'}});expect(screen.queryByTestId('suggested-plan-instagram-reels')).toBeNull();
  v.rerender(<ScenarioSuitability scenarios={[{...a,features:{...features,durationDays:60}},b]} predictionFor={()=>({status:'idle'})}/>);open();expect(screen.getByTestId('suggested-instagram-reels-phase-3')).toHaveAttribute('data-end-day','60');
  v.rerender(<ScenarioSuitability scenarios={[b]} predictionFor={()=>({status:'idle'})}/>);expect(screen.queryByTestId('suggested-campaign-instagram-reels')).toBeNull();expect(screen.queryByTestId('suggested-plan-instagram-reels')).toBeNull();
 });
 it('ignores illustrative ROI changes and keeps the same proposals with no API result',()=>{
  const v=render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);chooseContext();chooseChannel();
  fireEvent.click(within(screen.getByTestId('suggested-campaign-instagram-reels')).getByRole('button',{name:'Xem kế hoạch chi tiết'}));
  const before=screen.getByTestId('campaign-suggestions').textContent;
  v.rerender(<ScenarioSuitability scenarios={[{...a,predictedRoi:-999999},{...b,predictedRoi:999999}]} predictionFor={()=>({status:'idle'})}/>);
  expect(screen.getByTestId('campaign-suggestions').textContent).toBe(before);expect(screen.getByTestId('suggested-plan-instagram-reels')).toBeVisible();
 });
});
