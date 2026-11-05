# Phase 5.1 — Kiểm toán website DreamMakers

Ngày kiểm toán: **04/11/2026**, Windows/PowerShell, Edge headless. **Đã hoàn thành kiểm toán; website chưa đạt nghiệm thu demo hoàn chỉnh. CONDITIONAL GO cho Phase 5.2 sửa lỗi trong phạm vi website**, không cho phép tối ưu Marketing hoặc triển khai model nghiên cứu. Phase 5.2 chưa được thực hiện.

Production ROI vẫn **Linear Regression / artifact version 1.0.0 / BASELINE_ONLY**. Nhánh Criteo vẫn **RESEARCH_LIMITED**, không tham gia suy luận website. Không huấn luyện, không đọc giá trị ROI trong CSV/Test 30.000 dòng. Hash bảo vệ bao gồm dữ liệu để phát hiện thay đổi byte, không phải phân tích outcome.

## 1. Phạm vi và bằng chứng

Đã đọc ba báo cáo [tổng kết ML](../final_ml_research_summary.md), [kết quả ML](../final_ml_experiment_results.md), [bàn giao website](../ml_to_website_handoff.md); đối chiếu hồ sơ 4B.1/4B.1A/4B.2 liên quan. Đã rà source bốn trang, component/layout/chart, services, context, types, translations, entry/CSS; Backend app/routes/schemas/services/config; tests FE/BE/browser, scripts verify; package/lock/config Vite/TypeScript/Vitest/Playwright, README và tài liệu API Backend. [Danh mục 58 file source/test](run_20261104/source_inventory.json), [bản source có số dòng](run_20261104/source_review.txt). Source index không bao gồm toàn bộ docs/config; không dùng số file này làm số test.

Browser bổ sung chạy API/Uvicorn và Vite thật ở 8000/5173, production build ở 4173; mỗi tình huống localStorage có browser context riêng. Các probe bổ sung chặn **chỉ Google Fonts** để tránh phụ thuộc tải font; E2E hiện có và test Backend thực sự tắt không sửa nội dung. Probe API outage dùng route abort được ghi rõ, tách khỏi test offline không interception.

Evidence mới ở [run_20261104](run_20261104/). Log Phase5 cũ được giữ nguyên, không lấy làm kết quả lần này. Test có ghi lại báo cáo/screenshot lịch sử đã được sao lưu, lưu output thay đổi vào `generated_current/` và khôi phục byte gốc. [Integrity](run_20261104/final_integrity.json): **484 file có trước không đổi**, gồm bảy artifact, source production và báo cáo nghiên cứu. Chỉ thêm file kiểm toán/build/evidence dưới `research/phase5/`.

## 2. Chức năng thực tế

| Trang | Hoàn thành / nguồn dữ liệu | Giới hạn chính |
|---|---|---|
| Dashboard | Bốn biểu đồ, KPI, bảng 12 mẫu, tìm kiếm, hai bộ lọc, phân trang 6 dòng; browser đã thao tác lọc/phân trang/không có kết quả | Tất cả analytics/bảng lấy từ `mockDataset.ts`, không có API analytics hoặc đọc dataset trực tiếp. Badge chất lượng lấy `/model-info`. Chú thích nguồn/phân phối còn sai hoặc chưa được chứng minh |
| Predict ROI | `/model-info` thật cấp domain; `/predict` thật; năm input; 15/30/45/60; loading, reset, hủy request cũ, chặn submit lặp, cảnh báo, retry metadata, xóa kết quả khi lỗi | Không có khoảng dự đoán hiệu chuẩn, khuyến nghị, ngân sách/lợi nhuận; chưa nối kết quả sang Compare. Đơn vị “lần ROI” chưa có định nghĩa kinh tế được xác minh |
| Compare Scenarios | Tạo/sửa/nhân bản/xóa có xác nhận, localStorage, bảng/chart và sắp xếp; thông báo ROI mô phỏng rõ | **Không gọi `/predict`**. Hai ROI mặc định và công thức cộng thủ công là mock. Không phải so sánh kết quả pipeline; lỗi storage, modal và sắp xếp ROI cần xử lý |
| Model Insights | Bảng/chart MAE/RMSE/R² bốn mô hình, giải thích metric, accordion, cảnh báo | Số tổng hợp lịch sử hardcode từ `modelResults.ts`; không lấy bảng metric từ API. Chưa có panel kết quả 4B.2/Criteo hoặc giới hạn tái lập lịch sử; không được coi là dashboard thực nghiệm mới |

