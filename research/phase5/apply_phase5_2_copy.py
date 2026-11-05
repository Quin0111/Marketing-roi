"""Apply reviewed UI copy changes; never modifies published research/artifacts."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
def edit(name,replacements):
    p=ROOT/name;s=p.read_text(encoding='utf-8')
    for old,new in replacements:
        assert old in s,(name,old)
        s=s.replace(old,new)
    p.write_text(s,encoding='utf-8')
edit('src/constants/translations.ts',[
 ('5,0024 lần','5,0024 theo thang đo dataset'),
 ('`${formatNumberVi(value, decimals)} lần`','`${formatNumberVi(value, decimals)}`')])
edit('src/components/prediction/PredictionResultCard.tsx',[
 ('lần ROI','ROI · thang đo dataset'),
 ('Tuân thủ nghiêm ngặt chuẩn mực học thuật','Đơn vị kinh tế chưa được xác minh'),
 ('Đánh giá 5-Fold Cross-Validation:','Snapshot lịch sử (giới hạn tái lập):')])
for filename in ['ChannelRoiChart.tsx','CampaignTypeRoiChart.tsx','DurationRoiChart.tsx']:
    edit('src/components/charts/'+filename,[(" lần`, 'ROI trung bình'","`, 'ROI minh họa · thang đo dataset'")])
edit('src/components/dashboard/KpiCards.tsx',[
 ("title: 'ROI trung bình'","title: 'ROI minh họa trung bình'"),
 ("unit: 'lần'","unit: 'thang đo dataset'"),
 ('Dữ liệu ghi nhận trong','Quy mô dataset nghiên cứu:')])
edit('src/pages/DashboardPage.tsx',[
 ('Phân bố chuẩn tập trung quanh mốc trung bình 5,0024 lần (Biên độ từ 2,0 đến 8,0 lần)','Histogram minh họa, không phải phân phối đã kiểm toán của dataset nghiên cứu'),
 ('Tác động của hình thức quảng cáo (Tìm kiếm, Mạng xã hội, Người ảnh hưởng, Hiển thị, Email)','Ví dụ hiển thị theo loại chiến dịch; không chứng minh tác động nhân quả'),
 ('Đối chiếu tỷ suất sinh lời','Đối chiếu chỉ số ROI minh họa')])
edit('src/components/layout/Header.tsx',[
 ('Phân tích tổng thể cấu trúc bộ dữ liệu 200.000 chiến dịch và phân phối chỉ số ROI thực tế năm 2021.','Dashboard minh họa giao diện; biểu đồ và chiến dịch mẫu không phải dữ liệu kinh doanh thực tế.'),
 ('Báo cáo thực nghiệm 5-Fold Cross-Validation, đối chiếu Dummy Regressor với Linear Regression, Decision Tree và Random Forest.','Snapshot ROI lịch sử và nghiên cứu Phase 4B được trình bày theo giao thức riêng; mô hình production chưa vượt baseline.')])
edit('src/data/mockDataset.ts',[
 ('Dữ liệu phân tích trong bảng và biểu đồ dưới đây được tổng hợp và lấy mẫu minh họa từ bộ dữ liệu nghiên cứu 200.000 chiến dịch năm 2021. Mô hình Machine Learning đánh giá trên bộ dữ liệu này hiện giữ vai trò nghiên cứu học thuật.',
  'Nguồn quy mô dataset: hồ sơ nghiên cứu Marketing Campaign Performance 2021. Các KPI ROI, bucket biểu đồ và 12 chiến dịch mẫu được hardcode trong src/data/mockDataset.ts để minh họa giao diện; không có quy trình trích xuất được xác minh cho các số minh họa này. ROI giữ trên thang đo dataset, đơn vị kinh tế chưa xác minh. Không dùng biểu đồ để chọn kênh hoặc suy luận hiệu quả kinh doanh.')])
edit('src/components/dashboard/CampaignTable.tsx',[
 ('ROI Thực tế','ROI minh họa'),
 ("{row.roi.toFixed(2).replace('.', ',')} lần","{row.roi.toFixed(2).replace('.', ',')}"),
 ('Dữ liệu minh họa: Bảng dữ liệu là mẫu minh họa được chuẩn hóa từ bộ dữ liệu 200.000 chiến dịch.','Dữ liệu minh họa: 12 bản ghi hardcode cho giao diện, không phải trích xuất đã xác minh từ dataset. ROI theo thang đo dataset.'),
 ('value={selectedType}','aria-label="Lọc loại chiến dịch"\n              value={selectedType}'),
 ('value={selectedChannel}','aria-label="Lọc kênh Marketing"\n              value={selectedChannel}')])
edit('src/components/dashboard/DatasetInfoCard.tsx',[
 ('Thời gian khảo sát','Mốc thời gian trong hồ sơ'),
 ('Ghi nhận liên tục qua các chu kỳ chiến dịch từ 15 đến 60 ngày.','Trường Date có chu kỳ trùng Campaign_ID; không dùng làm bằng chứng về thời gian thu thập thực tế.'),
 ('Thông tin bộ dữ liệu & Giới hạn nghiên cứu','Dataset nghiên cứu & dữ liệu giao diện minh họa')])
edit('src/components/modelInsights/PerformanceOverview.tsx',[
 ('Chuẩn tham chiếu (Trung bình = 5,0024 lần)','Dummy mean được fit trên phần huấn luyện của từng lần đánh giá'),
 ('RMSE thấp nhất (Tốt nhất)','RMSE thấp nhất trong snapshot lịch sử'),
 ('0% thành công','Chưa vượt baseline'),
 ('Số Fold vượt mô hình cơ sở','Bằng chứng từng Fold lịch sử'),
 ("value: '0 / 5'","value: 'Chưa xác minh'"),
 ('Cả 3 mô hình đều thua trên cả 5 lần kiểm định chéo','Thiếu indices và metric từng fold; không suy ra từ mean RMSE'),
 ("badge: 'Chưa vượt qua'","badge: 'Thiếu provenance'")])
edit('src/data/modelResults.ts',[
 ('foldsBeatBaseline: 0','foldsBeatBaseline: null'),
 ('Mô hình cơ sở ngây thơ (Baseline Model) luôn dự đoán giá trị trung bình (5,0024 lần) cho mọi đầu vào. Một mô hình Machine Learning chỉ được xem là có giá trị thực tiễn khi vượt qua được Dummy Regressor một cách có ý nghĩa thống kê.',
  'Dummy mean dự đoán trung bình target của phần fit; constant thay đổi theo fold. Constant artifact gốc là 4,999906285714286 theo audit 4B.1A, không phải ROI trung bình minh họa 5,0024. Vượt baseline dự báo vẫn chưa chứng minh tác động hoặc giá trị kinh doanh.'),
 ('so với cách tiếp cận đơn giản.','so với cách tiếp cận đơn giản; đây là giả thuyết, không phải nguyên nhân đã được xác minh.'),
 ('do hiện tượng học phải nhiễu.','trong snapshot lịch sử; chưa xác minh nguyên nhân chênh lệch.'),
 ('việc lấy trung bình đơn giản của toàn bộ dữ liệu.','baseline trung bình trong tập được đánh giá; không tự đồng nhất với Dummy fit trên fold huấn luyện.')])
p=ROOT/'src/data/modelResults.ts';s=p.read_text(encoding='utf8');s=re.sub(r'export const CV_FOLDS_DETAILS = \[.*?\];\n','',s,flags=re.S);p.write_text(s,encoding='utf8')
edit('src/types/index.ts',[("foldsBeatBaseline: number; // 0/5","foldsBeatBaseline: number | null; // historical per-fold evidence unavailable")])
edit('src/components/common/QualityBadge.tsx',[
 ('Mô hình Machine Learning đã vượt qua mô hình cơ sở với RMSE < 1,732275 và R² > 0.','Trạng thái này không được chấp nhận trong phiên bản triển khai hiện tại. Cần quy trình kiểm chứng riêng trước khi mở khuyến nghị.')])
edit('src/pages/PredictRoiPage.tsx',[
 ('Chưa có khoảng dự đoán được hiệu chuẩn. RMSE không được dùng làm khoảng tin cậy.','Giá trị ROI theo thang đo dataset; đơn vị kinh tế chưa xác minh, không quy đổi sang % hoặc lợi nhuận. Chưa có khoảng dự đoán được hiệu chuẩn. RMSE không được dùng làm khoảng tin cậy.')])
p=ROOT/'index.html';s=p.read_text(encoding='utf8');s=re.sub(r'    <link[^>]+(?:fonts\.google|vite\.svg)[^>]*>\n','',s);s=re.sub(r'<title>.*?</title>','<title>DreamMakers – Marketing ROI Intelligence</title>',s);p.write_text(s,encoding='utf8')
print('Scientific/UI copy updated; historical numeric metrics retained')
