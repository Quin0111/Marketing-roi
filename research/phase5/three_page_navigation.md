# DreamMakers — Điều hướng ba trang

Ngày 04/11/2026, Asia/Bangkok. Phạm vi: rút gọn Frontend theo yêu cầu người dùng, không thay đổi mô hình hoặc nghiên cứu.

**READY_FOR_DEMO — ba trang, 263 kiểm thử PASS, 0 FAIL, 0 SKIP.** Phạm vi nghiên cứu có giới hạn, Quality Gate BASELINE_ONLY.

## 1. Hành vi sau chỉnh sửa

Sidebar desktop và menu mobile chỉ còn **ba mục**:

1. Tổng quan.
2. Dự đoán ROI.
3. So sánh & Đề xuất.

Đã bỏ Model Insights khỏi điều hướng chính và union kiểu route. Header, tiêu đề nội dung Compare và CTA từ Dashboard dùng tên **So sánh & Đề xuất**. Cấu hình, CRUD/nhân bản/lưu, API predict/retry, chart tách nguồn, phân tích giống/khác và gợi ý theo tiêu chí được giữ nguyên. Không bổ sung hoặc tuyên bố đã có bộ máy tối ưu/hướng triển khai Marketing vượt nội dung rule-based hiện có.

## 2. Thông tin mô hình nằm trong Predict

Mục **Thông tin mô hình** mặc định thu gọn, có summary dùng bàn phím/native details. Khi mở:

- Predictor: **Linear Regression**, metadata/version hiện hành lấy từ ModelContext đã xác minh API.
- MAE **1,500916**, RMSE **1,732384**, R² **-0,000171**, lấy trực tiếp từ `EXPERIMENT_RESULTS`, không sao chép/chỉnh số để hợp thức hóa kết quả mới.
- Nguồn ghi rõ **model_metrics.json, artifact 1.0.0, snapshot 5-Fold trên Development 170.000 dòng theo metadata**. Dummy RMSE **1,732275**, có giới hạn tái lập theo audit 4B.1A; không gọi đây là metrics động hoặc thay bằng giao thức Phase 4B.2.
- Cảnh báo Backend đầy đủ và giới hạn: chưa vượt Dummy ổn định; thang ROI nghiên cứu không tự đổi thành %/lợi nhuận; RMSE không là khoảng tin cậy.
- **Quality Gate = BASELINE_ONLY** khi metadata đã được xác minh. Nếu API lỗi, ghi chưa xác minh metadata, giữ snapshot lịch sử có nhãn nguồn; không giả mạo trạng thái đã xác minh.

Mở **Bảng đánh giá và nghiên cứu chi tiết** để xem toàn bộ bảng/biểu đồ MAE/RMSE/R², baseline, provenance, giới hạn và nghiên cứu Phase 4B đã có. `ModelInsightsPage.tsx` được giữ làm nội dung chi tiết tái sử dụng, không là trang thứ tư trong menu. Dữ liệu metrics, metadata, kết quả nghiên cứu và tests về chất lượng không bị xóa.

## 3. Bookmark và lịch sử trình duyệt

| URL cũ/mới | Hành vi |
|---|---|
| `/#insights` | Thay entry hiện tại thành `/#predict/model-info`; mở/focus summary Thông tin mô hình |
| `/#/insights` | Cùng hành vi chuyển tiếp tương thích |
| `/insights`, `/insights/` | SPA nhận pathname, chuyển về `/#predict/model-info`, không để trang trắng/liên kết chết |
| `/#predict/model-info` | Vào trực tiếp Predict và tự mở/focus thông tin mô hình |
| `/#predict` | Vào Predict bình thường, mục thông tin mặc định thu gọn khi mount mới |

Route parser thuần ở `src/services/navigation.ts`. App đồng bộ hashchange/popstate, dùng `history.replaceState` cho URL cũ để không tạo vòng Back. Mỗi lần yêu cầu mở model information có navigation ID riêng, kể cả Predict đang mount. Mở mục thông tin không gọi predict hoặc thay inputs/kết quả mô hình.

Đã kiểm Back/Forward thật trong E2E. Với deployment ngoài Vite, pathname `/insights` cần server hosting cấu hình SPA fallback về `index.html`; đây là xử lý Frontend, không thêm route Backend. Hash bookmark hoạt động mà không cần rewrite pathname riêng.

## 4. File thay đổi

