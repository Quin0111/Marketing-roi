# Phase 5.1 — Ma trận chức năng thực tế

Ngày 04/11/2026. Trạng thái chỉ áp dụng phạm vi đã quan sát. **PASS kỹ thuật không phải validation khoa học.** STATIC khác dự đoán API; NOT IMPLEMENTED không tự là lỗi. Finding IDs theo [website_audit.md](website_audit.md).

## Frontend

| Trang / chức năng | Nguồn / API | Hoàn thành và giới hạn | Validation / Loading / Error / Empty | Responsive / bằng chứng |
|---|---|---|---|---|
| Layout và điều hướng | App hash, local state; ModelProvider gọi /model-info | PASS render bốn trang, hash trực tiếp và menu mobile. Back/Forward có handler source, chưa thêm assertion browser riêng | Metadata loading → badge; lỗi → UNVERIFIED. Không error boundary (F04) | Bốn viewport mỗi trang không overflow document/pageerror mặc định; E2E I11/I12. Chưa full accessibility audit |
| Dashboard KPI/dataset info | mockDataset.ts, không analytics API | STATIC/MINH HỌA, render PASS; provenance và ngữ nghĩa F01/F02 | Không async analytics nên không có analytics loading/error; metadata chỉ badge | Screenshot dashboard-1440.png; bốn viewport geometry PASS |
| Bốn biểu đồ Dashboard | Mảng hardcode, có demo badge | MOCK/STATIC, không tính lại từ dataset. Claim phân bố chuẩn/tác động không đạt scientific review | Chưa có data-fetch retry/empty contract; không kiểm mọi tooltip | Bố cục responsive; ảnh đẹp không chứng minh bucket đúng |
| Campaign table/search/filter/pagination | 12 SAMPLE_CAMPAIGNS, sáu dòng/trang | PASS next, search không khớp và filter Email; không phải bảng 200.000 dòng thật | Đổi filter về trang1, empty message PASS; select thiếu accessible label theo source | Scroll ngang nội bộ; mobile không thấy mọi cột cùng lúc. F01 nhãn ROI thực tế |
| Predict metadata/options | GET /model-info thật | PASS parse LR/version/domain/gate; từ chối metadata tự nâng VALIDATED | Loading disable, lỗi alert/retry/UNVERIFIED; không lấy domain mock thay thế | E2E I07/I13, FE service tests |
| Predict form | PredictionForm.tsx, đúng năm trường | PASS lựa chọn categories và duration 15/30/45/60; reset | FE kiểm membership/integer; Backend xác nhận; disable pending, abort/invalidate khi đổi input/reset | I08/I09 và responsive probes; chưa kiểm đầy đủ screen reader |
| Predict result | POST /predict thật | PASS A/B full precision khớp reference; không random/demo fallback. Đơn vị lần ROI còn F02 | Có initial empty/loading; lỗi 422/500/503/network/timeout/malformed không để ROI cũ; race tests PASS | Screenshot predict-390.png; bốn viewport có suy luận thật |
| Confidence / optimize | Không có calibrated interval/API | NOT IMPLEMENTED có chủ ý; thông báo chưa calibrated, không lấy RMSE làm CI; optimize khóa | Không phát minh interval/recommendation | Source và BE/FE no-recommendation checks |
| Predict → Compare | ResultCard prop optional nhưng parent không truyền | NOT IMPLEMENTED; không có nút lưu prediction thật sang scenario | Không được mô tả là đã lưu kết quả API | PredictionResultCard.tsx:158 và PredictRoiPage.tsx |
| Compare CRUD | React state/localStorage, DemoScenarioService | PASS tạo/sửa/nhân bản/xóa có confirm, toast; chặn xóa cuối | Tên rỗng HTML required PASS; whitespace trim return không có inline error rõ. Storage sai shape/denied FAIL (F04) | Desktop CRUD PASS; card responsive; modal 320×568 FAIL (F07) |
| Compare ROI/chart/table | Hai preset; baseRoi=5.0024 cộng Search/Google/15 ngày | MOCK, không gọi /predict; có warning. Sort ROI thủ công còn bật (F06); không auto-best/optimizer | Không loading/error suy luận API vì không có suy luận API; không phải fallback của Predict | Request log chỉ model-info; ROI sort ~5.0350/5.0160/5.0084 |
| Compare persistence/empty | dm_scenarios | Reload dữ liệu hợp lệ PASS; invalid JSON fallback; [{}] và denied getItem crash; [] tự sinh lại hai mẫu | Không schema/version/defensive storage recovery; empty branch chưa dùng được (F09) | storage-wrong-shape.png và JSON probes |
| Compare modal/keyboard | Native form overlay | Create/edit desktop PASS; dialog semantics và Escape FAIL (F08) | Chưa focus trap/restore; thiếu liên kết label/input | Save y582..614, close y−23 tại màn hình cao568px; scenario-modal-320.png |
| Model Insights aggregate metrics | EXPERIMENT_RESULTS static | HISTORICAL SNAPSHOT: aggregate trùng model_metrics.json; không metric API live | Không metric loading/error/empty; metadata lỗi đổi badge nhưng vẫn hiện số (F10) | Bốn viewport geometry PASS; nội dung provenance F03 |
| Model Insights fold claims | foldsBeatBaseline hardcode; CV_FOLDS_DETAILS không được dùng | Claim 0/5 từng model thiếu fold provenance; CV200k và Dummy5.0024 sai scope/constant (F03). Không gọi unused array là đã hiển thị | Không phải tái lập mới; không sửa historical metrics để ép khớp | ModelComparisonTable.tsx:62,89; modelResults.ts:50–56,75 |
| Insights accordion/charts/conclusion | modelResults.ts và local state | UI có; scientific conclusion cần sửa F03 | Có thông báo baseline; lời giải thích nguyên nhân vượt evidence | Chưa tự động kiểm mọi accordion/control; source đã review |
| Research 4B.2/Criteo read-only | Chưa có tích hợp | NOT IMPLEMENTED, panel đọc báo cáo có thể là scope sau. S-Learner không dùng production | Không đổi Qini thành ROI hoặc ghép target | Ba handoff reports là nguồn chính; research status khác production gate |

