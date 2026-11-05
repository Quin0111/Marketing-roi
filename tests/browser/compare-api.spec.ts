import { test, expect, Page } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TEST_API_BASE } from '../support/api-base';
const reference=JSON.parse(readFileSync('backend/models/reference_prediction.json','utf8'));
const rows=reference.cases.map((row:{features:Record<string,unknown>},index:number)=>({
  id:index===0?'a':'b',name:`Reference ${index===0?'A':'B'}`,createdAt:'acceptance',updatedAt:'acceptance',
  features:{campaignType:row.features.Campaign_Type,channelUsed:row.features.Channel_Used,
    targetAudience:row.features.Target_Audience,customerSegment:row.features.Customer_Segment,durationDays:row.features.Duration_days},
}));
const card=(page:Page,id='a')=>page.getByTestId(`scenario-card-${id}`);
async function load(page:Page,preview=false,expectReady=true){
  await page.addInitScript(value=>{
    if(!sessionStorage.getItem('compare-api-seeded')){
      localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:value}));sessionStorage.setItem('compare-api-seeded','1');
    }
  },rows);
  await page.goto(preview?'http://127.0.0.1:4173/#scenarios':'/#scenarios');
  if(expectReady) await expect(card(page).getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeEnabled();
}
async function predict(page:Page,id='a'){
  const pending=page.waitForResponse(r=>r.url().endsWith('/predict')&&r.request().method()==='POST');
  await card(page,id).getByRole('button',{name:/Dự đoán ROI kịch bản|Dự đoán lại ROI|Thử lại dự đoán/}).click();
  const response=await pending;await expect(card(page,id).getByTestId('scenario-api-roi')).toBeVisible();return response;
}

