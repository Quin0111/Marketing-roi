# DreamMakers — Gợi ý mức độ phù hợp theo tiêu chí

Ngày 04/11/2026, Asia/Bangkok. Nguồn yêu cầu: attachment `840c28b0-b60d-4fae-a479-8d5a658477d5`.

**READY_FOR_DEMO — gợi ý theo tiêu chí có giới hạn; 242 kiểm thử PASS.** Đây là rule-based suitability ở Frontend, không phải optimizer ROI hoặc triển khai lại nhánh ML.

## 1. Khảo sát chức năng có trước

Đã đọc Compare, Scenario Storage, API client, hook dự đoán, các tests và bốn báo cáo yêu cầu: `marketing_evaluation_upgrade.md`, `compare_scenarios_api_upgrade.md`, `final_ml_research_summary.md`, `ml_to_website_handoff.md`. Baseline nghiệm thu gần nhất là Backend 62, Frontend 112, E2E 48, tổng 222.

Compare đã có CRUD/nhân bản/lưu envelope version1, API thật từng kịch bản, retry, hủy stale response, bảng/chart phân biệt API và demo. API kết quả chỉ trong phiên, fingerprint năm feature và metadata bảo vệ kết quả. Những chức năng này được kế thừa, không thay bằng bộ chọn mới.

## 2. Thiết kế và quy tắc rules-v1

Thêm **Gợi ý phương án Marketing phù hợp** bên dưới phần so sánh. Form có bốn tiêu chí, bỏ trống nghĩa là không xét:

| Tiêu chí | Đối chiếu thực tế | Tùy chọn |
|---|---|---|
| Kênh Marketing | So bằng đúng `channelUsed` | Bắt buộc / ưu tiên |
| Thời lượng | `durationDays === giá trị` hoặc `durationDays <= tối đa` | Bắt buộc / ưu tiên; 15/30/45/60 ngày |
| Nhóm khách hàng | So bằng đúng `targetAudience` | Bắt buộc / ưu tiên |
| Phân khúc | So bằng đúng `customerSegment` | Bắt buộc / ưu tiên |

Các giá trị dùng miền cấu hình chiến dịch hiện có. Không suy đoán khả năng tiếp cận, chi phí, conversion, doanh thu hay ưu thế cố định của kênh. Loại chiến dịch chỉ xuất hiện trong phần giống/khác của cấu hình, không tự thêm trọng số ẩn.

Hàm thuần [evaluateScenarioSuitability](../../src/services/scenarioSuitability.ts) chỉ đọc `id`, `name`, `features`:

1. Xét từng tiêu chí và ghi actual/expected/matched để giải thích.
2. Phương án phải thỏa **tất cả điều kiện bắt buộc**. Điểm ưu tiên không thể bù một điều kiện bắt buộc thất bại.
3. Mỗi ưu tiên khớp có trọng số cố định **1**, không khớp **0**. Form nói rõ trọng số bằng nhau; không suy ra trọng số từ mô hình hoặc dữ liệu ROI.
4. Trong những phương án đủ điều kiện, giữ mọi phương án có tổng điểm ưu tiên cao nhất. Một phương án: “Gợi ý theo tiêu chí”; nhiều phương án: đồng hạng, không chọn riêng một.
5. Chỉ chọn điều kiện bắt buộc: tất cả phương án đủ điều kiện đồng hạng ở điểm ưu tiên 0. Không có tiêu chí: không chọn. Không có phương án đạt bắt buộc: báo không có phương án phù hợp. Có ưu tiên nhưng mọi phương án đủ điều kiện đều 0 điểm: báo chưa có cơ sở gợi ý, không chọn tùy tiện.
6. Không sử dụng `predictedRoi`, output API, chi phí hoặc mô hình Criteo trong điểm hoặc tie-breaker. Đổi thứ tự danh sách chỉ đổi thứ tự trình bày các đồng hạng, không đổi tập phương án được giữ.

Đây là mức khớp theo lựa chọn người dùng, không là utility kinh tế đã kiểm chứng. “Phù hợp nhất” chỉ có nghĩa là phù hợp hơn theo bộ quy tắc bằng nhau này trong danh sách hiện có; không tìm kiếm toàn bộ không gian chiến dịch.

