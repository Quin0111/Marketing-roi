# Phase 5.1 — Kế hoạch hoàn thiện sau kiểm toán

Ngày 04/11/2026. **CONDITIONAL GO cho Phase 5.2 sửa website có giới hạn; chưa nghiệm thu demo.** Đây là kế hoạch, chưa thay đổi source. Căn cứ [audit](website_audit.md) và [ma trận chức năng](feature_status_matrix.md).

## 1. Thứ tự xử lý ít rủi ro

| Thứ tự | Mức / finding | Công việc dự kiến | Điều kiện hoàn thành |
|---|---|---|---|
| 1 | P1 F01/F02/F03/F06 | Sửa nội dung khoa học, provenance và tắt sắp xếp theo ROI mô phỏng. Dashboard ghi rõ static minh họa; bỏ claim phân bố chuẩn/tác động. Ghi đơn vị kinh tế ROI chưa xác minh. Model Insights phân biệt snapshot lịch sử, scope CV và giới hạn fold evidence | Giữ số lịch sử và artifact. Không thay RMSE 1.732275 bằng 1.734476 như cùng một run. Dẫn audit 4B.1A/4B.2/handoff; UI không chọn best hoặc sắp thứ tự ROI thiếu bằng chứng; reference không đổi |
| 2 | P1 F04 | Safe storage adapter, validation cấu trúc và version dữ liệu lưu; catch lỗi đọc/ghi; phục hồi rõ và dùng state trong bộ nhớ nếu storage bị từ chối; xem xét error boundary | Test valid/invalid JSON, [{}], null, enum sai, [], read SecurityError và write QuotaExceeded. Browser không trắng app, thông báo phục hồi; không gọi mock là API prediction |
| 3 | P1 F05 | Chọn đường demo duy nhất: dev 5173 hoặc preview với port/origin được cho phép. Dùng biến CORS env đã có và cập nhật runbook | Bản build thật gọi metadata/predict thành công, preflight đúng origin 200; origin ngoài allowlist vẫn bị reject; không mở wildcard/credentials |
| 4 | P2 F07/F08/F09 | Modal có giới hạn chiều cao/scroll; nút tiếp cận được; role/aria, label bindings, Escape/focus trap/return focus. Quyết định rõ empty state và quy tắc xóa cuối | Browser 320×568, 390×844 và desktop tạo/sửa/lưu/đóng được; kiểm Tab/Escape. Nếu contract cho phép rỗng, [] không tự sinh lại mẫu |
| 5 | P2 F10 | Thông báo metadata lỗi và retry nhất quán ở layout; vẫn có thể đọc báo cáo static nhưng không hiểu nhầm là dữ liệu live đã xác minh | Bốn trang khi API tắt/503/metadata sai đều hiển thị UNVERIFIED và recovery phù hợp; Predict disabled/no ROI; historical metrics có nhãn |
| 6 | P2 F11 | Điều tra runner treo; cleanup process do test tạo có thời hạn và report/exit xác định trên Windows | 15 ca hiện có đi đến summary/JSON/exit 0; port 8000/5173 được giải phóng; không dừng server của người dùng hoặc bỏ assertion để ép xanh |
| 7 | P2 nhỏ, API docs | Biểu diễn allowed duration/category chính xác hoặc dẫn /model-info làm nguồn domain chuẩn | OpenAPI/example khớp runtime; giữ 15/30/45/60; sai type/extra/category/duration vẫn 422; không thêm API tối ưu |
| 8 | P3 F12 | Sau correctness: giảm phụ thuộc font ngoài, cân nhắc code splitting và lint policy trong phạm vi phù hợp | Đo startup/bundle trước/sau; build/tests vẫn PASS; không đổi model hoặc ngữ nghĩa dữ liệu |

Mục 1–6 bắt buộc trước đề xuất nghiệm thu demo đầy đủ. Mục 7 có thể làm cùng cấu hình/tài liệu. Mục 8 không chặn đồ án nếu demo ổn định. Không mục nào cần huấn luyện hoặc sửa kết quả lịch sử.

