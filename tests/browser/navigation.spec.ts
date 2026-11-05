import { test, expect } from '@playwright/test';
for(const width of [1440,390]){
  test(`N01 three-page navigation and preserved scenario suitability ${width}`,async({page},info)=>{
    await page.setViewportSize({width,height:1000});await page.goto('/#dashboard');
    if(width<768)await page.getByRole('button',{name:'Mở thanh điều hướng'}).click();
    const nav=page.getByRole('navigation',{name:width<768?'Điều hướng chính trên di động':'Điều hướng chính',exact:true});
    await expect(nav.getByRole('button')).toHaveCount(3);
    await expect(nav).not.toContainText('Phân tích mô hình');
    await page.screenshot({path:info.outputPath(`navigation-${width}.png`),fullPage:false});
    await nav.getByRole('button',{name:width<768?'So sánh & Đề xuất':'Đi đến So sánh & Đề xuất',exact:true}).click();
    await expect(page.locator('header h1')).toHaveText('So sánh & Đề xuất');
    await expect(page.getByTestId('scenario-suitability')).toBeVisible();
    await expect(page.getByRole('button',{name:'Thêm kịch bản',exact:true})).toBeVisible();
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:info.outputPath(`compare-${width}.png`),fullPage:true});
    await page.goto('/#predict');const panel=page.getByTestId('model-information');await expect(panel).not.toHaveAttribute('open','');
    await panel.locator('summary').first().click();await expect(panel).toHaveAttribute('open','');
    await expect(page.getByTestId('model-summary-metrics')).toContainText('1,500916');
    await expect(page.getByTestId('model-summary-metrics')).toContainText('1,732384');
    await expect(page.getByTestId('model-summary-metrics')).toContainText('-0,000171');
    await expect(page.getByTestId('model-summary-source')).toContainText('snapshot lịch sử');
    await expect(panel).toContainText('Quality Gate = BASELINE_ONLY');
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:info.outputPath(`predict-model-info-${width}.png`),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
for(const url of ['/#insights','/#/insights','/insights','/insights/','/#predict/model-info']){
  test(`N02 legacy or canonical model information URL ${url}`,async({page})=>{
    await page.goto(url);await expect(page).toHaveURL(/\/#predict\/model-info$/);
    await expect(page.locator('header h1')).toContainText('Dự đoán ROI');
    await expect(page.getByTestId('model-information')).toHaveAttribute('open','');
    await expect(page.getByText('Thông tin mô hình',{exact:true})).toBeFocused();
    await expect(page.getByTestId('model-summary-source')).toContainText('model_metrics.json');
  });
}
test('N03 Back/Forward preserves three-page routing and reopens model information',async({page})=>{
  await page.goto('/#dashboard');await page.getByRole('button',{name:'Đi đến Dự đoán ROI',exact:true}).click();
  await expect(page).toHaveURL(/#predict$/);await page.evaluate(()=>{window.location.hash='insights';});
  await expect(page).toHaveURL(/#predict\/model-info$/);
  await page.goBack();await expect(page).toHaveURL(/#predict$/);
  await page.goBack();await expect(page.locator('header h1')).toHaveText('Tổng quan Marketing');
  await page.goForward();await expect(page).toHaveURL(/#predict$/);
  await page.goForward();await expect(page.getByTestId('model-information')).toHaveAttribute('open','');
});