## Backend và integration

| Thành phần | Kết quả | Evidence / giới hạn |
|---|---|---|
| Health | PASS local ready và unit degraded | routes.py:20; HTTP200 vẫn phải đọc model_ready |
| Model-info | PASS fields/domain/gate/version | live_model_info.json và pytest T02 |
| Predict | PASS hai reference và bốn duration | live_reference.json; chín HTTP responses; pytest reference/input validation |
| Pydantic/domain | PASS strict type/missing/extra/category/duration/malformed JSON/query | 52 pytest; OpenAPI chưa biểu diễn đầy đủ category/duration enum, runtime đúng |
| Artifact/model loading | PASS hash/fitted/type/features, một lần nạp, độc lập cwd | T12/T16/load-once/corrupt/tamper; 33 checks nội bộ không cộng lặp |
| Inference error/NaN/Inf | PASS 500 an toàn, không fallback | Pytest failure/nonfinite và E2E error states |
| Quality Gate | PASS Backend BASELINE_ONLY, rank=false, optimize=false | Metadata checks, T13/T14, FE parser; sort mock Compare là F06 riêng |
| CORS | PASS allowlist5173/reject khác; FAIL khả năng dùng preview mặc định4173 | Preflight400 và browser bản build thật F05; có env override hợp lệ |
| Runtime versions | PASS numeric compatibility; có khác patch Python | Python3.13.17/export3.13.18, sklearn1.6.1; pip check; hai reference error0 |
| /optimize, Criteo serving | ABSENT, đúng yêu cầu | OpenAPI ba paths, POST /optimize404, không import research learner |
| Backend offline | PASS outage thật, không interception | npm run test:offline exit0; UNVERIFIED/disabled/no ROI |

## Test status và evidence

- [Backend JUnit](run_20261104/backend-pytest.xml): **52 PASS, 0 FAIL, 0 SKIP**, hoàn tất exit0.
- [Vitest](run_20261104/frontend-tests.json): **43 PASS, 0 FAIL, 0 SKIP**, hoàn tất exit0.
- [E2E log](run_20261104/browser-tests.log): **15 ca ok**, không có ca fail/skip được báo; **runner completion BLOCKED**, đã phải ngắt ở teardown, không ghi cả lệnh PASS.
- HTTP verification: **1 script PASS, 9 requests** sau retry giải phóng port; script Backend offline **PASS**.
- [Probe bổ sung](run_20261104/browser_audit.json): **57 PASS, 9 FAIL, 0 BLOCKED**, không có ca skip. Chi tiết từng assertion và tọa độ lưu trong JSON.
- TypeScript/Vite build **PASS**; dependency pip check **PASS**; lint **SKIP / NOT CONFIGURED**.

Các trạng thái ngoài phạm vi test được ghi rõ; không suy đoán PASS. Screenshot và logs nằm trong run_20261104, source evidence có số dòng ở source_review.txt.