Chi tiết validation/loading/error/empty/responsive tại [feature_status_matrix.md](feature_status_matrix.md). Static data không được gọi chung là API thật. Metrics tổng hợp lịch sử trùng artifact không có nghĩa là đã tái lập được thí nghiệm lịch sử.

## 3. Backend và API thực tế

Source: [routes](../../backend/app/api/routes.py), [schema](../../backend/app/schemas/prediction.py), [model service](../../backend/app/services/model_service.py), [settings](../../backend/app/config/settings.py), [README](../../backend/README.md). [OpenAPI lấy từ server thật](run_20261104/openapi.json) có đúng ba application paths; Swagger/docs là tài liệu framework, không là API tối ưu.

| Endpoint | Contract đã đối chiếu | Kết quả |
|---|---|---|
| `GET /health` | `status:ok|degraded`, `application_running`, `model_ready`, `model_name`, `api_version` | Live 200/ok/ready; health degraded khi model không nạp được được unit test. HTTP 200 health không tự đảm bảo model ready |
| `GET /model-info` | tên/version, features, target, ready, gate/research flag/rules, metrics/CV, allowed categories/durations, nguồn duration, warning | Live LR/1.0.0/BASELINE_ONLY; metadata lỗi trả 503; client không được chọn model/gate |
| `POST /predict` | Bốn `StrictStr` dài 1–100: `Campaign_Type`, `Channel_Used`, `Target_Audience`, `Customer_Segment`; `Duration_days:StrictInt>0`. Service tiếp tục kiểm tra domain encoder và đúng `[15,30,45,60]` | Live A/B và cả bốn duration thành công. Thiếu/sai type/category/duration/extra/query bị 422. Bool/float/string không thay cho integer |

Response predict: `predicted_roi` hữu hạn, `model_name:"Linear Regression"`, `model_version`, `quality_status:"BASELINE_ONLY"`, `is_research_only:true`, `warning`. Schema cấm extra fields; không có input model path, ngân sách hay target Criteo. OpenAPI chưa biểu diễn allowed duration thành enum và category thành enum: **hạn chế tài liệu**, runtime vẫn reject đúng (P2 nhỏ, xử lý cùng cập nhật tài liệu nếu cần).

Model nạp một lần trong lifespan, đường dẫn tính từ Backend, đọc và SHA256-check metadata/metrics/LR trước unpickle; kiểm tra fitted Pipeline/LinearRegression/features/encoder/gate/deployment duration. Model thiếu/hỏng không sinh ROI thay thế; predict 503. Lỗi suy luận/NaN/Inf trả 500 an toàn, không lộ path/traceback; validation trả thông tin lỗi đã lọc. Tests sử dụng bản sao artifact tạm cho corruption, không sửa bản gốc.

CORS default chỉ `http://localhost:5173`, `http://127.0.0.1:5173`, không wildcard/credentials; allowlist hợp lệ có thể cấu hình qua `DREAMMAKERS_CORS_ORIGINS`. API version và artifact version đều 1.0.0, là hai loại version khác nhau. Python runtime 3.13.17 khác patch export 3.13.18; sklearn 1.6.1 khớp, reference checks pass; không tự coi patch khác là lỗi dự đoán. `pip check` thành công.

## 4. Tích hợp ML và Quality Gate

