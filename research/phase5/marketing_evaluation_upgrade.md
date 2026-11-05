# DreamMakers — Nâng cấp website hỗ trợ đánh giá chiến dịch Marketing

Ngày 04/11/2026, Asia/Bangkok. Báo cáo thực thi yêu cầu trong attachment `f9e8bcfd-2abe-4128-b91e-4fde698afc54`, kế thừa phần Compare API đã triển khai trong cùng lượt làm việc.

**READY_FOR_DEMO — công cụ nghiên cứu local có giới hạn; 222 ca PASS, 0 FAIL, 0 SKIP.** Chi tiết evidence và hạn chế ở cuối báo cáo.

## 1. Khảo sát và phạm vi

Đã đối chiếu bốn page và các component liên quan, API client, ModelContext, scenario storage, FastAPI routes/schema/model service, tests; báo cáo Phase 5.2 (`phase5_2_implementation_report.md`, `phase5_2_test_results.md`, `phase5_2_remaining_issues.md`), Phase 5.3 (`phase5_3_final_acceptance.md`, UC contract), cùng ba báo cáo bàn giao ML. Các tài liệu lịch sử giữ nguyên.

| Khu vực | Trước nâng cấp | Sau triển khai |
|---|---|---|
| Dashboard | KPI/biểu đồ minh họa; bảng 12 dòng mẫu | Quy mô kiểm toán và hai phân phối số đếm Development đã đối soát; bảng mẫu riêng DEMO_DATA; nút điều hướng |
| Predict ROI | API Linear Regression thật, năm feature, validation và chống stale | Giữ API hiện có; hiển thị 4 chữ số, raw precision nguyên vẹn; lưu cấu hình và chuyển kết quả sang Compare |
| Compare | CRUD/localStorage và ROI minh họa | API thật từng kịch bản, trạng thái/retry độc lập, hủy kết quả cũ, chart chọn nguồn, không ranking |
| Model Insights | Snapshot metrics và nghiên cứu đọc riêng | Giải thích ngắn baseline/RMSE; nguồn, giới hạn và nghiên cứu bổ sung mở xem; bảng metrics cuộn ngang trên mobile |
| Giao diện | Navy/tím, gradient, nhiều cảnh báo/badge lặp | Blue/slate, card trắng, một Quality Gate control tại header, giới hạn chi tiết có thể truy cập |

Không huấn luyện mô hình, không đọc ROI Test để nghiên cứu, không tạo optimizer, không đổi endpoint hoặc schema Backend production. Không tích hợp Criteo vào suy luận ROI, không Git init/push/deploy.

## 2. Dashboard: thống kê có nguồn

Snapshot mới [verifiedDataset.json](../../src/data/verifiedDataset.json) chỉ chép cột `count` của hai feature từ [development_group_statistics.csv](../outputs/phase4b1/development_group_statistics.csv). Mỗi nhóm cộng đúng **170.000**. Số dòng dataset gốc **200.000** lấy từ kiểm toán cấu trúc Phase 4B.1, không coi đó là 200.000 dòng dữ liệu vận hành thật.

| Campaign_Type | Số dòng Development | Channel_Used | Số dòng Development |
|---|---:|---|---:|
| Display | 34.012 | Email | 28.470 |
| Email | 33.818 | Facebook | 27.954 |
| Influencer | 34.121 | Google Ads | 28.433 |
| Search | 34.085 | Instagram | 28.404 |
| Social Media | 33.964 | Website | 28.409 |
| — | — | YouTube | 28.330 |

SHA-256 nguồn: `462998cbc0197a0778a9f9b96658f11c7fcae504f3fb94a6e9c6ba82ce0bff97`. Test kiểm byte/hash, tên nhóm, từng số đếm và tổng; không dùng dữ liệu mock làm bằng chứng. Hai biểu đồ có scope Development và đơn vị số bản ghi, không hiển thị ROI trung bình giả. Tắt animation cho biểu đồ mới để ảnh và chiều cao cột phản ánh ngay dữ liệu thật.

Bảng 12 chiến dịch hardcode còn tồn tại đúng vai trò **DEMO_DATA**, ghi rõ không lấy từ dataset/API. Tìm kiếm/lọc/phân trang vẫn hoạt động. Hai biểu đồ mới không dùng các component ROI minh họa cũ; những component cũ còn trong source không có nghĩa đang được render trên Dashboard.

## 3. Predict và chuyển sang Compare

[PredictRoiPage](../../src/pages/PredictRoiPage.tsx) tiếp tục dùng [PredictionService](../../src/services/predictionService.ts) và API client hiện có. Backend `/model-info` xác minh domain và model version; chỉ gửi đúng năm field kỹ thuật. Response trái hợp đồng, số không hữu hạn, version khác, quality_status khác hoặc trường khuyến nghị bị từ chối.