## 3. Tích hợp và hiển thị

[ScenarioSuitability](../../src/components/scenarios/ScenarioSuitability.tsx) giữ tiêu chí trong state của phiên trang, tính lại trực tiếp từ cấu hình hiện tại mỗi lần render. Không cache selected IDs hoặc lưu điểm vào localStorage. Thay đổi tiêu chí/role/exact-maximum, tạo/sửa/xóa/nhân bản tự cập nhật kết quả. Nút Xóa tiêu chí đưa về trạng thái chưa gợi ý.

- Live region có tên riêng, hỗ trợ thông báo kết quả qua công nghệ hỗ trợ.
- Kết quả cho thấy tên phương án, điểm ưu tiên và lý do khớp. Bảng đối chiếu liệt kê từng actual/expected, vai trò và đạt/không đạt cho **mọi** phương án, gồm phương án bị loại.
- Mục mở xem liệt kê năm feature giống/khác giữa các cấu hình.
- ROI chỉ tham khảo cho phương án được giữ nếu `predictionFor` trả success hiện hành. Hiển thị API /predict, model/version và BASELINE_ONLY; không lấy ROI mô phỏng làm tham khảo mô hình.
- Sau sửa/xóa hoặc refresh metadata, hook cũ vô hiệu hóa response; phần gợi ý lập tức bỏ ROI không còn hiệu lực. Tính suitability không yêu cầu API: khi Backend lỗi vẫn có thể đối chiếu cấu hình, còn ROI ghi chưa có kết quả API hiện hành và nút predict vẫn theo metadata thật.
- Một chú thích ngắn nói rõ thiếu dữ liệu kinh tế/nhân quả; không lặp banner cảnh báo dài. Dùng card trắng, blue/slate và bảng cuộn ngang cục bộ trên mobile.

Không gọi thêm endpoint hoặc tự POST khi chọn tiêu chí. API `/predict`, schema, Quality Gate rules và cơ chế lưu kịch bản giữ nguyên. Câu chú thích tại Compare được làm rõ phạm vi “kết quả ROI không dùng để xếp hạng”, để phân biệt với đánh giá phù hợp theo tiêu chí mới được người dùng yêu cầu.

## 4. Files đã sửa/thêm

| File | Thay đổi |
|---|---|
| `src/services/scenarioSuitability.ts` | Hàm thuần, kiểu tiêu chí/kết quả, protocol rules-v1 và tên năm feature |
| `src/components/scenarios/ScenarioSuitability.tsx` | Form, kết quả/lý do/tie/empty, bảng phân tích, giống/khác và ROI tham khảo hiện hành |
| `src/pages/CompareScenariosPage.tsx` | Gắn khu vực mới sau so sánh; đặt accessible name cho thông báo lưu trữ; làm rõ giới hạn ROI |
| `tests/frontend/suitability.test.tsx` | 10 ca hàm thuần + 5 ca component/integration |
| `tests/browser/suitability.spec.ts` | 5 ca E2E mới, hai viewport, API thật, criteria/edit/delete/offline |
| `tests/frontend/phase5_2.test.tsx` | Định danh live region thông báo lưu trữ; giữ assertion lỗi lưu và hành vi cũ |
| `tests/browser/phase5_2.spec.ts` | Tương tự, tránh chọn nhầm live region kết quả suitability mới |
| `research/phase5/suitability_{guard,restore,run}.py` | Tái sử dụng QA runner/snapshot/restore ở output riêng `run_suitability/` |
| `research/phase5/suitability_visual.mjs` | Visual QA độc lập từ production preview/API thật, hai viewport, ảnh và cleanup riêng |
| Báo cáo này | Thiết kế, quy tắc, nghiệm thu và giới hạn |

Không sửa Scenario Storage, API client, hook prediction, production Backend, artifact, dataset hoặc nghiên cứu ML. Báo cáo lịch sử không được cập nhật để làm như tính năng mới đã tồn tại ở nghiệm thu cũ.

## 5. Kiểm thử và bằng chứng

Các ca mới kiểm đầy đủ yêu cầu:

| Yêu cầu | Kiểm thực tế |
|---|---|
| Phù hợp duy nhất / đồng hạng / không đáp ứng / chưa tiêu chí | Unit rules-v1, component và U01 |
| Bắt buộc trước ưu tiên; trọng số minh bạch | Unit filtering/weights/required-only và U02 |
| Thời lượng tối đa, đúng thời lượng, biên bằng | Unit duration và U02 |
| Đổi tiêu chí, reset, sửa/xóa | Component cập nhật props, integration edit, U01/U03 |
| Không đọc ROI để chọn | Getter `predictedRoi` cố ý throw: hàm vẫn chạy; đảo ROI/đảo thứ tự không đổi tập lựa chọn |
| Không tạo nhận xét thiếu dữ liệu | Kiểm ghi rõ thiếu chứng cứ, không có khẳng định tăng conversion/doanh thu/tiếp cận |
| API ROI thật và không dùng stale/demo | Unit integration và U01/U03; U04 chặn metadata, vẫn không hiện điểm demo như kết quả mô hình |
| Gate/contract/API cũ không hồi quy | Toàn bộ Backend/FE/E2E cũ, U01 gate và U04 request count |
| Desktop/mobile | U01 1440×900 và 390×900; bộ S05 cũ 320/390/768/1440 và tooltip/modal tiếp tục chạy |

U01 gọi `/predict` thật cho cả hai reference, kiểm request đúng năm feature, HTTP200 và raw ROI bằng artifact; metadata vẫn Linear Regression 1.0.0 / BASELINE_ONLY. Các payload/response được đính kèm JSON của Playwright. Unit fixtures và U04 fault injection không được dùng làm bằng chứng hiệu quả Marketing hoặc kết quả ML thực tế.

Lượt FE đầu: **126 PASS/1 FAIL**, vì query `getByRole('status')` cũ trở nên không duy nhất khi thêm live region. Đã đặt accessible name và scope hai assertion lưu trữ (unit/browser), giữ nguyên kiểm lỗi lưu; không xóa ca test hoặc sửa dữ liệu để ép PASS. Log/JSON lần đầu giữ trong `run_suitability/frontend-first.*`.

### Nghiệm thu cuối — kết quả chạy mới

| Bộ thực sự chạy | PASS | FAIL | SKIP | Exit | Evidence |
|---|---:|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | 0 | [JUnit](run_suitability/backend-final.xml), [command](run_suitability/backend-final-command.json) |
| Frontend Vitest | 127 | 0 | 0 | 0 | [JSON](run_suitability/frontend-final.json), [command](run_suitability/frontend-final-command.json) |
| Browser E2E | 53 | 0 | 0 | 0 | [JSON](run_suitability/e2e-isolated-acceptance.json), [command](run_suitability/e2e-isolated-acceptance-command.json) |

**Tổng 242 ca duy nhất PASS, 0 FAIL, 0 SKIP, E2E flaky=0 ở lượt nghiệm thu cuối.** So baseline 222: thêm 15 Frontend và 5 E2E; không cộng đúp kiểm reference hoặc Quality Gate đã nằm trong suite.

Build TypeScript/Vite cấu hình default: **PASS/exit0**, [log](run_suitability/build-default-final.log), [record](run_suitability/build-default-final-command.json). Build API base 18000 cho preview: **PASS/exit0**, [record](run_suitability/build-isolated-final-command.json). Warning chunk >500 kB vẫn còn, không che warning.

E2E dùng server test riêng 18000, dev5173 và preview4173; không dừng hoặc dùng server 8000 của người dùng. [Cleanup cuối](run_suitability/e2e-isolated-acceptance/e2e-cleanup.json): Uvicorn exit0, không còn process/cổng test. [Tổng hợp máy đọc được](run_suitability/acceptance_summary.json) ghi command thực, counts, hash source/ảnh và danh mục file.

Lượt E2E đầu **52 PASS/1 FAIL**: bộ đếm request của U04 nhận nhầm các module Vite `/src/.../predictionService.ts` là endpoint `/predict` do dùng `includes`. Sửa test để so đúng pathname `/predict` và `/optimize`, giữ kiểm không gọi API; không sửa logic sản phẩm hoặc nới giới hạn gate. [Log lần đầu](run_suitability/e2e-isolated-final.log) và JSON/trace được giữ nguyên. Chạy lại **toàn bộ 53 ca**, không chỉ ca lỗi. Runtime không đổi nên tái sử dụng bundle đã build, kiểm byte/hash bằng [reused_build.json](run_suitability/reused_build.json).

