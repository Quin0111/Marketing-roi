# Final remaining issues và giới hạn

Ngày 04/11/2026. Kết luận cuối: **0 P0/P1 còn mở**, 378 ca PASS và HTTP/offline/hash/teardown đều PASS; phạm vi local research theo FINAL_ACCEPTANCE_REPORT.md.

## Các lỗi chức năng đã xử lý trong đợt này

| ID | Vấn đề / nguyên nhân | Sửa / bằng chứng regression |
|---|---|---|
| FIX-01 | Generator dùng numeric object key nên nhận cả duration chuỗi `'30'` | Strict number/integer + domain; action-plan.test.tsx invalid input; log lỗi đầu run_action_plan/frontend-first.* |
| FIX-02 | Passive effect metadata có thể clear/abort request vừa bắt đầu khi nút mới enabled | useLayoutEffect; final-business.test.tsx Auto khởi request trong layout commit; targeted-fixed67 PASS và full FE |
| FIX-03 | Scenario autosave ghi danh sách rỗng lên raw JSON/schema lỗi | canPersist=false; giữ raw, CRUD memory-only; unit và browser F04 |
| FIX-04 | Default parameter đọc window.localStorage trước try có thể throw SecurityError và trắng trang | Đưa truy cập property vào try; unit property getter + browser F07 production preview |
| FIX-05 | ROI tài chính đã lưu vẫn hiện như hiện hành khi đang sửa revenue/currency/expense chưa lưu | financialDirty ẩn ROI/nhận xét cũ, yêu cầu lưu; unit + F01 sửa dương→âm→0 |
| FIX-06 | Cộng float tiền có thể tạo sai khác giả cho 0.10+0.20 | Integer minor units và cap tổng; unit zero ROI chính xác |

| FIX-07 | Browser tự tải favicon.ico không tồn tại, sinh console404; còn preconnect font ngoài không dùng | Khai báo SVG data URI, bỏ preconnect, dùng selection blue; diagnostic URL404 và production audit zero-errors + full regression |

Các chặn lifecycle/task/currency/invalid-input là quy tắc mới, không cộng thành lỗi đã quan sát riêng. Không đổi ML metrics để hợp thức hóa kết quả.

## QA/environment được giải quyết

- E2E lượt đầu 77 PASS/1 timeout: P01 đầu tiên trả phí cold compilation Vite, page.goto vượt30s trước khi test nghiệp vụ. Chỉ tăng budget ca cold-case lên45s, không sửa timeout API hoặc bỏ assertion. Targeted đã PASS37.5s; full regression sau sửa80/80 PASS. Offline verifier cũng tăng riêng page-load budget45s sau cùng lỗi cold-load30s; không thay10s API timeout hoặc assertion. Log lỗi offline đầu giữ ở offline-isolated-release.log, lượt sửa PASS ở offline-isolated-coldfix.
- Không có Git repository; `git status --short` báo fatal not-a-repository. Không có diff/commit status để cung cấp, không init/push. Dùng manifest/hash thay thế cho kiểm bảo toàn, không gọi đây là Git working tree sạch.
- Cổng8000 có server người dùng. QA dùng18000, giữ nguyên process người dùng. Không force-exit runner hoặc bỏ teardown.

## P2/P3 còn lại, không phải lỗi P0/P1 của demo local

| Mức | Giới hạn thực tế | Ảnh hưởng / cách demo |
|---|---|---|
| P2 | Campaigns/criteria không có đồng bộ server hoặc xác thực tài khoản; dữ liệu browser-local | Dùng cùng trình duyệt/origin; sao lưu raw dm_campaigns/dm_scenarios trước khi dọn browser. Không gọi production-ready |
| P2 | Data hỏng/unknown version được giữ nguyên; thay đổi mới chỉ trong memory | Có cảnh báo; không tự ghi đè mất raw. Cần khôi phục bản sao hợp lệ thủ công trước khi muốn persist tiếp |
| P2 | Lịch template tương đối, ngành/mục tiêu heuristic không có data đánh giá tác động | Cần xác nhận brief/nhân sự/tài khoản/tracking, không tự phát hành campaign hoặc chứng minh hiệu quả |
| P2 | Tài chính người dùng nhập không kiểm toán; không biết đầy đủ cost/attribution | ROI là quy ước trên ledger đã nhập, không so với ROI dataset hoặc khẳng định incremental profit |
| P2 | Vite cold dev có thể mất hơn30s tải lần đầu trên môi trường hiện tại | Demo nên dùng build + preview, mở trước Backend và trang. Ca cold-start có budget hữu hạn45s |
| P3 | Bundle final >500kB, Vite warning | Build vẫn exit0; có thể tách bundle ở nhiệm vụ sau, không che warning |
| P3 | Bảng nhiều cột dùng cuộn ngang mobile; report/plan chi tiết có thể dài khi mở | Controls mobile đã kiểm; phần chi tiết mặc định thu gọn |
| P3 | Test JSDOM không có layout nên Recharts phát warning kích thước | Dùng browser thật để kiểm chart/overflow; không suy đoán layout PASS từ unit |

Không có tích hợp quảng cáo, CRM, gửi Email hoặc chuyển tiền thật; hoạt động chưa tự chạy trên nền tảng. Không có dữ liệu thực tế tự sinh. BASELINE_ONLY/RESEARCH_LIMITED vẫn là giới hạn khoa học, không là lỗi kỹ thuật đã được sửa.

Audit console/network cuối hai viewport đã PASS zero-errors trên production preview; favicon404 không còn trong flow bình thường. Toàn bộ regression378 tiếp tục PASS sau assetfix.
