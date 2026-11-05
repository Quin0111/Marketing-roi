# Compare Scenarios — tích hợp API dự đoán thật

Ngày 04/11/2026. Phạm vi triển khai được mở rộng theo attachment website evaluation; đây là bàn giao riêng cho yêu cầu Compare API ban đầu. [Báo cáo toàn bộ website](marketing_evaluation_upgrade.md) ghi Dashboard, Predict, Insights và redesign.

## Chức năng triển khai

| Chức năng | Hành vi thực tế | Evidence |
|---|---|---|
| Predict từng kịch bản | Dùng PredictionService/API client cũ, POST đúng năm feature; kiểm domain từ model-info | `compare-api.test.tsx`, C01/C05 |
| Nhiều kịch bản | Request/result/loading/error độc lập; lỗi A không xóa kết quả B | Compare unit tests, C01/C02 |
| Nguồn | MODEL_PREDICTION từ API đã kiểm hợp đồng; DEMO_DATA riêng; NOT_PREDICTED khi chưa có output hiện hành | ScenarioPrediction, chart source/data-source, E01 |
| Metadata | ROI, Linear Regression, version 1.0.0, BASELINE_ONLY, cảnh báo đầy đủ mở xem; nhãn “Đã dự đoán bằng mô hình” | C01, `scenario-api-warning` |
| API lỗi | Không có ROI fallback, thông báo an toàn, retry; 422/503/500/network được kiểm | C02, Compare unit tests, outage script thật |
| Sửa | Xóa kết quả cũ trên card/table/chart, hủy pending, cho dự đoán lại feature mới | C03/C04, unit response ignores abort |
| Xóa/nhân bản | Xóa không resurrect; clone chỉ cấu hình/demo cũ, không copy kết quả API | C03/C04, Compare unit tests |
| Persistence | Envelope version1/CRUD giữ nguyên. API result không ghi vào localStorage, không tin prediction giả trong JSON | C06, unit forged storage |
| Predict → Compare | Thêm cấu hình, giữ danh sách cũ, nhận kết quả thật trong memory khi fingerprint/metadata khớp | E01, evaluation unit tests |
| Chart/table | Chart API mặc định, chọn demo riêng, thiếu kết quả thì empty; bảng tách cột, chỉ sort tên/thời lượng | C01, unit source switching/zero/no-ranking |
| Giới hạn | Không best/optimal/recommended, không gọi /optimize; chênh lệch không là bằng chứng hiệu quả | C01, E03, existing gate tests |

## Files

Chính: `src/pages/CompareScenariosPage.tsx`, `src/hooks/useScenarioPredictions.ts`, `src/components/scenarios/{ScenarioCard,ScenarioComparisonTable,ScenarioPrediction,ScenarioModal}.tsx`, `src/types/index.ts`. Luồng lưu từ Predict dùng `ScenarioTransferContext.tsx`, `PredictRoiPage.tsx`, `PredictionResultCard.tsx`, App provider; API client cũ được tái sử dụng. PredictionService chỉ bổ sung nguồn MODEL_PREDICTION cho response đã xác minh, không đổi request/Backend contract.

Tests mới: `tests/frontend/compare-api.test.tsx` **26 ca**, `evaluation-upgrade.test.tsx` **8 ca**; `tests/browser/compare-api.spec.ts` **12 ca**, `evaluation-upgrade.spec.ts` **5 ca**. Các test cũ vẫn được chạy; assertion hiển thị đã cập nhật theo 4 chữ số, giữ kiểm raw precision/reference và safety behavior.

Danh sách tất cả file cũ/mới ở [changed_files.md](run_compare_api/changed_files.md); helper kiểm thử và styling của bốn trang được ghi riêng ở báo cáo tổng. Không sửa production Backend, model, ROI Test, Quality Gate hoặc báo cáo lịch sử.

## Bằng chứng API

POST dùng đúng `Campaign_Type`, `Channel_Used`, `Target_Audience`, `Customer_Segment`, `Duration_days`, không gửi tên kịch bản hoặc ROI minh họa. Hai reference giữ nguyên:

| Reference | API LR raw | UI 4 chữ số | Sai số với artifact |
|---|---:|---:|---:|
| A: Social Media / Facebook / Women 25-34 / Fashionistas / 30 | 4.991136884533976 | 4,9911 | 0 |
| B: Search / Google Ads / Women 25-34 / Fashionistas / 45 | 4.997267870097019 | 4,9973 | 0 |

Evidence không intercept: [C01 desktop](run_compare_api/e2e-isolated-delivery/compare-reference-1440.json), [C01 mobile](run_compare_api/e2e-isolated-delivery/compare-reference-390.json); body/request/status/model/version/gate và absolute_error được ghi. HTTP script thực: [responses](run_compare_api/generated_current/backend/tests/http_results.json). C07 kiểm Compare từ production preview, E01 kiểm lưu từ Predictor sang Compare và reload không tin kết quả cũ.

Raw value giữ ở state/chart/data-value; chỉ format khi hiển thị. Chọn source chỉ lọc dữ liệu, không lựa chọn chiến dịch tốt nhất. Các ROI demo có sẵn vẫn đọc được trong cột/nguồn demo, không được quảng bá thành output mô hình khi API mất kết nối.

