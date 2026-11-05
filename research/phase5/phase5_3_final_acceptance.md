# Phase 5.3 — Final acceptance và bàn giao demo

Ngày **04/11/2026**, Asia/Bangkok. **Quyết định: READY_FOR_DEMO — phiên bản nghiên cứu/minh họa local có giới hạn.** Không phải nghiệm thu production, không hoàn thành UC-08 và chưa nghiệm thu UC-06 như so sánh ROI thật. Dừng Phase5.3, không chuyển Phase5.4.

## 1. Phạm vi và nguồn yêu cầu

Đã đối chiếu source/config/tests hiện tại, ba báo cáo Phase5.2 và ML handoff. Bảng UC/FR do **người dùng cung cấp bổ sung trong phiên này** là contract đối chiếu, vì chưa có bản Chương5 chính thức trong workspace. Đã tạo [uc_acceptance_matrix.md](uc_acceptance_matrix.md) đúng mã UC-01…08 và FR-01…10, không tự đổi tên UC hoặc coi mọi chức năng là IMPLEMENTED.

Phase5.3 chỉ thêm helper kiểm thử/tài liệu/evidence; **không sửa Frontend, Backend production, model, gate, dataset hoặc kết quả nghiên cứu**. Test-generated reports cũ đã được sao lưu/khôi phục; output mới lưu riêng ở run_phase5_3. Không train hoặc chạy script research có fit, không mở ROI Test30kđể phân tích, không thêm optimizer/Criteo serving, không Git init/push/deploy.

## 2. Final regression — kết quả mới, không kế thừa PASS

| Bộ / lệnh thực sự chạy | PASS | FAIL | SKIP | BLOCKED | Exit code | Evidence |
|---|---:|---:|---:|---:|---:|---|
| `backend/.venv/Scripts/python.exe -X utf8 -m pytest backend -c backend/pytest.ini --junitxml=research/phase5/run_phase5_3/backend.xml` | **62** | 0 | 0 | 0 | **0** | [JUnit](run_phase5_3/backend.xml), [log](run_phase5_3/backend.log), [command record](run_phase5_3/backend-command.json) |
| `npm.cmd test -- --reporter=default --reporter=json --outputFile.json=research/phase5/run_phase5_3/frontend.json` | **78** | 0 | 0 | 0 | **0** | [JSON](run_phase5_3/frontend.json), [log](run_phase5_3/frontend.log), [command record](run_phase5_3/frontend-command.json) |
| `npm.cmd run test:e2e -- --reporter=list,json --output=research/phase5/run_phase5_3/e2e-artifacts` | **31** | 0 | 0 | 0 | **0** | [JSON](run_phase5_3/e2e.json), [log](run_phase5_3/e2e.log), [command record và env](run_phase5_3/e2e-command.json) |

**Tổng171ca regression duy nhất PASS,0FAIL,0SKIP,0BLOCKED.** Không cộng lặp reference/integration/gate/model-loading đã nằm trong các bộ này. E2E mới hoàn tất trong khoảng92giây; [cleanup](run_phase5_3/e2e/e2e-cleanup.json) ghi backendExitCode0, signal=null, backendStillAlive=false, ports8000/5173/4173/control đều đóng, cleanup951ms. Không ngắt runner hoặc ép exit0.

Các biến E2E trong record:DM_TEST_BUILD_DIR trỏ đúng bundle run_phase5_3/build; DM_TEST_RESULTS_DIR và PLAYWRIGHT_JSON_OUTPUT_NAME trỏ run mới. Vì có build dir, ca S06 preview thực sự chạy, không SKIP. Test cũ giữ nguyên, không xóa/làm yếu assertion để nghiệm thu.

