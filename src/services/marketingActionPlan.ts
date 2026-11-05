import { CampaignFeatures, CampaignType, DurationDays } from '../types';
import { CAMPAIGN_TYPE_LABELS, CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS } from '../constants/translations';
import { validDescription } from './campaignInput';
import { contextActivities, MarketingContext } from './marketingContext';

interface ChannelTemplate {
  prepare: string[]; launch: string[]; monitor: string[]; metrics: string[];
  outputs: [string,string,string,string]; types: CampaignType[];
}
export interface PlanPhase { name: string; startDay: number; endDay: number; activities: string[]; expectedOutput: string; metrics: string[] }
export interface ActionPlan {
  templateVersion: 'action-plan-v1'; features: CampaignFeatures; brief: string;
  configurationReviewRequired: boolean; notes: string[]; phases: PlanPhase[];
}
const channels: Record<string, ChannelTemplate> = {
  Instagram: {
    prepare: ['Chuẩn bị ảnh, video dọc và kịch bản Reels; kiểm tra quyền sử dụng tư liệu.', 'Soạn caption, CTA và lịch đăng bài/Reels; kiểm tra liên kết hồ sơ hoặc trang đích.'],
    launch: ['Đăng bài/Reels theo lịch đã duyệt, kiểm tra hiển thị trên điện thoại.', 'Chỉ thử nghiệm mẫu quảng cáo khi có quyền tài khoản và ngân sách được phê duyệt; nếu chưa đủ điều kiện, chỉ đăng nội dung tự nhiên.'],
    monitor: ['Ghi nhận tiếp cận, tương tác, thời gian xem Reels và nhấp khi công cụ cung cấp.', 'Rà phản hồi; chỉnh hình ảnh, đoạn mở đầu và caption, lưu nhật ký thay đổi.'],
    metrics: ['Tiếp cận và tương tác nếu Insights khả dụng', 'Thời gian xem Reels nếu có video', 'Nhấp liên kết nếu có tracking'],
    outputs: ['Bộ ảnh/video, caption và lịch Instagram.', 'Bài đăng/Reels đã kiểm tra; cấu hình thử nghiệm nếu có.', 'Nhật ký nội dung và phản hồi Instagram.', 'Báo cáo Instagram và nội dung cần thử tiếp.'], types:['Social Media','Influencer','Display'],
  },
  Facebook: {
    prepare: ['Chuẩn bị bài Page, ảnh/video và mẫu trả lời bình luận; rà quyền quản trị.', 'Lập lịch bài đăng và kiểm tra liên kết trang đích trên điện thoại.'],
    launch: ['Xuất bản bài trên Page theo lịch đã duyệt; kiểm tra bình luận và hộp thư.', 'Chỉ thử nghiệm quảng cáo khi chủ tài khoản duyệt nội dung, cấu hình và ngân sách; ghi rõ biến thể đối chiếu.'],
    monitor: ['Theo dõi Page/Meta Business Suite khi có quyền; ghi nhận tiếp cận, tương tác và nhấp.', 'Phân loại bình luận, cập nhật câu trả lời và điều chỉnh nội dung; ghi nhật ký thay đổi.'],
    metrics:['Tiếp cận và tương tác khi công cụ cung cấp','Nhấp liên kết nếu có tracking','Bình luận/tin nhắn cần xử lý'],
    outputs:['Lịch nội dung Page, tư liệu và mẫu phản hồi.','Bài đăng Facebook và checklist phát hành.','Nhật ký Page và phản hồi.','Báo cáo Facebook cùng hạn chế dữ liệu.'], types:['Social Media','Influencer','Display'],
  },
  'Google Ads': {
    prepare:['Xác nhận Search hay Display và quyền tài khoản; kiểm tra landing page, liên kết và mục tiêu đo lường.','Chuẩn bị nội dung và tài sản quảng cáo theo định dạng được xác nhận.'],
    launch:['Tạo bản nháp chiến dịch; kiểm tra định dạng và nhắm chọn theo loại đã xác nhận.','Chỉ bật chiến dịch sau khi chủ tài khoản duyệt cấu hình/ngân sách; xác minh conversion tracking trước khi sử dụng báo cáo chuyển đổi.'],
    monitor:['Rà nội dung quảng cáo và trang đích, ghi lại các thay đổi cấu hình.','Theo dõi hiển thị và nhấp; chỉ báo cáo chuyển đổi khi tracking đã xác minh, không suy ra lợi nhuận.'],
    metrics:['Hiển thị và nhấp khi chiến dịch hoạt động','CTR theo báo cáo nền tảng nếu khả dụng','Chuyển đổi chỉ khi tracking đã xác minh'],
    outputs:['Brief Search/Display, tài sản quảng cáo và landing page đã kiểm tra.','Cấu hình đã duyệt hoặc bản nháp chờ phê duyệt.','Nhật ký từ khóa/vị trí và nội dung.','Báo cáo Google Ads cùng câu hỏi đo lường còn thiếu.'],types:['Search','Display'],
  },
  Email: {
    prepare:['Rà danh sách đã đồng ý nhận tin, địa chỉ gửi và đường dẫn hủy đăng ký.','Soạn tiêu đề, nội dung và CTA; gửi thử nội bộ để kiểm tra liên kết/hiển thị trên điện thoại.'],
    launch:['Duyệt email thử và danh sách nhận trước khi gửi.','Gửi theo lịch đã duyệt cho danh sách hợp lệ; không tự thêm người chưa đồng ý nhận tin.'],
    monitor:['Theo dõi gửi thành công, thư trả lại, hủy đăng ký và nhấp nếu hệ thống cung cấp.','Rà lỗi/phản hồi; điều chỉnh tiêu đề, CTA hoặc lịch gửi cho đợt tiếp theo được duyệt.'],
    metrics:['Gửi thành công và thư trả lại','Nhấp khi có tracking','Hủy đăng ký; lượt mở chỉ tham khảo do sai lệch đo lường'],
    outputs:['Danh sách hợp lệ, nội dung email và bản thử.','Email được duyệt và nhật ký gửi.','Nhật ký phân phối email và điều chỉnh.','Báo cáo gửi/nhấp/hủy đăng ký.'],types:['Email'],
  },
  Website: {
    prepare:['Rà landing page: nội dung, CTA, biểu mẫu, liên kết và hiển thị trên điện thoại.','Chuẩn bị quy ước UTM; kiểm tra sự kiện analytics/biểu mẫu khi có quyền và sự đồng ý phù hợp.'],
    launch:['Xuất bản landing page đã duyệt; kiểm tra biểu mẫu, thông báo lỗi và luồng hoàn tất.','Ghi lại phiên bản trang; phối hợp với người phụ trách nguồn truy cập ngoài Website.'],
    monitor:['Theo dõi truy cập, nhấp CTA và gửi biểu mẫu khi tracking hoạt động.','Sửa lỗi liên kết/biểu mẫu, rà nội dung chưa rõ và lưu nhật ký phiên bản.'],
    metrics:['Truy cập nếu analytics khả dụng','Nhấp CTA/gửi biểu mẫu nếu tracking đã xác minh','Lỗi biểu mẫu và liên kết'],
    outputs:['Landing page và danh mục sự kiện cần kiểm tra.','Phiên bản Website đã kiểm tra/phát hành.','Nhật ký lỗi, sự kiện và thay đổi Website.','Báo cáo hành vi Website cùng hạn chế attribution.'],types:['Search','Display','Email','Social Media','Influencer'],
  },
  YouTube: {
    prepare:['Chuẩn bị kịch bản video, thumbnail, tiêu đề, mô tả và phụ đề; kiểm tra quyền hình/âm thanh.','Kiểm tra kênh, lịch phát hành và liên kết mô tả; xác nhận video dài hoặc Shorts.'],
    launch:['Tải video kiểm tra, rà phụ đề/thumbnail trên điện thoại rồi xuất bản theo lịch đã duyệt.','Kiểm tra liên kết/bình luận; chỉ thử quảng cáo video khi chủ tài khoản duyệt cấu hình và ngân sách riêng.'],
    monitor:['Theo dõi YouTube Studio: lượt xem, hiển thị/CTR thumbnail và thời gian xem khi có dữ liệu.','Rà điểm người xem rời video và phản hồi; điều chỉnh thumbnail, tiêu đề hoặc cách mở đầu cho nội dung tiếp theo.'],
    metrics:['Lượt xem và thời gian xem','Hiển thị/CTR thumbnail trong phạm vi YouTube đo được','Nhấp liên kết nếu có tracking'],
    outputs:['Video, thumbnail, phụ đề và lịch phát hành.','Video/Shorts đã kiểm tra và phát hành.','Nhật ký video và báo cáo YouTube Studio.','Báo cáo video và giả thuyết cần kiểm tra tiếp.'],types:['Social Media','Influencer','Display'],
  },
};
const typeTasks: Record<string,string> = {
  Search:'Xác định ý định tìm kiếm và từ khóa phù hợp với thông điệp/trang đích; không coi mọi kênh đều hỗ trợ định dạng Search.',
  Display:'Chuẩn bị biến thể ảnh/banner và thông điệp ngắn; kiểm tra kích thước theo vị trí hiển thị thực tế.',
  Email:'Duyệt chuỗi email, tiêu đề và CTA; nếu kênh khác Email, xác nhận vai trò của kênh trước.',
  'Social Media':'Lập trụ cột nội dung xã hội và quy trình phản hồi; phối hợp nguồn phân phối riêng nếu kênh là điểm đến.',
  Influencer:'Chuẩn bị brief hợp tác nhà sáng tạo, quyền sử dụng nội dung và cách công khai quan hệ hợp tác.',
};
const segmentTasks: Record<string,string> = {
  Fashionistas:'Chuẩn bị tư liệu phối trang phục và ảnh sản phẩm được phép sử dụng theo brief thời trang.',
  Foodies:'Chuẩn bị ảnh món ăn, thành phần và thông tin sản phẩm đã xác minh theo brief ẩm thực.',
  'Health & Wellness':'Rà căn cứ cho nội dung sức khỏe; loại bỏ cam kết điều trị hoặc công dụng chưa xác minh.',
  'Outdoor Adventurers':'Chuẩn bị tư liệu sử dụng ngoài trời và thông tin an toàn đã kiểm tra.',
  'Tech Enthusiasts':'Chuẩn bị demo tính năng và thông số sản phẩm đã kiểm tra, không thêm công dụng chưa xác minh.',
};
const boundaries: Record<DurationDays,readonly number[]> = {15:[3,5,13,15],30:[6,9,27,30],45:[9,14,40,45],60:[12,18,54,60]};
export function createMarketingActionPlan(features: CampaignFeatures, context: MarketingContext = {}): ActionPlan {
  if(!validDescription(features)) throw new Error('Cấu hình kế hoạch không hợp lệ.');
  const knownChannel=Object.prototype.hasOwnProperty.call(channels,features.channelUsed);
  const t:ChannelTemplate=knownChannel?channels[features.channelUsed]:{
    prepare:[`Xác minh khả năng và điều kiện sử dụng kênh “${features.channelUsed}”; thu thập tài liệu chính thức trước khi triển khai.`, 'Chuẩn bị brief, nội dung và checklist tracking; chưa giả định định dạng quảng cáo của kênh mới.'],
    launch:['Chưa khởi chạy: người phụ trách cần xác nhận quyền tài khoản, định dạng và quy trình của kênh mới.'],
    monitor:['Xác định chỉ số thực sự có thể thu thập và lưu nhật ký thay đổi; chưa giả định có conversion tracking.'],
    metrics:['Chưa xác minh chỉ số của kênh; bổ sung sau khi kiểm tra tài liệu và tracking'],
    outputs:['Brief và danh mục thông tin còn thiếu.','Checklist cần xác nhận trước triển khai.','Nhật ký quan sát nếu có dữ liệu.','Tổng kết dữ liệu đã thu thập cùng giới hạn.'], types:[]
  };
  const d=features.durationDays;
  const ends=boundaries[d as DurationDays]??[Math.max(1,Math.floor(d*.2)),Math.max(1,Math.ceil(d*.3)),Math.max(1,Math.floor(d*.9)),d];
  const configurationReviewRequired=!knownChannel||!t.types.includes(features.campaignType as CampaignType);
  const notes=['Template action-plan-v1 do quy tắc tạo; Linear Regression chỉ dự đoán ROI, không tạo hay tối ưu kế hoạch.',
    'Lịch tương đối từ ngày 1. Cần xác nhận quyền tài khoản, nhân sự, tư liệu và tracking. Chỉ số là danh mục cần theo dõi, chưa có giá trị thực tế.',
    'Nhóm khách hàng/phân khúc là brief người dùng chọn, không là bằng chứng về hành vi. Cần xác nhận khả năng nhắm chọn và chính sách của tài khoản.'];
  if(d<4) notes.push('Thời lượng dưới 4 ngày: các giai đoạn có thể cùng ngày; thứ tự thực hiện giữ nguyên.');
  if(!knownChannel) notes.push('Kênh mới chưa có template chuyên biệt: kế hoạch là checklist xác minh, cần người phụ trách hoàn thiện trước khi triển khai.');
  if(configurationReviewRequired) notes.push('Cần xác nhận lại tổ hợp loại chiến dịch/kênh. API chấp nhận nhãn không đồng nghĩa có định dạng triển khai tương ứng; không khởi chạy cấu hình chưa xác nhận.');
  if(features.channelUsed==='Website') notes.push('Website là điểm đến; chưa xác định nguồn thu hút truy cập hoặc cấu hình quảng cáo ngoài Website.');
  let prepare=t.prepare, monitor=t.monitor;
  if(features.channelUsed==='Google Ads' && features.campaignType==='Search') {
    prepare=[t.prepare[0],'Nghiên cứu từ khóa, nhóm ý định và từ khóa phủ định; soạn tiêu đề/mô tả quảng cáo tìm kiếm.'];
    monitor=['Kiểm tra cụm từ tìm kiếm và từ khóa phủ định; rà mức khớp nội dung quảng cáo với trang đích.',t.monitor[1]];
  } else if(features.channelUsed==='Google Ads' && features.campaignType==='Display') {
    prepare=[t.prepare[0],'Chuẩn bị bộ ảnh, tiêu đề và mô tả cho quảng cáo hiển thị; kiểm tra kích thước tài sản.'];
    monitor=['Rà vị trí/nội dung hiển thị và biến thể ảnh/tiêu đề; ghi lại thay đổi.',t.monitor[1]];
  }
  const activities=[
    [...prepare,(Object.prototype.hasOwnProperty.call(typeTasks,features.campaignType)?typeTasks[features.campaignType]:`Xác minh định dạng và yêu cầu cho loại chiến dịch “${features.campaignType}”; chưa có template chuyên biệt.`),(Object.prototype.hasOwnProperty.call(segmentTasks,features.customerSegment)?segmentTasks[features.customerSegment]:`Làm rõ nhu cầu phân khúc “${features.customerSegment}” từ brief người dùng; chưa có bằng chứng hành vi.`),`Duyệt thông điệp cho ${TARGET_AUDIENCE_LABELS[features.targetAudience]||features.targetAudience}; xác nhận khả năng nhắm chọn, không suy đoán hành vi từ nhãn nhóm.`],
    configurationReviewRequired ? ['Chưa khởi chạy: xác nhận hoặc chỉnh lại loại chiến dịch/kênh trước.',...t.launch.map(task=>`Sau khi cấu hình được xác nhận: ${task}`)] : t.launch,
    monitor,
    [`Tổng hợp báo cáo ${CHANNEL_LABELS[features.channelUsed]||features.channelUsed} thực sự truy cập được; ghi rõ chỉ số thiếu hoặc tracking chưa xác minh.`,'Đối chiếu với brief và nhật ký thay đổi; lưu tư liệu, hạn chế đo lường và việc cần thử tiếp. Không quy khác biệt quan sát thành tác động kinh doanh.'],
  ];
  const contextual=contextActivities(context);
  activities[0]=[...activities[0],...contextual.preparation];
  activities[2]=[...activities[2],...contextual.monitoring];
  return {templateVersion:'action-plan-v1',features:{campaignType:features.campaignType,channelUsed:features.channelUsed,targetAudience:features.targetAudience,customerSegment:features.customerSegment,durationDays:features.durationDays},configurationReviewRequired,notes,
    brief:`${CAMPAIGN_TYPE_LABELS[features.campaignType]||features.campaignType} · ${CHANNEL_LABELS[features.channelUsed]||features.channelUsed} · ${TARGET_AUDIENCE_LABELS[features.targetAudience]||features.targetAudience} · ${CUSTOMER_SEGMENT_LABELS[features.customerSegment]||features.customerSegment} · ${features.durationDays} ngày`,
    phases:['Chuẩn bị','Khởi chạy','Theo dõi và điều chỉnh','Tổng kết'].map((name,index)=>({name,startDay:index===0?1:Math.min(ends[index],ends[index-1]+1),endDay:ends[index],activities:activities[index],expectedOutput:t.outputs[index],metrics:index===0?['Hoàn tất checklist nội dung, quyền và đo lường (chưa phải kết quả chiến dịch)']:t.metrics}))};
}
