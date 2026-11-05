import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const reference=JSON.parse(readFileSync('backend/models/reference_prediction.json','utf8'));
const rows=[1,0].map((index,i)=>{
  const f=reference.cases[index].features;
  return {id:i?'b':'a',name:`Scenario ${i?'B':'A'}`,createdAt:'today',updatedAt:'today',predictedRoi:i?9999:-9999,
    features:{campaignType:f.Campaign_Type,channelUsed:f.Channel_Used,targetAudience:f.Target_Audience,customerSegment:f.Customer_Segment,durationDays:f.Duration_days}};
});
async function load(page:Page){
  await page.addInitScript(rows=>localStorage.setItem('dm_scenarios',JSON.stringify({version:1,scenarios:rows})),rows);
  await page.goto('/#scenarios');await expect(page.getByTestId('scenario-suitability')).toBeVisible();
}
async function channel(page:Page,value:string){await page.getByLabel('Kênh Marketing mong muốn',{exact:true}).selectOption(value);}
async function predict(page:Page,id='a'){
  const card=page.getByTestId(`scenario-card-${id}`);
  await expect(card.getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeEnabled();
  const response=page.waitForResponse(r=>r.url().endsWith('/predict')&&r.request().method()==='POST');
  await card.getByRole('button',{name:'Dự đoán ROI kịch bản'}).click();return response;
}
for(const width of [1440,390]){
  test(`U01 criteria, actual API reference, ties, no match and reset ${width}`,async({page},info)=>{
    test.setTimeout(45000);await page.setViewportSize({width,height:900});await load(page);
    const result=page.getByTestId('suitability-result');await expect(result).toContainText('Hãy chọn tiêu chí');
    await channel(page,'Google Ads');await expect(page.getByTestId('suitability-choice-a')).toBeVisible();
    await expect(page.getByTestId('suitability-roi-a')).not.toContainText('-9999');
    const evidence=[];
    for(const [id,index] of [['a',1],['b',0]] as const){const response=await predict(page,id);const body=await response.json();
      expect(response.status()).toBe(200);expect(response.request().postDataJSON()).toEqual(reference.cases[index].features);
      expect(body.predicted_roi).toBe(reference.cases[index].expected_predictions['Linear Regression']);
      evidence.push({id,request:response.request().postDataJSON(),response:body});
    }
    await expect(page.getByTestId('suitability-roi-a')).toContainText('API /predict');
    await expect(page.getByTestId('suitability-roi-a')).toContainText('BASELINE_ONLY');
    await page.getByTestId('scenario-suitability').screenshot({path:info.outputPath(`suitability-${width}.png`)});
    await channel(page,'Facebook');await expect(page.getByTestId('suitability-choice-b')).toBeVisible();await expect(page.getByTestId('suitability-choice-a')).toHaveCount(0);
    await page.getByRole('button',{name:'Xóa tiêu chí'}).click();
    await page.getByLabel('Nhóm khách hàng mong muốn',{exact:true}).selectOption('Women 25-34');
    await expect(result).toContainText('Đồng hạng');await expect(page.getByTestId(/suitability-choice-/)).toHaveCount(2);
    await channel(page,'YouTube');await page.getByLabel('Vai trò: Kênh Marketing',{exact:true}).selectOption('required');
    await expect(result).toContainText('Không có phương án đáp ứng');
    await page.getByRole('button',{name:'Xóa tiêu chí'}).click();await expect(result).toContainText('Hãy chọn tiêu chí');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.getByRole('button',{name:'Quality Gate: BASELINE_ONLY'})).toHaveCount(1);
    await info.attach('suitability-real-api',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
  });
}
test('U02 mandatory limits precede preference scoring, duration maximum/exact and equal weights',async({page})=>{
  await load(page);await channel(page,'Google Ads');
  await page.getByLabel('Thời lượng mong muốn',{exact:true}).selectOption('30');
  await expect(page.getByTestId('suitability-result')).toContainText('Không phương án đủ điều kiện nào khớp ưu tiên');
  await channel(page,'Facebook');await expect(page.getByTestId('suitability-choice-b')).toBeVisible();
  await page.getByLabel('Thời lượng mong muốn',{exact:true}).selectOption('45');
  await page.getByLabel('Cách đối chiếu thời lượng',{exact:true}).selectOption('exact');
  await expect(page.getByTestId('suitability-result')).toContainText('chưa có cơ sở');
  await channel(page,'Google Ads');await expect(page.getByTestId('suitability-choice-a')).toBeVisible();
  await expect(page.getByTestId('suitability-analysis')).toContainText('Không đáp ứng');
  await expect(page.getByText(/trọng số bằng nhau/)).toBeVisible();
});
test('U03 scenario edit/delete recomputes suitability and drops stale referenced prediction',async({page})=>{
  await load(page);await channel(page,'Google Ads');await predict(page);await expect(page.getByTestId('suitability-roi-a')).toContainText('API /predict');
  const card=page.getByTestId('scenario-card-a');await card.getByRole('button',{name:'Chỉnh sửa kịch bản'}).click();
  await page.getByRole('dialog').locator('#scenario-channelUsed').fill('Facebook');await page.getByRole('button',{name:'Lưu thay đổi'}).click();
  await expect(page.getByTestId('suitability-choice-a')).toHaveCount(0);await expect(page.getByTestId('suitability-result')).toContainText('chưa có cơ sở');
  await channel(page,'Facebook');await expect(page.getByTestId(/suitability-choice-/)).toHaveCount(2);
  await expect(page.getByTestId('suitability-roi-a')).toContainText('chưa có kết quả API hiện hành');
  page.on('dialog',d=>d.accept());await card.getByRole('button',{name:'Xóa kịch bản'}).click();
  await expect(page.getByTestId('suitability-choice-a')).toHaveCount(0);await expect(page.getByTestId('suitability-choice-b')).toBeVisible();
});
test('U04 criteria work without Backend, never promote demo ROI or issue recommendation API requests',async({page})=>{
  const requests:string[]=[];page.on('request',r=>{if(['/predict','/optimize'].includes(new URL(r.url()).pathname))requests.push(r.url());});
  await page.route('**/model-info',r=>r.abort('connectionrefused'));await load(page);await channel(page,'Google Ads');
  await expect(page.getByTestId('suitability-choice-a')).toBeVisible();await expect(page.getByTestId('suitability-roi-a')).toContainText('chưa có kết quả API');
  await expect(page.getByTestId('suitability-roi-a')).not.toContainText('-9999');
  await expect(page.getByRole('button',{name:'Quality Gate: UNVERIFIED'})).toBeVisible();
  await expect(page.getByTestId('scenario-card-a').getByRole('button',{name:'Dự đoán ROI kịch bản'})).toBeDisabled();expect(requests).toEqual([]);
  await expect(page.getByTestId('scenario-suitability')).toContainText('không xác nhận hiệu quả kinh doanh tối ưu');
});
