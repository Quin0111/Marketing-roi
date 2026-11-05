import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import setup from '../../tests/support/e2e-global-setup.mjs';

const out=resolve('research/phase5/run_suitability/visual');
process.env.DM_TEST_API_PORT='18000';
process.env.DM_TEST_RESULTS_DIR=out;
process.env.DM_TEST_BUILD_DIR=resolve('research/phase5/run_suitability/build-isolated-final');
mkdirSync(out,{recursive:true});
const reference=JSON.parse(readFileSync('backend/models/reference_prediction.json','utf8'));
const rows=[1,0].map((index,i)=>{
  const f=reference.cases[index].features;
  return {id:i?'b':'a',name:`Kịch bản ${i?'B':'A'}`,createdAt:'visual QA',updatedAt:'visual QA',
    features:{campaignType:f.Campaign_Type,channelUsed:f.Channel_Used,targetAudience:f.Target_Audience,customerSegment:f.Customer_Segment,durationDays:f.Duration_days}};
});
const cleanup=await setup();let browser;
const started=Date.now();
try {
  browser=await chromium.launch({channel:'msedge',headless:true});
  const checks=[];
  for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:1000}});
    await page.addInitScript(rows=>localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:rows})),rows);
    await page.goto('http://127.0.0.1:4173/#scenarios');
    await page.getByLabel('Kênh Marketing mong muốn',{exact:true}).selectOption('Google Ads');
    const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/predict'&&r.request().method()==='POST');
    const button=page.getByTestId('scenario-card-a').getByRole('button',{name:'Dự đoán ROI kịch bản'});
    await button.waitFor();await button.click();
    const response=await pending,body=await response.json();
    assert.equal(response.status(),200);assert.deepEqual(response.request().postDataJSON(),reference.cases[1].features);
    assert.equal(body.predicted_roi,reference.cases[1].expected_predictions['Linear Regression']);
    assert.equal(body.quality_status,'BASELINE_ONLY');
    await page.getByTestId('suitability-roi-a').filter({hasText:'API /predict'}).waitFor();
    assert.equal(await page.getByTestId('suitability-choice-a').count(),1);
    assert.equal(await page.getByTestId('suitability-choice-b').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:resolve(out,`compare-full-${width}.png`),fullPage:true});
    const result=page.getByTestId('suitability-result');await result.scrollIntoViewIfNeeded();
    await result.screenshot({path:resolve(out,`suitability-result-${width}.png`)});
    checks.push({viewport:{width,height:1000},chosen:'a',criterion:{channelUsed:'Google Ads',mode:'preferred',weight:1},
      request:response.request().postDataJSON(),response:body,absolute_error:0,viewport_overflow:false});
    await page.close();
  }
  writeFileSync(resolve(out,'checks.json'),JSON.stringify({status:'PASS',source:'production preview + unmodified real FastAPI /predict, no interception',checks},null,2));
  console.log(JSON.stringify({status:'PASS',checks:checks.length,screenshots:4,duration_ms:Date.now()-started}));
} finally {await browser?.close();await cleanup();}
