import { CampaignFeatures } from '../types';
import { CHANNEL_LABELS, CUSTOMER_SEGMENT_LABELS, TARGET_AUDIENCE_LABELS } from '../constants/translations';
import { validDescription } from './campaignInput';
import { ActionPlan, createMarketingActionPlan } from './marketingActionPlan';
import { contextActivities, INDUSTRIES, MarketingContext, MARKETING_GOALS } from './marketingContext';

export interface SuggestedCampaign {
  id:string; ruleVersion:'campaign-suggestions-v1'; name:string; objective:string;
  reasons:string[]; audience:string; channel:string; requirements:string[]; plan:ActionPlan;
}
interface Blueprint { id:string; title:string; prepare:string; launch:string; monitor:string; requirements?:string[] }
const industryBriefs = {
  fashion:{subject:'bộ sưu tập thời trang',assets:'ảnh phối đồ, bảng kích cỡ và chất liệu đã xác minh',intent:'mẫu trang phục, chất liệu và tư vấn kích cỡ'},
  technology:{subject:'sản phẩm công nghệ',assets:'demo tính năng, bảng thông số và giới hạn sử dụng đã kiểm tra',intent:'giải pháp, tính năng và đăng ký demo'},
  education:{subject:'chương trình học',assets:'nội dung chương trình, lịch học, điều kiện tham gia và thông tin giảng dạy đã xác minh',intent:'nội dung học, lịch học và yêu cầu tư vấn'},
  food:{subject:'thực đơn và sản phẩm ẩm thực',assets:'ảnh món, thành phần, thông tin đặt hàng và khả năng phục vụ đã xác nhận',intent:'món ăn, thành phần và cách đặt hàng'},
  services:{subject:'dịch vụ tư vấn',assets:'phạm vi dịch vụ, quy trình làm việc, thông tin liên hệ và cách đặt lịch đã xác minh',intent:'nhu cầu dịch vụ, phạm vi hỗ trợ và đặt lịch tư vấn'},
  other:{subject:'sản phẩm hoặc dịch vụ theo brief',assets:'brief sản phẩm, tư liệu và thông tin đã được người phụ trách duyệt',intent:'nhu cầu và thuật ngữ phải xác minh với chủ sản phẩm'},
} as const;
const goalBriefs = {
  awareness:{action:'giới thiệu',objective:'Trình bày thông điệp và dấu hiệu nhận diện nhất quán',cta:'xem nội dung giới thiệu',metric:'Tiếp cận/hiển thị nếu có báo cáo; không suy ra mức tăng nhận biết'},
  leads:{action:'tư vấn',objective:'Tạo luồng tiếp nhận nhu cầu tư vấn có sự đồng ý',cta:'gửi yêu cầu tư vấn qua biểu mẫu hoặc liên hệ đã kiểm tra',metric:'Yêu cầu tư vấn và chất lượng liên hệ nếu có dữ liệu và sự đồng ý'},
  conversion:{action:'hành động chuyển đổi',objective:'Kiểm thử luồng thực hiện hành động chuyển đổi do chủ chiến dịch xác nhận',cta:'hoàn tất hành động đã định nghĩa trên trang đích',metric:'Chuyển đổi chỉ khi tracking đã kiểm thử; không suy doanh thu từ click'},
  launch:{action:'ra mắt',objective:'Giới thiệu thông tin mới và tiếp nhận câu hỏi về sản phẩm',cta:'xem trang giới thiệu và gửi câu hỏi',metric:'Lượt xem nội dung, nhấp và câu hỏi thực sự ghi nhận được'},
} as const;

