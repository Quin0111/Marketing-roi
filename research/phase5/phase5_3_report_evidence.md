# Phase 5.3 — Minh chứng triển khai cho Chương 5

Ngày **04/11/2026**, Asia/Bangkok. Có **20 PNG thật** tại [evidence/phase5_3](evidence/phase5_3/), từ lượt nghiệm thu mới. [Manifest](evidence/phase5_3/manifest.json) ghi viewport, nguồn URL/file, kích thước PNG, thời điểm chụp và SHA-256. Không dùng ImageGen/mockup hoặc ảnh tự vẽ làm bằng chứng triển khai.

## Phương pháp và cách dùng

- Website: Edge headless tự động mở **production preview thật tại127.0.0.1:4173**, Backend thật tại8000. Không route interception hoặc mock API trong script chụp ảnh. Desktop1440×1080, mobile390×844; ảnh trang là full-page, ảnh form/warning là crop element trực tiếp từ browser, modal và Compare là viewport thật. Compare được cuộn tới chart/bảng, đợi cột render, không chỉnh CSS/data để làm ảnh.
- Test results: browser mở nguyên tệp log do lệnh mới tạo, chụp file viewer thật. **Không phải ảnh terminal đang chạy test**, không tạo terminal/UI giả để trình bày PASS. Luôn dẫn thêm log và JSON/JUnit để kiểm chứng exit code và số ca.
- API predict: ảnh browser mở bản ghi request/response HTTP thật do trang Predict gửi, không phải trang GET/predict hoặc response mô phỏng.
- Lượt ảnh đầu chỉ chụp viewport do nhận diện đối tượng Page chưa đúng, thiếu phần ROI ở ảnh mobile; giữ ở `run_phase5_3/browser_capture_attempt1/`. Đã sửa helper full-page. Một lượt bổ sung kiểm cột Compare sau full-page capture FAIL14/1 vì path đang ở trạng thái chuyển động; giữ [log](run_phase5_3/browser_settled.log) và [diagnostic](run_phase5_3/chart-diagnostic.json) cho thấy chart bình thường có cột dương. Bộ20ảnh cuối dùng riêng viewport thật cho Compare và giữ kiểm đủ4cột: [checks](run_phase5_3/browser-acceptance.json) **46PASS/0FAIL**, [exit code](run_phase5_3/browser_viewport-command.json)0. Không sửa sản phẩm/ép dữ liệu hoặc che lần FAIL.
- MãH5 dưới đây là **mã gợi ý tổ chức minh chứng**, chưa phải số hình chính thức của bản Chương5 chưa có trong workspace. Khi đưa vào báo cáo, giữ caption về mock/API/snapshot và giới hạn nghiên cứu.

## Danh mục ảnh và caption đề nghị

