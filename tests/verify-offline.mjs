// Real outage check: no backend process, no request interception, no mock response.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

async function isRunning(url) {
  try { await fetch(url, { signal: AbortSignal.timeout(1000) }); return true; }
  catch { return false; }
}

const API_BASE=`http://127.0.0.1:${process.env.DM_TEST_API_PORT||8000}`;
assert.equal(await isRunning(`${API_BASE}/health`), false,
  'Stop the backend before verifying a real outage. This script will not stop your server.');
assert.equal(await isRunning('http://127.0.0.1:5173'), false,
  'Port 5173 must be free. This script will not stop your frontend.');
mkdirSync('tests/results', { recursive: true });
process.env.VITE_API_BASE_URL=API_BASE;
process.env.VITE_API_TIMEOUT_MS='10000';
const server = await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true,watch:{ignored:['**/tests/results/**','**/research/**']}}});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  // Allow the same bounded Vite cold-start budget as browser P01. This does
  // not change the 10s API timeout or any outage assertion.
  await page.goto('http://127.0.0.1:5173/#predict', { timeout: 45000 });
  const alert = page.getByRole('alert');
  await alert.waitFor();
  assert.match(await alert.innerText(), /Không kết nối được máy chủ/);
  assert.equal(await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).isDisabled(), true);
  assert.equal(await page.getByTestId('predicted-roi').count(), 0);
  assert.equal(await page.getByText('Chưa được kiểm chứng', { exact: true }).first().isVisible(), true);
  assert.equal(await isRunning(`${API_BASE}/health`), false);
  await page.screenshot({ path: 'tests/results/backend-offline.png', fullPage: true });
  await page.goto('http://127.0.0.1:5173/#scenarios');
  await page.getByRole('alert').waitFor();
  const scenarioButtons=page.getByRole('button',{name:'Dự đoán ROI kịch bản',exact:true});
  assert.ok(await scenarioButtons.count()>0);
  for(const button of await scenarioButtons.all())assert.equal(await button.isDisabled(),true);
  assert.equal(await page.getByTestId('scenario-api-roi').count(),0);
  assert.equal(await page.getByTestId('comparison-chart-empty').isVisible(),true);
  await page.screenshot({path:'tests/results/compare-backend-offline.png',fullPage:true});
  const report = { status: 'PASS', backend_url: API_BASE, backend_running: false,
    request_interception: false, api_timeout_ms: 10000, alert: await alert.innerText(),
    quality_status: 'UNVERIFIED', predict_disabled: true, displayed_roi: null, compare_predict_disabled:true,compare_api_roi:null };
  writeFileSync('tests/results/backend-offline.json', JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