| Kiểm tra bổ trợ mới | Kết quả / exit | Evidence và cách tính |
|---|---|---|
| `npm.cmd run build -- --outDir research/phase5/run_phase5_3/build` | **PASS/0**, TypeScript+Vite6.4.5 | [log](run_phase5_3/build.log), [record](run_phase5_3/build-command.json); JS680.18kB/gzip189.20kB, còn warning>500kB |
| `backend/.venv/Scripts/python.exe -m compileall -q backend/app` | **PASS/0** | [record](run_phase5_3/backend_compile-command.json); startup Uvicorn còn được kiểm trực tiếp trongHTTP/E2E/browser |
| `backend/.venv/Scripts/python.exe -m pip check` | **PASS/0** | [log](run_phase5_3/pip_check.log), [record](run_phase5_3/pip_check-command.json) |
| Model verification quaT16 | **33checks PASS** | [JSON](run_phase5_3/generated_current/backend/tests/phase1_results.json), đã nằm trong62pytest, không cộng33ca mới |
| `backend/.venv/Scripts/python.exe -X utf8 backend/tests/verify_http.py` | **1script PASS/0;9requests** | [log](run_phase5_3/http.log), [record](run_phase5_3/http-command.json), [responses](run_phase5_3/generated_current/backend/tests/http_results.json) |
| `npm.cmd run test:offline` | **1script PASS/0**, outage thật | [record](run_phase5_3/offline-command.json), [JSON](run_phase5_3/backend-offline.json); không interception, no fake ROI |
| `node research/phase5/phase5_3_browser.mjs` | **46assertions PASS/0FAIL/0SKIP/0BLOCKED**, exit0 | [checks](run_phase5_3/browser-acceptance.json), [record cuối](run_phase5_3/browser_viewport-command.json); 20PNG thật, không cộng46assertions chồng lấn thành test cases mới |
| Source/history/artifact SHA guard | **PASS** | [integrity](run_phase5_3/integrity.json):1970prior files unchanged, bảy artifact khớp published manifest |
| Lint | **SKIP / NOT_CONFIGURED** | package không có lint script/config; không phải skipped test trong171, không tự tuyên bố lintPASS |

Command wrapper ghi UTC start/duration, command và mã thoát thật từ PowerShell/native command; thời gian hiển thị trong tài liệu/manifest theo Asia/Bangkok. Các dependencies đã có, không cold-install lại nên không đánh dấu clean installation PASS.

Không có test FAIL hoặc môi trường BLOCKED trong lượt nghiệm thu cuối. Lượt capture đầu44assertions PASS nhưng ảnh mobile chỉ có viewport, thiếu phần ROI; đã lưu bản đầu và chụp lại full-page. Sau đó thêm kiểm tra cột Compare: một lượt **14PASS/1FAIL**, exit1 vì bbox đọc ngay sau full-page capture bằng0. Không che FAIL này: [log](run_phase5_3/browser_settled.log), [record](run_phase5_3/browser_settled-command.json), [checks thất bại](run_phase5_3/browser-acceptance-attempt3.json).

[Chẩn đoán trực tiếp](run_phase5_3/chart-diagnostic.json) cho thấy với cả2mẫu mặc định và4kịch bản đã lưu, các cột có width36/height dương ở trạng thái bình thường, sau cuộn, bấm header và mở lại chart. Không tái hiện lỗi dữ liệu hoặc chart trống dai dẳng trong luồng người dùng. Full-page capture có thể resize chart và kích hoạt lại animation; sửa helper để riêng Compare chụp viewport sau khi các cột thực sự render, giữ nguyên assertion4cột dương. Lượt cuối **46PASS**, không sửa sản phẩm hoặc bỏ assertion. Không cộng các lượt lặp thành test cases độc lập.

QA bàn giao riêng: [delivery_checks.json](run_phase5_3/delivery_checks.json) **44PASS/0FAIL**, xác nhận exit codes, số ca, reference, cleanup, SHAảnh,1970file bảo vệ, mappingUC/FR, timeline7phút, local links và cú pháp các blockPowerShell trong runbook. Đây là kiểm tra tính nhất quán tài liệu/evidence, khác46assertionsbrowser và không cộng vào171test sản phẩm.

