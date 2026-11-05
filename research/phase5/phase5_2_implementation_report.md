# Phase 5.2 — Sửa lỗi và hoàn thiện DreamMakers

Ngày **04/11/2026**. **PASS nghiệm thu phạm vi Phase 5.2; GO cho Phase 5.3 hoàn thiện demo/tài liệu trong giới hạn nghiên cứu.** Chưa thực hiện Phase 5.3 hoặc phát hành. Quality Gate production vẫn **BASELINE_ONLY**, nghiên cứu Criteo vẫn **RESEARCH_LIMITED**.

Đã đọc ba báo cáo Phase5.1, ba báo cáo bàn giao ML và source/test thực tế trước sửa. Đã trực tiếp sửa Frontend, cấu hình CORS, tests và tài liệu. Không huấn luyện, không mở ROI Test để phân tích, không sửa pipeline hoặc bảy artifact, không tạo `/optimize` hay phục vụ Criteo.

## 1. Kết quả tổng thể

- **8/8 Task hoàn thành.** Khắc phục **11 finding P1/P2 F01–F11** của Phase5.1; **9/9 assertion lỗi bổ sung** có regression tương ứng đã PASS. Các số này là ba cách nhóm công việc, không cộng thành 28 lỗi độc lập.
- Test sản phẩm cuối: **62 Backend +78 Frontend +31 E2E =171 ca PASS, 0 FAIL, 0 SKIP**. E2E chạy lại hai lượt liên tiếp đạt31/31, mỗi lượt exit0, teardown thật và cổng được giải phóng. Giữ nguyên15 ca E2E cũ.
- Build TypeScript/Vite exit0; Backend compileall, FastAPI startup và test suite PASS. HTTP verification9requests và offline thực PASS. Hai reference có absolute error0.
- Hash [integrity.json](run_phase5_2/integrity.json): không thay đổi artifact hoặc báo cáo/kết quả nghiên cứu có trước. Không tuyên bố toàn bộ source không đổi: sửa source là mục tiêu Phase5.2.
- F12 được xử lý phần font ngoài/favicon/title; bundle JS680.18kB còn warning>500kB, là P3 chưa xử lý. Không còn P0/P1 trong phạm vi kiểm thử local đã nêu.

## 2. Task 1 — localStorage crash: PASS

**Root cause:** initializer chỉ kiểm `Array.isArray`, nên `[{}]` lọt vào render rồi truy cập feature/name undefined. `getItem` nằm ngoài try; `setItem` không catch; `[]` bị xem như thiếu dữ liệu và tự tái sinh mẫu.

**Files:** thêm [scenarioStorage.ts](../../src/services/scenarioStorage.ts); sửa [CompareScenariosPage.tsx](../../src/pages/CompareScenariosPage.tsx); thêm [FE regression](../../tests/frontend/phase5_2.test.tsx) và [browser regression](../../tests/browser/phase5_2.spec.ts).

**Sửa:** envelope `{version:1,scenarios:[...]}`, nhận diện/migrate mảng cũ; kiểm ID, name, timestamps, notes, hữu hạn ROI và năm feature đúng domain; lọc từng bản ghi sai/ID trùng nhưng giữ bản ghi hợp lệ. JSON/shape/version chưa hỗ trợ trả danh sách rỗng có thông báo. Storage bị từ chối vẫn CRUD trong bộ nhớ; lỗi ghi cảnh báo mất persistence. Missing key khởi tạo hai mẫu minh họa; danh sách rỗng đã lưu được giữ rỗng. Cho phép xóa kịch bản cuối có confirm.

**Tests:** FE storage/migration/domain/partial invalid/zero/read-denied/write-quota, page recovery; E2E S01/S02/S03 (missing key/defaults, corrupt JSON, shape, legacy/current, empty, unsupported version, denied read/write và CRUD/reload). **PASS.** Evidence: [FE JSON](run_phase5_2/frontend-acceptance.json), [E2E run3](run_phase5_2/e2e-run3.json).

**Giới hạn:** không thể migration có ý nghĩa cho version tương lai chưa biết; phục hồi rỗng có notice. Không có persistence server-side; khi storage bị từ chối thì state chỉ sống trong tab. Không thêm error boundary toàn app vì lỗi khởi động được xử lý tại nguồn; không tuyên bố mọi lỗi React khác đều được chặn.

