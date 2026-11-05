# Campaign Management — vòng đời và ROI tài chính

Ngày 04/11/2026. Source trước đợt final không có Campaign Management. Đã thêm khu vực trong **So sánh & Đề xuất**, giữ điều hướng ba trang.

## Chức năng thực tế

- Tạo thủ công bằng năm feature hợp lệ và context; hoặc tạo từ phương án đã được chọn hợp lệ.
- Lưu snapshot độc lập của feature/context và danh sách nhiệm vụ theo template. Sửa/xóa kịch bản gốc không thay lịch/tiến độ chiến dịch đã tạo. Không sao chép điểm mock hoặc predicted_roi sang tài chính.
- Bản nháp cho sửa cấu hình; đổi cấu hình phải xác nhận tạo lại kế hoạch, bỏ tiến độ cũ, tăng planVersion. Sau active, cấu hình bị khóa; muốn cấu hình khác phải tạo chiến dịch mới. Khoản tài chính giữ theo campaign ID, người dùng phải đối soát nếu đổi bản nháp.
- Trạng thái: draft→active/cancelled; active→completed/cancelled. Completed/cancelled không tự mở lại. Muốn completed phải có hoạt động và tất cả được người dùng xác nhận done. Tổ hợp loại/kênh chưa rõ không được active trước khi chỉnh phù hợp.
- Thêm/sửa/xóa hoạt động và đánh dấu done, ngày tương đối trong 1..duration. Completed/cancelled khóa hoạt động. Tiến độ chỉ là số nhiệm vụ, không phải hiệu quả Marketing.
- Thêm/xóa khoản chi, nhập/sửa doanh thu/tiền tệ, tổng kết và nhận xét điều kiện cho vòng sau. Hủy giữ dữ liệu nhưng không hiện ROI như kết quả hiệu quả; xóa có xác nhận.

## ROI quy ước

`ROI (%) = (doanh thu − tổng chi phí đã nhập) / tổng chi phí đã nhập × 100`.

Đây là chỉ số tài chính quy ước theo phạm vi ledger người dùng nhập, chưa phải lợi nhuận kiểm toán, incremental ROI hoặc proof causal. Chưa thể biết chi phí đã đầy đủ hay doanh thu có attribution hợp lệ. Không dùng làm nhãn chất lượng predictor và **không trừ với predicted_roi** trên dataset.

Tiền là chuỗi thập phân không âm, tối đa hai chữ số lẻ, không exponent/dấu phân nhóm; từng giá trị và tổng chi phí tối đa 10^12. Tổng dùng integer minor units, tránh sai 0.1+0.2. VND/USD/EUR phải khớp giữa campaign/revenue/mọi khoản chi; không tự đổi tỷ giá. Cost≤0, doanh thu thiếu, giá trị âm/NaN/Infinity/quá lớn đều không tạo ROI. Sửa trường chưa lưu làm ẩn ROI cũ ngay; sau lưu tính lại từ ledger hiện hành.

Các số 100/150 và ROI50% trong tests/ảnh là **fixture do automation nhập**, không là dữ liệu kinh doanh thực hoặc dự báo của DreamMakers.

## Persistence và dữ liệu hỏng

`dm_campaigns` envelope version1, UUID cho campaign/task/expense; schema validation/filter IDs trùng. Mất quyền đọc, JSON/schema/version hỏng hoặc một phần invalid: giữ raw, cho làm trong memory, không ghi đè dữ liệu gốc. Quota/write error có thông báo; không trắng màn hình. Không có localStorage.clear trong production. Campaigns chỉ trên trình duyệt, không đồng bộ/backup server, không authentication thật.

Đồng thời sửa `dm_scenarios`: `canPersist=false` khi không đọc an toàn, thay vì autosave danh sách rỗng đè raw hỏng. Dữ liệu valid/legacy vẫn lưu theo hành vi cũ; legacy mảng hợp lệ được migrate.

## Source và nghiệm thu

`services/campaigns.ts`, `hooks/useCampaignWorkspace.ts`, `components/scenarios/CampaignManagement.tsx`; callback nối từ `CompareScenariosPage` qua `ScenarioSuitability`/`MarketingActionPlan`. Không thêm Backend API.

Unit/integration kiểm parser tiền, ROI âm/zero/dương, currency, finite/cap, minor-units, transitions, ngày/task, snapshot, corruption/quota/property-denied và dirty ROI. Browser F01–F05 kiểm quy trình thực trên desktop/mobile, refresh, manual/source creation, statuses/progress, hủy/xóa, đổi kế hoạch và source independence. [Nghiệm thu](FINAL_TEST_RESULTS.md) và [ảnh](FINAL_ACCEPTANCE_REPORT.md) là kết quả chạy mới.

Không tự kết nối advertising/CRM, không nhập KPI nền tảng tự động, không xác minh tài chính hoặc attribution. Nhận xét chỉ dùng dữ liệu người dùng đã lưu và nêu các kiểm tra tracking/nội dung còn cần, không hứa tăng doanh thu hoặc lợi nhuận.