for(const viewport of [{width:1440,height:1080},{width:390,height:844}]){
  test(`C01 real scenario A/B API predictions and source separation ${viewport.width}`,async({page},info)=>{
    // Two real predictions, source switching and screenshots, including cold
    // dev compilation. Keep a finite budget; original suite retains 30s.
    test.setTimeout(45000);
    await page.setViewportSize(viewport);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await load(page);await expect(page.getByTestId('comparison-chart-empty')).toBeVisible();const evidence=[];
    for(const [index,id] of ['a','b'].entries()){
      const response=await predict(page,id),body=await response.json();
      expect(response.status()).toBe(200);expect(response.request().postDataJSON()).toEqual(reference.cases[index].features);
      const error=Math.abs(body.predicted_roi-reference.cases[index].expected_predictions['Linear Regression']);expect(error).toBe(0);
      await expect(card(page,id).getByTestId('scenario-api-roi')).toHaveAttribute('data-value',String(body.predicted_roi));
      await expect(page.getByTestId(`scenario-row-${id}`).getByTestId('scenario-api-roi')).toHaveAttribute('data-value',String(body.predicted_roi));
      await expect(card(page,id)).toContainText('Đã dự đoán bằng mô hình');
      await expect(card(page,id)).toContainText('Linear Regression · phiên bản 1.0.0 · BASELINE_ONLY');
      await expect(card(page,id).getByTestId('scenario-api-warning')).toHaveText(body.warning);
      await expect(card(page,id)).not.toContainText('Đã kiểm chứng chính xác');
      evidence.push({scenario:id,request:response.request().postDataJSON(),status:response.status(),response:body,absolute_error:error});
    }
    await expect(page.getByTestId('comparison-chart-values').locator('li')).toHaveCount(2);
    const order=await page.locator('table tbody tr').evaluateAll(elements=>elements.map(el=>el.getAttribute('data-testid')));
    await page.getByRole('columnheader',{name:'ROI dự đoán · API /predict',exact:true}).click();
    expect(await page.locator('table tbody tr').evaluateAll(elements=>elements.map(el=>el.getAttribute('data-testid')))).toEqual(order);
    const chart=page.getByTestId('comparison-chart');await chart.scrollIntoViewIfNeeded();
    await expect.poll(()=>chart.locator('.recharts-bar-rectangle path').evaluateAll(paths=>paths.length===2&&paths.every(p=>(p as SVGGraphicsElement).getBBox().height>0))).toBe(true);
    await page.screenshot({path:info.outputPath(`compare-real-api-${viewport.width}.png`),fullPage:false});
    await card(page).screenshot({path:info.outputPath(`scenario-a-${viewport.width}.png`)});
    await page.getByLabel('Nguồn biểu đồ').selectOption('demo');
    await expect(page.getByTestId('comparison-chart-values').locator('li')).toHaveCount(0);
    await expect(page.getByTestId('comparison-chart-source')).toContainText('dữ liệu minh họa');
    await page.getByLabel('Nguồn biểu đồ').selectOption('api');await expect(page.getByTestId('comparison-chart-values').locator('li')).toHaveCount(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
    await expect(page.getByRole('button',{name:/best campaign|recommended campaign|tối ưu/i})).toHaveCount(0);
    const out=resolve(process.env.DM_TEST_RESULTS_DIR||'tests/results');mkdirSync(out,{recursive:true});
    writeFileSync(`${out}/compare-reference-${viewport.width}.json`,JSON.stringify({viewport,evidence},null,2));
    await info.attach('compare-real-api-reference',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
  });
}

for(const failure of [422,503,500,'network'] as const){
  test(`C02 scenario failure ${failure} removes stale ROI, isolates other results and retries`,async({page})=>{
    await load(page);await predict(page);await predict(page,'b');
    await page.route('**/predict',r=>typeof failure==='number'?r.fulfill({status:failure,contentType:'application/json',body:'{"detail":"private traceback secret path"}'}):r.abort('connectionrefused'));
    await card(page).getByRole('button',{name:'Dự đoán lại ROI'}).click();
    await expect(card(page).getByRole('alert')).toBeVisible();await expect(card(page).getByRole('alert')).not.toContainText('private');
    await expect(card(page).getByTestId('scenario-api-roi')).toHaveCount(0);
    await expect(card(page,'b').getByTestId('scenario-api-roi')).toBeVisible();
    await expect(page.getByTestId('comparison-chart-values').locator('li')).toHaveCount(1);
    await page.unroute('**/predict');await predict(page);await expect(page.getByTestId('comparison-chart-values').locator('li')).toHaveCount(2);
  });
}

test('C03 edit invalidates old card/table/chart value; re-predict, duplicate and delete remain correct',async({page})=>{
  await load(page);await predict(page);await card(page).getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();
  await page.locator('#scenario-durationDays').fill('60');await page.getByRole('button',{name:'Lưu thay đổi'}).click();
  await expect(card(page).getByTestId('scenario-api-roi')).toHaveCount(0);
  await expect(page.getByTestId('scenario-row-a').getByTestId('scenario-api-roi')).toHaveCount(0);
  await expect(page.getByTestId('comparison-chart-values').locator('li')).toHaveCount(0);
  const response=await predict(page);expect(response.request().postDataJSON().Duration_days).toBe(60);
  await card(page).getByRole('button',{name:'Nhân bản kịch bản'}).click();
  await expect(page.getByTestId('scenario-api-result')).toHaveCount(2); // card + table of the original, not clone
  page.on('dialog',dialog=>dialog.accept());await card(page).getByRole('button',{name:'Xóa kịch bản'}).click();
  await expect(page.getByTestId('scenario-api-result')).toHaveCount(0);await expect(card(page)).toHaveCount(0);
});

for(const action of ['edit','delete'] as const){
  test(`C04 ${action} while prediction pending aborts stale result`,async({page})=>{
    await load(page);let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
    await page.route('**/predict',async route=>{await gate;await route.continue().catch(()=>{});});
    try{
      await card(page).getByRole('button',{name:'Dự đoán ROI kịch bản'}).click();
      await expect(card(page).getByRole('button',{name:'Đang dự đoán…'})).toBeDisabled();
      if(action==='edit'){
        await card(page).getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();
        await page.locator('#scenario-durationDays').fill('60');await page.getByRole('button',{name:'Lưu thay đổi'}).click();
      }else{page.on('dialog',dialog=>dialog.accept());await card(page).getByRole('button',{name:'Xóa kịch bản'}).click();}
    }finally{release();await page.unroute('**/predict');}
    await expect(page.getByTestId('scenario-api-roi')).toHaveCount(0);
    if(action==='edit'){const response=await predict(page);expect(response.request().postDataJSON().Duration_days).toBe(60);}
    else await expect(card(page)).toHaveCount(0);
  });
}

test('C05 backend domain validation blocks unsupported scenario before POST',async({page,request})=>{
  const actual=await (await request.get(`${TEST_API_BASE}/model-info`)).json();
  await page.route('**/model-info',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...actual,allowed_categories:{...actual.allowed_categories,Campaign_Type:['Search']}})}));
  const requests:string[]=[];page.on('request',r=>{if(r.url().endsWith('/predict'))requests.push(r.url());});
  await load(page,false,false);await expect(card(page)).toContainText('chưa được mô hình hỗ trợ');
  await expect(card(page).getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeDisabled();expect(requests).toEqual([]);
});

test('C06 reload keeps features but does not trust stored model results',async({page})=>{
  await load(page);await predict(page);await page.reload();
  await expect(card(page).getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeEnabled();
  await expect(page.getByTestId('scenario-api-roi')).toHaveCount(0);await expect(page.getByTestId('comparison-chart-empty')).toBeVisible();
});

test('C07 production preview can predict a real comparison scenario',async({page})=>{
  test.skip(!process.env.DM_TEST_BUILD_DIR,'Build directory required for preview acceptance');
  await load(page,true);const response=await predict(page);const body=await response.json();
  expect(body.predicted_roi).toBe(reference.cases[0].expected_predictions['Linear Regression']);
  expect(body.quality_status).toBe('BASELINE_ONLY');
});