## 3. Task 2 — Scientific correctness/provenance: PASS

**Root cause:** static UI được gọi là thống kê thực; histogram mock gọi phân bố chuẩn, từ “tác động” và diễn giải nhiễu/overfit được trình bày quá chắc chắn.

**Files:** `src/data/mockDataset.ts`, `src/pages/DashboardPage.tsx`, `src/components/dashboard/{DatasetInfoCard,KpiCards,CampaignTable}.tsx`, `src/components/layout/{Header,Layout}.tsx`, `src/data/modelResults.ts`, `src/components/modelInsights/{EmpiricalConclusion,PerformanceOverview,ModelComparisonTable}.tsx`, `src/components/common/QualityBadge.tsx`, README.

**Sửa:** nói rõ bucket/chart/KPI ROI và12records là hardcode minh họa, chưa có quy trình trích xuất được xác minh; dataset200k là quy mô hồ sơ nghiên cứu, không là200krows trong UI. Bỏ khẳng định phân bố chuẩn/tác động; ghi Date cyclic ID và giả thuyết nguồn tổng hợp chưa chứng minh. Thay lời giải thích nguyên nhân chắc chắn bằng giới hạn bằng chứng. Metadata lỗi trên các trang static có banner/retry và phân biệt snapshot với inference.

**Tests:** FE scientific provenance và historical numeric equality; E2E S05/S07, I11, I13; source review toàn các chỗ ROI. **PASS.** Không sửa aggregate historical metrics hoặc số nghiên cứu để ép khớp.

**Giới hạn:** dữ liệu Dashboard vẫn mock; provenance cảnh báo không biến mock thành thống kê thật. Chưa chứng minh tác động Marketing, nguồn sinh dữ liệu hoặc external validity.

## 4. Task 3 — ROI unit: PASS

**Root cause:** formatter/result/table/tooltip tự thêm “lần”, dễ bị hiểu thành hệ số hoàn vốn kinh tế dù định nghĩa ROI chưa được xác minh.

**Files:** `src/constants/translations.ts`, `src/components/prediction/PredictionResultCard.tsx`, `src/pages/PredictRoiPage.tsx`, `src/components/charts/{CampaignTypeRoiChart,ChannelRoiChart,DurationRoiChart}.tsx`, KPI/table/card/Compare và Insights nêu trên.

**Sửa:** bỏ suffix đơn vị kinh tế, thống nhất “ROI · thang đo dataset” và chú thích đơn vị chưa xác minh; không đổi số, không %/profit conversion, không ROI±RMSE. Format full precision tại Predict được giữ nguyên cho reference.

**Tests:** FE formatter và source/DOM provenance; E2E I01/S06 đối chiếu hai reference ở dev/preview, S05 kiểm bốn viewport. **PASS**, A=4.991136884533976, B=4.997267870097019, error0. [HTTP evidence](run_phase5_2/http-verification.log), [website predictions](run_phase5_2/website_predictions.json).

**Giới hạn:** không có công thức kinh tế hoặc calibrated prediction interval; đã công bố điều này, không giả tạo đơn vị/CI.

## 5. Task 4 — Compare Scenarios: PASS

**Root cause:** ROI cộng thủ công theo Search/Google/duration và cột có handler sort ROI dù gate BASELINE_ONLY; `||` còn thay0 bằng điểm mặc định.

**Files:** `CompareScenariosPage.tsx`, `ScenarioComparisonTable.tsx`, `ScenarioCard.tsx`, storage service; FE/browser regression.

**Sửa:** giữ chế độ minh họa đúng phạm vi được phép; bỏ cộng điểm ưu tiên kênh/thời lượng, scenario mới dùng điểm cố định5.0024, preset có nhãn. Bỏ hoàn toàn ROI sort field/handler/icon; chỉ sort tên/thời lượng. Giữ0 đúng, missing score hiển thị chưa có thay vì dựng điểm fallback. CRUD/confirmation/reload vẫn hoạt động; empty state đến được.

**Tests:** E2E S03 thao tác create/edit/duplicate/delete đến0, reload valid/empty; click ROI header không đổi thứ tự; log không `/predict`. FE có kiểm zero/missing field và click ROI header. **PASS.** Không có best/recommended campaign, không endpoint mới hoặc automatic ranking.

