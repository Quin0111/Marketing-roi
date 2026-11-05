import { ModelMetrics } from '../types';

export const EXPERIMENT_RESULTS: ModelMetrics[] = [
  {
    id: 'dummy',
    name: 'Dummy Regressor (Mô hình cơ sở)',
    category: 'Baseline',
    meanMae: 1.500843,
    meanRmse: 1.732275,
    meanR2: -0.000045,
    beatsBaseline: false,
    foldsBeatBaseline: null,
    description: 'Mô hình cơ sở dự đoán giá trị trung bình tổng thể của tập huấn luyện. Đây là chuẩn mực tối thiểu mà mọi mô hình Machine Learning cần vượt qua.'
  },
  {
    id: 'linear-regression',
    name: 'Linear Regression (Hồi quy tuyến tính)',
    category: 'Machine Learning',
    meanMae: 1.500916,
    meanRmse: 1.732384,
    meanR2: -0.000171,
    beatsBaseline: false,
    foldsBeatBaseline: null,
    description: 'Mô hình hồi quy tuyến tính giả định mối quan hệ tuyến tính giữa các đặc trưng marketing và ROI. Hiệu năng tương đương mô hình cơ sở và chưa vượt qua Baseline.'
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree (Cây quyết định)',
    category: 'Machine Learning',
    meanMae: 1.501221,
    meanRmse: 1.732903,
    meanR2: -0.000771,
    beatsBaseline: false,
    foldsBeatBaseline: null,
    description: 'Mô hình cây quyết định phân chia không gian đặc trưng. Dễ bị ảnh hưởng bởi nhiễu do bản chất phân bố ngẫu nhiên của biến ROI trong bộ dữ liệu.'
  },
  {
    id: 'random-forest',
    name: 'Random Forest (Rừng ngẫu nhiên)',
    category: 'Machine Learning',
    meanMae: 1.502294,
    meanRmse: 1.734325,
    meanR2: -0.002413,
    beatsBaseline: false,
    foldsBeatBaseline: null,
    description: 'Mô hình tổ hợp rừng ngẫu nhiên. Mặc dù là thuật toán phi tuyến mạnh, kết quả kiểm định 5-Fold cho thấy RMSE lớn hơn Dummy Regressor trong snapshot lịch sử; chưa xác minh nguyên nhân chênh lệch.'
  }
];


export const SCIENTIFIC_CONCLUSION = `Qua thực nghiệm 5-Fold Cross-Validation, các mô hình Linear Regression, Decision Tree và Random Forest chưa cải thiện hiệu năng so với Dummy Regressor. Vì vậy, kết quả dự đoán hiện tại chỉ phục vụ mục đích nghiên cứu và minh họa, chưa đủ cơ sở để đưa ra khuyến nghị tối ưu chiến dịch Marketing trong thực tế.`;

export const MODEL_INSIGHT_METRICS_INFO = [
  {
    term: 'MAE (Mean Absolute Error - Sai số tuyệt đối trung bình)',
    definition: 'Sai số tuyệt đối trung bình giữa ROI dự đoán và target quan sát trong dataset. MAE thấp hơn biểu thị sai số dự báo nhỏ hơn theo metric này, không tự chứng minh hiệu quả kinh doanh.'
  },
  {
    term: 'RMSE (Root Mean Squared Error - Căn bậc hai của sai số bình phương trung bình)',
    definition: 'Căn bậc hai của sai số bình phương trung bình trên thang đo target. RMSE nhạy với sai lệch lớn; không phải khoảng dự đoán hoặc bằng chứng đủ để phân bổ ngân sách. Chỉ so sánh trong cùng dataset và giao thức đánh giá.'
  },
  {
    term: 'R² (Hệ số xác định - Coefficient of Determination)',
    definition: 'Tỷ lệ phương sai của biến mục tiêu (ROI) được giải thích bởi các biến đầu vào. Giá trị âm (như -0,000171) chứng tỏ mô hình dự đoán kém hơn cả baseline trung bình trong tập được đánh giá; không tự đồng nhất với Dummy fit trên fold huấn luyện.'
  },
  {
    term: 'Mô hình cơ sở (Baseline / Dummy Regressor) là gì?',
    definition: 'Dummy mean dự đoán trung bình target của phần fit; constant thay đổi theo fold. Constant artifact gốc là 4,999906285714286 theo audit 4B.1A, không phải ROI trung bình minh họa 5,0024. Vượt baseline dự báo vẫn chưa chứng minh tác động hoặc giá trị kinh doanh.'
  },
  {
    term: 'Vì sao mô hình phức tạp không nhất thiết tốt hơn?',
    definition: 'Mô hình phức tạp như Random Forest có thể ghi nhớ nhiễu (noise) trong dữ liệu thay vì học quy luật tổng quát. Khi mối liên hệ giữa các thuộc tính đầu vào và ROI trong bộ dữ liệu có tính ngẫu nhiên cao, các mô hình phức tạp dễ bị suy giảm hiệu năng so với cách tiếp cận đơn giản; đây là giả thuyết, không phải nguyên nhân đã được xác minh.'
  }
];
