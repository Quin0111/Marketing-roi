# Final test results

Ngày 04/11/2026. Chỉ tổng hợp output mới trong `run_final_handoff/`. Baseline ba trang263 là lịch sử; action-plan195/Backend62 là lượt trung gian, không thay nghiệm thu cuối.

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


## Quy ước đếm và phạm vi

- Backend pytest, Frontend Vitest và E2E là ba suite độc lập. Reference/model loading/gate/integration đã nằm trong suite, không cộng lặp.
- Targeted67 ca FE và targeted1 cold E2E chỉ xác minh sửa lỗi; không cộng thêm vào tổng unique.
- Compile, pip check, HTTP9requests, offline script, hash và ảnh là kiểm bổ trợ, báo riêng exit/status; không biến một file log thành ca test mới.
- Source/application không bỏ test hoặc skip để làm xanh. Preview S06/C07 được chạy vì DM_TEST_BUILD_DIR hợp lệ, không đánh dấu PASS khi SKIP.
- API/financial fixtures trong tests không phải kết quả kinh doanh thực. P01 gọi thật sáu kênh, F01 context vẫn POST đúng năm feature, Reference A/B raw precision giữ nguyên.
- CORS dev5173/preview4173 và negative external origin nằm trong Backend/E2E. Browser desktop/mobile, storage corruption/quota/property-denied, console errors, model info/legacy routes và teardown được kiểm bằng các case liên quan.

## Lượt chưa đạt và sửa lỗi

1. `run_action_plan/frontend-first`:191 PASS/1 FAIL, duration string được coercion. Strict validation đã sửa, ca regression giữ nguyên.
2. `run_final_handoff/frontend-first`:194 PASS/1 FAIL, request đầu bị metadata passive-effect clear trong timing nhạy. Layout invalidation + Auto layout-request regression; targeted-fixed67 PASS, full FE acceptance chạy lại.
3. `e2e-isolated-acceptance`:77 PASS/1 cold-start timeout. Assertion/UI/API không bị nới; budget ca P01 hữu hạn45s như các ca lạnh tương tự. `targeted-e2e`:1PASS/exit0 trước full rerun. Bundle cho lượt release giữ byte-identical với build acceptance, kiểm ở release-bundle.json.

Tất cả log/JSON/trace các lượt chưa đạt được giữ, không sửa kết quả lịch sử. Các FAIL này không được suy đoán thành PASS; kết luận cuối chỉ lấy record cuối có exit0.

4. Offline verifier lần đầu timeout page.goto30s do Vite cold-load; giữ log offline-isolated-release. Sửa riêng budget navigation45s, không sửa10s API timeout/assertion. Lượt offline-isolated-assetfix PASS với Backend18000 thực sự tắt. Thay đổi chỉ ở test helper độc lập, không đổi runtime hoặc bundle đã qua236 FE/80 E2E.

## Audit console/network và asset cuối

Phát hiện 404 `/favicon.ico` trong luồng bình thường ở audit riêng, có URL trong [diagnostic](run_final_handoff/browser_diagnostic/diagnostic.json). Đã thêm favicon SVG data URI tại index.html, bỏ preconnect font ngoài không dùng và chuyển selection color sang blue. Không lọc bỏ lỗi hoặc tắt console assertion.

[Targeted audit sau sửa](run_final_handoff/browser-audit-assetfix-command.json) exit0: [checks](run_final_handoff/browser_audit_assetfix/checks.json), hai viewport, Dashboard/Predict/Compare/plan/campaign, **0 pageerror, 0 console.error, 0 unexpected network error**, không interception. Sau đó chạy lại Backend62/Frontend236/E2E80 và production build trên bundle đã sửa, đều PASS. Các fault-injection tests có lỗi network mong đợi được đánh giá riêng, không gọi đó là lỗi console của flow bình thường.

Ảnh production audit mới: [Dashboard desktop](run_final_handoff/browser_audit_assetfix/dashboard-1440.png), [Predict mobile](run_final_handoff/browser_audit_assetfix/predict-390.png), [Compare/plan desktop](run_final_handoff/browser_audit_assetfix/compare-plan-1440.png), [Campaign mobile](run_final_handoff/browser_audit_assetfix/campaign-390.png). Các số100/150/50% trong ảnh là fixtures do automation nhập, không phải business actuals.
