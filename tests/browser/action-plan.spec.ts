import { test, expect, Page } from '@playwright/test';
const features={campaignType:'Social Media',channelUsed:'Instagram',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30};
const rows=[{id:'a',name:'Instagram A',features,createdAt:'now',updatedAt:'now',predictedRoi:99999},
  {id:'b',name:'Google B',features:{...features,campaignType:'Search',channelUsed:'Google Ads'},createdAt:'now',updatedAt:'now',predictedRoi:-99999}];
async function load(page:Page,scenarios=rows){await page.addInitScript(value=>localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:value})),scenarios);await page.goto('/#scenarios');await expect(page.getByTestId('scenario-suitability')).toBeVisible();}
async function choose(page:Page,channel:string){await page.getByLabel('Kênh Marketing mong muốn',{exact:true}).selectOption(channel);}
async function openPlan(page:Page){await page.getByRole('button',{name:'Xem kế hoạch triển khai',exact:true}).click();await expect(page.getByTestId('action-plan-details')).toBeFocused();}
for(const [channel,type,duration,keyword] of [
  ['Instagram','Social Media',15,'Reels'],['Google Ads','Search',30,'từ khóa phủ định'],['Facebook','Social Media',45,'Page'],
  ['Email','Email',60,'hủy đăng ký'],['Website','Display',30,'biểu mẫu'],['YouTube','Influencer',15,'thumbnail'],
] as const){
  test(`P01 actual API + ${channel} action plan ${duration} days`,async({page},info)=>{
    // The alphabetically first case also pays Vite's cold module compilation.
    // Bound that setup cost without changing API timeouts or assertions.
    test.setTimeout(45000);
    const scenario={...rows[0],name:`Plan ${channel}`,features:{...features,channelUsed:channel,campaignType:type,durationDays:duration}};
    await load(page,[scenario]);await choose(page,channel);
    await expect(page.getByTestId('action-plan-scenario')).toHaveText(`Plan ${channel}`);
    const button=page.getByTestId('scenario-card-a').getByRole('button',{name:'Dự đoán ROI kịch bản'});await expect(button).toBeEnabled();
    const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/predict'&&r.request().method()==='POST');
    await button.click();const response=await pending,body=await response.json();expect(response.status()).toBe(200);expect(body.quality_status).toBe('BASELINE_ONLY');
    const requests:string[]=[];page.on('request',r=>{if(r.resourceType()==='fetch'||r.resourceType()==='xhr')requests.push(r.url());});
    await openPlan(page);await expect(page.getByTestId('action-plan-details')).toContainText(keyword);
    const phases=page.locator('[data-testid^="action-plan-phase-"]');await expect(phases).toHaveCount(4);
    const intervals=await phases.evaluateAll(nodes=>nodes.map(n=>[Number(n.getAttribute('data-start-day')),Number(n.getAttribute('data-end-day'))]));
    let previous=0;for(const [start,end] of intervals){expect(start).toBe(previous+1);expect(end).toBeGreaterThanOrEqual(start);expect(end).toBeLessThanOrEqual(duration);previous=end;}expect(previous).toBe(duration);
    expect(requests).toEqual([]);await expect(page.getByTestId('marketing-action-plan')).not.toContainText('99999');
    await info.attach('real-api-and-template',{body:JSON.stringify({request:response.request().postDataJSON(),response:body,channel,type,duration,intervals,template:'action-plan-v1'},null,2),contentType:'application/json'});
  });
}
test('P02 all tied choices remain available, explicit choice controls plan and changes reset details',async({page})=>{
  await load(page);await page.getByLabel('Nhóm khách hàng mong muốn',{exact:true}).selectOption(features.targetAudience);
  const picker=page.getByLabel('Phương án đồng hạng để xem kế hoạch',{exact:true});await expect(picker).toHaveValue('');
  await expect(picker.locator('option')).toHaveCount(3);await expect(page.getByTestId('action-plan-details')).toHaveCount(0);
  await picker.selectOption('a');await openPlan(page);await expect(page.getByTestId('action-plan-details')).toContainText('Reels');
  await picker.selectOption('b');await expect(page.getByTestId('action-plan-details')).toHaveCount(0);await openPlan(page);
  await expect(page.getByTestId('action-plan-scenario')).toHaveText('Google B');await expect(page.getByTestId('action-plan-details')).toContainText('từ khóa phủ định');
  await expect(page.getByTestId('action-plan-details')).not.toContainText('Reels');
});
test('P03 editing duration/type and deleting invalidates the old plan',async({page})=>{
  await load(page);await choose(page,'Instagram');await openPlan(page);
  const card=page.getByTestId('scenario-card-a');await card.getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();
  await page.locator('#scenario-durationDays').fill('60');await page.getByRole('dialog').locator('#scenario-campaignType').fill('Email');
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByTestId('action-plan-details')).toHaveCount(0);
  await expect(page.getByTestId('action-plan-review')).toBeVisible();await openPlan(page);
  await expect(page.getByTestId('action-plan-phase-3')).toHaveAttribute('data-end-day','60');await expect(page.getByTestId('action-plan-phase-1')).toContainText('Chưa khởi chạy');
  page.on('dialog',d=>d.accept());await card.getByRole('button',{name:'Xóa kịch bản'}).click();
  await expect(page.getByTestId('action-plan-details')).toHaveCount(0);await expect(page.getByTestId('action-plan-empty')).toBeVisible();
});
test('P04 no criteria or unmet mandatory conditions never yield a plan',async({page})=>{
  await load(page);await expect(page.getByTestId('action-plan-empty')).toBeVisible();await expect(page.getByRole('button',{name:'Xem kế hoạch triển khai'})).toHaveCount(0);
  await choose(page,'YouTube');await page.getByLabel('Vai trò: Kênh Marketing',{exact:true}).selectOption('required');
  await expect(page.getByTestId('suitability-result')).toContainText('Không có phương án đáp ứng');
  await expect(page.getByTestId('action-plan-empty')).toBeVisible();await expect(page.getByTestId('action-plan-details')).toHaveCount(0);
});
for(const width of [1440,390]){
  test(`P05 concrete plan desktop/mobile and focus navigation ${width}`,async({page},info)=>{
    await page.setViewportSize({width,height:1000});await load(page);await choose(page,'Instagram');
    await expect(page.getByTestId('action-plan-details')).toHaveCount(0);await openPlan(page);
    await expect(page.getByTestId('action-plan-phase-0')).toContainText('ảnh, video dọc');
    await expect(page.getByTestId('action-plan-phase-2')).toContainText('tiếp cận');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`action-plan-detail-${width}.png`),fullPage:false});
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:info.outputPath(`action-plan-full-${width}.png`),fullPage:true});
    await page.getByText('Nguồn kế hoạch và điều kiện thực hiện',{exact:true}).click();
    await expect(page.getByTestId('action-plan-details')).toContainText('Linear Regression chỉ dự đoán ROI');
    await expect(page.getByTestId('action-plan-details')).toContainText('BASELINE_ONLY');
    await expect(page.getByTestId('action-plan-details')).not.toContainText('doanh thu:');
  });
}