| Kiểm tra | Kết quả và bằng chứng |
|---|---|
| Pipeline đúng, không thay model Criteo | PASS — settings cố định `linear_regression_pipeline.joblib`; load hash/type/fitted checks; `/model-info` target ROI, features đúng năm trường. Không import research learner vào `src`/`backend/app` |
| Reference A | API và browser hiển thị **4.991136884533976**, expected đúng số này, absolute error **0** |
| Reference B | API và browser hiển thị **4.997267870097019**, expected đúng số này, absolute error **0** |
| API tắt không dùng mock | PASS — test offline thực, không interception: UNVERIFIED, nút predict disabled, ROI null. E2E còn kiểm tra 422/503/500/network/timeout/malformed response và xóa ROI cũ |
| Gate Backend | PASS — predict/info literal BASELINE_ONLY, research true; rank/optimize false; extra/query client promotion bị reject; POST `/optimize` 404 |
| Gate Frontend ở Predict | PASS — chỉ chấp nhận contract LR/BASELINE_ONLY/domain/version; bad metadata hoặc predict lỗi thành UNVERIFIED. Cảnh báo không dùng quyết định kinh doanh; không lấy RMSE làm interval |
| Không khuyến nghị tự động | PASS trong đường API/Predict: không best/recommended campaign hoặc optimizer. **PARTIAL trên toàn UI:** Compare vẫn có thao tác sắp thứ tự theo ROI mock, dù cảnh báo và không có automatic ranking. F06 dưới đây |
| Truyền đạt khoa học | FAIL — provenance/đơn vị/phân phối/CV scope/fold claims còn vấn đề, không được giải quyết bằng test API PASS |

Evidence: [live_reference.json](run_20261104/live_reference.json), [HTTP script](run_20261104/http-verification-retry.log), [browser prediction đã lưu trong run kiểm toán](run_20261104/website_predictions.json) và [E2E log lần này](run_20261104/browser-tests.log), [offline log](run_20261104/offline-test.log), [live metadata](run_20261104/live_model_info.json).

## 5. Kết quả kiểm thử thực tế

| Bộ kiểm tra / lệnh | PASS | FAIL | SKIP | Trạng thái tiến trình / evidence |
|---|---:|---:|---:|---|
| `backend/.venv/Scripts/python.exe -X utf8 -m pytest backend -c backend/pytest.ini --junitxml=research/phase5/run_20261104/backend-pytest.xml` | 52 | 0 | 0 | exit 0, [log](run_20261104/backend-pytest.log), [JUnit](run_20261104/backend-pytest.xml) |
| `npm.cmd test -- --reporter=default --reporter=json --outputFile.json=research/phase5/run_20261104/frontend-tests.json` | 43 | 0 | 0 | exit 0, [JSON](run_20261104/frontend-tests.json), [log](run_20261104/frontend-tests.log) |
| `npm.cmd run test:e2e -- --reporter=list,json --output=research/phase5/run_20261104/browser-artifacts` (JSON output env trỏ run mới) | 15 ca có dòng `ok` | 0 ca được báo fail | 0 ca được báo skip | **BLOCKED ở hoàn tất runner/teardown**: sau ca 15 không có summary/JSON và chưa thoát. Đã ngắt tiến trình do kiểm toán khởi tạo; exit 1 sau ngắt. Không ghi lệnh này PASS trọn vẹn. [Log](run_20261104/browser-tests.log) |
| T16 gọi `backend/tests/verify_models.py` | 33 check nội bộ | 0 | 0 | PASS, [output mới đã lưu riêng](run_20261104/generated_current/backend/tests/phase1_results.json). Đã nằm trong 52 pytest, **không cộng thêm** vào số ca |
| `backend/.venv/Scripts/python.exe -X utf8 backend/tests/verify_http.py` | 1 script / 9 request assertions | 0 sau retry | 0 | Lần đầu BLOCKED vì port 8000 còn thuộc E2E; sau dừng runner, retry exit 0. Giữ cả [log ban đầu](run_20261104/http-verification.log) và [log retry](run_20261104/http-verification-retry.log); [9 responses](run_20261104/generated_current/backend/tests/http_results.json) |
| `npm.cmd run test:offline` | 1 script | 0 | 0 | exit 0, Backend thực sự tắt, [log](run_20261104/offline-test.log) |
| `node research/phase5/browser_audit.mjs` — probe kiểm toán mới | **57** | **9** | 0 | 66 assertions, **0 BLOCKED**, [JSON](run_20261104/browser_audit.json), [log](run_20261104/browser-audit.log). Script collect evidence exit 0 **không có nghĩa mọi assertion PASS** |