// Editorial rules, not learned affinity or an estimate of business impact.
export function createCampaignSuggestions(features:CampaignFeatures, context:MarketingContext, selectionReasons:readonly string[]=[]):{campaigns:SuggestedCampaign[];issues:string[]} {
  const issues:string[]=[];
  if(!context.industry)issues.push('Chọn lĩnh vực kinh doanh để xây dựng brief chiến dịch.');
  if(!context.goal)issues.push('Chọn mục tiêu Marketing để xác định hành động và chỉ số cần theo dõi.');
  if(!validDescription(features))issues.push('Mô tả hoặc thời lượng chưa hợp lệ.');
  if(issues.length)return {campaigns:[],issues};
  try{contextActivities(context);}catch{return {campaigns:[],issues:['Lĩnh vực hoặc mục tiêu chưa được hỗ trợ; cần xác minh lại.']};}
  const base=createMarketingActionPlan(features,context);
  if(base.configurationReviewRequired)return {campaigns:[],issues:['Chưa đủ thông tin để đề xuất chiến dịch cụ thể: cần xác nhận loại chiến dịch và khả năng triển khai của kênh. Kế hoạch chung bên dưới chỉ là bản nháp xác minh.']};
  const industry=context.industry!,goal=context.goal!,b=industryBriefs[industry],g=goalBriefs[goal];
  const objective=`${g.objective} cho ${b.subject}; CTA tham khảo: ${g.cta}.`;
  const audience=`${TARGET_AUDIENCE_LABELS[features.targetAudience]||features.targetAudience} · ${CUSTOMER_SEGMENT_LABELS[features.customerSegment]||features.customerSegment}`;
  const blueprints:Blueprint[]=[];
  const add=(id:string,title:string,prepare:string,launch:string,monitor:string,requirements:string[]=[])=>blueprints.push({id,title,prepare,launch,monitor,requirements});
  switch(features.channelUsed){
    case 'Instagram':
      add('instagram-series',`Instagram: ${g.action} ${b.subject}`,`Chuẩn bị carousel/ảnh về ${b.subject}, dùng ${b.assets}; soạn caption và CTA ${g.cta}.`,
        `Đăng chuỗi nội dung ${g.action}; kiểm tra ảnh trên điện thoại, đường dẫn hồ sơ và cách ${g.cta}.`,
        'Rà phản hồi từng bài, lưu thay đổi caption/ảnh và ghi nhận nhấp khi có tracking.');
      if(features.campaignType!=='Display')add('instagram-reels',`Reels: ${g.action} ${b.subject}`,`Soạn kịch bản Reels trình bày ${b.subject}; quay tư liệu ${b.assets} và duyệt quyền hình/âm thanh.`,
        `Đăng Reels có đoạn mở đầu, phụ đề và CTA ${g.cta}; kiểm tra video dọc trước khi xuất bản.`,
        'Rà thời gian xem và tương tác Reels khi có Insights; ghi nhận câu hỏi, thử lại đoạn mở đầu dựa trên dữ liệu thu thập được.');
      break;
    case 'Google Ads':
      if(features.campaignType==='Search'){
        add('google-search',`Tìm kiếm: ${g.action} ${b.subject}`,`Nghiên cứu nhóm từ khóa về ${b.intent}, soạn từ khóa phủ định và nội dung tìm kiếm khớp trang đích.`,
          `Thiết lập nhóm quảng cáo tìm kiếm đã duyệt; kiểm tra CTA ${g.cta} và tracking trước khi chạy.`,
          'Rà cụm từ tìm kiếm, lượt nhấp và biểu mẫu/chuyển đổi nếu được đo; lưu nhật ký thay đổi từ khóa và quảng cáo.',
          ['Cần tài khoản, ngân sách được chủ sở hữu phê duyệt, trang đích và cấu hình đo lường; hệ thống không tự cấp ngân sách.']);
        if(goal!=='awareness')add('google-keyword-test',`Đối chiếu từ khóa và nội dung: ${b.subject}`,`Chuẩn bị giả thuyết và các biến thể từ khóa/nội dung về ${b.intent}; ghi rõ biến cần đối chiếu và trang đích dùng chung.`,
          `Triển khai phương án đối chiếu được duyệt; chỉ thay biến đã ghi nhận, kiểm tra CTA ${g.cta}.`,
          'Lưu dữ liệu quan sát theo từng phiên bản và hạn chế cỡ mẫu; chưa kết luận tác động nhân quả hoặc chiến dịch hiệu quả hơn.',
          ['Cần giao thức phân nhóm/đo lường hợp lệ nếu muốn gọi đây là A/B test nhân quả; không suy tác động từ khác biệt quan sát.']);
      }else add('google-display',`Hiển thị: ${g.action} ${b.subject}`,`Chuẩn bị bộ banner/ảnh về ${b.subject} từ ${b.assets}; kiểm tra kích thước và trang đích.`,
        `Thiết lập nội dung hiển thị đã duyệt và CTA ${g.cta}; chưa chạy khi tài khoản/ngân sách chưa được xác nhận.`,
        'Rà vị trí hiển thị, biến thể ảnh và nhấp thực tế; đo chuyển đổi chỉ khi tracking hoạt động.');
      break;
    case 'Facebook':
      add('facebook-page',`Facebook Page: ${g.action} ${b.subject}`,`Soạn chuỗi bài Page về ${b.subject} với ${b.assets}; chuẩn bị câu trả lời và CTA ${g.cta}.`,
        `Đăng bài Page theo lịch đã duyệt, kiểm tra bình luận/hộp thư và đường dẫn để ${g.cta}.`,
        'Phân loại câu hỏi, ghi nhận tương tác/nhấp khi báo cáo khả dụng; sửa nội dung theo phản hồi thực tế.');
      break;
    case 'YouTube':
      add('youtube-video',`YouTube: video ${g.action} ${b.subject}`,`Lập kịch bản video trình bày ${b.subject}; chuẩn bị ${b.assets}, thumbnail và phụ đề.`,
        `Xuất bản video đã duyệt, kiểm tra thumbnail/phụ đề và liên kết để ${g.cta}.`,
        'Rà thời gian xem, CTR thumbnail khi YouTube cung cấp; ghi lại điểm cần giải thích rõ hơn và phản hồi người xem.');
      break;
    case 'Email':
      add('email-sequence',`Email: ${g.action} ${b.subject}`,`Soạn nội dung email về ${b.subject} dùng ${b.assets}; kiểm tra danh sách có sự đồng ý, CTA ${g.cta} và hủy đăng ký.`,
        'Gửi email thử, rà liên kết và hiển thị di động; chỉ gửi danh sách được phép sau khi chủ chiến dịch duyệt.',
        'Theo dõi gửi thành công, thư trả lại, nhấp và hủy đăng ký; không coi lượt mở là bằng chứng hiệu quả kinh doanh.',
        ['Cần danh sách người nhận hợp lệ, quyền gửi và quy trình hủy đăng ký; không tự thu thập hoặc gửi email.']);
      break;
    case 'Website':
      add('website-landing',`Landing page: ${g.action} ${b.subject}`,`Chuẩn bị trang đích về ${b.subject} với ${b.assets}; thiết kế CTA ${g.cta} và trạng thái lỗi/hoàn tất.`,
        'Xuất bản bản trang đã duyệt, kiểm tra luồng di động, biểu mẫu và sự kiện analytics nếu có quyền.',
        'Rà nhấp CTA, lỗi biểu mẫu và hành động hoàn tất nếu tracking xác minh; lưu phiên bản trang.',
        ['Website là điểm đến; còn cần xác định nguồn truy cập và người phụ trách phân phối, không tự giả định có lưu lượng.']);
      break;
  }
  if(features.campaignType==='Influencer'&&['awareness','launch'].includes(goal)&&['Instagram','Facebook','YouTube'].includes(features.channelUsed)){
    add('creator-collaboration',`Hợp tác nhà sáng tạo: ${b.subject}`,`Chuẩn bị brief ${b.subject}, ${b.assets}, tiêu chí đối tác và yêu cầu công khai quan hệ hợp tác.`,
      `Chỉ phát hành nội dung hợp tác trên ${features.channelUsed} sau khi có người sáng tạo, quyền sử dụng và nội dung được duyệt.`,
      'Ghi nhận dữ liệu thực sự được chia sẻ từ nội dung hợp tác và nhật ký phản hồi; không suy doanh số từ lượt xem.',
      ['Chưa có đối tác, thỏa thuận, quyền sử dụng hoặc chi phí đã xác nhận; chỉ là đề xuất có điều kiện.']);
  }
  const commonRequirements=[`Xác nhận sản phẩm thực tế, ${b.assets}, người phụ trách và lịch làm việc trước triển khai.`,
    `Nhóm ${audience} là brief người dùng, chưa phải bằng chứng có thể tiếp cận/nhắm chọn trên tài khoản.`,
    'Chưa có số liệu vận hành hoặc mục tiêu định lượng; xác minh quyền tài khoản, nguồn dữ liệu và tracking trước đo lường.',
    ...(industry==='other'?['Lĩnh vực Khác cần bổ sung brief sản phẩm/dịch vụ cụ thể với người phụ trách.']:[])];
  return {issues:[],campaigns:blueprints.map(bp=>{
    const additions=[bp.prepare,bp.launch,bp.monitor,`Tổng kết chiến dịch “${bp.title}”: lưu tư liệu, nhật ký, dữ liệu có thật và các điều kiện còn thiếu.`];
    const requirements=[...commonRequirements,...(bp.requirements??[])];
    return {id:bp.id,ruleVersion:'campaign-suggestions-v1',name:bp.title,objective,audience,channel:features.channelUsed,
      reasons:[...selectionReasons,`Mẫu ${bp.id} khớp kênh ${CHANNEL_LABELS[features.channelUsed]||features.channelUsed}, loại ${features.campaignType}; dùng brief ${INDUSTRIES[industry]} và mục tiêu ${MARKETING_GOALS[goal]}. Không phải bằng chứng hiệu quả.`],requirements,
      plan:{...base,notes:[...base.notes,...requirements,'Các chiến dịch là lựa chọn triển khai riêng hoặc chạy song song trong cùng thời lượng; không cộng lịch nối tiếp. Cần kiểm tra nguồn lực trước khi chạy đồng thời.'],
        phases:base.phases.map((phase,i)=>({...phase,name:i===1?'Triển khai':phase.name,activities:[additions[i],...phase.activities],metrics:i===0?phase.metrics:[g.metric,...phase.metrics]}))}};
  })};
}
