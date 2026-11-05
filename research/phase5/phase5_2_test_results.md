# Phase 5.2 — Kết quả kiểm thử thực tế

Ngày04/11/2026, Windows/PowerShell, Edge headless. Chỉ số Phase5.1 là baseline; bảng dưới là **lượt chạy mới**. Code không được sửa sau build/test nghiệm thu cuối.

## 1. Bộ nghiệm thu cuối

| Bộ | PASS | FAIL | SKIP | Kết quả tiến trình / bằng chứng |
|---|---:|---:|---:|---|
| Backend pytest | **62** | 0 | 0 | exit0; [JUnit](run_phase5_2/backend-tests.xml), [log](run_phase5_2/backend-tests.log) |
| Frontend Vitest | **78** | 0 | 0 | exit0; [JSON](run_phase5_2/frontend-acceptance.json), [log](run_phase5_2/frontend-acceptance.log) |
| E2E lượt2 | **31** | 0 | 0 | exit0; [JSON](run_phase5_2/e2e-run2.json), [log](run_phase5_2/e2e-run2.log), [cleanup](run_phase5_2/e2e-run2/e2e-cleanup.json) |
| E2E lượt3, xác nhận cuối sau chỉnh copy UI | **31** | 0 | 0 | exit0; [JSON](run_phase5_2/e2e-run3.json), [log](run_phase5_2/e2e-run3.log), [cleanup](run_phase5_2/e2e-run3/e2e-cleanup.json) |

**171 ca sản phẩm duy nhất PASS,0FAIL,0SKIP =62+78+31.** Lượt E2E lặp thêm31PASS để xác minh stability; không cộng thành202ca độc lập. So baseline: Backend52→62 (+10CORS cases), FE43→78 (+35storage/scientific/dialog cases), E2E15→31 (+16browser cases).15ca gốc giữ nguyên nội dung. Integration/reference/loading/gate là các phần trong các bộ này, không cộng lặp.

| Kiểm tra bổ trợ | Kết quả | Evidence |
|---|---|---|
| Model verification qua pytestT16 | **33checks PASS**, không cộng vào171 | [JSON mới](run_phase5_2/generated_current/backend/tests/phase1_results.json) |
| HTTP thực | **1script PASS /9requests**, exit0 | [log](run_phase5_2/http-verification.log), [responses](run_phase5_2/generated_current/backend/tests/http_results.json) |
| Backend tắt thật | **1script PASS**, exit0, no interception, ROI=null | [log](run_phase5_2/offline-verification.log), [JSON](run_phase5_2/backend-offline.json) |
| Frontend TypeScript/Vite build | **PASS exit0** | [log](run_phase5_2/build-acceptance.log), output run_phase5_2/build |
| Backend compileall | **PASS exit0** | [log](run_phase5_2/backend-compile.log); FastAPI startup còn được kiểm tra trong E2E/HTTP |
| Dependency pip check | **PASS exit0**, no broken requirements | [log](run_phase5_2/pip-check.log) |
| Integrity artifact/history | **PASS** | [manifest](run_phase5_2/integrity.json), protected_changed=[] |
| Kiểm tra nhất quán evidence/báo cáo | Xem số check trong JSON riêng, không cộng vào test sản phẩm | [acceptance_checks.json](run_phase5_2/acceptance_checks.json) |
| Lint | **SKIP / NOT CONFIGURED** | Không có lint script; đây không là ca bị skip trong171 |

JS680.18kB minified/gzip189.20kB; warning>500kB vẫn còn. Build success không đồng nghĩa bundle đã tối ưu. Python3.13.17 vs export3.13.18 patch khác đã ghi nhận; sklearn1.6.1 và numerical checks/reference đạt, không sửa thư viện/mô hình.

## 2. Các lệnh đã chạy

```powershell
backend/.venv/Scripts/python.exe -X utf8 -m pytest backend -c backend/pytest.ini --junitxml=research/phase5/run_phase5_2/backend-tests.xml
npm.cmd test -- --reporter=default --reporter=json --outputFile.json=research/phase5/run_phase5_2/frontend-acceptance.json
npm.cmd run build -- --outDir research/phase5/run_phase5_2/build

# Mỗi lượt E2E dùng tên thư mục/file riêng: e2e-run2 và e2e-run3.
$env:DM_TEST_RESULTS_DIR='research/phase5/run_phase5_2/e2e-run3'
$env:DM_TEST_BUILD_DIR='research/phase5/run_phase5_2/build'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='research/phase5/run_phase5_2/e2e-run3.json'
npm.cmd run test:e2e -- --reporter=list,json --output=research/phase5/run_phase5_2/e2e-artifacts-run3

backend/.venv/Scripts/python.exe -X utf8 backend/tests/verify_http.py
npm.cmd run test:offline
backend/.venv/Scripts/python.exe -m compileall -q backend/app
backend/.venv/Scripts/python.exe -m pip check
```

Trong PowerShell lệnh ghi log được kết thúc bằng `exit $LASTEXITCODE` để lấy đúng mã trả của native command; stderr warning được giữ nguyên, không coi warning là test fail. Từng lệnh server được chạy tuần tự khi cần; offline không chạy song song với Backend HTTP/E2E.

## 3. Đối chiếu chín lỗi probe Phase5.1

