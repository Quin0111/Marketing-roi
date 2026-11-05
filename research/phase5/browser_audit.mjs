// Read-only product audit. Fault injection is per isolated browser context only.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, openSync, closeSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const out=resolve('research/phase5/run_20261104');
mkdirSync(out,{recursive:true});
const checks=[],observations=[],serverLogs=[];
let backend,vite,preview,browser;
async function alive(url){try {await fetch(url,{signal:AbortSignal.timeout(800)});return true;}catch{return false;}}
function record(name,pass,evidence){checks.push({name,status:pass?'PASS':'FAIL',evidence});}
function save(){writeFileSync(`${out}/browser_audit.json`,JSON.stringify({
  scope:'Additional QA probes; font requests aborted only in isolated custom contexts; existing E2E unmodified.',
  checks,counts:{pass:checks.filter(v=>v.status==='PASS').length,fail:checks.filter(v=>v.status==='FAIL').length,
    blocked:checks.filter(v=>v.status==='BLOCKED').length},observations},null,2));}
async function ready(){for(let n=0;n<150;n++){if(await alive('http://127.0.0.1:8000/health')&&await alive('http://127.0.0.1:5173'))return;await delay(200);}throw Error('Servers did not start');}
async function context(viewport={width:1440,height:1080},init){
  const ctx=await browser.newContext({viewport});
  await ctx.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,route=>route.abort());
  if(init)await ctx.addInitScript(init);
  const page=await ctx.newPage();
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().startsWith('http://127.0.0.1:8000'))requests.push({method:r.method(),url:r.url(),body:r.postData()});});
  return {ctx,page,errors,requests};
}
async function navigate(page,hash){await page.goto(`http://127.0.0.1:5173/#${hash}`,{waitUntil:'domcontentloaded'});await page.locator('header h1').waitFor();await delay(300);}
async function probe(name,fn){try{await fn();}catch(e){checks.push({name,status:'BLOCKED',error:e.message});}save();}