**Giới hạn:** Compare vẫn mock, không phải multi-scenario API inference; chưa chuyển prediction thật từ Predict sang Compare. UI ghi rõ giới hạn, không coi đây là chức năng API đã hoàn thành.

## 6. Task 5 — Model Insights: PASS

**Root cause:** snapshot lịch sử chưa gắn nguồn, ghi CV200k thay vì Development170k, dùng constant minh họa cho Dummy và hiển thị fold wins không có bằng chứng. Chưa trình bày tách nhánh Phase4B.

**Files:** `ModelInsightsPage.tsx`, `modelResults.ts`, `ModelComparisonTable.tsx`, `PerformanceOverview.tsx`, `EmpiricalConclusion.tsx`; thêm [ResearchEvidence.tsx](../../src/components/modelInsights/ResearchEvidence.tsx).

**Sửa:** giữ nguyên tất cả MAE/RMSE/R² tổng hợp lịch sử; nhãn snapshot/source/artifact version và giới hạn tái lập1.732275. Fold wins là chưa xác minh, xóa unused array fold giả định ở source UI, không đụng artifact hoặc kết quả lịch sử. Dummy constant được giải thích fit theo fold; không đồng nhất5.0024. Model đang dùng/version/status lấy từ API thật; khi lỗi hiển thị chưa xác minh.

Panel read-only mới tách ROI4B.2 (15 outer folds) và Criteo visit/uplift RESEARCH_LIMITED, Qini0.003087141/C0.1, không vượt response20. Ghi file nguồn trong repository, không dùng các metric mới làm production metrics, không nạp research joblib hoặc map f0–f11 sang dropdown.

**Tests:** FE so từng historical aggregate với artifact JSON, DOM labels; E2E S05/S07 và I13 gate. **PASS.**

**Giới hạn:** snapshot không tự cập nhật; chưa có report API và không thêm API chỉ để trình bày tài liệu. Các đường dẫn nguồn được ghi như tài liệu repository, không giả làm URL công khai đã host.

## 7. Task 6 — CORS preview: PASS

**Root cause:** port4173 của preview không nằm trong default allowlist5173.

**Files:** [settings.py](../../backend/app/config/settings.py), `backend/tests/test_api.py`, thêm `backend/tests/test_cors_config.py`, README và Backend README. Backend ngoài CORS không sửa.

**Sửa:** cho phép đúng bốn origin HTTP localhost/127.0.0.1 tại5173/4173; giữ reject wildcard, external host, HTTPS không trong contract, sai port/path/credentials; env riêng thay thế defaults. Runbook chỉ rõ env phải có preview nếu người dùng đã override.

**Tests:** Backend original CORS case kiểm cả bốn origins;10regression cases cấu hình/reject/override; E2E S06 chạy bản build thật tại4173 với hai references và OPTIONS origin không cho phép400. **PASS.** Runtime request/response schema/gate không thay đổi.

**Giới hạn:** chỉ hỗ trợ local dev/preview. Cấu hình host/HTTPS deployment ngoài máy local là phạm vi riêng, không mở rộng CORS tùy tiện.

## 8. Task 7 — E2E runner hang: PASS

**Root cause đã khoanh vùng bằng evidence:** [log chẩn đoán cấu hình cũ](run_phase5_2/old-runner-diagnostic.log) dừng ở `pw:webserver Terminating the WebServer`, không có `Terminated`. Source Playwright cài trong node_modules cho thấy Windows WebServer dùng `shell:true`, không hỗ trợ gracefulShutdown ở nhánh này, fallback `taskkill /T /F` rồi chờ cleanup. Đường kết thúc wrapper/process không hoàn tất ở môi trường này; chưa xác định riêng lỗi OS/quyền nào làm fallback thất bại, không suy đoán browser test assertions là nguyên nhân.

**Files:** [playwright.config.ts](../../playwright.config.ts), thêm [e2e-global-setup.mjs](../../tests/support/e2e-global-setup.mjs), [serve_backend.py](../../tests/support/serve_backend.py); sửa `tests/verify-offline.mjs` dùng Vite API thay child kill.

