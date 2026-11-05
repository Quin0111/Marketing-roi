import { chromium } from '@playwright/test';
import { writeFileSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import setup from '../../tests/support/e2e-global-setup.mjs';
const out=resolve('research/phase5/run_phase5_3');
process.env.DM_TEST_RESULTS_DIR=`${out}/chart-diagnostic`;
process.env.DM_TEST_BUILD_DIR=`${out}/build`;
const close=await setup();let browser;
try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1080}});const errors=[];
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/#scenarios');await page.locator('table').waitFor();
  const stages=[];
  async function inspect(name){
    stages.push({name,...await page.evaluate(()=>({storage:localStorage.getItem('dm_scenarios'),bars:[...document.querySelectorAll('.recharts-bar-rectangle path')].map(p=>({d:p.getAttribute('d'),bbox:{width:p.getBBox().width,height:p.getBBox().height},outer:p.outerHTML})),chart:document.querySelector('.recharts-wrapper')?.outerHTML}))});
    await page.screenshot({path:`${out}/chart-diagnostic-${name}.png`,fullPage:true});
  }
  await page.waitForTimeout(2500);await inspect('initial');
  await page.locator('.recharts-wrapper').scrollIntoViewIfNeeded();await page.waitForTimeout(2500);await inspect('scrolled');
  await page.getByRole('columnheader',{name:'ROI mô phỏng',exact:true}).click();await page.waitForTimeout(2500);await inspect('header-click');
  await page.getByRole('button',{name:'Thu gọn biểu đồ',exact:true}).click();
  await page.getByRole('button',{name:'Mở rộng biểu đồ',exact:true}).click();await page.waitForTimeout(2500);await inspect('reopen');
  const saved=JSON.parse(readFileSync(`${out}/desktop-scenarios.json`,'utf8'));
  await page.evaluate(value=>localStorage.setItem('dm_scenarios',JSON.stringify(value)),saved);
  await page.reload();await page.locator('table').waitFor();await page.waitForTimeout(3000);await inspect('saved-four');
  await page.locator('.recharts-wrapper').scrollIntoViewIfNeeded();await page.waitForTimeout(2000);await inspect('saved-four-scrolled');
  await page.getByRole('columnheader',{name:'ROI mô phỏng',exact:true}).click();await page.waitForTimeout(2000);await inspect('saved-four-header');
  writeFileSync(`${out}/chart-diagnostic.json`,JSON.stringify({stages,errors},null,2));
  console.log(JSON.stringify(stages.map(s=>({name:s.name,bars:s.bars}))));
}finally{await browser?.close();await close();}
