import { expect, Page, test } from '@playwright/test';
const features={campaignType:'Social Media',channelUsed:'Instagram',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30};
const rows=[{id:'a',name:'Thời trang Instagram',features,createdAt:'test',updatedAt:'test',predictedRoi:-9999},
 {id:'b',name:'Công nghệ Google',features:{...features,campaignType:'Search',channelUsed:'Google Ads',customerSegment:'Tech Enthusiasts'},createdAt:'test',updatedAt:'test',predictedRoi:9999}];
async function load(page:Page,unknown=false){
 await page.addInitScript(({rows,unknown})=>{if(!sessionStorage.getItem('suggestions-seeded')){
  localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:unknown?[...rows,{...rows[0],id:'c',name:'Kênh chưa xác minh',features:{...rows[0].features,channelUsed:'TikTok'}}]:rows}));sessionStorage.setItem('suggestions-seeded','1');
 }},{rows,unknown});await page.goto('/#scenarios');await expect(page.getByTestId('industry-evaluation')).toBeVisible();
}
async function context(page:Page,industry='fashion',goal='awareness'){
 await page.getByLabel('Lĩnh vực kinh doanh',{exact:true}).selectOption(industry);await page.getByLabel('Mục tiêu Marketing',{exact:true}).selectOption(goal);
}
async function channel(page:Page,value='Instagram'){await page.getByLabel('Kênh Marketing mong muốn',{exact:true}).selectOption(value);}
const card=(page:Page,id='instagram-reels')=>page.getByTestId(`suggested-campaign-${id}`);
for(const width of [1440,390])test(`R01 automatic contextual campaigns, real ROI independence, concrete draft and reload ${width}`,async({page},info)=>{
 test.setTimeout(60000);await page.setViewportSize({width,height:1000});const errors:string[]=[],consoleErrors:string[]=[],posts:unknown[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('request',r=>{if(r.method()==='POST')posts.push({url:r.url(),body:r.postDataJSON()});});
 await load(page);await context(page);await channel(page);await page.getByRole('button',{name:'Đánh giá phương án theo lĩnh vực'}).click();
 await expect(page.getByRole('heading',{name:'CHIẾN DỊCH MARKETING ĐỀ XUẤT',exact:true})).toBeVisible();await expect(card(page)).toContainText('bộ sưu tập thời trang');
 const before=await page.getByTestId('campaign-suggestions').innerText();expect(await page.evaluate(()=>localStorage.getItem('dm_campaigns'))).toBeNull();
 await expect(page.getByTestId('scenario-card-a').getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeEnabled();
 const prediction=page.waitForResponse(r=>r.url().endsWith('/predict')&&r.request().method()==='POST');await page.getByTestId('scenario-card-a').getByRole('button',{name:'Dự đoán ROI kịch bản'}).click();
 const response=await prediction;expect(response.status()).toBe(200);const body=await response.json();expect(body.quality_status).toBe('BASELINE_ONLY');
 expect(Object.keys(response.request().postDataJSON()).sort()).toEqual(['Campaign_Type','Channel_Used','Customer_Segment','Duration_days','Target_Audience']);
 await expect(page.getByTestId('scenario-card-a').getByTestId('scenario-api-roi')).toBeVisible();expect(await page.getByTestId('campaign-suggestions').innerText()).toBe(before);
 await card(page).getByRole('button',{name:'Xem kế hoạch chi tiết',exact:true}).click();await expect(page.getByTestId('suggested-plan-instagram-reels')).toBeFocused();
 await expect(page.getByTestId('suggested-instagram-reels-phase-0')).toContainText('quay tư liệu');await expect(page.getByTestId('suggested-instagram-reels-phase-3')).toHaveAttribute('data-end-day','30');
 await page.getByTestId('marketing-action-plan').screenshot({path:info.outputPath(`fashion-campaigns-${width}.png`)});
 await context(page,'technology','leads');await channel(page,'Google Ads');await expect(card(page,'google-search')).toContainText('sản phẩm công nghệ');
 await expect(page.getByTestId('suggested-plan-instagram-reels')).toHaveCount(0);await expect(card(page)).toHaveCount(0);
 await card(page,'google-keyword-test').getByRole('button',{name:'Xem kế hoạch chi tiết',exact:true}).click();await expect(page.getByTestId('suggested-plan-google-keyword-test')).toContainText('từ khóa');
 await expect(page.getByTestId('scenario-card-b').getByTestId('scenario-api-roi')).toHaveCount(0);
 const proposalName=await card(page,'google-keyword-test').locator('h4').first().innerText();
 await page.getByTestId('marketing-action-plan').screenshot({path:info.outputPath(`technology-campaigns-${width}.png`)});
 expect(await page.getByTestId('campaign-suggestions').innerText()).not.toMatch(/\d+\s*(%|VND|USD|EUR)/);
 await card(page,'google-keyword-test').getByRole('button',{name:'Lưu chiến dịch đề xuất'}).click();await expect(page.getByLabel('Tên chiến dịch đang quản lý')).toHaveValue(proposalName);
 const id=await page.getByLabel('Chiến dịch đang quản lý',{exact:true}).inputValue();
 const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('dm_campaigns')!).campaigns.find((c:{id:string})=>c.id===id),id);
 expect(saved.sourceScenarioId).toBe('b');expect(saved.notes).toContain('campaign-suggestions-v1');expect(saved.tasks[0].title).toContain('Chuẩn bị giả thuyết');expect(saved.revenue).toBe('');expect(saved.expenses).toEqual([]);
 await page.reload();await page.getByLabel('Chiến dịch đang quản lý',{exact:true}).selectOption(id);await expect(page.getByLabel('Tên chiến dịch đang quản lý')).toHaveValue(proposalName);
 await page.getByText(/^Hoạt động và tiến độ/).click();await expect(page.getByTestId('campaign-editor')).toContainText('Chuẩn bị giả thuyết');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);expect(consoleErrors).toEqual([]);expect(posts).toHaveLength(1);
 await info.attach('actual-api-independent-proposals',{body:JSON.stringify({request:response.request().postDataJSON(),response:body,proposalName,savedDraft:saved},null,2),contentType:'application/json'});
});
test('R02 all tied options remain explicit; ROI extremes never select a campaign or preserve the old details',async({page})=>{
 await load(page);await context(page);await page.getByLabel('Nhóm khách hàng mong muốn',{exact:true}).selectOption('Women 25-34');
 const picker=page.getByLabel('Phương án đồng hạng để xem kế hoạch');await expect(picker).toHaveValue('');await expect(picker.locator('option')).toHaveCount(3);
 await expect(card(page)).toHaveCount(0);await picker.selectOption('a');await card(page).getByRole('button',{name:'Xem kế hoạch chi tiết'}).click();
 await picker.selectOption('b');await expect(page.getByTestId('suggested-plan-instagram-reels')).toHaveCount(0);await expect(card(page,'google-search')).toBeVisible();await expect(card(page)).toHaveCount(0);
});
test('R03 insufficient context, no criteria, mandatory failures and unknown channel block concrete proposals',async({page})=>{
 await load(page,true);await channel(page);await expect(page.getByTestId('campaign-suggestions-empty')).toContainText('Chọn lĩnh vực');
 await context(page);await expect(card(page)).toBeVisible();await page.getByRole('button',{name:'Xóa tiêu chí'}).click();await expect(card(page)).toHaveCount(0);
 await channel(page,'YouTube');await page.getByLabel('Vai trò: Kênh Marketing',{exact:true}).selectOption('required');await expect(page.getByTestId('suitability-result')).toContainText('Không có phương án');await expect(page.getByTestId('campaign-suggestions-empty')).toBeVisible();
 await channel(page,'TikTok');await expect(page.getByTestId('campaign-suggestions-empty')).toContainText('xác nhận loại chiến dịch');await expect(page.getByTestId('scenario-card-c')).toContainText('TikTok');
});
test('R04 scenario edits, criteria changes and deletion invalidate campaigns and their detailed plans',async({page})=>{
 await load(page);await context(page);await channel(page);await card(page).getByRole('button',{name:'Xem kế hoạch chi tiết'}).click();
 await page.getByTestId('scenario-card-a').getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();await page.locator('#scenario-channelUsed').fill('Facebook');await page.locator('#scenario-durationDays').fill('60');await page.getByRole('button',{name:'Lưu thay đổi'}).click();
 await expect(page.getByTestId('suggested-plan-instagram-reels')).toHaveCount(0);await expect(card(page)).toHaveCount(0);await channel(page,'Facebook');
 await card(page,'facebook-page').getByRole('button',{name:'Xem kế hoạch chi tiết'}).click();await expect(page.getByTestId('suggested-facebook-page-phase-3')).toHaveAttribute('data-end-day','60');
 await page.getByLabel('Vai trò: Kênh Marketing',{exact:true}).selectOption('required');await expect(page.getByTestId('suggested-plan-facebook-page')).toHaveCount(0);
 page.on('dialog',d=>d.accept());await page.getByTestId('scenario-card-a').getByRole('button',{name:'Xóa kịch bản'}).click();await expect(card(page,'facebook-page')).toHaveCount(0);await expect(page.getByTestId('campaign-suggestions-empty')).toBeVisible();
});
test('R05 all four modeled durations have bounded specific campaign schedules',async({page})=>{
 await load(page);await context(page);await channel(page);
 for(const days of [15,30,45,60]){
  await page.getByTestId('scenario-card-a').getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();await page.locator('#scenario-durationDays').fill(String(days));await page.getByRole('button',{name:'Lưu thay đổi'}).click();
  await card(page).getByRole('button',{name:'Xem kế hoạch chi tiết'}).click();let previous=0;
  for(let i=0;i<4;i++){const phase=page.getByTestId(`suggested-instagram-reels-phase-${i}`);const start=Number(await phase.getAttribute('data-start-day')),end=Number(await phase.getAttribute('data-end-day'));expect(start).toBe(previous+1);expect(end).toBeGreaterThanOrEqual(start);expect(end).toBeLessThanOrEqual(days);previous=end;}expect(previous).toBe(days);
 }
});