| Mã | Ảnh thật | Nội dung/caption dùng trong báo cáo | UC/FR và giới hạn |
|---|---|---|---|
| H5-01 | [Dashboard desktop](evidence/phase5_3/desktop-dashboard.png) | Dashboard với bốn biểu đồ, KPI và bảng chiến dịch minh họa; nguồn được ghi chú | UC-01/FR-01 DEMO_ONLY; không là dữ liệu vận hành thực |
| H5-02 | [Form desktop](evidence/phase5_3/desktop-prediction-form.png) | Cấu hình năm feature của mẫu tham chiếuA, domain lấy từ Backend | UC-02/FR-02/FR-03; chưa gửi request ở trạng thái ảnh form |
| H5-03 | [Predict A desktop](evidence/phase5_3/desktop-prediction-a.png) | Output Linear Regression từ API thật cho mẫuA:4.991136884533976 | UC-03/04; ROI dataset scale, không%/profit |
| H5-04 | [Predict B desktop](evidence/phase5_3/desktop-prediction-b.png) | Output API thật cho mẫuB:4.997267870097019, khớp reference | UC-03/04; không suy ra B tốt hơn A |
| H5-05 | [BASELINE_ONLY desktop](evidence/phase5_3/desktop-baseline-warning.png) | Cảnh báo nghiên cứu và badge chưa vượt baseline cùng model/version | FR-09; không đồng nghĩa model đã VALIDATED |
| H5-06 | [Compare desktop](evidence/phase5_3/desktop-compare.png) | Viewport chart/bảng A/B sau thao tác UI; điểm ROI minh họa tách khỏi kết quả API | UC-05 và UC-06 DEMO_ONLY; không ranking/optimizer |
| H5-07 | [Insights desktop](evidence/phase5_3/desktop-model-insights.png) | Metadata model hiện tại, snapshot lịch sử có nguồn và các panel nghiên cứu riêng | UC-07; Criteo visit không phải ROI |
| H5-08 | [Backend tests](evidence/phase5_3/backend-tests.png) | File viewer của log pytest mới:62passed | Log thật, không phải screenshot terminal; [JUnit](run_phase5_3/backend.xml), [command/exit0](run_phase5_3/backend-command.json) |
| H5-09 | [Frontend tests](evidence/phase5_3/frontend-tests.png) | File viewer log Vitest mới:78passed | [JSON](run_phase5_3/frontend.json), [command/exit0](run_phase5_3/frontend-command.json) |
| H5-10 | [E2E tests](evidence/phase5_3/e2e-tests.png) | File viewer log31ca E2E và summary mới | [JSON](run_phase5_3/e2e.json), [exit0](run_phase5_3/e2e-command.json), [cleanup](run_phase5_3/e2e/e2e-cleanup.json) |
| H5-11 | [API predict](evidence/phase5_3/api-predict.png) | Browser hiển thị request/response200 thật, model/gate và error0 choA | [Bản ghi gốc](run_phase5_3/desktop-api-predict-a.json); không phải mock response |
| H5-12 | [Scenario modal desktop](evidence/phase5_3/desktop-scenario-modal.png) | Nhập scenarioA bằng UI, có label/form/modal và controls | UC-05; scenario vẫn minh họa, không chạy model |
| H5-13 | [Dashboard mobile](evidence/phase5_3/mobile-dashboard.png) | Dashboard minh họa ở390px, chart/table responsive | UC-01 DEMO_ONLY, bảng có scroll ngang nội bộ |
| H5-14 | [Form mobile](evidence/phase5_3/mobile-prediction-form.png) | Năm feature mẫuA trên mobile | UC-02/FR-03 |
| H5-15 | [Predict A mobile](evidence/phase5_3/mobile-prediction-a.png) | Toàn trang Predict mobile, giá trịA thật cùng warning | UC-03/04 và FR-09 |
| H5-16 | [Predict B mobile](evidence/phase5_3/mobile-prediction-b.png) | Toàn trang Predict mobile choB, cùng model/gate | Không diễn giải chênh output thành ưu thế can thiệp |
| H5-17 | [Warning mobile](evidence/phase5_3/mobile-baseline-warning.png) | Cảnh báo giới hạn suy luận trên mobile | FR-09 |
| H5-18 | [Compare mobile](evidence/phase5_3/mobile-compare.png) | Viewport chart/bảng minh họa sau create/edit/reload; cards nằm phía trên, ngoài khung này | UC-05 và UC-06 DEMO_ONLY; trạng thái lưu trong JSON đi kèm |
| H5-19 | [Insights mobile](evidence/phase5_3/mobile-model-insights.png) | Snapshot lịch sử, trạng thái model và Criteo visit tách biệt | UC-07; không phải fresh training hay Criteo serving |
| H5-20 | [Modal mobile](evidence/phase5_3/mobile-scenario-modal.png) | Modal trong viewport390×844, header/footer và body cuộn | UC-05; E2E còn kiểm320×568 |

Đã xem trực tiếp ảnh mobile PredictA, desktop Insights và ảnh log Backend sau chụp; đồng thời dùng kích thước PNG để xác nhận ảnh mobile full-page vượt chiều cao844. Không gọi việc xem ảnh này là thao tác kiểm thử thủ công trên browser native.

## File máy đọc được đi kèm

- [Browser acceptance cuối](run_phase5_3/browser-acceptance.json):46PASS,4recordA/B ở hai viewport, geometry charts gồm4cột Compare sau render, CRUD/save/reload, no ROI sort, không predict ởCompare, provenance và không pageerror.
- [Desktop A](run_phase5_3/desktop-api-predict-a.json), [desktop B](run_phase5_3/desktop-api-predict-b.json), [mobile A](run_phase5_3/mobile-api-predict-a.json), [mobile B](run_phase5_3/mobile-api-predict-b.json):request/response thật, hiển thị và absolute_error0.
- [Validation desktop](run_phase5_3/desktop-validation.json), [mobile](run_phase5_3/mobile-validation.json):duration31 thực bị422, không dùng invalid payload làm mẫu demo hợp lệ.
- [Saved scenarios desktop](run_phase5_3/desktop-scenarios.json), [mobile](run_phase5_3/mobile-scenarios.json):version1, cấu hình nhập bằng UI, score minh họa không lấy API.
- [HTTP verification](run_phase5_3/generated_current/backend/tests/http_results.json):health/model-info, hai reference và bốn duration hợp lệ, duration31bị422; cả chín request assertions PASS.
- [Model verification](run_phase5_3/generated_current/backend/tests/phase1_results.json):33nestedchecks PASS, các pipeline/reference và SHA; không cộng lặp vào171ca regression.
- [Offline thật](run_phase5_3/backend-offline.json):không Backend, không interception, UNVERIFIED/disabled/ROI=null; [log](run_phase5_3/offline.log).
- [Integrity](run_phase5_3/integrity.json):1970file có trước không đổi, bảy artifact khớp manifest đã công bố. Bản build và evidence mới không ghi đè lịch sử.

Các ảnh chứng minh UI/API đã chạy trong môi trường đã nêu; **không chứng minh mô hình có giá trị kinh doanh, causal ROI hoặc tối ưu Marketing**. Dùng [demo script](phase5_3_demo_script.md) để thuyết trình và [UC matrix](uc_acceptance_matrix.md) để ghi đúng trạng thái chức năng.