## 3. Browser acceptance và API/ML integration

Phương pháp: **Edge headless tự động**, E2E dùng dev5173 và preview4173; bộ ảnh riêng dùng preview production thật. Không tuyên bố đã thao tác kiểm thử thủ công trên native browser. Đã xem trực tiếp ảnh kết quả/Insights/log để kiểm chất lượng evidence.

| Trang / luồng | Quan sát thực tế | Kết quả |
|---|---|---|
| Dashboard | Bốn chart có SVG/bounding box dương trên1440×1080 và390×844, badge/provenance minh họa, bảng12samples. E2E còn render bốn viewport320/390/768/1440 | **PASS phạm vi DEMO_ONLY**; không là dữ liệu vận hành thực |
| Predict | Đủ năm featureA/B, gửi POST thật, full precision, LR/version/gate/warning, không đổi ROI thành%/profit. Duration31thực bị422; FE/API/E2E còn kiểm strict type/domain/missing/extra vàerror lifecycle | **PASS kỹ thuật**, chưa validated kinh doanh |
| Compare | TạoA/B đúng cấu hình bằng modal; sửa/lưu/reload/xóa trên desktop/mobile; ROI mock tách khỏi outputAPI; clickROIheader khôngsort; không có requestpredict ởCompare | **PASS quản lý scenario/DEMO_ONLY comparison**; so ROI thật chưa nghiệm thu |
| Insights | Metadata model hiện tại từAPI, snapshot historical có source/version/Development170k và giới hạn tái lập; panel ROI4B.2 vàCriteovisitRESEARCH_LIMITED riêng | **PASS read-only evidence**, không dùng Qini làmROI hoặc nâng gate |
| Responsive | E2E bốn viewport, modal320×568/390×844/desktop; capture desktop/mobile mới, không pageerror | **PASS phạm vi kiểm tra**; không phải full WCAG/cross-browser/load test |

Reference từ artifact gốc:

| Case | Request | ROI thật / expected LR | Absolute error |
|---|---|---:|---:|
| A | Social Media/Facebook/Women25–34 (`Women 25-34`)/Fashionistas/30 | **4.991136884533976** | **0** |
| B | Search/Google Ads/Women25–34 (`Women 25-34`)/Fashionistas/45 | **4.997267870097019** | **0** |

[Browser rawA](run_phase5_3/desktop-api-predict-a.json), [rawB](run_phase5_3/desktop-api-predict-b.json), [HTTP records](run_phase5_3/generated_current/backend/tests/http_results.json). Hai viewport đều khớp; sự khác biệt output không chứng minh B tốt hơn A.

Backend dùng pinned fitted Linear Regression pipeline, load một lần/lifespan, integrity/type/features checks; source không import research estimators. Lỗi model/metadata fail closed. `/model-info` và `/predict` BASELINE_ONLY/research=true; rank=false/optimize=false. Client promotion bị reject; POST/optimize404 trong Backend tests. FE gate không mở recommendation; Compare chỉ sort cấu hình. Criteo chỉ xuất hiện như nội dung snapshot, không là modelROI.

## 4. Use Case và yêu cầu — nghiệm thu có phân loại

[Ma trận đầy đủ](uc_acceptance_matrix.md) có mọi cột UC ID/tên/FR/expected/actual/status/evidence/result/limitations. Tổng hợp:

