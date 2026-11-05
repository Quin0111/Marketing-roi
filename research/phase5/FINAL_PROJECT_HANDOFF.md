# FINAL PROJECT HANDOFF — DreamMakers

Ngày 04/11/2026. Trạng thái cuối được điền từ acceptance_summary.json sau HTTP/offline/hash; không dùng checkpoint cũ để tự suy đoán PASS. Các checkpoint trung gian được lưu trong run_final_handoff/checkpoint_history.md.

## 1. Tổng quan
DreamMakers là công cụ local hỗ trợ khám phá dữ liệu nghiên cứu Marketing, dự đoán ROI nghiên cứu, so sánh cấu hình, gợi ý theo tiêu chí, lập kế hoạch template và quản lý chiến dịch/ledger do người dùng nhập. Không phải optimizer ROI đã kiểm chứng hoặc SaaS production thương mại.

## 2. Kiến trúc thực tế
React18/TypeScript/Vite/Tailwind/Recharts + FastAPI/sklearn joblib. Frontend API client gọi GET /health, GET /model-info, POST /predict. Backend chỉ suy luận LR đã lưu, không thêm campaign/recommendation API. Marketing context/rules/templates/campaign persistence nằm tại Frontend. Sidebar giữ đúng ba trang: Tổng quan, Dự đoán ROI, So sánh & Đề xuất; quản lý chiến dịch là khu vực trong Compare.

## 3. Chức năng hoàn thành
- Dashboard: số đếm Development đã đối soát, nguồn/hash; bảng demo12dòng riêng.
- Predict: đúng5features, domain từ metadata, raw precision/display4dec, loading/error/retry/reset, lưu sang Compare, model info/metrics có nguồn và Insights alias.
- Compare: CRUD/duplicate/versioned localStorage; API từng scenario, source separation, chart; mandatory filters/equal-weight preferences, ties/unknown/no eligible; ROI không làm rank/tie-break.
- Industry/goal: 6 ngành,4 mục tiêu là context brief; không có điểm ngành tự bịa. Bảng mọi scenario sau chart và lý do/unknown.
- Plan: action-plan-v1,6kênh,5campaign types,4durations, stage ranges không vượt duration. Tổ hợp chưa rõ có draft guard, không kích hoạt campaign trước khi chỉnh.
- Campaign: snapshot từ phương án hoặc manual, revision bản nháp, statuses, activities/progress, expenses/revenue/currency, ROI quy ước và nhận xét dữ liệu nhập. Refresh lưu cấu hình/ledger, không tự tạo financial actuals.

## 4. Không có / ngoài phạm vi
Không tích hợp phát hành ads/email/CRM, không server DB/campaign sync/login thật, không accounting audit hoặc causal attribution. Không chứng minh ROI ML tốt hơn baseline hoặc suitability/plan hiệu quả kinh doanh. Không có optimizer hoặc Criteo serving. Industry alone không đủ xác định kênh tốt hơn.

## 5. File quan trọng
- App.tsx và services/navigation.ts:3pages/legacy insights redirect.
- pages/{DashboardPage,PredictRoiPage,CompareScenariosPage}.tsx.
- contexts/ModelContext.tsx, services/{apiClient,modelInfoService,predictionService}.ts; hooks/useScenarioPredictions.ts (layout metadata invalidation).
- services/scenarioStorage.ts: dm_scenarios v1, corrupted raw canPersist=false.
- services/{scenarioSuitability,marketingContext,marketingActionPlan,campaigns}.ts.
- components/scenarios/{ScenarioSuitability,IndustryEvaluation,MarketingActionPlan,CampaignManagement,ScenarioComparisonTable,ScenarioModal}.tsx; hooks/useCampaignWorkspace.ts.
- backend/app/api/routes.py, services/model_service.py, config/{deployment_metadata,artifact_sha256}.json; backend/models7originalfiles.
- research/phase5/FINAL_* và action-plan/industry/lifecycle reports. Evidence mới trong run_final_handoff/.

## 6. Khởi động Backend (PowerShell, cwd project root)
```powershell
backend/.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```
Không dừng server có sẵn của người dùng. Nếu8000đang dùng, xác minh health/model-info hoặc dùng port khác và cấu hình VITE_API_BASE_URL tương ứng trước khi build. QA đã dùng18000, không dùng tiến trình8000 làm bằng chứng chạy mới.

## 7. Khởi động Frontend
```powershell
npm.cmd run dev -- --host 127.0.0.1
# Demo ổn định: production bundle, tránh Vite cold compile
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
```
.env.local tùy chọn VITE_API_BASE_URL=http://127.0.0.1:8000, VITE_API_TIMEOUT_MS=10000, VITE_DISPLAY_NAME. Đổi env cần restart/build lại. Backend CORS dev5173/preview4173 explicit loopback. Hosting pathname /insights cần SPA fallback; hash routes không cần rewrite riêng.

