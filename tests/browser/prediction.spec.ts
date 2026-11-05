import { test, expect, Page } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { TEST_API_BASE } from '../support/api-base';
const reference: { cases: { name: string; features: {
  Campaign_Type: string; Channel_Used: string; Target_Audience: string;
  Customer_Segment: string; Duration_days: number;
}; expected_predictions: Record<string, number> }[] } = JSON.parse(readFileSync('backend/models/reference_prediction.json', 'utf8'));

async function load(page: Page) {
  await page.goto('/#predict');
  await expect(page.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeEnabled();
}

async function configure(page: Page, features: typeof reference.cases[number]['features']) {
  await page.getByLabel(/1. Loại chiến dịch/).selectOption(features.Campaign_Type);
  await page.getByLabel(/2. Kênh Marketing/).selectOption(features.Channel_Used);
  await page.getByLabel(/3. Đối tượng mục tiêu/).selectOption(features.Target_Audience);
  await page.getByLabel(/4. Phân khúc khách hàng/).selectOption(features.Customer_Segment);
  await page.getByRole('button',{name:`${features.Duration_days} ngày`,exact:true}).click();
}

test('I01 website predicts A and B through real API and preserves exact values', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await load(page);
  const evidence = [];
  for (const campaign of reference.cases) {
    await configure(page, campaign.features);
    const pending = page.waitForResponse(response => response.url().endsWith('/predict') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
    const response = await pending;
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(response.request().postDataJSON()).toEqual(campaign.features);
    await expect(page.getByTestId('predicted-roi')).toHaveAttribute('data-value', String(body.predicted_roi));
    await expect(page.getByTestId('predicted-roi')).toHaveText(body.predicted_roi.toFixed(4).replace('.', ','));
    const error = Math.abs(body.predicted_roi - campaign.expected_predictions['Linear Regression']);
    expect(error).toBeLessThanOrEqual(1e-6);
    expect(body.quality_status).toBe('BASELINE_ONLY');
    await expect(page.getByText('Phiên bản mô hình: 1.0.0', { exact: true })).toBeVisible();
    await expect(page.getByTestId('model-warning')).toHaveText(body.warning);
    await expect(page.getByText(/Khoảng tin cậy ước lượng/)).toHaveCount(0);
    evidence.push({ case: campaign.name, request: response.request().postDataJSON(), response: body,
      displayed_roi: await page.getByTestId('predicted-roi').innerText(), absolute_error: error });
  }
  expect(errors).toEqual([]);
  mkdirSync('tests/results', { recursive: true });
  writeFileSync('tests/results/website_predictions.json', JSON.stringify({ status: 'PASS', evidence }, null, 2));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'tests/results/predict-desktop.png', fullPage: true });
  await testInfo.attach('real-api-evidence', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});

