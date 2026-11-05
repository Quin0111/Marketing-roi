import { test, expect } from '@playwright/test';
for(const width of [1440,390]){
 test(`T01 retained free Vietnamese brief, dropdown predict, mixed comparison and campaign ${width}`,async({page},info)=>{
  test.setTimeout(60000);await page.setViewportSize({width,height:1000});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const requests:unknown[]=[];page.on('request',r=>{if(r.url().endsWith('/predict'))requests.push(r.postDataJSON());});
  await page.addInitScript(()=>{
   if(!localStorage.getItem('dm_scenarios'))localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:[
    {id:'sc-1',name:'Kịch bản hợp lệ đã lưu',createdAt:'legacy',updatedAt:'legacy',features:{campaignType:'Search',channelUsed:'Google Ads',targetAudience:'Men 25-34',customerSegment:'Tech Enthusiasts',durationDays:30}},
    {id:'sc-free',name:'Mô tả tự do đã lưu',createdAt:'legacy',updatedAt:'legacy',features:{campaignType:'Ra mắt sách',channelUsed:'Hội chợ địa phương',targetAudience:'Gia đình tại Đà Nẵng',customerSegment:'Độc giả yêu sách',durationDays:21}}
   ]}));
  });
  const metadataResponse=page.waitForResponse(r=>r.url().endsWith('/model-info')&&r.status()===200);
  await page.goto('/#predict');const metadata=await (await metadataResponse).json();
  const submit=page.getByRole('button',{name:'Dự đoán ROI',exact:true});await expect(submit).toBeEnabled();
  for(const [label,key] of [['1. Loại chiến dịch','Campaign_Type'],['2. Kênh Marketing','Channel_Used'],['3. Đối tượng mục tiêu','Target_Audience'],['4. Phân khúc khách hàng','Customer_Segment']]){
   const choices=await page.getByLabel(new RegExp(label)).locator('option').evaluateAll(options=>options.map(o=>(o as HTMLOptionElement).value).filter(Boolean));
   expect(choices).toEqual(metadata.allowed_categories[key]);
  }
  await page.getByLabel(/1. Loại chiến dịch/).selectOption('Search');
  await page.getByLabel(/2. Kênh Marketing/).selectOption('Google Ads');
  await submit.click();await expect(page.getByTestId('predicted-roi')).toBeVisible();
  expect(requests).toHaveLength(1);expect(requests[0]).toMatchObject({Campaign_Type:'Search',Channel_Used:'Google Ads',Duration_days:30});
  await expect(page.locator('main select')).toHaveCount(4);
  await expect(page.getByTestId('prediction-config-summary')).toContainText('Quảng cáo tìm kiếm');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:info.outputPath(`restored-predict-${width}.png`),fullPage:true});
  await page.goto('/#scenarios');const custom=page.getByTestId(/^scenario-card-sc-/).filter({hasText:'Hội chợ địa phương'});
  await expect(custom).toHaveCount(1);const id=(await custom.getAttribute('data-testid'))!.replace('scenario-card-','');
  await expect(custom.getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeDisabled();
  await page.getByTestId('scenario-card-sc-1').getByRole('button',{name:'Dự đoán ROI kịch bản'}).click();
  await expect(page.getByTestId('comparison-chart-values').locator('li')).toHaveCount(1);
  await expect(page.getByTestId(`scenario-row-${id}`)).toContainText('Chưa dự đoán');
  await page.reload();await expect(custom).toContainText('21 ngày');await expect(custom).toContainText('Độc giả yêu sách');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dm_scenarios')!).scenarios.find((s:{id:string})=>s.id==='sc-free').features)).toEqual({campaignType:'Ra mắt sách',channelUsed:'Hội chợ địa phương',targetAudience:'Gia đình tại Đà Nẵng',customerSegment:'Độc giả yêu sách',durationDays:21});
  await page.getByLabel('Kênh Marketing mong muốn',{exact:true}).selectOption('Hội chợ địa phương');
  await page.getByRole('button',{name:'Xem kế hoạch triển khai'}).click();await expect(page.getByTestId('action-plan-phase-3')).toHaveAttribute('data-end-day','21');
  await expect(page.getByTestId('action-plan-details')).not.toContainText('undefined');
  await page.getByRole('button',{name:'Tạo chiến dịch từ phương án'}).click();
  const campaignId=await page.getByLabel('Chiến dịch đang quản lý',{exact:true}).inputValue();
  await expect(page.getByLabel('Chiến dịch channelUsed',{exact:true})).toHaveValue('Hội chợ địa phương');
  await page.reload();await page.getByLabel('Chiến dịch đang quản lý',{exact:true}).selectOption(campaignId);
  await expect(page.getByLabel('Chiến dịch durationDays',{exact:true})).toHaveValue('21');
  await page.screenshot({path:info.outputPath(`free-campaign-${width}.png`),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);expect(requests).toHaveLength(2);
 });
}
test('T02 blank dropdown, invalid legacy edits, correction and unsupported scenarios never POST',async({page})=>{
 await page.goto('/#predict');const submit=page.getByRole('button',{name:'Dự đoán ROI',exact:true});await expect(submit).toBeEnabled();
 let posts=0;page.on('request',r=>{if(r.url().endsWith('/predict'))posts++;});
 const save=page.getByRole('button',{name:'Lưu kịch bản để lập kế hoạch'});
 await page.getByLabel(/1. Loại chiến dịch/).selectOption('');await expect(submit).toBeDisabled();await expect(save).toBeDisabled();
 await page.getByLabel(/1. Loại chiến dịch/).selectOption('Search');await expect(submit).toBeEnabled();
 await expect(page.locator('main input[type=number]')).toHaveCount(0);
 for(const d of [15,30,45,60]){const button=page.getByRole('button',{name:`${d} ngày`,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');}
 await page.goto('/#scenarios');const card=page.getByTestId('scenario-card-sc-1');await card.getByRole('button',{name:'Dự đoán ROI kịch bản'}).click();await expect(card.getByTestId('scenario-api-roi')).toBeVisible();
 await card.getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();await page.locator('#scenario-channelUsed').fill('Kênh cộng đồng');
 for(const d of ['','0','-1','1.5']){await page.locator('#scenario-durationDays').fill(d);await page.getByRole('button',{name:'Lưu thay đổi'}).click();await expect(page.getByRole('dialog')).toBeVisible();expect(posts).toBe(1);}
 await page.locator('#scenario-durationDays').fill('7');await page.getByRole('button',{name:'Lưu thay đổi'}).click();
 await expect(card.getByTestId('scenario-api-roi')).toHaveCount(0);await expect(card.getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeDisabled();
 await page.reload();await expect(card).toContainText('Kênh cộng đồng');await expect(card).toContainText('7 ngày');expect(posts).toBe(1);
});