try{
  if(await alive('http://127.0.0.1:8000/health')||await alive('http://127.0.0.1:5173'))throw Error('Ports occupied; refuse to reuse or stop user servers');
  for(const [label,command,args] of [
    ['backend',resolve('backend/.venv/Scripts/python.exe'),['-m','uvicorn','app.main:app','--app-dir','backend','--host','127.0.0.1','--port','8000']],
    ['vite',process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort']]]){
    const fd=openSync(`${out}/custom-${label}.log`,'w');serverLogs.push(fd);
    const child=spawn(command,args,{cwd:process.cwd(),env:{...process.env,VITE_API_BASE_URL:'http://127.0.0.1:8000'},stdio:['ignore',fd,fd],windowsHide:true});
    if(label==='backend')backend=child;else vite=child;
  }
  await ready();
  browser=await chromium.launch({channel:'msedge',headless:true});
  await probe('Actual API contract and endpoint surface',async()=>{
    const response=await fetch('http://127.0.0.1:8000/openapi.json');const schema=await response.json();writeFileSync(`${out}/openapi.json`,JSON.stringify(schema,null,2));
    const endpoints=Object.keys(schema.paths);record('Only three application API paths',JSON.stringify(endpoints.sort())===JSON.stringify(['/health','/model-info','/predict']),endpoints);
    const health=await(await fetch('http://127.0.0.1:8000/health')).json();record('Live health and model ready',health.status==='ok'&&health.model_ready,health);
    const reference=JSON.parse(readFileSync('backend/models/reference_prediction.json','utf8'));const cases=[];
    for(const c of reference.cases){const r=await fetch('http://127.0.0.1:8000/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c.features)});const body=await r.json();cases.push({case:c.name,status:r.status,body,error:Math.abs(body.predicted_roi-c.expected_predictions['Linear Regression'])});}
    writeFileSync(`${out}/live_reference.json`,JSON.stringify(cases,null,2));record('Both live reference predictions match',cases.every(r=>r.status===200&&r.error<=1e-6),cases);
    const forbidden=await fetch('http://127.0.0.1:8000/optimize',{method:'POST'});record('Optimize absent',forbidden.status===404,{status:forbidden.status});
    const info=await(await fetch('http://127.0.0.1:8000/model-info')).json();writeFileSync(`${out}/live_model_info.json`,JSON.stringify(info,null,2));
    record('Live gate disables rank/optimization',info.model_name==='Linear Regression'&&info.quality_status==='BASELINE_ONLY'&&!info.quality_gate_rules.allow_automatic_ranking&&!info.quality_gate_rules.allow_optimization_recommendation,info.quality_gate_rules);
  });
  await probe('Dashboard interactions',async()=>{
    const {ctx,page,requests}=await context();await navigate(page,'dashboard');
    const table=page.locator('table');record('Dashboard first page has six rows',await table.locator('tbody tr').count()===6,{rows:await table.locator('tbody tr').count()});
    await page.getByRole('button',{name:'Trang tiếp',exact:true}).click();record('Dashboard pagination page two',await table.locator('tbody').innerText().then(t=>t.includes('CMP-2021-007')),{text:await table.locator('tbody').innerText()});
    await page.getByPlaceholder('Tìm kiếm theo mã, phân khúc, kênh...').fill('__NO_MATCH_AUDIT__');record('Dashboard empty filter state',await table.innerText().then(t=>t.includes('Không tìm thấy chiến dịch')),{text:await table.innerText()});
    await page.getByPlaceholder('Tìm kiếm theo mã, phân khúc, kênh...').fill('');await page.locator('select').first().selectOption('Email');
    record('Dashboard campaign filter',await table.locator('tbody tr').count()===2,{rows:await table.locator('tbody tr').count()});
    record('Dashboard does not call analytics endpoint',requests.every(r=>r.url.endsWith('/model-info')),requests);
    await ctx.close();
  });
  for(const viewport of [{width:1440,height:1080},{width:768,height:1024},{width:390,height:844},{width:320,height:568}]){
    for(const hash of ['dashboard','predict','scenarios','insights'])await probe(`Responsive ${hash} ${viewport.width}`,async()=>{
      const {ctx,page,errors,requests}=await context(viewport);await navigate(page,hash);
      if(hash==='predict'){
        await page.getByRole('button',{name:'Dự đoán ROI',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
        await page.getByRole('button',{name:'Dự đoán ROI',exact:true}).click();await page.getByTestId('predicted-roi').waitFor();
      }
      const geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,main:document.querySelector('main')?.getBoundingClientRect().width,
        overflows:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>({tag:e.tagName,text:(e.textContent||'').slice(0,60),right:e.getBoundingClientRect().right}))}));
      record(`${hash} ${viewport.width}px no document horizontal overflow`,geometry.document<=viewport.width,geometry);
      record(`${hash} ${viewport.width}px no uncaught page error`,errors.length===0,errors);
      await page.screenshot({path:`${out}/${hash}-${viewport.width}.png`,fullPage:true});
      observations.push({page:hash,width:viewport.width,requests});await ctx.close();
    });
  }
  await probe('Scenario CRUD/persistence/sorting',async()=>{
    const {ctx,page,requests}=await context();page.on('dialog',d=>d.accept());await navigate(page,'scenarios');
    await page.getByRole('button',{name:'Thêm kịch bản',exact:true}).click();
    const input=page.getByPlaceholder('Ví dụ: Kịch bản tiếp cận khách hàng công nghệ Q4');await input.fill('');
    await page.getByRole('button',{name:'Lưu kịch bản',exact:true}).click();record('Scenario empty-name validation',await input.evaluate(el=>!el.validity.valid),{modalStillPresent:await input.count()});
    await input.fill('QA Audit Scenario');await page.getByRole('button',{name:'Lưu kịch bản',exact:true}).click();
    record('Scenario create',await page.getByRole('button',{name:'Nhân bản kịch bản',exact:true}).count()===3,{cards:await page.getByRole('button',{name:'Nhân bản kịch bản',exact:true}).count()});
    await page.getByRole('button',{name:'Nhân bản kịch bản',exact:true}).first().click();record('Scenario duplicate',await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).count()===4,{});
    await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).first().click();await input.fill('QA Edited');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
    record('Scenario edit',await page.locator('h4').allTextContents().then(v=>v.includes('QA Edited')),{});
    await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).first().click();record('Scenario delete with confirmation',await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).count()===3,{});
    await page.reload({waitUntil:'domcontentloaded'});record('Scenario local persistence',await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).count()===3,{});
    const roi=page.getByRole('columnheader',{name:'ROI mô phỏng',exact:true});await roi.click();await roi.click();
    const order=await page.locator('table tbody tr').evaluateAll(rows=>rows.map(r=>r.cells[6].textContent.trim()));
    record('ROI ordering disabled under baseline gate',!(await roi.isVisible()),{manualRoiSortPresent:await roi.isVisible(),descendingValues:order,automaticRanking:false,apiRecommendation:false});
    record('Scenario CRUD never calls predict',requests.every(r=>r.url.endsWith('/model-info')),requests);
    while(await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).count()>1)await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).first().click();
    await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).click();record('Last scenario deletion blocked',await page.getByRole('button',{name:'Xóa kịch bản',exact:true}).count()===1,{});
    await ctx.close();
  });
  for(const [kind,init] of [
    ['invalid-json',()=>localStorage.setItem('dm_scenarios','{broken')],
    ['wrong-shape',()=>localStorage.setItem('dm_scenarios','[{}]')],
    ['empty-array',()=>localStorage.setItem('dm_scenarios','[]')],
    ['storage-denied',()=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k==='dm_scenarios')throw new DOMException('Storage denied for audit','SecurityError');return get.call(this,k);};}]
  ])await probe(`Storage ${kind}`,async()=>{
    const {ctx,page,errors}=await context(undefined,init);await page.goto('http://127.0.0.1:5173/#scenarios',{waitUntil:'domcontentloaded'});await delay(700);
    const evidence={errors,headerCount:await page.locator('header h1').count(),cards:await page.getByRole('button',{name:'Chỉnh sửa kịch bản',exact:true}).count(),body:(await page.locator('body').innerText()).slice(0,600)};
    record(`Storage ${kind} safely renders`,evidence.headerCount===1&&errors.length===0,evidence);
    if(kind==='empty-array')record('Persisted empty scenario list shows empty state',evidence.cards===0,evidence);
    await page.screenshot({path:`${out}/storage-${kind}.png`,fullPage:true});await ctx.close();
  });
  await probe('Small-screen scenario modal and keyboard',async()=>{
    const {ctx,page}=await context({width:320,height:568});await navigate(page,'scenarios');await page.getByRole('button',{name:'Thêm kịch bản',exact:true}).click();
    const saveButton=page.getByRole('button',{name:'Lưu kịch bản',exact:true});const box=await saveButton.boundingBox();const close=await page.getByRole('button',{name:'Đóng cửa sổ',exact:true}).boundingBox();
    record('Modal save and close fit 320x568',box.y>=0&&box.y+box.height<=568&&close.y>=0,{save:box,close,viewportHeight:568});
    record('Modal exposes dialog semantics',await page.getByRole('dialog').count()===1,{dialogCount:await page.getByRole('dialog').count()});
    await page.keyboard.press('Escape');record('Modal closes on Escape',await saveButton.count()===0,{saveButtonCountAfterEscape:await saveButton.count()});
    await page.screenshot({path:`${out}/scenario-modal-320.png`,fullPage:true});await ctx.close();
  });
  await probe('API offline at load across static pages',async()=>{
    const {ctx,page}=await context();await ctx.route('http://127.0.0.1:8000/**',r=>r.abort('connectionrefused'));
    for(const hash of ['dashboard','predict','scenarios','insights']){
      await navigate(page,hash);await page.getByText('Chưa được kiểm chứng',{exact:true}).first().waitFor();
      record(`Offline ${hash} UNVERIFIED`,await page.getByText('Chưa được kiểm chứng',{exact:true}).first().isVisible(),{alertCount:await page.getByRole('alert').count()});
      if(hash==='predict')record('Offline predict disabled no fabricated ROI',await page.getByRole('button',{name:'Dự đoán ROI',exact:true}).isDisabled()&&await page.getByTestId('predicted-roi').count()===0,{});
      if(hash==='insights')observations.push({page:'offline-insights',stillDisplaysHistoricalMetrics:(await page.locator('main').innerText()).includes('1,732275'),inlineAlert:await page.getByRole('alert').count()});
    }await ctx.close();
  });
  await probe('Production build preview origin',async()=>{
    const preflight=await fetch('http://127.0.0.1:8000/predict',{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:4173','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
    record('Default CORS allows documented preview origin',preflight.status===200,{status:preflight.status,body:await preflight.text()});
    if(await alive('http://127.0.0.1:4173'))throw Error('Preview port occupied');
    const fd=openSync(`${out}/custom-preview.log`,'w');serverLogs.push(fd);
    preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--outDir','research/phase5/run_20261104/build','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore',fd,fd],windowsHide:true});
    for(let i=0;i<100&&!await alive('http://127.0.0.1:4173');i++)await delay(100);
    const {ctx,page}=await context();await page.goto('http://127.0.0.1:4173/#predict',{waitUntil:'domcontentloaded'});await delay(2000);
    const disabled=await page.getByRole('button',{name:'Dự đoán ROI',exact:true}).isDisabled();
    record('Default production preview can load API metadata',!disabled,{disabled,alerts:await page.getByRole('alert').allTextContents()});
    await page.screenshot({path:`${out}/production-preview.png`,fullPage:true});await ctx.close();
  });
  save();console.log(JSON.stringify({counts:{pass:checks.filter(v=>v.status==='PASS').length,fail:checks.filter(v=>v.status==='FAIL').length,blocked:checks.filter(v=>v.status==='BLOCKED').length}}));
}finally{
  save();await browser?.close();
  for(const child of [preview,vite,backend])if(child&&child.exitCode===null){child.kill();await Promise.race([new Promise(r=>child.once('exit',r)),delay(5000)]);}
  for(const fd of serverLogs)closeSync(fd);
}