test('I02 four durations are selectable and call the pipeline', async ({ page }) => {
  await load(page);
  for (const days of [15, 30, 45, 60]) {
    await page.getByRole('button',{name:`${days} ngày`,exact:true}).click();
    const response = page.waitForResponse(response => response.url().endsWith('/predict') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
    expect((await response).request().postDataJSON().Duration_days).toBe(days);
    await expect(page.getByTestId('predicted-roi')).toBeVisible();
  }
});

for (const status of [422, 503, 500]) {
  test(`I03 HTTP ${status} clears stale ROI, shows safe error and UNVERIFIED`, async ({ page }) => {
    await load(page);
    await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
    await expect(page.getByTestId('predicted-roi')).toBeVisible();
    await page.route('**/predict', route => route.fulfill({ status, body: JSON.stringify({ detail: 'private path secret traceback' }), contentType: 'application/json' }));
    await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).not.toContainText('private');
    await expect(page.getByTestId('predicted-roi')).toHaveCount(0);
    await expect(page.getByText('Chưa được kiểm chứng', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeDisabled();
    await page.unroute('**/predict');
    await page.getByRole('button', { name: 'Tải lại thông tin mô hình', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeEnabled();
  });
}

test('I04 malformed response never displays an ROI', async ({ page }) => {
  await load(page);
  await page.route('**/predict', route => route.fulfill({ status: 200, body: JSON.stringify({ predicted_roi: 99 }), contentType: 'application/json' }));
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Phản hồi từ máy chủ không hợp lệ');
  await expect(page.getByTestId('predicted-roi')).toHaveCount(0);
});

test('I05 timeout shows error and no ROI', async ({ page }) => {
  await load(page);
  let release!: () => void;
  const gate = new Promise<void>(done => { release = done; });
  await page.route('**/predict', async route => { await gate; await route.abort().catch(() => {}); });
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('quá thời gian chờ');
  await expect(page.getByTestId('predicted-roi')).toHaveCount(0);
  release();
});

test('I06 network failure never falls back to mock', async ({ page }) => {
  await load(page);
  await page.route('**/predict', route => route.abort('connectionrefused'));
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Không kết nối được máy chủ');
  await expect(page.getByTestId('predicted-roi')).toHaveCount(0);
});

test('I07 backend unavailable at page load uses UNVERIFIED and can recover', async ({ page }) => {
  await page.route('**/model-info', route => route.abort('connectionrefused'));
  await page.goto('/#predict');
  await expect(page.getByRole('alert')).toContainText('Không kết nối được máy chủ');
  await expect(page.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeDisabled();
  await expect(page.getByText('Chưa được kiểm chứng', { exact: true }).first()).toBeVisible();
  await page.unroute('**/model-info');
  await page.getByRole('button', { name: 'Tải lại thông tin mô hình', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeEnabled();
});

test('I08 edit while pending cancels old request; repeated clicks submit once', async ({ page }) => {
  await load(page);
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>(done => { release = done; });
  await page.route('**/predict', async route => { requests++; await gate; await route.continue().catch(() => {}); });
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByRole('button', { name: /Đang xử lý yêu cầu/ })).toBeDisabled();
  // Real DOM dispatch bypasses pointer restrictions, still cannot submit a disabled button.
  await page.getByRole('button', { name: /Đang xử lý yêu cầu/ }).dispatchEvent('click');
  expect(requests).toBe(1);
  await page.getByRole('button',{name:'45 ngày',exact:true}).click();
  await expect(page.getByTestId('predicted-roi')).toHaveCount(0);
  release();
  await page.unroute('**/predict');
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByTestId('predicted-roi')).toBeVisible();
});

test('I09 feature change and reset clear results', async ({ page }) => {
  await load(page);
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByTestId('predicted-roi')).toBeVisible();
  await page.getByLabel(/1. Loại chiến dịch/).selectOption('Email');
  await expect(page.getByTestId('predicted-roi')).toHaveCount(0);
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByTestId('predicted-roi')).toBeVisible();
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page.getByTestId('predicted-roi')).toHaveCount(0);
  await expect(page.getByLabel(/1. Loại chiến dịch/)).toHaveValue('Search');
});

test('I10 real HTTP invalid inputs return 422 via browser origin', async ({ page }) => {
  await load(page);
  const results = await page.evaluate(async ({payload,apiBase}) => {
    const missing = { ...payload } as Partial<typeof payload>; delete missing.Campaign_Type;
    return await Promise.all([missing, { ...payload, Duration_days: 31 }].map(async body => {
      const response = await fetch(`${apiBase}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      return response.status;
    }));
  }, {payload:reference.cases[0].features,apiBase:TEST_API_BASE});
  expect(results).toEqual([422, 422]);
});

test('I11 three pages and legacy redirect render; comparison clearly separates API and illustrative data', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const hash of ['dashboard', 'predict', 'scenarios', 'insights']) {
    await page.goto(`/#${hash}`);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header h1')).toBeVisible();
    if (hash === 'scenarios') await expect(page.getByText(/ROI mô phỏng là dữ liệu minh họa cũ, không phải kết quả mô hình/)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('I12 mobile form and result fit viewport; navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page); await configure(page, reference.cases[0].features);
  await page.getByRole('button', { name: 'Dự đoán ROI', exact: true }).click();
  await expect(page.getByTestId('predicted-roi')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'tests/results/predict-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Mở thanh điều hướng' }).click();
  await page.getByRole('button', { name: 'Tổng quan', exact: true }).last().click();
  await expect(page.locator('header h1')).toHaveText('Tổng quan Marketing');
});

test('I13 refuses unverified or client-promoted quality metadata', async ({ page }) => {
  const actual = JSON.parse(readFileSync('backend/tests/http_results.json', 'utf8')).responses.find((row: { endpoint: string }) => row.endpoint === '/model-info').response;
  await page.route('**/model-info', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...actual, quality_status: 'VALIDATED' }) }));
  await page.goto('/#predict');
  await expect(page.getByRole('alert')).toContainText('Phản hồi từ máy chủ không hợp lệ');
  await expect(page.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeDisabled();
  await expect(page.getByText('Chưa được kiểm chứng', { exact: true }).first()).toBeVisible();
});
