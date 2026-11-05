import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMarketingActionPlan } from '../../src/services/marketingActionPlan';
import { ScenarioSuitability } from '../../src/components/scenarios/ScenarioSuitability';
import { CampaignFeatures, CampaignType, ChannelUsed, CustomerSegment, DurationDays, MarketingScenario } from '../../src/types';
import http from '../../backend/tests/http_results.json';
const base:CampaignFeatures={campaignType:'Social Media',channelUsed:'Instagram',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30};
const a:MarketingScenario={id:'a',name:'Instagram A',features:base,createdAt:'now',updatedAt:'now',predictedRoi:9999};
const b:MarketingScenario={...a,id:'b',name:'Google B',features:{...base,campaignType:'Search',channelUsed:'Google Ads'}};
const channelTypes:Record<ChannelUsed,CampaignType>={Instagram:'Social Media',Facebook:'Social Media','Google Ads':'Search',Email:'Email',Website:'Display',YouTube:'Influencer'};
const durations:DurationDays[]=[15,30,45,60];
beforeEach(()=>{
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>setTimeout(()=>callback(0),0));
  Element.prototype.scrollIntoView=vi.fn();
});
describe('action-plan-v1 template boundaries and specificity',()=>{
  it.each(Object.keys(channelTypes).flatMap(channel=>durations.map(duration=>[channel,duration] as const)))('covers %s %s days without gaps, overlap or invented performance', (channel,duration)=>{
    const features={...base,channelUsed:channel as ChannelUsed,campaignType:channelTypes[channel as ChannelUsed],durationDays:duration};
    const plan=createMarketingActionPlan(features);expect(plan.phases).toHaveLength(4);expect(plan.features).toEqual(features);
    let previous=0;
    for(const phase of plan.phases){expect(phase.startDay).toBe(previous+1);expect(phase.endDay).toBeGreaterThanOrEqual(phase.startDay);expect(phase.endDay).toBeLessThanOrEqual(duration);expect(phase.activities.length).toBeGreaterThan(1);expect(phase.expectedOutput).toBeTruthy();expect(phase.metrics.length).toBeGreaterThan(0);previous=phase.endDay;}
    expect(previous).toBe(duration);expect(plan.configurationReviewRequired).toBe(false);
    for(const field of ['budget','revenue','profit','predicted_roi']) expect(plan).not.toHaveProperty(field);
    expect(JSON.stringify(plan)).not.toMatch(/\d+\s*(?:%|VNĐ|VND|USD|triệu|đồng)/i);
  });
  it.each([['Instagram','Reels'],['Facebook','Page'],['Google Ads','từ khóa phủ định'],['Email','hủy đăng ký'],['Website','biểu mẫu'],['YouTube','thumbnail']] as const)('uses distinct %s tasks and relevant observables', (channel,keyword)=>{
    const plan=createMarketingActionPlan({...base,channelUsed:channel,campaignType:channelTypes[channel]});
    expect(plan.phases.flatMap(p=>p.activities).join(' ')).toContain(keyword);
    expect(plan.phases[2].metrics.join(' ')).not.toMatch(/doanh thu:|lợi nhuận:|ngân sách:/i);
  });
  it('distinguishes Google Search from Display rather than prescribing keywords for banners',()=>{
    const search=createMarketingActionPlan({...base,channelUsed:'Google Ads',campaignType:'Search'});
    const display=createMarketingActionPlan({...base,channelUsed:'Google Ads',campaignType:'Display'});
    expect(search.phases[0].activities.join(' ')).toContain('từ khóa phủ định');
    expect(display.phases.flatMap(p=>p.activities).join(' ')).not.toContain('từ khóa phủ định');
    expect(display.phases[0].activities.join(' ')).toContain('quảng cáo hiển thị');
  });
  it.each(['Search','Display','Email','Social Media','Influencer'] as CampaignType[])('adapts campaign type %s and guards unresolved channel combinations',campaignType=>{
    const plan=createMarketingActionPlan({...base,campaignType});
    expect(plan.phases[0].activities).toHaveLength(5);
    expect(plan.configurationReviewRequired).toBe(['Search','Email'].includes(campaignType));
    if(plan.configurationReviewRequired){expect(plan.phases[1].activities[0]).toContain('Chưa khởi chạy');expect(plan.notes.join(' ')).toContain('không đồng nghĩa');}
  });
  it.each(['Fashionistas','Foodies','Health & Wellness','Outdoor Adventurers','Tech Enthusiasts'] as CustomerSegment[])('uses segment brief %s without inferring customer behaviour',customerSegment=>{
    const plan=createMarketingActionPlan({...base,customerSegment,targetAudience:'Men 18-24'});
    expect(plan.features.customerSegment).toBe(customerSegment);expect(plan.phases[0].activities[3]).toBeTruthy();
    expect(plan.phases[0].activities[4]).toContain('không suy đoán hành vi');
    expect(plan.notes.join(' ')).toContain('khả năng nhắm chọn');
  });
  it('is deterministic, does not mutate input or read ROI/extra economics fields',()=>{
    const features={...base};Object.defineProperty(features,'predicted_roi',{enumerable:true,get(){throw Error('must not read model output');}});
    const first=createMarketingActionPlan(features);expect(first).toEqual(createMarketingActionPlan(features));
    expect(first.features).not.toHaveProperty('predicted_roi');expect(base.durationDays).toBe(30);
  });
  it('covers the full Backend domain matrix with four bounded phases and explicit configuration review',()=>{
    const info=http.responses.find(r=>r.endpoint==='/model-info')!.response as {allowed_categories:{Channel_Used:ChannelUsed[];Campaign_Type:CampaignType[]};allowed_duration_days:DurationDays[]};
    for(const channelUsed of info.allowed_categories.Channel_Used) for(const campaignType of info.allowed_categories.Campaign_Type) for(const durationDays of info.allowed_duration_days){
      const plan=createMarketingActionPlan({...base,channelUsed,campaignType,durationDays});
      expect(plan.phases[0].startDay).toBe(1);expect(plan.phases[3].endDay).toBe(durationDays);
      expect(plan.phases.every(p=>p.startDay<=p.endDay&&p.endDay<=durationDays)).toBe(true);
      if(plan.configurationReviewRequired)expect(plan.phases[1].activities[0]).toContain('Chưa khởi chạy');
    }
  });
  it.each([{durationDays:0},{durationDays:'30'},{channelUsed:''},{campaignType:''},{customerSegment:''},{targetAudience:''}])('rejects invalid descriptions %j (new free-input contract)',invalid=>{
    expect(()=>createMarketingActionPlan({...base,...invalid} as CampaignFeatures)).toThrow();
  });
});
describe('plan eligibility, progressive details and stale selection',()=>{
  it('automatically prepares the unique choice and opens concrete stages on request',async()=>{
    render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    expect(screen.getByTestId('action-plan-empty')).toBeVisible();expect(screen.queryByRole('button',{name:'Xem kế hoạch triển khai'})).toBeNull();
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Instagram'}});
    expect(screen.getByTestId('action-plan-scenario')).toHaveTextContent('Instagram A');expect(screen.queryByTestId('action-plan-details')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));
    await waitFor(()=>expect(screen.getByTestId('action-plan-details')).toHaveFocus());
    expect(screen.getByTestId('action-plan-phase-0')).toHaveTextContent('Reels');
    expect(screen.getByTestId('action-plan-phase-3')).toHaveAttribute('data-end-day','30');
    fireEvent.click(screen.getByText('Lý do lựa chọn theo tiêu chí'));expect(screen.getByTestId('marketing-action-plan')).toHaveTextContent('khớp ưu tiên');
    expect(screen.getByTestId('marketing-action-plan')).not.toHaveTextContent('9999');
    fireEvent.click(screen.getByRole('button',{name:'Thu gọn kế hoạch'}));expect(screen.queryByTestId('action-plan-details')).toBeNull();
  });
  it('does not arbitrarily choose a tie; switching explicit choice replaces and collapses the plan',()=>{
    render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Nhóm khách hàng mong muốn'),{target:{value:base.targetAudience}});
    const selector=screen.getByLabelText('Phương án đồng hạng để xem kế hoạch');expect(selector).toHaveValue('');
    expect(within(selector).getAllByRole('option')).toHaveLength(3);expect(screen.queryByTestId('action-plan-scenario')).toBeNull();
    fireEvent.change(selector,{target:{value:'a'}});fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));
    expect(screen.getByTestId('action-plan-details')).toHaveTextContent('Reels');
    fireEvent.change(selector,{target:{value:'b'}});expect(screen.queryByTestId('action-plan-details')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));expect(screen.getByTestId('action-plan-details')).toHaveTextContent('từ khóa phủ định');
    expect(screen.getByTestId('action-plan-details')).not.toHaveTextContent('Reels');
  });
  it('clears plans after criteria make a previous candidate ineligible',()=>{
    render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Instagram'}});fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'YouTube'}});
    fireEvent.change(screen.getByLabelText('Vai trò: Kênh Marketing'),{target:{value:'required'}});
    expect(screen.getByTestId('action-plan-empty')).toBeVisible();expect(screen.queryByTestId('action-plan-details')).toBeNull();
    expect(screen.queryByTestId('action-plan-scenario')).toBeNull();
  });
  it('uses updated five-feature configuration after edits and does not resurrect deleted plans',()=>{
    const view=render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Instagram'}});fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));
    view.rerender(<ScenarioSuitability scenarios={[{...a,features:{...base,durationDays:60}},b]} predictionFor={()=>({status:'idle'})}/>);
    expect(screen.queryByTestId('action-plan-details')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));
    expect(screen.getByTestId('action-plan-phase-3')).toHaveAttribute('data-end-day','60');
    view.rerender(<ScenarioSuitability scenarios={[b]} predictionFor={()=>({status:'idle'})}/>);
    expect(screen.queryByTestId('action-plan-details')).toBeNull();expect(screen.getByTestId('action-plan-empty')).toBeVisible();
  });
  it('clears a previously opened unique plan when criteria produce a tie',()=>{
    render(<ScenarioSuitability scenarios={[a,b]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Instagram'}});fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:''}});
    fireEvent.change(screen.getByLabelText('Nhóm khách hàng mong muốn'),{target:{value:base.targetAudience}});
    expect(screen.getByLabelText('Phương án đồng hạng để xem kế hoạch')).toHaveValue('');
    expect(screen.queryByTestId('action-plan-details')).toBeNull();expect(screen.queryByTestId('action-plan-scenario')).toBeNull();
  });
  it('marks a modeled but unresolved type/channel pair as a conditional draft',()=>{
    render(<ScenarioSuitability scenarios={[{...a,features:{...base,campaignType:'Email'}}]} predictionFor={()=>({status:'idle'})}/>);
    fireEvent.change(screen.getByLabelText('Kênh Marketing mong muốn'),{target:{value:'Instagram'}});
    expect(screen.getByTestId('action-plan-review')).toHaveTextContent('cần xác nhận');
    fireEvent.click(screen.getByRole('button',{name:'Xem kế hoạch triển khai'}));
    expect(screen.getByTestId('action-plan-phase-1')).toHaveTextContent('Chưa khởi chạy');
  });
});
