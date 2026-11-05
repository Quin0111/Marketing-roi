import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { TEST_API_BASE } from '../support/api-base';

for(const [kind,value] of [['empty','[]'],['bad-json','{broken'],['bad-shape','[{}]'],['old-version','{"version":999,"scenarios":[]}']]){
  test(`S01 storage ${kind} recovers without blank screen`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(raw=>localStorage.setItem('dm_scenarios',raw),value);
    await page.goto('/#scenarios');
    await expect(page.locator('header h1')).toBeVisible();
    await expect(page.getByText('Bạn chưa tạo kịch bản nào.')).toBeVisible();
    await page.getByRole('button',{name:'Thêm kịch bản',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
for(const operation of ['getItem','setItem'] as const){
  test(`S02 denied storage ${operation} keeps CRUD usable`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(method=>{Storage.prototype[method]=()=>{throw new DOMException('denied for test','SecurityError');};},operation);
    await page.goto('/#scenarios');await expect(page.locator('header h1')).toBeVisible();
    await page.getByRole('button',{name:'Thêm kịch bản',exact:true}).click();
    await page.getByLabel(/Tên kịch bản/).fill('In-memory scenario');
    await page.getByRole('button',{name:'Lưu kịch bản',exact:true}).click();
    await expect(page.getByRole('heading',{name:'In-memory scenario',exact:true})).toBeVisible();
    await expect(page.getByRole('status',{name:'Thông báo lưu trữ kịch bản'})).toBeVisible();expect(errors).toEqual([]);
  });
}

test('S03 CRUD, empty persistence and no ROI ranking or predict requests',async({page})=>{
  const predictions:string[]=[];page.on('request',r=>{if(r.url().endsWith('/predict'))predictions.push(r.url());});
  page.on('dialog',dialog=>dialog.accept());
  await page.goto('/#scenarios');
  await page.getByRole('button',{name:'Thêm kịch bản',exact:true}).click();
  await page.getByLabel(/Tên kịch bản/).fill('QA Created');
  await page.getByRole('button',{name:'Lưu kịch bản',exact:true}).click();
  await expect(page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true})).toHaveCount(3);
  await page.getByRole('button',{name:'Nhân bản kịch bản',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true})).toHaveCount(4);
  await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).first().click();
  await page.getByLabel(/Tên kịch bản/).fill('QA Edited');
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
  await expect(page.getByRole('heading',{name:'QA Edited',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'QA Edited',exact:true})).toBeVisible();
  const before=await page.locator('table tbody').innerText();
  await page.getByRole('columnheader',{name:'ROI mô phỏng',exact:true}).click();
  expect(await page.locator('table tbody').innerText()).toBe(before);
  expect(predictions).toEqual([]);
  while(await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).count())await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).first().click();
  await expect(page.getByText('Bạn chưa tạo kịch bản nào.')).toBeVisible();
  await page.reload();await expect(page.getByText('Bạn chưa tạo kịch bản nào.')).toBeVisible();
});

for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:1080}]){
  test(`S04 modal ${size.width} accessible actions and keyboard`,async({page},info)=>{
    await page.setViewportSize(size);await page.goto('/#scenarios');
    const opener=page.getByRole('button',{name:'Thêm kịch bản',exact:true});await opener.click();
    const dialog=page.getByRole('dialog');await expect(dialog).toHaveAttribute('aria-modal','true');
    const save=dialog.getByRole('button',{name:'Lưu kịch bản',exact:true});
    const close=dialog.getByRole('button',{name:'Đóng cửa sổ',exact:true});
    for(const control of [save,close]){
      const box=(await control.boundingBox())!;expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(size.height);
    }
    await close.focus();await page.keyboard.press('Shift+Tab');await expect(save).toBeFocused();
    await page.keyboard.press('Tab');await expect(close).toBeFocused();
    await page.getByLabel(/Ghi chú kịch bản/).fill('Scrollable body remains reachable');
    await page.screenshot({path:info.outputPath(`modal-${size.width}.png`),fullPage:false});
    await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
    await opener.click();await close.click();await expect(dialog).toHaveCount(0);
  });
}

for(const size of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:1440,height:1080}]){
  test(`S05 three pages plus legacy Insights redirect ${size.width} responsive and scientifically labeled`,async({page},info)=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(size);
    for(const hash of ['dashboard','predict','scenarios','insights']){
      await page.goto(`/#${hash}`);await expect(page.locator('header h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(hash==='dashboard')await expect(page.getByText(/Thống kê đã đối soát trên Development/)).toBeVisible();
      if(hash==='insights'){
        await expect(page).toHaveURL(/#predict\/model-info$/);
        await expect(page.getByTestId('model-information')).toHaveAttribute('open','');
        await page.getByText('Bảng đánh giá và nghiên cứu chi tiết',{exact:true}).click();
        await expect(page.getByTestId('historical-provenance')).toContainText('BASELINE_ONLY');
        await expect(page.getByTestId('research-evidence')).toContainText('visit, không phải ROI');
        await expect(page.getByTestId('research-evidence')).toContainText('RESEARCH_LIMITED');
      }
      await page.screenshot({path:info.outputPath(`${hash}-${size.width}.png`),fullPage:true});
    }
    expect(errors).toEqual([]);
  });
}

test('S06 production preview calls real model and preserves both references',async({page,request})=>{
  test.skip(!process.env.DM_TEST_BUILD_DIR,'Build directory required to run preview acceptance');
  await page.goto('http://127.0.0.1:4173/#predict');
  const submit=page.getByRole('button',{name:'Dự đoán ROI',exact:true});await expect(submit).toBeEnabled();
  const reference=JSON.parse(readFileSync('backend/models/reference_prediction.json','utf8'));
  for(const row of reference.cases){
    const f=row.features;
    await page.getByLabel(/1. Loại chiến dịch/).selectOption(f.Campaign_Type);
    await page.getByLabel(/2. Kênh Marketing/).selectOption(f.Channel_Used);
    await page.getByLabel(/3. Đối tượng mục tiêu/).selectOption(f.Target_Audience);
    await page.getByLabel(/4. Phân khúc khách hàng/).selectOption(f.Customer_Segment);
    await page.getByRole('button',{name:`${f.Duration_days} ngày`,exact:true}).click();
    await submit.click();await expect(page.getByTestId('predicted-roi')).toHaveAttribute('data-value',String(row.expected_predictions['Linear Regression']));
  }
  const cors=await request.fetch(`${TEST_API_BASE}/predict`,{method:'OPTIONS',headers:{Origin:'https://example.com','Access-Control-Request-Method':'POST'}});
  expect(cors.status()).toBe(400);expect(cors.headers()['access-control-allow-origin']).toBeUndefined();
});

test('S07 static pages explain metadata outage and recover',async({page})=>{
  await page.route('**/model-info',r=>r.abort('connectionrefused'));
  for(const hash of ['dashboard','scenarios','insights']){
    await page.goto(`/#${hash}`);await expect(page.getByRole('alert')).toContainText('Không kết nối được máy chủ');
    await expect(page.getByText('Chưa được kiểm chứng',{exact:true}).first()).toBeVisible();
  }
  await page.unroute('**/model-info');await page.getByRole('button',{name:'Tải lại thông tin mô hình',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByText('Bảng đánh giá và nghiên cứu chi tiết',{exact:true}).click();
  await expect(page.getByTestId('historical-provenance')).toContainText('BASELINE_ONLY');
});
