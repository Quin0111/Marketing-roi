# Đánh giá theo lĩnh vực và mục tiêu Marketing

Ngày 04/11/2026. Đã triển khai trong cùng luồng Compare, không tạo bộ xếp hạng ROI mới.

## Cấu trúc dữ liệu

`MarketingContext` gồm hai field tùy chọn tại Frontend:

| Field | Giá trị |
|---|---|
| industry | fashion, technology, education, food, services, other |
| Nhãn | Thời trang, Công nghệ, Giáo dục, Thực phẩm và đồ uống, Dịch vụ, Khác |
| goal | awareness, leads, conversion, launch |
| Nhãn | Nhận diện thương hiệu, Khách hàng tiềm năng, Chuyển đổi, Sản phẩm mới |

Định nghĩa tập trung `src/services/marketingContext.ts`. Không đưa vào năm feature, không sửa POST /predict, không thêm model hoặc endpoint. F01 E2E ghi payload thực chỉ có Campaign_Type, Channel_Used, Target_Audience, Customer_Segment, Duration_days dù UI đã chọn ngành/mục tiêu.

## Quy tắc minh bạch

- Tái sử dụng `evaluateScenarioSuitability`: lọc tất cả bắt buộc trước, ưu tiên mỗi match=1, giữ mọi đồng hạng.
- **Không cộng điểm ngành/mục tiêu**: source hiện tại không có chứng cứ ngành–kênh/hiệu quả để định trọng số. Mỗi dòng ghi **Chưa đủ thông tin** về hiệu quả theo lĩnh vực/mục tiêu.
- Các tiêu chí cấu hình trực tiếp do người dùng chọn mới tạo điểm. Nếu có đúng một phương án đáp ứng rõ ràng và đã chọn context, kết luận “Phương án phù hợp nhất theo tiêu chí”. Không có tiêu chí hoặc không có eligible match: không chọn theo ROI. Tie giữ đầy đủ, người dùng chọn kế hoạch muốn xem.
- ROI API độc lập, chỉ lấy success hiện hành; không làm điểm/tie-breaker hoặc tự chuyển thành %. Không có số demo thay thế API.
- Ngành/mục tiêu chỉ điều chỉnh brief/hoạt động kế hoạch theo heuristic minh họa, không khẳng định chiến lược tốt hơn: ngành công nghệ chuẩn bị demo/thông số; giáo dục xác minh chương trình/lịch tư vấn; thực phẩm chuẩn bị ảnh/thành phần; dịch vụ làm rõ phạm vi/quy trình; khác yêu cầu làm rõ brief. Mục tiêu leads kiểm CTA/form; conversion chỉ tracking đã xác minh; awareness không tự suy ra thay đổi nhận biết từ impressions.

## UX và trạng thái

`IndustryEvaluation.tsx` nằm ngay sau ROI chart thông qua slot `afterChart` trong `ScenarioComparisonTable`. Người dùng chọn context và các ràng buộc/ưu tiên, bấm **Đánh giá phương án theo lĩnh vực**; focus/scroll tới kết quả. Bảng có tên, kênh, context, eligibility, điểm, ROI API và lý do cho tất cả kịch bản. Bảng rộng cuộn ngang cục bộ.

Sau lần đánh giá, đổi context, tiêu chí hoặc kịch bản sẽ tính lại từ state thật. Đổi context reset lựa chọn tie/kế hoạch đã mở để tránh dùng brief cũ. Luồng truyền context sang template và campaign snapshot, không sang API. Kiểu trường được kiểm theo enum; giá trị lạ/prototype names bị từ chối.

## Demo

1. Tạo hai kịch bản Instagram và Google Ads, cùng nhóm khách hàng.
2. Chọn ngành/mục tiêu nhưng chưa chọn criteria: bấm đánh giá, xem **Chưa đủ thông tin**, không có phương án tự chọn.
3. Chọn ưu tiên Instagram: xem điểm/lý do từ cấu hình, ngành vẫn không có điểm tự tạo.
4. Chọn audience chung và bỏ ưu tiên kênh: hai phương án đồng hạng; chọn kế hoạch cụ thể bằng dropdown.
5. Chuyển ngành công nghệ/giáo dục: kế hoạch thu gọn/reset, nội dung brief thay đổi, điểm cấu hình không thay theo giả định ngành.
6. Chọn kênh bắt buộc không có: không đề xuất/phát sinh kế hoạch cho phương án bị loại.

## File, tests và kết quả

Runtime: `marketingContext.ts`, `IndustryEvaluation.tsx`, `ScenarioSuitability.tsx`, `ScenarioComparisonTable.tsx`, `MarketingActionPlan.tsx`, `marketingActionPlan.ts`, `CompareScenariosPage.tsx`. Đã tái sử dụng generator và logic criteria, không nhân đôi.

Test 6 ngành×4 mục tiêu, unknown/unique/tie/bắt buộc, đổi context, dữ liệu API thật, không dùng ROI và responsive nằm trong `final-business.test.tsx`, `final-business.spec.ts`; toàn bộ test trước vẫn chạy. Kết quả thực và ảnh ở [FINAL_TEST_RESULTS](FINAL_TEST_RESULTS.md), [FINAL_ACCEPTANCE_REPORT](FINAL_ACCEPTANCE_REPORT.md).

Giới hạn: không có training/validation cho ngành; không chứng minh optimal ROI/causal effect, không có dữ liệu cost/revenue tự động hoặc benchmark cho các ngành này. BASELINE_ONLY, RESEARCH_LIMITED và các kết quả nghiên cứu trước giữ nguyên. UC-08 tối ưu đã kiểm chứng không được đánh dấu hoàn thành.