## Kiểm thử, build và bảo toàn

**READY_FOR_DEMO — phiên bản nghiên cứu local có giới hạn.** Đã triển khai trực tiếp và kiểm chứng bằng lượt chạy mới; không phải nghiệm thu mô hình cho quyết định kinh doanh.

| Bộ kiểm thử cuối | PASS | FAIL | SKIP | Exit | Evidence |
|---|---:|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | 0 | [JUnit](run_compare_api/backend-evaluation.xml), [command](run_compare_api/backend-evaluation-command.json) |
| Frontend Vitest | 112 | 0 | 0 | 0 | [JSON](run_compare_api/frontend-delivery.json), [command](run_compare_api/frontend-delivery-command.json) |
| Browser E2E | 48 | 0 | 0 | 0 | [JSON](run_compare_api/e2e-isolated-delivery.json), [command](run_compare_api/e2e-isolated-delivery-command.json) |

**Tổng 222 ca duy nhất PASS, 0 FAIL, 0 SKIP, 0 BLOCKED ở lượt nghiệm thu cuối; E2E flaky = 0.** Baseline lịch sử 171 được giữ nguyên; bổ sung 34 Frontend và 17 E2E. Không cộng reference/model loading/Quality Gate thành ca riêng vì đã nằm trong các suite.

| Kiểm tra bổ trợ | Kết quả | Evidence |
|---|---|---|
| TypeScript + Vite build cấu hình default API 8000 | PASS, exit 0 | [record](run_compare_api/build-default-delivery-command.json), [log](run_compare_api/build-default-delivery.log) |
| Build API 18000 để kiểm preview độc lập | PASS, exit 0 | [record](run_compare_api/build-isolated-delivery-command.json), [log](run_compare_api/build-isolated-delivery.log) |
| Real HTTP 9 requests, reference A/B | PASS, exit 0; sai số 0 cả hai mẫu | [record](run_compare_api/http-isolated-final-command.json), [responses](run_compare_api/generated_current/backend/tests/http_results.json) |
| Backend mất kết nối thật, không intercept | PASS, exit 0; Predict/Compare không ROI giả | [record](run_compare_api/offline-isolated-final-command.json), [JSON](run_compare_api/generated_current/tests/results/backend-offline.json) |
| Backend compileall / pip check | PASS, exit 0 | [compile](run_compare_api/compile-evaluation-command.json), [pip](run_compare_api/pip_check-evaluation-command.json) |
| Cleanup test servers | PASS; Backend exit 0, không còn process/cổng test | [cleanup](run_compare_api/e2e-isolated-delivery/e2e-cleanup.json) |
| Bảo toàn source Backend production, 7 artifact, lịch sử research | PASS; protected_changed rỗng | [integrity](run_compare_api/integrity.json) |

27 ảnh E2E mới nằm trong `run_compare_api/e2e-isolated-delivery-artifacts/`; thêm ảnh Predict desktop/mobile và outage trong `run_compare_api/generated_current/tests/results/`. [Tổng hợp máy đọc được](run_compare_api/acceptance_summary.json) ghi hash source/ảnh, 42 file cũ thay đổi và 14 file bàn giao mới, gồm tests/helper/reports. [Danh mục file](run_compare_api/changed_files.md) đối chiếu snapshot trước khi sửa.

Quality Gate **BASELINE_ONLY** giữ nguyên, nhánh nghiên cứu **RESEARCH_LIMITED**. Hai reference và toàn bộ artifact gốc không đổi. Compare được dùng để đối chiếu output API trong demo; **không phát hành chức năng khuyến nghị tối ưu**. Dừng sau lượt nâng cấp website này, không tự chuyển phase hoặc triển khai ML mới.

Chi tiết mọi lượt chạy chưa đạt/timing và cách giải quyết cổng test nằm ở báo cáo tổng; không giấu output cũ hoặc cộng lặp cùng ca reference trong nhiều suite. Mất kết nối thật tại API base 18000 đã kiểm không interception; server 8000 của người dùng được giữ nguyên. Hash bảy artifact và toàn bộ báo cáo research có trước được đối chiếu ở [integrity.json](run_compare_api/integrity.json).

## Hạn chế và kết luận

API results chỉ giữ trong phiên trang. Cấu hình được lưu cục bộ; không triển khai account/server storage. ROI chưa xác minh đơn vị kinh tế, không đổi thành %/lợi nhuận, không có prediction interval hiệu chuẩn. Linear Regression vẫn **BASELINE_ONLY**, nghiên cứu Criteo vẫn **RESEARCH_LIMITED** và không được phục vụ bởi API ROI.

Việc đối chiếu ROI thật qua API là chức năng kỹ thuật; không phải kiểm chứng phương án Marketing tối ưu. UC-08 vẫn NOT_IMPLEMENTED. Quyết định demo cuối phụ thuộc kết quả thực ở mục kiểm thử trên, không chuyển giai đoạn hoặc triển khai tính năng tối ưu.