Tổng bộ test hiện có: **95 unit/service ca PASS hoàn tất**; thêm **15 ca browser ghi PASS**, nhưng runner chưa hoàn tất. Có **110 ca được quan sát PASS, 0 ca báo FAIL, 0 ca báo SKIP**, không thể gọi là “110/110 toàn bộ pipeline xanh” do blocker teardown. Hai script HTTP/offline báo riêng, không gộp số requests vào số unit cases. Integration tests có trong Vitest và Playwright; reference/loading/gate có trong pytest/T16/Vitest/browser, không phải bộ độc lập để cộng lặp.

Build TypeScript/Vite: **PASS exit 0**, `npm.cmd run build -- --outDir research/phase5/run_20261104/build`, [log](run_20261104/build.log); bundle JS 675.63 kB/minified, warning >500 kB, không phải build fail. `python -m pip check`: PASS, [log](run_20261104/pip-check.log). Lint: **SKIP / NOT CONFIGURED**, package không có lint script/config; không tạo hoặc đoán kết quả lint.

Chín assertion bổ sung FAIL tương ứng: (1) ROI sort còn bật, (2) storage sai shape crash, (3) persisted empty list không giữ rỗng, (4) storage bị từ chối crash, (5) modal cắt dọc, (6) thiếu dialog semantics, (7) Escape không đóng, (8) preview preflight CORS 400, (9) preview không nạp metadata. Đây không phải chín test production đã có bị sửa.

Responsive: 4 trang × 4 viewport **1440×1080 / 768×1024 / 390×844 / 320×568**, 32 assertions document width/pageerror PASS với state mặc định (Predict có suy luận thật). Bảng rộng có scroll nội bộ, không kết luận mọi cột cùng thấy trên mobile. Các screenshot nằm trong run mới; đã xem trực tiếp Dashboard desktop, Predict 390 và modal 320. Modal FAIL độc lập với page width PASS; full-page screenshot không thay thế tọa độ viewport của nút.

Chưa thực hiện screen-reader audit, toàn bộ browser/OS, kiểm tra load/concurrency, security pentest, deployment ngoài máy local hoặc kiểm chứng khoa học bằng Test ROI. Các hạng mục này **NOT TESTED**, không đánh dấu PASS.

Kiểm tra bàn giao tài liệu/evidence riêng: [audit_delivery_checks.json](run_20261104/audit_delivery_checks.json) **14 PASS / 0 FAIL**, xác nhận liên kết, số ca, reference, gate, integrity và các port do kiểm toán dùng đã được giải phóng. Đây là QA của báo cáo, không chuyển 9 product assertions FAIL hoặc E2E completion BLOCKED thành PASS. Log PowerShell có BOM UTF-16 được đọc theo đúng encoding; lỗi đọc UTF-8 ban đầu của helper QA đã được sửa trong phạm vi helper kiểm toán, không sửa source sản phẩm.

## 6. Phát hiện và mức ưu tiên

Không phát hiện **P0** trong luồng mặc định dev + API + reference. Lỗi sau có bằng chứng, không đồng nghĩa hệ thống sẵn sàng demo:

| ID | Mức | Phát hiện / tác động / bằng chứng |
|---|---|---|
| F01 | P1 | **Dashboard mô tả mock như thống kê thực và phân bố chuẩn.** `DashboardPage.tsx:34,52`, `Header.tsx:19`, `mockDataset.ts` dựng biểu đồ/bảng; `CampaignTable.tsx:132` ghi “ROI Thực tế”, footer vẫn có nhãn minh họa. Chưa có script/provenance chứng minh các bucket/sample này được trích từ dataset. Mô tả “phân bố chuẩn” trái [audit dữ liệu](../phase4b1_data_audit.md) ghi ROI gần đều; “Tác động” hàm ý nhân quả chưa được chứng minh. [Ảnh desktop](run_20261104/dashboard-1440.png). Không kết luận mọi static statistic đều sai: sai ở mức claim/nguồn chưa chứng minh |
| F02 | P1 | **Gán đơn vị kinh tế chưa xác minh.** `PredictionResultCard.tsx:72` ghi “lần ROI”, Dashboard/Compare/chart dùng “lần”. [ML handoff](../ml_to_website_handoff.md) xác định công thức/đơn vị kinh tế còn thiếu. Số pipeline khớp reference nhưng chưa đủ hiểu thành hoàn vốn x lần, ROAS hoặc lợi nhuận. [Ảnh Predict](run_20261104/predict-390.png) |
| F03 | P1 | **Model Insights thiếu provenance và claim vượt bằng chứng.** `ModelComparisonTable.tsx:89` nói CV toàn 200.000, trong `model_metrics.json` ghi Development 170.000; không được hàm ý đã dùng Test. `PerformanceOverview.tsx:9`/`modelResults.ts:75` gọi Dummy constant 5.0024, trong audit 4B.1A constant artifact là 4.999906285714286; CV constants khác nhau theo fold. `foldsBeatBaseline:0` hardcode cho từng model chưa có fold lịch sử để xác minh. Aggregate RMSE lịch sử khớp artifact nhưng tái lập còn giới hạn; các số fold `CV_FOLDS_DETAILS` không có nguồn và hiện **không được import/render**. `EmpiricalConclusion.tsx:43,53` diễn giải tập trung/nhiễu như nguyên nhân chắc chắn. Cần sửa lời và provenance, **giữ nguyên số/artifact lịch sử** |
| F04 | P1 | **localStorage có thể làm trắng toàn app.** `CompareScenariosPage.tsx:15–33` đọc/ghi không bảo vệ storage exceptions, JSON chỉ kiểm tra array/nonempty, không kiểm schema; `App.tsx` không có error boundary. Context chứa `dm_scenarios='[{}]'` phát sinh TypeError channelUsed/length, header=0/body rỗng; context deny getItem cũng trắng. Đây là fault injection client-side có điều kiện, không phải crash mặc định. [JSON](run_20261104/browser_audit.json), [ảnh](run_20261104/storage-wrong-shape.png) |
| F05 | P1 | **Luồng demo bản build mặc định bị CORS chặn.** README:158 có `npm run preview` → port4173; settings:33–35 chỉ cho 5173. OPTIONS từ127.0.0.1:4173 trả400 “Disallowed CORS origin”; browser bản build thật hiện alert mạng, disabled predict. Có thể giải quyết bằng cấu hình origin/port hợp lệ và tài liệu, không cần đổi model. [Ảnh](run_20261104/production-preview.png), [JSON](run_20261104/browser_audit.json) |
| F06 | P1 | **Compare cho sắp xếp thủ công theo ROI mock khi BASELINE_ONLY.** `ScenarioComparisonTable.tsx:18–45,149`, không dùng gate để khóa sort. Browser click ROI hai lần cho thứ tự ~5.0350/~5.0160/~5.0084. Có warning minh họa và **không có tự động chọn best, API rank/optimize**; không gọi đây là Backend gate bypass. Tuy nhiên broad yêu cầu không xếp hạng thiếu bằng chứng chưa đạt trọn vẹn; tắt sort ROI hoặc bỏ so điểm ROI trong demo sau này |
| F07 | P2 | **Modal bị cắt ở 320×568.** `ScenarioModal.tsx:70–80` không max-height/scroll. Bounding box save y582..614, close y−23..5, ngoài viewport. [Ảnh](run_20261104/scenario-modal-320.png); nút có thể được Playwright auto-scroll để click nhưng không đạt UI usable trong viewport |
| F08 | P2 | **Modal thiếu semantics/keyboard.** Không `role=dialog`/aria-modal, Escape không đóng; labels thiếu liên kết htmlFor/id, không focus trap/restore. Browser kiểm chứng dialog count0, nút save còn sau Escape. Cần QA keyboard thực sau sửa, chưa có screen-reader verification |
| F09 | P2 | **Empty state Compare không đến được qua luồng bình thường.** `CompareScenariosPage.tsx:19,111,166`: saved `[]` tự sinh lại hai mẫu, cấm xóa phần tử cuối, nhánh empty không thể thao tác đến. Probe persisted[] thấy2 cards, không rỗng. Quyết định rõ là giữ tối thiểu1 hay hỗ trợ empty, làm UI/contract nhất quán |
| F10 | P2 | **Metadata lỗi trên các trang static chỉ đổi badge.** Offline Dashboard/Compare/Insights vẫn render số static, alertCount0; riêng Predict có alert/retry. Chưa phân biệt rõ lịch sử vẫn đọc được với mô hình không được xác minh. Không có ROI API giả; đây là thiếu thông tin sự cố/recovery ngoài Predict |
| F11 | P2 | **E2E runner không hoàn tất teardown/report.** 15 ca ok nhưng thiếu final JSON/summary, phải ngắt; HTTP script ban đầu bị portoccupied. Nguyên nhân sâu Windows/runner chưa kết luận. Cần runner cleanup có thời hạn và exit/report xác định trước nghiệm thu; không đổi assertion để ép xanh |
| F12 | P3 | **Phụ thuộc font ngoài và bundle lớn.** `index.html` dùng Google Fonts, các ca E2E đầu mất khoảng20 giây/page; chưa đo cô lập toàn bộ độ trễ nên không khẳng định mọi chậm do font. JS build675.63 kB, warning>500 kB. Có thể dùng font fallback/local phù hợp license và code-split sau khi sửa correctness |

