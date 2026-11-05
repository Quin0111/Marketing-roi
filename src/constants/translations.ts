import { ModelQualityStatus } from '../types';

/**
 * Bảng ánh xạ giá trị kỹ thuật sang nhãn tiếng Việt hiển thị
 * Lưu ý: Giá trị key bên dưới là giá trị kỹ thuật gửi đến mô hình Machine Learning / Backend.
 * Tuyệt đối không thay đổi giá trị key.
 */

// 1. Loại chiến dịch (Campaign_Type)
export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  'Display': 'Quảng cáo hiển thị',
  'Email': 'Tiếp thị qua Email',
  'Influencer': 'Tiếp thị qua người ảnh hưởng',
  'Search': 'Quảng cáo tìm kiếm',
  'Social Media': 'Tiếp thị mạng xã hội',
};

// 2. Kênh Marketing (Channel_Used)
export const CHANNEL_LABELS: Record<string, string> = {
  'Email': 'Email',
  'Facebook': 'Facebook',
  'Google Ads': 'Google Ads',
  'Instagram': 'Instagram',
  'Website': 'Website',
  'YouTube': 'YouTube',
};

// 3. Đối tượng mục tiêu (Target_Audience)
export const TARGET_AUDIENCE_LABELS: Record<string, string> = {
  'All Ages': 'Mọi độ tuổi',
  'Men 18-24': 'Nam từ 18–24 tuổi',
  'Men 25-34': 'Nam từ 25–34 tuổi',
  'Women 25-34': 'Nữ từ 25–34 tuổi',
  'Women 35-44': 'Nữ từ 35–44 tuổi',
};

// 4. Phân khúc khách hàng (Customer_Segment)
export const CUSTOMER_SEGMENT_LABELS: Record<string, string> = {
  'Fashionistas': 'Người yêu thích thời trang',
  'Foodies': 'Người yêu thích ẩm thực',
  'Health & Wellness': 'Người quan tâm sức khỏe',
  'Outdoor Adventurers': 'Người yêu thích hoạt động ngoài trời',
  'Tech Enthusiasts': 'Người yêu thích công nghệ',
};

// 5. Thời lượng chiến dịch (Duration_days)
export const DURATION_LABELS: Record<number, string> = {
  15: '15 ngày',
  30: '30 ngày',
  45: '45 ngày',
  60: '60 ngày',
};

// Only declared labels resolve for free-text descriptions.
for (const map of [CAMPAIGN_TYPE_LABELS, CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS, DURATION_LABELS]) Object.setPrototypeOf(map, null);

// 6. Nhãn trạng thái Quality Gate
export const QUALITY_STATUS_LABELS: Record<ModelQualityStatus, string> = {
  'UNVERIFIED': 'Chưa được kiểm chứng',
  'BASELINE_ONLY': 'Chưa vượt mô hình cơ sở',
  'VALIDATED': 'Đã đáp ứng tiêu chí kiểm chứng',
};

// 7. Nhãn mô hình Machine Learning
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'dummy': 'Dummy Regressor (Mô hình cơ sở)',
  'linear-regression': 'Linear Regression (Hồi quy tuyến tính)',
  'decision-tree': 'Decision Tree (Cây quyết định)',
  'random-forest': 'Random Forest (Rừng ngẫu nhiên)',
  'Dummy': 'Dummy Regressor (Mô hình cơ sở)',
  'LinearRegression': 'Linear Regression (Hồi quy tuyến tính)',
  'DecisionTree': 'Decision Tree (Cây quyết định)',
  'RandomForest': 'Random Forest (Rừng ngẫu nhiên)',
};

// 8. Cảnh báo khoa học chuẩn mực theo yêu cầu đồ án
export const SCIENTIFIC_STATEMENTS = {
  qualityGateWarning: 'Các mô hình Machine Learning hiện chưa cải thiện hiệu năng so với Dummy Regressor. Vì vậy, kết quả dự đoán chỉ có giá trị tham khảo trong phạm vi nghiên cứu và chưa đủ cơ sở để đưa ra khuyến nghị tối ưu chiến dịch Marketing.',
  modelEvaluationConclusion: 'Qua thực nghiệm 5-Fold Cross-Validation, các mô hình Linear Regression, Decision Tree và Random Forest chưa cải thiện hiệu năng so với Dummy Regressor. Vì vậy, kết quả dự đoán hiện tại chỉ phục vụ mục đích nghiên cứu và minh họa, chưa đủ cơ sở để đưa ra khuyến nghị tối ưu chiến dịch Marketing trong thực tế.',
  demoModeNotice: 'Dữ liệu minh họa',
  unverifiedPrediction: 'Chưa có kết quả dự đoán được kiểm chứng',
  missingFieldsError: 'Vui lòng nhập đầy đủ thông tin chiến dịch.',
  predictingNotice: 'Đang xử lý yêu cầu dự đoán...',
  predictErrorNotice: 'Không thể thực hiện dự đoán. Vui lòng thử lại.',
  emptyScenariosNotice: 'Bạn chưa tạo kịch bản nào.',
  minScenariosNotice: 'Thêm ít nhất hai kịch bản để thực hiện so sánh.',
  deleteScenarioConfirm: 'Bạn có chắc chắn muốn xóa kịch bản này?',
  savedChangesNotice: 'Đã lưu thay đổi.',
};

/**
 * Định dạng số theo chuẩn tiếng Việt (dấu chấm phân tách hàng nghìn, dấu phẩy phân tách thập phân)
 */
export function formatNumberVi(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Định dạng ROI chuẩn tiếng Việt (ví dụ: 5,0024 theo thang đo dataset)
 */
export function formatRoiVi(value: number, decimals: number = 4): string {
  return `${formatNumberVi(value, decimals)}`;
}