## 8. Lệnh tests
```powershell
backend/.venv/Scripts/python.exe -X utf8 -m pytest backend -c backend/pytest.ini
npm.cmd test
npm.cmd run build
# QA isolate, dùng attempt MỚI chưa tồn tại; build và e2e cùng attempt
backend/.venv/Scripts/python.exe -X utf8 research/phase5/final_run.py build --attempt isolated-followup
backend/.venv/Scripts/python.exe -X utf8 research/phase5/final_run.py e2e --attempt isolated-followup
```
Runner giữ stdout/log/exit thực. Tasks khác: backend/frontend/offline/http/compile/pip_check. Không chạy offline cùng lúc HTTP hoặc E2E trên cùngport. Không ghi đè record cũ; nếu sửa source ở session mới, tạo run/snapshot/report mới, không sửa evidence lịch sử.

## 9. Kết quả kiểm thử mới nhất
**READY_FOR_DEMO — bản local có giới hạn nghiên cứu.** Hoàn thành 5/5 luồng chức năng trong phạm vi, 7 lỗi đã xử lý (6 logic/dữ liệu +1 tài nguyên), không còn P0/P1 theo code review và kiểm thử cuối. Không phải chứng minh hiệu quả kinh doanh.

| Suite thực sự chạy | PASS | FAIL | SKIP | Exit | Evidence |
|---|---:|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | 0 | [JUnit](run_final_handoff/backend-assetfix.xml), [record](run_final_handoff/backend-assetfix-command.json) |
| Frontend Vitest / integration | 236 | 0 | 0 | 0 | [JSON](run_final_handoff/frontend-assetfix.json), [record](run_final_handoff/frontend-assetfix-command.json) |
| Browser E2E | 80 | 0 | 0 | 0 | [JSON](run_final_handoff/e2e-isolated-assetfix.json), [record](run_final_handoff/e2e-isolated-assetfix-command.json) |

**Tổng 378 ca duy nhất PASS, 0 FAIL, 0 SKIP, 0 BLOCKED ở nghiệm thu cuối; E2E flaky=0.** So baseline trước action-plan263: thêm96 FE +19 E2E; không cộng targeted hoặc nested matrix assertions thành ca mới.

| Kiểm bổ trợ | Kết quả / evidence |
|---|---|
| TypeScript và production build default | PASS/exit0, `tsc && vite build`; [log](run_final_handoff/build-default-assetfix.log), [record](run_final_handoff/build-default-assetfix-command.json). JS707.61kB/gzip199.64kB, còn warning>500kB |
| Build isolated preview | PASS/exit0; [record](run_final_handoff/build-isolated-assetfix-command.json). Lượt E2E assetfix dùng đúng bundle build-isolated-assetfix mới; record release-bundle.json chỉ mô tả lượt trước sửa favicon |
| Backend compile / pip | PASS/exit0; [compile](run_final_handoff/compile-acceptance-command.json), [pip check](run_final_handoff/pip_check-acceptance-command.json) |
| Startup + health/model-info/predict HTTP | PASS/exit0,9requests thật; [record](run_final_handoff/http-isolated-assetfix-command.json), [responses](run_final_handoff/generated_current/backend/tests/http_results.json) |
| Reference A/B | Raw4.991136884533976 và4.997267870097019, absolute error0 cả hai; cùng responses HTTP và I01/S06/C01 trong E2E |
| Real outage | PASS/exit0, không interception, server18000 thực sự tắt, Predict/Compare không sinh ROI giả; [record](run_final_handoff/offline-isolated-assetfix-command.json), [JSON](run_final_handoff/generated_current/tests/results/backend-offline.json) |
| Targeted sau sửa | FE67 PASS/exit0 và E2E1 PASS/exit0; [FE](run_final_handoff/targeted-fixed-command.json), [E2E](run_final_handoff/targeted-e2e-command.json); không cộng vào378 |
| SHA-256 / bảo toàn | PASS,7artifact đúng manifest gốc, protected_changed rỗng; [integrity](run_final_handoff/integrity.json) |
| E2E teardown | Backend exit0, không còn process/cổng test; [cleanup](run_final_handoff/e2e-isolated-assetfix/e2e-cleanup.json), không force-exit |
| Git inspection | N/A: workspace không phải Git repository, exit128 được giữ; [record](run_final_handoff/git-status-command.json). Không init/commit/push |

QA dùng Backend18000, dev5173/preview4173 riêng; không dừng hoặc dùng server8000 của người dùng làm bằng chứng. CORS/dev-preview/reference/model loading/gate nằm trong suite, không dựa vào UI mock. Test-generated history được backup/restore, output mới lưu riêng.

[Tổng hợp máy đọc được](run_final_handoff/acceptance_summary.json) ghi command/source/ảnh hashes; [file inventory](run_final_handoff/changed_files.md) liệt kê source đã sửa/thêm và QA/reports. Giữ BASELINE_ONLY, RESEARCH_LIMITED; UC-08 tối ưu đã kiểm chứng NOT_IMPLEMENTED. Các số tài chính trong tests/ảnh là fixtures được automation nhập, không phải business actuals.


