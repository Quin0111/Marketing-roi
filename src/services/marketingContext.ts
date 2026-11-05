export const INDUSTRIES = {fashion:'Thời trang',technology:'Công nghệ',education:'Giáo dục',food:'Thực phẩm và đồ uống',services:'Dịch vụ',other:'Khác'} as const;
export const MARKETING_GOALS = {awareness:'Tăng nhận diện thương hiệu',leads:'Thu hút khách hàng tiềm năng',conversion:'Tăng chuyển đổi',launch:'Giới thiệu sản phẩm mới'} as const;
export interface MarketingContext { industry?: keyof typeof INDUSTRIES; goal?: keyof typeof MARKETING_GOALS }
export function contextActivities(context: MarketingContext): { preparation: string[]; monitoring: string[] } {
  if(context.industry!==undefined&&!Object.prototype.hasOwnProperty.call(INDUSTRIES,context.industry)||context.goal!==undefined&&!Object.prototype.hasOwnProperty.call(MARKETING_GOALS,context.goal))throw new Error('Lĩnh vực/mục tiêu không hợp lệ.');
  const industry = {
    fashion:'Chọn bộ sản phẩm, ảnh phối đồ và thông tin kích cỡ/chất liệu đã xác minh.',
    technology:'Chuẩn bị demo tính năng, bảng thông số và trang giải thích sản phẩm công nghệ.',
    education:'Chuẩn bị nội dung chương trình, lịch học và biểu mẫu tư vấn; xác minh mọi thông tin đào tạo.',
    food:'Chuẩn bị ảnh món, thành phần và thông tin đặt hàng đã xác nhận.',
    services:'Mô tả phạm vi dịch vụ, quy trình tư vấn và cách đặt lịch, không cam kết kết quả chưa có căn cứ.',
    other:'Làm rõ sản phẩm/dịch vụ, thông điệp và tài liệu đã xác minh với người phụ trách.',
  };
  const goals = {
    awareness:['Chuẩn bị thông điệp nhận diện và quy chuẩn hình ảnh nhất quán.','Theo dõi tiếp cận/hiển thị khi nền tảng cung cấp; chưa suy ra thay đổi nhận biết thương hiệu.'],
    leads:['Kiểm tra CTA tư vấn, biểu mẫu và quy trình tiếp nhận liên hệ có sự đồng ý.','Theo dõi gửi biểu mẫu/liên hệ nếu tracking xác minh; rà chất lượng liên hệ bằng dữ liệu thực tế.'],
    conversion:['Xác định hành động chuyển đổi và kiểm thử tracking trước khi sử dụng báo cáo.','Theo dõi chuyển đổi chỉ khi tracking hoạt động; đối soát với dữ liệu người dùng nhập, không suy ra doanh thu từ nhấp.'],
    launch:['Chuẩn bị thông tin sản phẩm mới, nội dung giới thiệu và trang giải đáp.','Theo dõi phản hồi và hành động trên nội dung giới thiệu nếu có dữ liệu.'],
  };
  return {preparation:[...(context.industry?[industry[context.industry]]:[]),...(context.goal?[goals[context.goal][0]]:[])],monitoring:context.goal?[goals[context.goal][1]]:[]};
}