| File | Vai trò |
|---|---|
| `src/App.tsx` | Ba trang, xử lý alias/hash/popstate và chuyển yêu cầu mở model info |
| `src/services/navigation.ts` (mới) | Kiểu NavPage ba giá trị và hàm phân giải route/alias |
| `src/components/layout/Sidebar.tsx` | Bỏ Insights, đổi tên Compare |
| `src/components/layout/Layout.tsx` | Menu mobile ba mục, tên điều hướng truy cập được |
| `src/components/layout/Header.tsx` | Tiêu đề Compare mới, bỏ tiêu đề trang Insights độc lập |
| `src/pages/DashboardPage.tsx` | Đổi tên CTA Compare |
| `src/pages/CompareScenariosPage.tsx` | Đổi tiêu đề, không sửa logic kịch bản/API/suitability |
| `src/pages/PredictRoiPage.tsx` | Gắn mục ModelInformation, giữ vòng đời prediction và lưu sang Compare |
| `src/components/prediction/ModelInformation.tsx` (mới) | Tóm tắt metrics/nguồn/gate và truy cập toàn bộ nội dung cũ |
| `tests/frontend/navigation.test.tsx` (mới) | 13 ca route/nav/metrics/alias/focus/metadata outage |
| `tests/browser/navigation.spec.ts` (mới) | 8 ca desktop/mobile, năm URL và Back/Forward, ảnh UI |
| `tests/frontend/evaluation-upgrade.test.tsx` | Cập nhật assertion nhãn CTA, giữ kiểm đích liên kết |
| `tests/browser/evaluation-upgrade.spec.ts` | Truy cập provenance/limits qua model info; giữ các assertion dữ liệu/giới hạn và cuộn bảng |
| `tests/browser/phase5_2.spec.ts` | Kiểm ba trang cùng alias cũ, truy cập lịch sử qua panel; giữ kiểm outage/recovery và responsive |
| `tests/browser/prediction.spec.ts` | Đổi tên ca điều hướng; giữ vòng kiểm ba trang + legacy alias và mọi test API/reference |
| `README.md` | Hướng dẫn ba trang, model info và SPA fallback |
| `research/phase5/navigation_{guard,restore,run}.py` (mới) | QA snapshot/runner/restore output riêng, không chỉnh script lịch sử |
| Báo cáo này | Bàn giao và liên kết evidence mới |

Giữ nguyên `src/data/modelResults.ts`, component bảng/biểu đồ/nghiên cứu cũ, ModelContext, API client, hook prediction, Scenario Storage, rule-based evaluator và mọi file Backend production.

## 5. Kiểm thử và bằng chứng

Baseline được người dùng cung cấp: **242 PASS**. Chạy lại tests thật, không kế thừa PASS. Không xóa hoặc skip test chất lượng để bỏ trang; các assertion provenance/metrics/Date/Criteo/outage cũ chuyển sang lối truy cập thông tin mô hình. Thêm 13 Frontend và 8 E2E cho contract điều hướng mới.

### Kết quả thực sự chạy

| Suite | PASS | FAIL | SKIP | Exit | Evidence |
|---|---:|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | 0 | [JUnit](run_navigation/backend-final.xml), [command](run_navigation/backend-final-command.json) |
| Frontend Vitest | 140 | 0 | 0 | 0 | [JSON](run_navigation/frontend-first.json), [command](run_navigation/frontend-first-command.json) |
| Browser E2E | 61 | 0 | 0 | 0 | [JSON](run_navigation/e2e-isolated-final.json), [command](run_navigation/e2e-isolated-final-command.json) |

**Tổng 263 ca duy nhất PASS, 0 FAIL, 0 SKIP, E2E flaky=0.** So baseline 242: thêm 13 FE +8 E2E. Không cộng lặp reference/loading/gate vì đã nằm trong suite. Không xóa test cũ để đạt PASS.

TypeScript + Vite build default API8000 **PASS/exit0**: [log](run_navigation/build-default-final.log), [record](run_navigation/build-default-final-command.json). Bundle JS662.10kB/gzip187.40kB còn warning >500kB. Build riêng API18000 cho test preview **PASS/exit0**: [record](run_navigation/build-isolated-final-command.json).