## 10. Chất lượng mô hình
Deployed Linear Regression artifact1.0.0, BASELINE_ONLY, warning research only. Historical metrics trong model_metrics.json và src/data/modelResults.ts giữ nguyên, Dummy1.732275 còn giới hạn tái lập4B.1A; Phase4B.2 là giao thức khác Dummy1.734476/LR1.734565. Không gộp/thay số. Criteo visit/uplift RESEARCH_LIMITED không có mapping hợp lệ sang 5dropdown hoặc ROI economics.

## 11. Bất biến khoa học / ROI
- predicted_roi là thang dataset nghiên cứu, không tự đổi thành%/lợi nhuận.
- ROI tài chính quy ước%=(revenue-cost)/cost*100, chỉ khi cost>0, finite/nonnegative, cùng currency; không là audited profit/incremental effect.
- Tiền nhập dùng dấu chấm thập phân, tối đa2chữ số lẻ, mỗi giá trị/tổngcost≤10^12; không exponent/group separators/FX. Tổng dùng minor units. Dirty fields ẩn ROI cũ.
- Ngành/goal chỉ brief, không có điểm affinity. Chỉ preferences explicit tạo điểm, required trước; giữties. Không đọc ROI để chọn.
- Plan là template tham khảo; ngày relative, tài khoản/tracking/ngân sách cần user phê duyệt, không có số kinh tế tự sinh.

## 12. Lỗi / giới hạn còn lại
Đọc FINAL_REMAINING_ISSUES.md. Sáu lỗi chức năng và một lỗi tài nguyên đã sửa, có regression. P2/P3: local-only persistence/recovery, tài chính chưa kiểm toán, nguồn attribution/causal thiếu, Vitecold>30s và chunk>500kB. BrowsercoverageEdgeheadless/loopback, không production-ready. Tình trạng P0/P1 chính thức theo FINAL_ACCEPTANCE_REPORT, không theo checkpoint.

## 13. Quyết định đã chốt
- Giữ3pages, không thêm nav Campaign riêng.
- Không thêm industry/goal vàoAPI; không có automatic industry score.
- Campaign snapshot độc lập, không đổi theo source scenario; config chỉ sửa ởdraft, regenerate cầnconfirm/resetprogress/tăngrevision. Active/ended khóa cấu hình; ended khóatasks, cancelled khóafinance/khôngreportROI. Completedfinance có thể sửa vàrecompute.
- dm_campaigns v1 và dm_scenarios v1; rawcorrupt/versionunknown giữ nguyên, chỉmemory. Quota cónotice, không localStorage.clear trongproduction.
- Git status báo not-a-repository, không init/commit/push. Dùng SHA manifests để kiểm bảo toàn.

## 14. Tuyệt đối không thay đổi để ép nghiệm thu
Không train/refit, không mở ROI Test nghiên cứu, không sửa7artifact/joblib/metadata/metrics/reference, không đổi BASELINE_ONLY/API contract, không sửa lịch sửresearch, không /optimize hoặc Criteo production. Không xóa/skiptests/forceexit để green. Không dùng100/150fixture trong ảnh như businessactuals.

## 15. Tiếp tục ở session mới
1. Đọc4FINALreports + acceptance_summary.json, kiểm SourceSHA nếu source có thay đổi ngoài phiên.
2. Giữ7artifact/gate/backend và reports cũ. Không cần đọc lại toàn bộ chat.
3. Nếu chỉ demo: chạyBackend+build/preview, xác minhhealth/model-info, thửreference, flowindustry/plan/campaign với dữ liệu demo được ghi nhãn.
4. Nếu sửa mới: snapshot trước, targeted saufix, toàn bộregression/build/HTTP/hash/browser/cleanup mới; ghiPASS/FAIL/SKIP/BLOCKEDthực.
5. Không tiếp tụcML/newfeatures khi chưa có yêu cầu. Mọi khuyến nghị thực tế vẫn chưa validated.

## Audit console/network và asset cuối

Phát hiện 404 `/favicon.ico` trong luồng bình thường ở audit riêng, có URL trong [diagnostic](run_final_handoff/browser_diagnostic/diagnostic.json). Đã thêm favicon SVG data URI tại index.html, bỏ preconnect font ngoài không dùng và chuyển selection color sang blue. Không lọc bỏ lỗi hoặc tắt console assertion.

[Targeted audit sau sửa](run_final_handoff/browser-audit-assetfix-command.json) exit0: [checks](run_final_handoff/browser_audit_assetfix/checks.json), hai viewport, Dashboard/Predict/Compare/plan/campaign, **0 pageerror, 0 console.error, 0 unexpected network error**, không interception. Sau đó chạy lại Backend62/Frontend236/E2E80 và production build trên bundle đã sửa, đều PASS. Các fault-injection tests có lỗi network mong đợi được đánh giá riêng, không gọi đó là lỗi console của flow bình thường.

Ảnh production audit mới: [Dashboard desktop](run_final_handoff/browser_audit_assetfix/dashboard-1440.png), [Predict mobile](run_final_handoff/browser_audit_assetfix/predict-390.png), [Compare/plan desktop](run_final_handoff/browser_audit_assetfix/compare-plan-1440.png), [Campaign mobile](run_final_handoff/browser_audit_assetfix/campaign-390.png). Các số100/150/50% trong ảnh là fixtures do automation nhập, không phải business actuals.