Tổng **12 finding chính: 0 P0, 6 P1, 5 P2, 1 P3**. Hạn chế OpenAPI enum nêu riêng ở mục3, không cộng thành finding thứ13. Mock Compare/analytics API và chuyển prediction sang Compare là khoảng trống chức năng có chủ ý, không tự nâng thành P0. `predictedRoi || 5.0024` trong chart còn thay giá trị0 bằng default: rủi ro source đã thấy, chưa có luồng UI bình thường sinh0 nên không ghi là lỗi runtime đã tái hiện.

## 7. Kết luận nghiệm thu và bàn giao

1. **Đã có:** bốn trang điều hướng được, Predict ROI end-to-end thật, Backend ba endpoint và validation/model integrity/gate/error handling hoạt động trong local dev; reference khớp tuyệt đối; CRUD scenario minh họa cơ bản.
2. **Còn mock/static:** toàn analytics Dashboard, sample campaign table, mọi ROI Compare/công thức cộng thủ công; Model Insights là snapshot aggregate lịch sử và một số claim không có fold evidence, không phải API experiment mới.
3. **Cần sửa:** sáu P1 về thông tin khoa học/đơn vị, provenance metrics, storage crash, preview CORS và manual ROI sorting; các P2 demo/modal/empty/error/runner.
4. **Tests:** 52 BE +43 FE hoàn tất PASS;15 browser cases ghi PASS nhưng runner completion BLOCKED;HTTP/offline PASS;57/66 probe audit PASS,9 FAIL. Không dùng unit PASS để phủ nhận lỗi UX/khoa học đã tìm thấy.
5. **Sẵn sàng demo:** hoàn thành hạng mục bắt buộc trong [implementation_plan.md](implementation_plan.md), chạy lại targeted regressions và E2E có exit/report sạch; giữ cảnh báo nghiên cứu và dữ liệu minh họa trung thực.
6. **Phase5.2:** **CONDITIONAL GO cho sửa lỗi website có kiểm soát**, đủ evidence/backlog để bắt đầu; **chưa PASS nghiệm thu sản phẩm**. Không có quyền chuyển gate VALIDATED, phát hành optimizer, tích hợp S-Learner, sửa lịch sử hoặc thay artifact. Dừng tại Phase5.1.