| UC | Implementation Status | Result | Ý nghĩa |
|---|---|---|---|
| UC-01/FR-01 | DEMO_ONLY | PASS | Dashboard nghiên cứu/minh họa đúng phạm vi người dùng cho phép |
| UC-02/FR-02 | IMPLEMENTED | PASS | Nhập năm feature |
| UC-03/FR-04 | IMPLEMENTED | PASS | Suy luận LR/API thật, **không đồng nghĩa chất lượng ứng dụng đạt** |
| UC-04/FR-05 | IMPLEMENTED | PASS | Hiển thị output/model/gate/warning đúng |
| UC-05/FR-06 | IMPLEMENTED | PASS | CRUD/save/reload browser, lỗi storage phục hồi |
| UC-06/FR-07 | DEMO_ONLY | BLOCKED | Có đối chiếu cấu hình/mock; chưa nghiệm thu chức năng so sánh ROI thật |
| UC-07/FR-08 | IMPLEMENTED | PASS | Snapshot được phép theo contract, có nguồn/giao thức/version và runtime metadata |
| UC-08/FR-10 | NOT_IMPLEMENTED | BLOCKED | Không có nhận phương án tối ưu; đúng giới hạn phải giữ |

FR-03validation vàFR-09QualityGate đều IMPLEMENTED/PASS với source/API/FE/E2E evidence. Hai BLOCKED của UC là **nghiệm thu chức năng đầy đủ**, không phải ca test bị chặn hoặc P0/P1 mới. Không đổi tên UC-06 để biến mock thành chức năng ROI thật. Không đánh đồng kiểm tra âm tính “không có khuyến nghị” PASS với UC-08 được triển khai.

Các khoảng trống ngoài khả năng hiện tại: dashboard analytics live, so ROI thật/batch/save prediction sangCompare, server persistence/accounts, calibrated interval và optimizer **NOT_IMPLEMENTED**; không tự thêm trong Phase5.3. Snapshot metrics/read-only research không là fresh training hoặc report API động.

## 5. Bàn giao và điều kiện demo

- [Kịch bản demo7phút](phase5_3_demo_script.md): lời thoại/thao tác/kết quả mong muốn theo chín bước, A/B tham chiếu, nhấn mạnh không dùng output để chọn tốt hơn; có phương án Backend outage trung thực.
- [User guide/runbook](phase5_3_user_guide.md): môi trường/dependencies/start/stop/dev/build/preview/health/info/predict/tests/troubleshooting, đúng package/source.
- [Danh mục minh chứng](phase5_3_report_evidence.md):20PNG thật, caption/UC/giới hạn và source logs/JSON; [image manifest](evidence/phase5_3/manifest.json) có SHA256/kích thước/thời điểm.
- [UC acceptance matrix](uc_acceptance_matrix.md): contract người dùng cung cấp, các khác biệt và chưa đủ điều kiện ghi rõ.

**Các điều kiện đã đạt:** fresh regression171PASS; preview/API realA/Berror0; model integrity/load/gate/error handling; desktop/mobile; no unsupported ranking/recommendation; có docs/demo/evidence. Không phát hiện P0/P1 mới trong scope. Source/config và research/artifacts có trước giữ nguyên byte.

**Hạn chế không chặn demo minh bạch:** bundle680.18kB warningP3, lint chưa cấu hình; Dashboard/Compare mock; Insights snapshot; storage local. Chưa kiểm mọi OS/browser, screenreader/WCAG, pentest/load hoặc cold-install mới. Đây không là các kiểm tra đã PASS.

**Blocker cho nghiệm thu đầy đủ/production:** UC-06soROIthật vàUC-08; mô hìnhROI chưa vượtDummy, thiếu định nghĩa kinh tế/uncertainty/external validity, provenance historicalDummy chưa giải quyết; CriteoRESEARCH_LIMITED không thay các bằng chứng này. Không có economics/pilot chính sách để khẳng định tối ưuMarketingthật.

**Kết luận: READY_FOR_DEMO cho phiên bản nghiên cứu/minh họa local hiện có.** Không chấp thuận optimizer hoặc production recommendation, không nâng BASELINE_ONLY/RESEARCH_LIMITED. Trước buổi demo phải kiểm lại health/ready và origin; nếu Backend không phục hồi thì chỉ trình bày evidence đã ghi, công khai live prediction đang bị chặn. Không tự chuyển Phase5.4.