E2E chạy với Backend riêng 18000, dev5173 và preview4173; không dừng hoặc dùng server 8000 của người dùng. [Cleanup](run_navigation/e2e-isolated-final/e2e-cleanup.json): Backend exit0, mọi process/cổng test đã đóng. Các ca cũ tiếp tục kiểm API thật, bốn duration, hai reference raw precision, lỗi 422/503/500/network/timeout, storage/CRUD/stale, metadata/gate/CORS, chuyển Predict sang Compare và suitability. Những ca điều hướng mới kiểm đúng ba mục, UI tên mới, nguồn metrics, legacy URLs và Back/Forward.

### Ảnh giao diện sau sửa

Ảnh do E2E chụp từ giao diện thật; đã xem menu desktop/mobile và phần model info mobile, không dùng ảnh dựng. Tổng lượt E2E có 35 ảnh; sáu ảnh chuyên biệt cho thay đổi này:

| Nội dung | Desktop 1440 | Mobile 390 |
|---|---|---|
| Điều hướng ba mục | [1440px](run_navigation/e2e-isolated-final-artifacts/navigation-N01-three-page--dc681-d-scenario-suitability-1440/navigation-1440.png) | [390px](run_navigation/e2e-isolated-final-artifacts/navigation-N01-three-page--6032e-ed-scenario-suitability-390/navigation-390.png) |
| So sánh & Đề xuất | [1440px](run_navigation/e2e-isolated-final-artifacts/navigation-N01-three-page--dc681-d-scenario-suitability-1440/compare-1440.png) | [390px](run_navigation/e2e-isolated-final-artifacts/navigation-N01-three-page--6032e-ed-scenario-suitability-390/compare-390.png) |
| Dự đoán ROI / Thông tin mô hình | [1440px](run_navigation/e2e-isolated-final-artifacts/navigation-N01-three-page--dc681-d-scenario-suitability-1440/predict-model-info-1440.png) | [390px](run_navigation/e2e-isolated-final-artifacts/navigation-N01-three-page--6032e-ed-scenario-suitability-390/predict-model-info-390.png) |

### Bảo toàn và bàn giao

[Integrity](run_navigation/integrity.json) so snapshot **2.610 file có trước**: protected_changed rỗng, **bảy artifact giữ đúng SHA-256 gốc**. Source Backend không thay đổi, dữ liệu MAE/RMSE/R²/metadata và báo cáo nghiên cứu trước giữ nguyên. Output test cũ đã sao lưu/khôi phục, output mới nằm trong `run_navigation/generated_current/`.

[Tổng hợp máy đọc được](run_navigation/acceptance_summary.json) ghi file cũ thay đổi, file mới, hash source/ảnh và command thực. Có **12 file cũ thay đổi**, **8 file bàn giao mới** (gồm ba QA helper tạo trước snapshot). Danh mục chi tiết ở mục 4; không coi QA helper là Backend production.

**READY_FOR_DEMO trong phạm vi nghiên cứu.** Điều hướng còn ba trang, bookmark cũ không chết, toàn bộ chức năng Compare/suitability và bằng chứng chất lượng vẫn truy cập được. Backend/API/model/Quality Gate/kết quả ML giữ nguyên; không chứng minh tối ưu ROI.

## 6. Giới hạn còn lại

- **BASELINE_ONLY** giữ nguyên; không nâng VALIDATED, không sửa API/model/artifact hoặc nghiên cứu. Criteo vẫn là bằng chứng nghiên cứu riêng, không được dùng dự đoán ROI.
- “Đề xuất” trong tên trang là gợi ý phù hợp theo tiêu chí đã triển khai, không chứng minh tối ưu ROI, hiệu quả kinh doanh hay tác động nhân quả. UC-08 tối ưu đã kiểm chứng vẫn NOT_IMPLEMENTED.
- Build có warning JS chunk >500 kB, không lỗi TypeScript. Một số unit test có warning Recharts do JSDOM không có layout; responsive thực được kiểm ở browser.
- Kiểm thử local bằng Edge headless, Vite dev và production preview; không tuyên bố đã kiểm chứng mọi browser/hosting. Chưa deploy hoặc thay cấu hình server người dùng.
- Test-generated reports có trước được khôi phục; output mới lưu riêng trong `run_navigation/`. Tài liệu nghiên cứu/những báo cáo nghiệm thu trước vẫn là lịch sử, không sửa để phản ánh menu mới.

Dừng sau bàn giao điều hướng ba trang, không mở rộng sang tính năng Marketing hoặc ML mới.