| # | Lỗi cũ | Regression hiện tại | Kết quả |
|---|---|---|---|
| 1 | Manual ROI ordering | FEclickheader +browserS03, source không handleSort roi | PASS, thứ tự không đổi, không predict/rank API |
| 2 | Storage wrong shape trắng app | FEpage/storage, browserS01 bad-shape | PASS, header/CRUD/empty state hiện, không pageerror |
| 3 | [] tự tái sinh hai mẫu | FEpersistempty +browserS01 empty/S03 xóa cuối rồi reload | PASS, giữ danh sách rỗng |
| 4 | Storage denied trắng app | FEread/write exceptions, browserS02 getItem/setItem | PASS, CRUD trong bộ nhớ có thông báo |
| 5 | Save/close modal ngoài viewport | S04 boundingbox320/390/1440 | PASS, nút trong viewport, body scroll được |
| 6 | Thiếu dialog semantics | FE +S04role/aria | PASS |
| 7 | Escape không đóng | FE +S01/S04 Escape/focus | PASS |
| 8 | Preview preflight bị chặn | Backend default allowlist kiểm bốn origins; CORS config negatives | PASS, đúng origins200, origin khác400 |
| 9 | Preview không nạp metadata/predict | S06 production build thật, hai reference | PASS |

Đây là **mapping9failure cũ sang regression mới**, không tuyên bố đã chạy lại nguyên script66assertions của Phase5.1 hoặc biến kết quả lịch sử57/9thành66/0. Script cũ còn assertion yêu cầu header ROI biến mất và cấm xóa kịch bản cuối, không phù hợp contract UI đã sửa; giữ nguyên script/báo cáo cũ, không làm yếu assertions cũ để ép xanh.

## 4. Reference, integration và gate

- Dev I01 và preview S06 đều gọi API thật, không mock response; giá trịA **4.991136884533976**, B **4.997267870097019**, error0. [Website evidence](run_phase5_2/website_predictions.json).
- I02 và Backend parametrization chạy đủ duration15/30/45/60. Missing/category/type/extra/query/malformed body vẫn422; missing/corrupt model và metadata tamper fail closed; nonfinite inference500an toàn.
- `/model-info` và `/predict` vẫn BASELINE_ONLY/research=true; allow_automatic_ranking=false, allow_optimization_recommendation=false. Client-promoted VALIDATED bị từ chối, `/optimize` không có. Không sửa API contract ngoài CORS allowlist.
- I03–I09: lỗi422/503/500/network/timeout/invalid response, retry, stale response/cancel/reset đều PASS. Offline riêng tắt Backend thật, không interception, UNVERIFIED/disabled/no ROI giả.
- Model Insights snapshot historical numbers được so trực tiếp với model_metrics.json trong FE test; nguồn dữ liệu/4B.2/Criteo tách riêng. Không fit bất kỳ model nào trong Phase5.2.

## 5. Teardown và responsive

Hai lượt E2E liên tiếp kết thúc tự nhiên, không Ctrl+C, không process.exit hoặc force kill. Cleanup ghi `backendExitCode:0`, `backendStillAlive:false`, signal=null; ports8000/5173/4173/control=false. Child `close` đã awaited gồm stdio, Vite/preview đóng qua API. Playwright fixture sở hữu/đóng browser context và browser. Không kết luận mọi OS đã được kiểm tra; đây là Windows/Edge local.

S04 kiểm modal320×568,390×844,1440×1080, nút/scroll/keyboard/focus. S05 kiểm bốn trang tại320/390/768/1440, không document overflow/pageerror trong state tested; I12 còn có Predict mobile kết quả thật và navigation. Đã xem screenshot modal320 trực tiếp; không coi full-page screenshot thay cho boundingbox viewport.

## 6. Lần chạy chưa đạt và cách xử lý

| Lần | Kết quả thật | Nguyên nhân / xử lý |
|---|---|---|
| Diagnostic runner cũ | Treo teardown, được ngắt sau thu evidence | Log chỉ dừng Terminating WebServer; không ghi PASS cho runner này |
| Targeted launcher EOF, hai lần | Startup readiness timeout30s, chưa chạy test body; cleanup tự thoát0 | Bỏ thiết kế stdin reader, dùng async control channel. Không suy đoán nguyên nhân GIL/OS đã chứng minh. Giữ targeted-e2e.log, targeted-e2e-retry.log và launcher-client.log |
| Frontend targeted đầu | **74PASS/4FAIL** | jsdom thiếu ResizeObserver khi lần đầu render chart trong test mới; stub API layout thiếu trong test environment, browser kiểm layout thật. Không bỏ/làm yếu assertion. Sau sửa78/78PASS |
| Targeted IPC | **1PASS**, runner exit0 | Xác minh lifecycle mới trước full suite; không cộng vào171 |
| Full E2E lượt1 | **30PASS/1FAIL**, exit1 | Test mới dùng request.options không tồn tại; đổi sang request.fetch(method=OPTIONS), giữ cùng assertions. Preview reference đã qua trước dòng lỗi. [JSON](run_phase5_2/e2e-run1.json), [log](run_phase5_2/e2e-run1.log) |
| Full E2E lượt2 và3 | **31PASS/0FAIL/0SKIP mỗi lượt**, exit0 | Code sửa được chạy lại toàn bộ, teardown dưới1.1s |

Không che lần FAIL, không thay số lịch sử. Không còn test FAIL/BLOCKED ở bộ nghiệm thu cuối. Screen reader toàn diện, load/security testing, external deployment và validation Marketing thực tế chưa thực hiện, không suy đoán PASS.
