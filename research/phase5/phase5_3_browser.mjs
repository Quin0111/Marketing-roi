// Automated Edge acceptance and screenshots of real pages/raw command logs.
// No mocked responses, HTML mockups or edits to product code.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync,readFileSync,statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import setup from '../../tests/support/e2e-global-setup.mjs';

const out=resolve('research/phase5/run_phase5_3'),evidence=resolve('research/phase5/evidence/phase5_3');
mkdirSync(evidence,{recursive:true});
process.env.DM_TEST_RESULTS_DIR=`${out}/browser`;
process.env.DM_TEST_BUILD_DIR=`${out}/build`;
const checks=[],images=[],api=[];
const reference=JSON.parse(readFileSync('backend/models/reference_prediction.json','utf8'));
function check(name,pass,detail){checks.push({name,status:pass?'PASS':'FAIL',detail});assert.ok(pass,name);}
function save(){writeFileSync(`${out}/browser-acceptance.json`,JSON.stringify({
  method:'Automated headless Edge; real production preview and API; no request interception or manual browser claim',
  counts:{pass:checks.filter(c=>c.status==='PASS').length,fail:checks.filter(c=>c.status==='FAIL').length},checks,images,api},null,2));}
async function shot(locator,name,details={}){
  const path=`${evidence}/${name}.png`;
  const isPage=typeof locator.viewportSize==='function';
  if(isPage&&name.endsWith('-compare')){
    // A full-page capture can resize the responsive chart and restart its JS
    // animation. Capture the real scrolled viewport and wait for rendered bars.
    details.viewportOnly=true;
    await locator.locator('.recharts-wrapper').scrollIntoViewIfNeeded();
    await locator.waitForFunction(()=>{
      const paths=[...document.querySelectorAll('.recharts-bar-rectangle path')];
      return paths.length>0&&paths.every(p=>p.getBBox().width>0&&p.getBBox().height>0);
    },null,{timeout:5000});
    await locator.waitForTimeout(1700);
  }
  if(isPage&&!details.viewportOnly)await locator.evaluate(()=>window.scrollTo(0,0));
  // Recharts animates SVG paths in JavaScript; allow its normal finite
  // transition to finish. Do not alter product data/styles for screenshots.
  await locator.screenshot({path,...(isPage?{fullPage:!details.viewportOnly}:{})});
  images.push({file:`evidence/phase5_3/${name}.png`,bytes:statSync(path).size,...details});save();
}
const closeServers=await setup();let browser;
try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  for(const viewport of [{width:1440,height:1080},{width:390,height:844}]){
    const slug=viewport.width===1440?'desktop':'mobile';
    const ctx=await browser.newContext({viewport});const page=await ctx.newPage();
    const errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.url().startsWith('http://127.0.0.1:8000'))requests.push({method:r.method(),url:r.url()});});
    await page.goto('http://127.0.0.1:4173/#dashboard');
    await page.getByText('Chưa vượt mô hình cơ sở',{exact:true}).first().waitFor();
    const charts=page.locator('main .recharts-surface');await charts.first().waitFor();
    check(`${slug} dashboard four charts`,await charts.count()===4);
    for(let i=0;i<4;i++){const box=await charts.nth(i).boundingBox();check(`${slug} chart ${i+1} visible geometry`,box&&box.width>0&&box.height>0,box);}
    check(`${slug} dashboard clearly illustrative`,(await page.locator('main').innerText()).includes('không phải phân phối đã kiểm toán'));
    await shot(page,`${slug}-dashboard`,{url:page.url(),viewport});

    await page.goto('http://127.0.0.1:4173/#predict');
    const submit=page.getByRole('button',{name:'Dự đoán ROI',exact:true});await submit.waitFor();
    await page.waitForFunction(()=>!document.querySelector('button[type="submit"]').disabled);
    for(const [i,row] of reference.cases.entries()){
      const f=row.features;
      await page.getByLabel(/1. Loại chiến dịch/).selectOption(f.Campaign_Type);
      await page.getByLabel(/2. Kênh Marketing/).selectOption(f.Channel_Used);
      await page.getByLabel(/3. Đối tượng mục tiêu/).selectOption(f.Target_Audience);
      await page.getByLabel(/4. Phân khúc khách hàng/).selectOption(f.Customer_Segment);
      await page.getByRole('button',{name:`${f.Duration_days} ngày`,exact:true}).click();
      if(i===0)await shot(page.locator('form'),`${slug}-prediction-form`,{url:page.url(),viewport,case:row.name});
      const pending=page.waitForResponse(r=>r.url().endsWith('/predict')&&r.request().method()==='POST');
      await submit.click();const response=await pending;const body=await response.json();
      await page.getByTestId('predicted-roi').waitFor();
      const record={case:row.name,viewport,request:response.request().postDataJSON(),status:response.status(),response:body,
        displayed:await page.getByTestId('predicted-roi').innerText(),absolute_error:Math.abs(body.predicted_roi-row.expected_predictions['Linear Regression'])};
      api.push(record);writeFileSync(`${out}/${slug}-api-predict-${i===0?'a':'b'}.json`,JSON.stringify(record,null,2));
      check(`${slug} reference ${i===0?'A':'B'} real API exact`,record.status===200&&record.absolute_error===0&&Number(await page.getByTestId('predicted-roi').getAttribute('data-value'))===body.predicted_roi,record);
      check(`${slug} gate ${i===0?'A':'B'}`,body.model_name==='Linear Regression'&&body.quality_status==='BASELINE_ONLY'&&body.is_research_only===true);
      await shot(page,`${slug}-prediction-${i===0?'a':'b'}`,{url:page.url(),viewport,case:row.name});
      if(i===0)await shot(page.getByTestId('model-warning').locator('../../..'),`${slug}-baseline-warning`,{url:page.url(),viewport});
    }
    const validation=await page.evaluate(async features=>{
      const response=await fetch('http://127.0.0.1:8000/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...features,Duration_days:31})});
      return {status:response.status,body:await response.json()};
    },reference.cases[0].features);
    check(`${slug} invalid duration real HTTP 422`,validation.status===422,validation);
    writeFileSync(`${out}/${slug}-validation.json`,JSON.stringify(validation,null,2));

    await page.goto('http://127.0.0.1:4173/#scenarios');const requestStart=requests.length;
    page.on('dialog',d=>d.accept());
    for(const [i,row] of reference.cases.entries()){
      await page.getByRole('button',{name:'Thêm kịch bản',exact:true}).click();
      const dialog=page.getByRole('dialog'),f=row.features;
      await dialog.getByLabel(/Tên kịch bản/).fill(`Tham chiếu ${i===0?'A':'B'} · cấu hình minh họa`);
      await dialog.getByLabel('Loại chiến dịch',{exact:true}).selectOption(f.Campaign_Type);
      await dialog.getByLabel('Kênh Marketing',{exact:true}).selectOption(f.Channel_Used);
      await dialog.getByLabel('Đối tượng mục tiêu',{exact:true}).selectOption(f.Target_Audience);
      await dialog.getByLabel('Phân khúc khách hàng',{exact:true}).selectOption(f.Customer_Segment);
      await dialog.getByRole('button',{name:`${f.Duration_days} ngày`,exact:true}).click();
      if(i===0)await shot(page,`${slug}-scenario-modal`,{url:page.url(),viewport,viewportOnly:true});
      await dialog.getByRole('button',{name:'Lưu kịch bản',exact:true}).click();
    }
    check(`${slug} create scenarios`,await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).count()===4);
    await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).first().click();
    await page.getByLabel(/Tên kịch bản/).fill('Tham chiếu B · đã chỉnh sửa');
    await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
    await page.reload();await page.getByRole('heading',{name:'Tham chiếu B · đã chỉnh sửa',exact:true}).waitFor();
    check(`${slug} edit and persist`,await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).count()===4);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('dm_scenarios')));
    writeFileSync(`${out}/${slug}-scenarios.json`,JSON.stringify(stored,null,2));
    const before=await page.locator('table tbody').innerText();
    await page.getByRole('columnheader',{name:'ROI mô phỏng',exact:true}).click();
    check(`${slug} no ROI ordering`,before===await page.locator('table tbody').innerText());
    await shot(page,`${slug}-compare`,{url:page.url(),viewport});
    const bars=await page.locator('.recharts-bar-rectangle path').evaluateAll(elements=>elements.map(el=>({width:el.getBBox().width,height:el.getBBox().height})));
    check(`${slug} comparison chart bars rendered`,bars.length===4&&bars.every(b=>b.width>0&&b.height>0),bars);
    await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).first().click();
    check(`${slug} delete scenario`,await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).count()===3);
    check(`${slug} comparison does not call predict`,!requests.slice(requestStart).some(r=>r.url.endsWith('/predict')),requests.slice(requestStart));

    await page.goto('http://127.0.0.1:4173/#insights');
    await page.getByTestId('historical-provenance').waitFor();
    await page.getByText('Chưa vượt mô hình cơ sở',{exact:true}).first().waitFor();
    check(`${slug} historical provenance`,(await page.getByTestId('historical-provenance').innerText()).includes('backend/models/model_metrics.json'));
    check(`${slug} Criteo distinct visit target`,(await page.getByTestId('research-evidence').innerText()).includes('visit, không phải ROI'));
    check(`${slug} research limited`,(await page.getByTestId('research-evidence').innerText()).includes('RESEARCH_LIMITED'));
    await shot(page,`${slug}-model-insights`,{url:page.url(),viewport});
    check(`${slug} no uncaught browser errors`,errors.length===0,errors);
    await ctx.close();save();
  }

  const ctx=await browser.newContext({viewport:{width:1440,height:1080}}),page=await ctx.newPage();
  for(const [source,name,phrase] of [['backend.log','backend-tests','62 passed'],['frontend.log','frontend-tests','78 passed'],['e2e.log','e2e-tests','31 passed'],['desktop-api-predict-a.json','api-predict','4.991136884533976']]){
    await page.goto(pathToFileURL(`${out}/${source}`).href);
    check(`${name} raw evidence rendered`,(await page.locator('body').innerText()).includes(phrase));
    await shot(page,name,{source:`run_phase5_3/${source}`,type:'Actual raw log/HTTP record opened in browser file viewer; not a terminal screenshot or simulated UI'});
  }
  await ctx.close();save();
  console.log(JSON.stringify({counts:{pass:checks.filter(c=>c.status==='PASS').length,fail:checks.filter(c=>c.status==='FAIL').length},screenshots:images.length}));
}finally{save();await browser?.close();await closeServers();}