Chỉ `toFixed(4)` ở lớp trình bày. `PredictionResponse.predictedRoi`, `data-value`, chart data và đối chiếu reference giữ nguyên số gốc. `source: MODEL_PREDICTION` được gắn sau khi API response đã được kiểm tra, không lấy nhãn này từ localStorage.

Nút **Lưu thành kịch bản so sánh**:

1. Đọc danh sách hiện có qua storage service, thêm UUID và năm feature theo schema cũ.
2. Không ghi đè khi dữ liệu không đọc được/sai cấu trúc; lỗi ghi có thông báo, không chuyển trang như đã lưu thành công.
3. Chỉ lưu cấu hình vào envelope version 1. Không lưu kết quả API vào localStorage.
4. Chuyển response API thật trong [ScenarioTransferContext](../../src/contexts/ScenarioTransferContext.tsx). Compare chỉ nhận khi fingerprint năm feature, chính object metadata hiện hành, version và gate khớp.
5. Reload giữ cấu hình nhưng kết quả API trở về chưa dự đoán. Không nâng ROI minh họa cũ thành kết quả mô hình.

Loading/error/retry/reset, hủy request và vô hiệu hóa kết quả sau thay đổi input vẫn được kiểm thử. Giá trị là thang đo nghiên cứu, không tự quy đổi thành % hoặc lợi nhuận; không tạo khoảng tin cậy từ RMSE.

## 4. Compare API và nguồn kết quả

Chi tiết ở [compare_scenarios_api_upgrade.md](compare_scenarios_api_upgrade.md).

- Giữ tạo/sửa/xóa/nhân bản/lưu cấu hình. CRUD không tự gọi predict.
- Mỗi kịch bản có nút predict/re-predict/retry và loading/error riêng. Có thể gọi nhiều kịch bản.
- [useScenarioPredictions](../../src/hooks/useScenarioPredictions.ts) giữ fingerprint năm feature và metadata trong bộ nhớ. Sửa/xóa hủy request và xóa entry; response cũ bị bỏ qua kể cả transport không tuân thủ abort. Đổi metadata hoặc rời trang hủy request.
- `MODEL_PREDICTION`: kết quả API đã kiểm hợp đồng; `DEMO_DATA`: ROI minh họa cũ; `NOT_PREDICTED`: chưa có kết quả API hiện hành, gồm khi đang chờ hoặc thất bại. Trạng thái lỗi/loading vẫn hiển thị riêng, không được coi là ROI.
- Bảng tách cột; chart mặc định API, cho chọn riêng demo, không trộn/điền số thiếu bằng demo. Trục chart chứa zero. Số 0 hợp lệ không biến thành fallback.
- Chỉ sort tên/thời lượng; không sort ROI, chọn best hoặc gắn nhãn Recommended/Optimal. Chênh điểm không chứng minh tác động kinh doanh.

## 5. Model Insights và thiết kế

Linear Regression tiếp tục là predictor ROI duy nhất. Metrics lịch sử giữ đúng `model_metrics.json` phiên bản 1.0.0: Dummy RMSE **1,732275**, LR **1,732384**. Giới hạn tái lập 4B.1A vẫn được nêu trong nguồn mở xem; không thay số để khớp nghiên cứu mới. Bảng Phase 4B.2 theo giao thức 15 outer fold và Criteo visit/uplift **RESEARCH_LIMITED** nằm ở khối riêng. Không coi Qini là ROI hoặc bằng chứng VALIDATED.

Primary `#2563EB`, hover `#1D4ED8`, sidebar `#0F172A`, active `#1E293B`, nền `#F8FAFC`, card trắng/viền slate; bỏ gradient tím và banner dài ở luồng chính. Cảnh báo Backend đầy đủ vẫn truy cập trong details; main UI ghi ngắn gọn chỉ phục vụ nghiên cứu. Một Quality Gate control tại header, có focus/keyboard/Escape và tooltip portal giới hạn theo viewport.

Tên hiển thị cấu hình bằng `VITE_DISPLAY_NAME` trong `.env.local` trước khi chạy/build, fallback **Người dùng DreamMakers**. Đây là tên cục bộ, không phải tài khoản đã xác thực. Không dựng đăng nhập giả. Hướng dẫn cập nhật trong [README](../../README.md) và [.env.example](../../.env.example).

Visual QA đã xem ảnh thật Dashboard desktop, Predict với reference, Compare API và Insights mobile. Phát hiện và sửa nút Predict trắng sau bỏ gradient; bổ sung E2E kiểm màu nền. Phát hiện bảng metrics bị ép cột trên mobile; thêm min-width và kiểm cuộn ngang cục bộ, giữ viewport không tràn.