### Bằng chứng giao diện và API

- E2E U01: ảnh/JSON attachments trong [artifacts](run_suitability/e2e-isolated-acceptance-artifacts/), kiểm cả reference A và B, criteria/ties/no-match/reset trên desktop/mobile.
- Visual QA độc lập: [checks.json](run_suitability/visual/checks.json) — **2 viewport PASS, 4 ảnh**, production preview + FastAPI thật, không interception; raw reference B **4.997267870097019**, sai số **0**, quality_status BASELINE_ONLY.
- [Toàn trang desktop](run_suitability/visual/compare-full-1440.png), [toàn trang mobile](run_suitability/visual/compare-full-390.png).
- [Vùng kết quả desktop](run_suitability/visual/suitability-result-1440.png), [vùng kết quả mobile](run_suitability/visual/suitability-result-390.png). Đã xem ảnh; bản chụp toàn trang ở scrollTop0 tránh thanh sticky chen giữa ảnh component dài.
- [Visual cleanup](run_suitability/visual/e2e-cleanup.json): Backend exit0 và mọi cổng test đóng. Kiểm bổ trợ này không được cộng thành ca mới trong tổng 242.

### Bảo toàn và quyết định

[Integrity](run_suitability/integrity.json): snapshot **2.462 tệp có trước**, protected_changed rỗng; **bảy artifact khớp SHA-256 gốc**. Không sửa Backend production, API contract, Linear Regression, Quality Gate, ROI Test hoặc nghiên cứu cũ. Test-generated reports lịch sử đã khôi phục; output mới nằm ở `run_suitability/generated_current/`. Source cũ chỉ đổi Compare và hai selector test; source/helper/test mới được liệt kê ở mục file và JSON summary.

**READY_FOR_DEMO cho RULE-BASED SUITABILITY.** Các chức năng quản lý, API/retry, chart/source và gate đã qua regression mới. Không suy ra đã tối ưu ROI hoặc đạt chất lượng kinh doanh. UC-08 tối ưu đã kiểm chứng vẫn NOT_IMPLEMENTED, production vẫn BASELINE_ONLY.

## 6. Giới hạn khoa học và phạm vi demo

- **BASELINE_ONLY** và **RESEARCH_LIMITED** giữ nguyên. Không huấn luyện, không đọc ROI Test để chọn hướng, không thêm model hoặc API recommendation/optimize.
- Điểm khớp không phải xác suất thành công, ROI, causal effect hoặc policy value. Một ưu tiên =1 là quy ước minh bạch, không là trọng số học từ hiệu quả kinh doanh.
- Không có bằng chứng ngân sách, conversion, revenue/margin hoặc reach để nhận xét phương án sẽ hiệu quả hơn thực tế. Không có causal trial hoặc uncertainty đã hiệu chuẩn cho quyết định Marketing.
- Tính năng có thể hoạt động trước/sau dự đoán vì chỉ cần cấu hình. Khi chưa có API success hiện hành, không hiển thị ROI mô hình tham khảo. Ties giữ mọi phương án, không dùng chênh lệch ROI phá tie.
- Tiêu chí và gợi ý chỉ giữ trong phiên trang; reload/rời trang cần chọn lại. Cấu hình vẫn dùng persistence cũ. ROI API vẫn cần dự đoán lại sau reload/chỉnh sửa.
- UC-08 **không được đánh dấu là tối ưu đã kiểm chứng**; phiên bản tối ưu ROI có điều kiện vẫn NOT_IMPLEMENTED. Đây là chức năng hỗ trợ mức độ phù hợp riêng, không đổi định nghĩa UC hoặc nâng gate.
- Kiểm thử là bằng chứng phần mềm local (Edge headless), không phải validation khoa học hay kiểm chứng mọi thiết bị. Warning bundle >500 kB còn tồn tại; build không báo lỗi TypeScript.

Dừng sau khi bàn giao tính năng suitability, không tự chuyển giai đoạn hoặc phát hành optimizer.
