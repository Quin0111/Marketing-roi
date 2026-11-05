import { CampaignFeatures, MarketingScenario } from '../types';
import { SuggestedCampaign } from './campaignSuggestions';
import { createMarketingActionPlan } from './marketingActionPlan';
import { MarketingContext, INDUSTRIES, MARKETING_GOALS } from './marketingContext';
import { isScenario } from './scenarioStorage';
export type Currency='VND'|'USD'|'EUR';
export type CampaignStatus='draft'|'active'|'completed'|'cancelled';
export interface CampaignTask {id:string;title:string;startDay:number;endDay:number;done:boolean}
export interface Expense {id:string;label:string;amount:string;currency:Currency}
export interface Campaign {
 id:string;name:string;notes:string;features:CampaignFeatures;context:MarketingContext;status:CampaignStatus;
 sourceScenarioId?:string;planVersion:number;tasks:CampaignTask[];expenses:Expense[];
 revenue:string;revenueCurrency:Currency;currency:Currency;createdAt:string;updatedAt:string;
}
export const CURRENCIES:Currency[]=['VND','USD','EUR'];
export const CAMPAIGN_STATUSES:Record<CampaignStatus,string>={draft:'Bản nháp',active:'Đang triển khai',completed:'Đã hoàn thành',cancelled:'Đã hủy'};
export function parseMoney(value:string):number|null{
 if(typeof value!=='string'||!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value))return null;
 const n=Number(value);return Number.isFinite(n)&&n<=1_000_000_000_000?n:null;
}
export function campaignFinancials(c:Pick<Campaign,'expenses'|'revenue'|'currency'|'revenueCurrency'|'status'>):{valid:boolean;reason:string;cost:number|null;revenue:number|null;roiPercent:number|null}{
 const invalid=(reason:string)=>({valid:false,reason,cost:null,revenue:null,roiPercent:null});
 if(c.status==='cancelled')return invalid('Chiến dịch đã hủy; dữ liệu giữ để đối soát, không đưa ra tổng kết hiệu quả.');
 if(!CURRENCIES.includes(c.currency)||c.revenueCurrency!==c.currency||c.expenses.some(e=>e.currency!==c.currency))return invalid('Đơn vị tiền tệ không khớp; không tự quy đổi tỷ giá.');
 if(c.revenue==='')return invalid('Chưa nhập doanh thu.');
 const revenue=parseMoney(c.revenue);if(revenue===null)return invalid('Doanh thu không hợp lệ (số không âm, tối đa 2 số lẻ và 10^12).');
 let costCents=0;for(const row of c.expenses){const n=parseMoney(row.amount);if(n===null)return invalid('Chi phí không hợp lệ.');costCents+=Math.round(n*100);}
 const cost=costCents/100;
 if(!Number.isSafeInteger(costCents)||cost>1_000_000_000_000)return invalid('Tổng chi phí vượt giới hạn 10^12.');
 if(cost<=0)return invalid('Chi phí phải dương để tính ROI; không chia cho 0.');
 const roiPercent=(Math.round(revenue*100)-costCents)/costCents*100;
 if(!Number.isFinite(roiPercent))return invalid('ROI không hữu hạn.');
 return {valid:true,reason:'Tính từ số liệu người dùng nhập, chưa được kiểm toán.',cost,revenue,roiPercent};
}
export function campaignReview(c:Campaign):string[]{
 const f=campaignFinancials(c),done=c.tasks.filter(t=>t.done).length;
 const notes=[`Hoàn tất ${done}/${c.tasks.length} hoạt động; tiến độ không chứng minh hiệu quả kinh doanh.`];
 if(c.status!=='completed')notes.push('Số liệu tạm tính; chiến dịch chưa hoàn thành.');
 if(!f.valid)return [...notes,f.reason,'Đối soát chi phí, doanh thu và tracking trước khi kết luận.'];
 notes.push(f.roiPercent!<0?'ROI quy ước âm theo số liệu đã nhập: rà các khoản chi, nguồn doanh thu và dữ liệu còn thiếu.':f.roiPercent===0?'Doanh thu bằng chi phí đã nhập theo công thức quy ước.':'ROI quy ước dương theo số liệu đã nhập; chưa chứng minh tác động nhân quả hoặc độ đầy đủ chi phí.');
 notes.push('Vòng sau: kiểm tra tracking, lưu phiên bản nội dung và giả thuyết cần thử; không trừ ROI % này với predicted_roi trên thang dataset.');return notes;
}
export function buildCampaign(s:Pick<MarketingScenario,'id'|'name'|'features'>,context:MarketingContext={},suggestion?:SuggestedCampaign):Campaign{
 const now=new Date().toISOString(),base=createMarketingActionPlan(s.features,context),plan=suggestion?.plan??base;
 if(suggestion&&(suggestion.ruleVersion!=='campaign-suggestions-v1'||JSON.stringify(plan.features)!==JSON.stringify(base.features)||plan.phases.length!==4))throw new Error('Kế hoạch đề xuất không khớp cấu hình nguồn.');
 const campaign:Campaign={id:crypto.randomUUID(),name:suggestion?.name??s.name,notes:suggestion?[`Nguồn: ${suggestion.ruleVersion} · mẫu ${suggestion.id}`,suggestion.objective,...suggestion.reasons,...suggestion.requirements].join('\n'):'',features:{...plan.features},context:{...context},status:'draft',sourceScenarioId:s.id||undefined,planVersion:1,
  tasks:plan.phases.flatMap(p=>p.activities.map(title=>({id:crypto.randomUUID(),title,startDay:p.startDay,endDay:p.endDay,done:false}))),
  expenses:[],revenue:'',revenueCurrency:'VND',currency:'VND',createdAt:now,updatedAt:now};
 if(suggestion){const failure=validateCampaign(campaign);if(failure)throw new Error(failure);}
 return campaign;
}
export function validateCampaign(c:Campaign):string|null{
 if(!c||typeof c.id!=='string'||!c.id||typeof c.name!=='string'||!c.name.trim()||c.name.length>160||typeof c.notes!=='string')return 'Tên/thông tin chiến dịch không hợp lệ.';
 if(!isScenario({id:c.id,name:c.name,features:c.features,createdAt:c.createdAt,updatedAt:c.updatedAt}))return 'Năm feature không hợp lệ.';
 if(!c.context||c.context.industry!==undefined&&!Object.prototype.hasOwnProperty.call(INDUSTRIES,c.context.industry)||c.context.goal!==undefined&&!Object.prototype.hasOwnProperty.call(MARKETING_GOALS,c.context.goal))return 'Lĩnh vực/mục tiêu không hợp lệ.';
 if(!Object.prototype.hasOwnProperty.call(CAMPAIGN_STATUSES,c.status)||!Number.isInteger(c.planVersion)||c.planVersion<1||!CURRENCIES.includes(c.currency)||!CURRENCIES.includes(c.revenueCurrency))return 'Trạng thái/phiên bản/tiền tệ không hợp lệ.';
 if(!Array.isArray(c.tasks)||new Set(c.tasks.map(t=>t.id)).size!==c.tasks.length||c.tasks.some(t=>!t.id||typeof t.title!=='string'||!t.title.trim()||typeof t.done!=='boolean'||!Number.isInteger(t.startDay)||!Number.isInteger(t.endDay)||t.startDay<1||t.endDay<t.startDay||t.endDay>c.features.durationDays))return 'Hoạt động vượt thời lượng hoặc không hợp lệ.';
 if(!Array.isArray(c.expenses)||new Set(c.expenses.map(e=>e.id)).size!==c.expenses.length||c.expenses.some(e=>!e.id||typeof e.label!=='string'||!e.label.trim()||typeof e.amount!=='string'||parseMoney(e.amount)===null||!CURRENCIES.includes(e.currency)))return 'Khoản chi không hợp lệ.';
 if(typeof c.revenue!=='string'||c.revenue!==''&&parseMoney(c.revenue)===null)return 'Doanh thu không hợp lệ.';
 return null;
}
export function campaignUpdateError(previous:Campaign,next:Campaign):string|null{
 const error=validateCampaign(next);if(error)return error;
 const configurationChanged=JSON.stringify([previous.features,previous.context])!==JSON.stringify([next.features,next.context]);
 if(configurationChanged&&previous.status!=='draft')return 'Chỉ đổi cấu hình ở bản nháp; tạo chiến dịch mới cho cấu hình khác sau khởi chạy.';
 const transitions:Record<CampaignStatus,CampaignStatus[]>={draft:['draft','active','cancelled'],active:['active','completed','cancelled'],completed:['completed'],cancelled:['cancelled']};
 if(!transitions[previous.status].includes(next.status))return 'Chuyển trạng thái không hợp lệ.';
 if(previous.status==='draft'&&next.status==='active'&&createMarketingActionPlan(next.features,next.context).configurationReviewRequired)return 'Cần chỉnh/xác nhận loại chiến dịch và kênh phù hợp trước khi khởi chạy.';
 if(next.status==='completed'&&(!next.tasks.length||next.tasks.some(t=>!t.done)))return 'Hoàn tất các hoạt động trước khi đánh dấu hoàn thành.';
 if(['completed','cancelled'].includes(previous.status)&&JSON.stringify(previous.tasks)!==JSON.stringify(next.tasks))return 'Không sửa hoạt động của chiến dịch đã kết thúc.';
 if(previous.status==='cancelled'&&JSON.stringify([previous.expenses,previous.revenue,previous.currency,previous.revenueCurrency])!==JSON.stringify([next.expenses,next.revenue,next.currency,next.revenueCurrency]))return 'Không sửa tài chính của chiến dịch đã hủy.';
 return null;
}
const KEY='dm_campaigns';
export function loadCampaigns(storage?:Pick<Storage,'getItem'>):{campaigns:Campaign[];notice:string|null;writable:boolean}{
 try{const raw=(storage??window.localStorage).getItem(KEY);if(raw===null)return {campaigns:[],notice:null,writable:true};const value=JSON.parse(raw);
  if(value?.version!==1||!Array.isArray(value.campaigns))return {campaigns:[],notice:'Không đọc được schema chiến dịch. Giữ nguyên dữ liệu gốc; thay đổi chỉ trong bộ nhớ.',writable:false};
  const ids=new Set<string>();let invalid=false;const campaigns=value.campaigns.filter((c:Campaign)=>{try{if(validateCampaign(c)||ids.has(c.id)){invalid=true;return false;}ids.add(c.id);return true;}catch{invalid=true;return false;}});
  return {campaigns,notice:invalid?'Có bản ghi chiến dịch không hợp lệ. Giữ nguyên dữ liệu gốc; thay đổi chỉ trong bộ nhớ.':null,writable:!invalid};
 }catch{return {campaigns:[],notice:'Không đọc được dữ liệu chiến dịch. Giữ nguyên dữ liệu gốc; thay đổi chỉ trong bộ nhớ.',writable:false};}
}
export function saveCampaigns(campaigns:Campaign[],storage?:Pick<Storage,'setItem'>):string|null{
 try{if(campaigns.some(c=>validateCampaign(c)))return 'Không lưu chiến dịch không hợp lệ.';(storage??window.localStorage).setItem(KEY,JSON.stringify({version:1,campaigns}));return null;}catch{return 'Không lưu được chiến dịch trên trình duyệt; dữ liệu hiện chỉ trong bộ nhớ.';}
}