## 6. Bằng chứng kiểm thử và phạm vi

Không dùng PASS Phase 5.3 thay cho lượt chạy mới. Backend có test schema, domain 15/30/45/60, model loading/hash, reference/gate/CORS và error handling. Frontend có integration, lifecycle/storage, Compare và luồng chuyển prediction. Browser chạy với Edge headless, Vite dev và production preview, Backend FastAPI riêng **18000**; bundle test được build cùng API base. Build cấu hình thông thường vẫn dùng default **8000**.

Các test mới: [Compare unit/integration](../../tests/frontend/compare-api.test.tsx), [evaluation unit/integration](../../tests/frontend/evaluation-upgrade.test.tsx), [Compare E2E](../../tests/browser/compare-api.spec.ts), [evaluation E2E](../../tests/browser/evaluation-upgrade.spec.ts). S05 kiểm bốn trang ở 320/390/768/1440; tooltip có hình học viewport và bàn phím; S04 kiểm modal/focus/keyboard. Fault injection 422/503/500/network và unit stubs chỉ là phương tiện kiểm lỗi, không được coi là bằng chứng dự đoán thật.

Bằng chứng API không intercept: C01 reference A/B trên desktop/mobile, E01 save/compare, S06 production preview; thêm HTTP verification riêng 9 requests. Outage script thật không có server tại API base 18000 và không interception: Predict/Compare không hiển thị ROI API, nút disabled, trạng thái UNVERIFIED.

Các lượt chưa đạt được giữ trong `run_compare_api/`: E2E đầu bị BLOCKED trước khi chạy ca vì cổng 8000 có server người dùng; không dừng hoặc dùng server đó, đã thêm tùy chọn cổng cho **test launcher**, mặc định không đổi. Các FE fail do assertion giao diện cũ/full precision đã được cập nhật để kiểm UI 4 chữ số đồng thời giữ assertion raw/reference. Một lượt chạy FE đồng thời hai build có 111 PASS/1 FAIL ở chờ kết quả đầu tiên; chưa xác định chắc nguyên nhân, có khả năng do timing/tải môi trường. Giữ log `frontend-final-evaluation.*`; lượt lại không sửa logic và lượt delivery đều PASS. Đây là dấu hiệu flaky cần theo dõi, không xóa lịch sử fail hoặc tự suy đoán thành PASS.

## 7. File thay đổi và bảo toàn

Danh mục đầy đủ: [changed_files.md](run_compare_api/changed_files.md), hash source/ảnh trong [acceptance_summary.json](run_compare_api/acceptance_summary.json). Một số TSX chỉ thay palette/bo góc hoặc chuẩn hóa dòng, không đổi logic. Test helper sửa cổng là `backend/tests/verify_http.py`, `tests/support/serve_backend.py`, `e2e-global-setup.mjs`, `api-base.ts` và offline verifier; **không sửa Backend production**.

[integrity.json](run_compare_api/integrity.json) đối chiếu snapshot 2.183 file có trước, bảo vệ mọi file lịch sử dưới research và toàn bộ backend/app, backend/models. Output lịch sử do test ghi lại đã được sao lưu/khôi phục; output mới lưu riêng dưới `run_compare_api/generated_current/`. Không sửa bảy artifact, hai reference, dataset/ROI Test hoặc kết quả nghiên cứu. Hash bảy artifact đối chiếu thêm manifest gốc của Backend.

## 8. Hạn chế và điều kiện demo

- Chỉ demo local phục vụ nghiên cứu; **BASELINE_ONLY**, nghiên cứu **RESEARCH_LIMITED**. Không chứng minh độ chính xác áp dụng kinh doanh hoặc tối ưu Marketing; UC-08 vẫn NOT_IMPLEMENTED.
- So sánh là đối chiếu output của predictor chưa vượt Dummy ổn định, không phải đánh giá chính sách/nhân quả. Không có uncertainty interval được hiệu chuẩn.
- Cấu hình lưu trên từng trình duyệt; kết quả API chỉ trong phiên trang, reload/rời trang cần predict lại. Không có đồng bộ tài khoản/server storage; dữ liệu mất quyền lưu sẽ báo lỗi.
- Dashboard là thống kê nghiên cứu tĩnh có nguồn, bảng mẫu riêng; không phải analytics vận hành realtime.
- Có thể cuộn ngang bảng rộng trên mobile. Browser coverage thực tế là Edge headless local, không tuyên bố đã nghiệm thu mọi trình duyệt/thiết bị.
- Build có warning chunk JS >500 kB; TypeScript/Vite không lỗi. Không thay đổi kiến trúc bundle chỉ để che warning. Có dấu hiệu test timing nêu trên cần theo dõi nếu tái xuất hiện.

## 9. Kết quả nghiệm thu cuối

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
