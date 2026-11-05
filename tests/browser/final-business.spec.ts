import { test,expect,Page } from '@playwright/test';
const features={campaignType:'Social Media',channelUsed:'Instagram',targetAudience:'Women 25-34',customerSegment:'Fashionistas',durationDays:30};
const scenarios=[{id:'a',name:'Instagram brief',features,createdAt:'now',updatedAt:'now'}, {id:'b',name:'Google brief',features:{...features,campaignType:'Search',channelUsed:'Google Ads'},createdAt:'now',updatedAt:'now'}];
async function load(page:Page){await page.addInitScript(rows=>{if(!sessionStorage.getItem('final-seeded')){localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:rows}));sessionStorage.setItem('final-seeded','1');}},scenarios);await page.goto('/#scenarios');await expect(page.getByTestId('industry-evaluation')).toBeVisible();}
async function industry(page:Page){await page.getByLabel('Lĩnh vực kinh doanh',{exact:true}).selectOption('fashion');await page.getByLabel('Mục tiêu Marketing',{exact:true}).selectOption('leads');await page.getByLabel('Kênh Marketing mong muốn',{exact:true}).selectOption('Instagram');await page.getByRole('button',{name:'Đánh giá phương án theo lĩnh vực'}).click();}
for(const width of [1440,390])test(`F01 industry -> plan -> campaign, actual financial ROI and persistence ${width}`,async({page},info)=>{
 test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:1000});await load(page);await industry(page);
 await expect(page.getByTestId('industry-results')).toContainText('Phương án phù hợp nhất theo tiêu chí: Instagram brief');
 const predictionButton=page.getByTestId('scenario-card-a').getByRole('button',{name:'Dự đoán ROI kịch bản'});await expect(predictionButton).toBeEnabled();const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/predict'&&r.request().method()==='POST');await predictionButton.click();const api=await pending;expect(api.status()).toBe(200);expect(Object.keys(api.request().postDataJSON()).sort()).toEqual(['Campaign_Type','Channel_Used','Customer_Segment','Duration_days','Target_Audience'].sort());await info.attach('industry-five-feature-contract',{body:JSON.stringify({request:api.request().postDataJSON(),response:await api.json()}),contentType:'application/json'});
 await page.getByRole('button',{name:'Xem kế hoạch triển khai'}).click();await expect(page.getByTestId('action-plan-details')).toContainText('phối đồ');await expect(page.getByTestId('action-plan-details')).toContainText('biểu mẫu');
 await page.screenshot({path:info.outputPath(`plan-context-${width}.png`),fullPage:false});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:info.outputPath(`full-workspace-${width}.png`),fullPage:true});
 await page.getByRole('button',{name:'Tạo chiến dịch từ phương án'}).click();await expect(page.getByTestId('campaign-editor')).toBeVisible();
 await page.getByLabel('Nội dung khoản chi',{exact:true}).fill('Chi phí người dùng nhập');await page.getByLabel('Số tiền khoản chi',{exact:true}).fill('100');await page.getByRole('button',{name:'Thêm khoản chi',exact:true}).click();
 await page.getByLabel('Doanh thu thực tế',{exact:true}).fill('150');await page.getByRole('button',{name:'Lưu số liệu tài chính',exact:true}).click();await expect(page.getByTestId('campaign-actual-roi')).toContainText('50.00%');
 await page.getByLabel('Doanh thu thực tế',{exact:true}).fill('50');await expect(page.getByTestId('campaign-actual-roi')).not.toContainText('50.00%');await page.getByRole('button',{name:'Lưu số liệu tài chính'}).click();await expect(page.getByTestId('campaign-actual-roi')).toContainText('-50.00%');
 await page.getByLabel('Doanh thu thực tế',{exact:true}).fill('100');await page.getByRole('button',{name:'Lưu số liệu tài chính'}).click();await expect(page.getByTestId('campaign-actual-roi')).toContainText('0.00%');
 const id=await page.getByLabel('Chiến dịch đang quản lý',{exact:true}).inputValue();await page.reload();await page.getByLabel('Chiến dịch đang quản lý',{exact:true}).selectOption(id);await expect(page.getByTestId('campaign-actual-roi')).toContainText('0.00%');
 await page.getByLabel('Trạng thái chiến dịch',{exact:true}).selectOption('active');await page.getByRole('button',{name:'Lưu chiến dịch',exact:true}).click();
 await page.getByText(/^Hoạt động và tiến độ \(/).click();page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Xác nhận tất cả hoạt động đã làm'}).click();
 await page.getByLabel('Trạng thái chiến dịch',{exact:true}).selectOption('completed');await page.getByRole('button',{name:'Lưu chiến dịch',exact:true}).click();
 await expect(page.getByLabel('Trạng thái chiến dịch',{exact:true})).toHaveValue('completed');await expect(page.getByTestId('campaign-review')).not.toContainText('chưa hoàn thành');
 await page.getByTestId('campaign-actual-roi').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`financial-roi-${width}.png`),fullPage:false});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dm_campaigns')!));expect(saved.campaigns[0]).not.toHaveProperty('predictedRoi');
 await info.attach('campaign-inputs-test-only',{body:JSON.stringify({notice:'Financial values are test fixtures entered by automation, not observed business results',campaign:saved.campaigns[0]},null,2),contentType:'application/json'});
});
test('F02 industry alone is unknown, context changes/ties and mandatory failures stay honest',async({page})=>{
 await load(page);await page.getByLabel('Lĩnh vực kinh doanh',{exact:true}).selectOption('technology');await page.getByLabel('Mục tiêu Marketing',{exact:true}).selectOption('conversion');await page.getByRole('button',{name:'Đánh giá phương án theo lĩnh vực'}).click();
 await expect(page.getByTestId('industry-results')).toContainText('Chưa đủ thông tin');await expect(page.getByTestId('action-plan-empty')).toBeVisible();
 await page.getByLabel('Nhóm khách hàng mong muốn',{exact:true}).selectOption(features.targetAudience);await expect(page.getByTestId('industry-results')).toContainText('đồng hạng');
 await page.getByLabel('Phương án đồng hạng để xem kế hoạch',{exact:true}).selectOption('b');await page.getByRole('button',{name:'Xem kế hoạch triển khai'}).click();await expect(page.getByTestId('action-plan-details')).toContainText('bảng thông số');
 await page.getByLabel('Lĩnh vực kinh doanh',{exact:true}).selectOption('education');await expect(page.getByTestId('action-plan-details')).toHaveCount(0);await expect(page.getByLabel('Phương án đồng hạng để xem kế hoạch',{exact:true})).toHaveValue('');
 await page.getByLabel('Kênh Marketing mong muốn',{exact:true}).selectOption('YouTube');await page.getByLabel('Vai trò: Kênh Marketing',{exact:true}).selectOption('required');await expect(page.getByTestId('industry-results')).toContainText('Không có phương án');await expect(page.getByTestId('action-plan-empty')).toBeVisible();
});
test('F03 manual campaigns validate money/currency, activities, cancellation and deletion',async({page})=>{
 await load(page);await page.getByRole('button',{name:'Tạo chiến dịch thủ công'}).click();await page.getByLabel('Tên chiến dịch mới',{exact:true}).fill('Manual');await page.getByRole('button',{name:'Tạo chiến dịch',exact:true}).click();
 await page.getByLabel('Doanh thu thực tế').fill('1e309');await page.getByRole('button',{name:'Lưu số liệu tài chính'}).click();await expect(page.getByRole('alert')).toContainText('Doanh thu');
 await page.getByLabel('Doanh thu thực tế').fill('100');await page.getByRole('button',{name:'Lưu số liệu tài chính'}).click();await expect(page.getByTestId('campaign-actual-roi')).toContainText('Chi phí phải dương');
 await page.getByLabel('Nội dung khoản chi').fill('Chi');await page.getByLabel('Số tiền khoản chi').fill('10');await page.getByLabel('Tiền tệ khoản chi',{exact:true}).selectOption('USD');await page.getByRole('button',{name:'Thêm khoản chi'}).click();await expect(page.getByTestId('campaign-actual-roi')).toContainText('tiền tệ không khớp');
 await page.getByText(/^Hoạt động và tiến độ \(/).click();await page.getByText('Sửa hoạt động',{exact:true}).first().click();await page.getByLabel('Ngày kết thúc hoạt động',{exact:true}).first().fill('99');await page.getByRole('button',{name:'Lưu hoạt động',exact:true}).first().click();await expect(page.getByRole('alert')).toContainText('vượt thời lượng');
 page.on('dialog',d=>d.accept());await page.getByLabel('Trạng thái chiến dịch').selectOption('cancelled');await page.getByRole('button',{name:'Lưu chiến dịch',exact:true}).click();await expect(page.getByTestId('campaign-actual-roi')).toContainText('đã hủy');
 await page.getByRole('button',{name:'Xóa chiến dịch',exact:true}).click();await expect(page.getByTestId('campaign-editor')).toHaveCount(0);
});
test('F04 corrupt scenario/campaign JSON is preserved and quota failures remain visible',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('dm_scenarios','broken-scenario');localStorage.setItem('dm_campaigns','broken-campaign');});await page.goto('/#scenarios');
 await expect(page.getByRole('status',{name:'Thông báo lưu chiến dịch'})).toContainText('Giữ nguyên');
 expect(await page.evaluate(()=>localStorage.getItem('dm_scenarios'))).toBe('broken-scenario');expect(await page.evaluate(()=>localStorage.getItem('dm_campaigns'))).toBe('broken-campaign');
 await page.getByRole('button',{name:'Tạo chiến dịch thủ công'}).click();await page.getByLabel('Tên chiến dịch mới').fill('Memory');await page.getByRole('button',{name:'Tạo chiến dịch',exact:true}).click();await expect(page.getByTestId('campaign-editor')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('dm_campaigns'))).toBe('broken-campaign');
});
test('F05 campaign snapshot survives source edits; draft plan regeneration is explicit',async({page})=>{
 await load(page);await industry(page);await page.getByRole('button',{name:'Tạo chiến dịch từ phương án'}).click();
 page.on('dialog',d=>d.accept());await page.getByLabel('Chiến dịch durationDays',{exact:true}).fill('60');await page.getByRole('button',{name:'Lưu chiến dịch',exact:true}).click();await expect(page.getByTestId('campaign-editor')).toContainText('phiên bản 2 · 60 ngày');
 await page.getByTestId('scenario-card-a').getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();await page.locator('#scenario-durationDays').fill('15');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect(page.getByLabel('Chiến dịch durationDays',{exact:true})).toHaveValue('60');
});
test('F06 campaign quota failure retains memory state and warns before refresh',async({page})=>{
 await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='dm_campaigns')throw new DOMException('quota','QuotaExceededError');return original.call(this,key,value);};});
 await page.goto('/#scenarios');await page.getByRole('button',{name:'Tạo chiến dịch thủ công'}).click();await page.getByLabel('Tên chiến dịch mới').fill('Quota memory');await page.getByRole('button',{name:'Tạo chiến dịch',exact:true}).click();await expect(page.getByTestId('campaign-editor')).toBeVisible();await expect(page.getByRole('status',{name:'Thông báo lưu chiến dịch'})).toContainText('bộ nhớ');expect(await page.evaluate(()=>localStorage.getItem('dm_campaigns'))).toBeNull();
});
test('F07 denied localStorage property does not blank the production UI',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError');}});});
 await page.goto('http://127.0.0.1:4173/#scenarios');await expect(page.locator('header h1')).toHaveText('So sánh & Đề xuất');await expect(page.getByRole('status',{name:'Thông báo lưu chiến dịch'})).toContainText('bộ nhớ');await page.getByRole('button',{name:'Tạo chiến dịch thủ công'}).click();await page.getByLabel('Tên chiến dịch mới').fill('Private memory');await page.getByRole('button',{name:'Tạo chiến dịch',exact:true}).click();await expect(page.getByTestId('campaign-editor')).toBeVisible();expect(errors).toEqual([]);
});