## 2. Phạm vi chức năng cần ghi rõ

- **Dashboard:** có thể nghiệm thu như dashboard minh họa nếu mọi bảng/chart ghi đúng nguồn và giới hạn; không bắt buộc thêm analytics API. Nếu muốn thống kê thật, cần snapshot được review và script sinh số có provenance, dùng đúng dữ liệu được phép; không mở Test ROI để nghiên cứu.
- **Compare:** phương án demo ít rủi ro là so cấu hình/CRUD và ghi rõ minh họa, không trình bày thứ tự ROI như chọn phương án. API comparison và save-to-Compare hiện chưa có. Nếu nhiệm vụ 5.2 yêu cầu so dự đoán thật, dùng /predict hiện tại cho từng scenario, lưu input/version/source/status và pending/error riêng; không ranking/recommendation hoặc fallback mock. Không tự thêm endpoint.
- **Model Insights:** có thể thêm panel read-only dẫn ba báo cáo ML. Tách historical ROI, diagnostic ROI 15 fold và Criteo visit/uplift RESEARCH_LIMITED; ghi outcome/unit/split/version/assumptions. Không phục vụ S-Learner hoặc map Criteo sang năm dropdown.
- **Predict:** giữ API thật và raw value phục vụ QA; có thể format display dễ đọc kèm dữ liệu kiểm reference. Không đổi số pipeline hoặc ngụ ý confidence/profit/ROAS khi chưa đủ định nghĩa.

## 3. Giao thức kiểm tra sau sửa

1. Snapshot hash trước thay đổi; chỉ sửa website/docs/test được nhiệm vụ 5.2 cho phép. Bảy artifact, gate, dataset và lịch sử nghiên cứu không đổi.
2. Chạy regression đúng finding vừa sửa: nhãn/provenance, storage faults, modal, preview CORS. Không chạy script nghiên cứu có fit model.
3. Chạy build TypeScript/Vite, 52 Backend + 43 Frontend hiện có và các regression mới; 15 E2E phải hoàn tất exit 0/report. Tách số ca mới khỏi baseline, không cộng lặp 33 checks nội bộ T16 hoặc 9 HTTP requests thành unit cases.
4. Reference A = 4.991136884533976, B = 4.997267870097019, sai số ≤1e−6 ở API và browser. Kiểm bốn duration và invalid inputs; BASELINE_ONLY/research=true, rank/optimize=false.
5. Backend tắt thật, không interception: UNVERIFIED/disabled/no ROI. Mock errors bổ sung cho 422/500/503/timeout/malformed/stale request; không ROI giả.
6. Browser bốn trang × bốn viewport; kiểm modal/menu/keyboard riêng, storage faults và runbook clean start/stop. Lưu evidence mới, không ghi đè báo cáo lịch sử.
7. Hash cuối, kiểm link và số PASS/FAIL/SKIP/BLOCKED thực tế. Chỉ đề xuất nghiệm thu khi không còn P0/P1 và P2 demo bắt buộc đã giải quyết.

## 4. Quyết định và blocker

**Đủ evidence để bắt đầu Phase 5.2 có giới hạn. Chưa đủ để công bố website hoàn chỉnh hoặc khuyến nghị Marketing.** Sáu P1 còn mở, modal có lỗi, E2E completion BLOCKED, Compare chỉ mock và Insights chỉ snapshot lịch sử.

Blocker khoa học giữ nguyên: ROI chưa vượt Dummy; provenance Dummy lịch sử chưa giải quyết; định nghĩa kinh tế ROI còn thiếu; Criteo policy không vượt response20 và thiếu external/business validation. Với demo, phải giới hạn claim và thông báo trung thực; không giải quyết bằng sửa số hoặc nâng gate.

Không có /optimize, train/tune, sử dụng Test ROI 30.000 dòng, thay dataset/model, triển khai S-Learner, Git init/push hoặc production release trong Phase 5.1. Thực hiện backlog thuộc nhiệm vụ Phase 5.2 riêng. **Dừng sau kiểm toán.**