**Sửa:** không dùng WebServer shell plugin. Global setup sở hữu Vite trong process và child Uvicorn launcher riêng. Test launcher mở control channel loopback ngẫu nhiên có token, request hợp lệ đặt `server.should_exit`; đóng channel/context khi `serve()` hoàn tất. Teardown đóng preview/Vite, yêu cầu shutdown rồi await child `close` (bao gồm stdio), xác minh exit0, PID Python không còn sống và ports đóng. Giới hạn30s startup/10s close; không `process.exit(0)`, không taskkill/SIGKILL. `process.kill(pid,0)` chỉ probe tồn tại PID, không gửi tín hiệu chấm dứt.

**Tests:** giữ nguyên15casetests cũ, chạy cùng16regressions mới. [run2](run_phase5_2/e2e-run2.json) **31PASS/exit0**, [run3](run_phase5_2/e2e-run3.json) **31PASS/exit0**. [Cleanup2](run_phase5_2/e2e-run2/e2e-cleanup.json) 1033ms, [cleanup3](run_phase5_2/e2e-run3/e2e-cleanup.json) 930ms, backendStillAlive=false, no signal, tất cả port8000/5173/4173/control=false. Test offline thực cũng thoát0 bằng `Vite.close()`.

**Lần thử chưa đạt được giữ lại:** launcher stdin EOF ban đầu không đạt readiness trong30s, có [log](run_phase5_2/launcher-client.log) và hai targeted startup logs; đã bỏ thiết kế này, chuyển control async. Không kết luận GIL/OS cụ thể từ hiện tượng đó. Cấu hình cũ được ngắt chỉ để kết thúc chẩn đoán đang treo; không dùng thao tác ngắt đó để ghi PASS. Phiên bản cuối hoàn tất tự nhiên.

**Giới hạn:** kết quả là hai lượt local Windows/Edge; chưa bảo đảm mọi OS/CI. Nếu port bị server khác chiếm, setup từ chối thay vì dừng server người dùng. Nếu cleanup không đạt deadline, báo lỗi thay vì ép exit0.

## 9. Task 8 — Responsive modal: PASS

**Root cause:** modal centered không giới hạn chiều cao/scroll, save/close ngoài viewport320×568; thiếu dialog semantics/Escape/focus handling.

**Files:** [ScenarioModal.tsx](../../src/components/scenarios/ScenarioModal.tsx), FE/browser regression.

**Sửa:** portal vào body, max-height theo viewport, body cuộn riêng, header/footer giữ trong khung; labeled inputs, dialog/aria-modal, Escape, Tab wrap, restore focus, khóa/khôi phục body scroll; whitespace tên có thông báo.

**Tests:** E2E S04 tại320×568,390×844,1440×1080 kiểm bounding box close/save, cuộn tới notes, Escape/close/Tab/focus; S05 bốn trang × bốn viewport kiểm document width và pageerror. FE kiểm whitespace/semantics/focus. **PASS.** Đã xem ảnh mobile trực tiếp: header/close/footer/save trong viewport, body có thể cuộn. [Screenshot cuối](run_phase5_2/e2e-artifacts-run3/phase5_2-S04-modal-320-accessible-actions-and-keyboard/modal-320.png).

**Giới hạn:** không phải audit toàn diện screen reader/WCAG; bảng nhiều cột dùng scroll ngang nội bộ, không ép tất cả cột vừa một màn hình.

## 10. File thay đổi và bảo toàn

[Manifest](run_phase5_2/integrity.json) liệt kê file có trước đã đổi; source mới: scenarioStorage, ResearchEvidence, FE/browser regression, Backend CORS tests và test launchers. README/runbook và font/favicon/title được cập nhật. Không thay package versions hoặc API prediction contract.

Test-generated reports/screenshot cũ được sao lưu và phục hồi; output mới ở `generated_current/` và run directory. Snapshot ban đầu chụp khi diagnostic cũ đang tạo transient Playwright trace, nên manifest còn liệt kê vài `.trace/.network/.html/.jpeg` tạm trong tests/results; chúng là evidence của lượt chẩn đoán này, không phải thay đổi kết quả ML lịch sử. Mọi file research có trước và cả bảy artifact đều giữ SHA256.

**Kết luận:** đủ điều kiện chuyển Phase5.3 cho hoàn thiện demo/tài liệu trong phạm vi hiện có. Không đủ bằng chứng phát hành khuyến nghị Marketing thực tế. Dừng Phase5.2, giữ BASELINE_ONLY và RESEARCH_LIMITED.
