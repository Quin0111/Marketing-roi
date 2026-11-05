# Chuyển biểu mẫu chiến dịch sang nhập tự do

Ngày 04/11/2026. Báo cáo nghiệm thu riêng cho thay đổi này; không thay các báo cáo lịch sử.

## Hành vi đã triển khai

- Predict ROI có bốn ô nhập văn bản kèm datalist gợi ý lấy từ `/model-info`; có thể nhập, sửa và xóa nội dung. Không khóa ô nhập khi Backend chưa sẵn sàng.
- Thời lượng là ô số nguyên dương an toàn của JavaScript. Có thể xóa để sửa; dữ liệu trống, âm, thập phân hoặc vượt số nguyên an toàn không được lưu/lập kế hoạch.
- Mô tả người dùng và đầu vào tương thích mô hình là hai lớp riêng. Mô tả gốc được giữ nguyên khi lưu. Panel đối chiếu hiển thị các giá trị đã ánh xạ hoặc liệt kê từng trường chưa hỗ trợ/chưa xác minh.
- Ánh xạ chỉ so khớp nhãn kỹ thuật hoặc bản dịch tiếng Việt được định nghĩa rõ, sau chuẩn hóa Unicode NFC, khoảng trắng và chữ hoa/thường. Không bỏ dấu, tìm gần đúng, suy đoán hay đổi sang một loại chiến dịch khác. Nhãn được ánh xạ vẫn phải có trong metadata hiện tại.
- Nút dự đoán chỉ mở khi cả năm giá trị tương thích và mô hình sẵn sàng. API Client kiểm tra lại trước HTTP, chỉ gửi đúng năm feature kỹ thuật. Schema Backend giữ nguyên.
- Nút **Lưu kịch bản để lập kế hoạch** lưu mô tả hợp lệ kể cả khi không có ROI hoặc Backend không khả dụng. Chuyển sang **So sánh & Đề xuất** để sửa tên, đánh giá theo tiêu chí và lập kế hoạch; có thể tạo chiến dịch từ phương án hoặc tạo thủ công.
- Modal thêm/sửa kịch bản và cấu hình chiến dịch cũng nhận nhập tự do. Storage chấp nhận mô tả mới và giữ khả năng đọc schema v1/legacy; các xử lý corruption/quota/read-only cũ vẫn được kiểm thử.
- Chỉnh bất kỳ feature nào ở Predict xóa kết quả, hủy request cũ. Sửa kịch bản xóa ROI cũ khỏi thẻ, bảng và biểu đồ. Tải lại giữ mô tả nhưng không tin cậy ROI lưu cũ như kết quả API hiện hành.
- Compare khóa dự đoán cho kịch bản không tương thích, ghi rõ trường lỗi, không tạo ROI thay thế. Biểu đồ API chỉ chứa kết quả API thực sự có; kịch bản không có ROI vẫn xuất hiện trong bảng và đánh giá tiêu chí.
- Tiêu chí có thêm lựa chọn lấy từ mô tả/thời lượng thực tế của các kịch bản, nên kênh mới không bị mất khỏi luồng đánh giá. So khớp tiêu chí là đối chiếu trực tiếp giá trị mô tả, không dùng ROI để chọn hoặc phá đồng hạng.

## Lập kế hoạch ngoài miền mô hình

Các template sáu kênh cũ được giữ. Thời lượng 15/30/45/60 giữ nguyên các khoảng giai đoạn cũ. Với thời lượng khác, điểm kết thúc được tính tương đối 20%/30%/90%/100%, làm tròn và chặn trong `[1, duration]`. Bốn giai đoạn giữ thứ tự. Với 1–3 ngày, một số giai đoạn cùng ngày và có ghi chú rõ; không tạo khoảng bắt đầu sau kết thúc.

Kênh chưa có template chuyên biệt nhận **checklist xác minh**: thu thập tài liệu, quyền tài khoản, định dạng, tracking và brief; không giả định nền tảng có quảng cáo hoặc conversion tracking. Loại chiến dịch/phân khúc mới giữ nguyên mô tả và bổ sung việc làm rõ yêu cầu. Không tự thay thành Instagram/Google Ads hoặc một nhãn được mô hình hỗ trợ. Bản nháp chưa xác nhận tổ hợp loại/kênh không tự khởi chạy.

Ví dụ đã kiểm thử trên browser: `Ra mắt sách / Hội chợ địa phương / Gia đình tại Đà Nẵng / Độc giả yêu sách / 21 ngày`. Không POST dự đoán; lưu/tải lại được, chọn tiêu chí kênh mới được, kế hoạch kết thúc ngày 21, tạo và tải lại chiến dịch được. Không tạo chi phí/doanh thu/lợi nhuận giả.

## Source code

| File | Thay đổi |
|---|---|
| [campaignInput.ts](../../src/services/campaignInput.ts) — mới | Validation mô tả và đối chiếu metadata/nhãn chính xác |
| [CampaignDescriptionFields.tsx](../../src/components/prediction/CampaignDescriptionFields.tsx) — mới | Bốn input+datalist, duration number; dùng chung ba luồng |
| [PredictionForm.tsx](../../src/components/prediction/PredictionForm.tsx) | Nhập tự do, panel tương thích, lưu độc lập, chặn submit không hợp lệ |
| [PredictRoiPage.tsx](../../src/pages/PredictRoiPage.tsx) | Lưu mô tả sang kịch bản; giữ cancellation/invalidation |
| [index.ts](../../src/types/index.ts) | `CampaignFeatures` là mô tả string/number; `ApiPredictionRequest` và enum mô hình vẫn riêng, không đổi contract |
| [predictionService.ts](../../src/services/predictionService.ts) | Ánh xạ và kiểm tra trước HTTP |
| [scenarioStorage.ts](../../src/services/scenarioStorage.ts) | Validation lưu trữ dựa vào mô tả hợp lệ, độc lập miền mô hình |
| [ScenarioModal.tsx](../../src/components/scenarios/ScenarioModal.tsx) | Cho lưu/sửa nội dung ngoài miền mô hình |
| [CampaignManagement.tsx](../../src/components/scenarios/CampaignManagement.tsx) | Cấu hình nhập tự do, chặn mô tả trống trước tái tạo kế hoạch |
| [marketingActionPlan.ts](../../src/services/marketingActionPlan.ts) | Thời lượng bất kỳ, template/checklist chưa xác minh, giữ mô tả gốc |
| [CompareScenariosPage.tsx](../../src/pages/CompareScenariosPage.tsx) | Khóa dự đoán ngoài miền, truyền lý do |
| [ScenarioCard.tsx](../../src/components/scenarios/ScenarioCard.tsx) | Hiển thị từng trường không tương thích |
| [ScenarioSuitability.tsx](../../src/components/scenarios/ScenarioSuitability.tsx) | Lựa chọn tiêu chí từ dữ liệu nhập thực tế; tra nhãn an toàn |
| [translations.ts](../../src/constants/translations.ts) | Hỗ trợ fallback mô tả mới; không tra thuộc tính kế thừa như `constructor` |

Không sửa `App.tsx`, Backend production, API contract, pipeline hoặc bảy artifact.

## Kiểm thử và bằng chứng

| Suite chạy mới | PASS | FAIL | SKIP | Evidence |
|---|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | [Record](run_free_input/backend-final-command.json), [JUnit](run_free_input/backend-final.xml) |
| Frontend Vitest/integration | 264 | 0 | 0 | [Record](run_free_input/frontend-confirm-command.json), [JSON](run_free_input/frontend-confirm.json) |
| Browser E2E | 83 | 0 | 0 | [Record](run_free_input/e2e-isolated-confirm-command.json), [JSON](run_free_input/e2e-isolated-confirm.json) |

**409 ca duy nhất**, không cộng các lượt chạy lại hoặc assertion trong vòng lặp. So với baseline 378: thêm 28 Frontend và 3 E2E. Không xóa/skip test để đạt PASS. Các thao tác chọn dropdown/nút ngày trong regression cũ được đổi sang nhập văn bản/số. Các test miền lưu trữ/kế hoạch nay kiểm tra mô tả trống hoặc thời lượng sai kiểu; kiểm tra miền mô hình vẫn giữ riêng. C05 kiểm tra nút bị khóa, lý do và zero POST thay cho cố bấm nút bị khóa.

Test mới:

- [free-input.test.tsx](../../tests/frontend/free-input.test.tsx): nhãn tiếng Việt/NFC/case/space, nhãn ngoài metadata, không fuzzy mapping, zero HTTP khi sai miền, trống, thời lượng 1/2/3/4/7/21/31/90/365, âm/thập phân/NaN/Infinity, storage round-trip, kế hoạch generic, xóa ROI sau chỉnh sửa.
- [free-input.spec.ts](../../tests/browser/free-input.spec.ts): desktop 1440/mobile 390, ánh xạ qua API thật, mô tả tiếng Việt mới, 21 ngày, so sánh có/không ROI, lưu/tải lại kịch bản và chiến dịch, dữ liệu trống/sai thời lượng, sửa kịch bản đã dự đoán, không có POST không hợp lệ.
- Regression được cập nhật trong Frontend `integration`, `evaluation-upgrade`, `compare-api`, `suitability`, `phase5_2`, `action-plan`; browser `prediction`, `evaluation-upgrade`, `compare-api`, `suitability`, `phase5_2`, `action-plan`, `final-business`. Các suite còn lại vẫn chạy đầy đủ.

Build `tsc && vite build` exit 0: [default API 8000](run_free_input/build-default-command.json), [isolated API 18000](run_free_input/build-isolated-confirm-command.json). Bundle khoảng 702.51 kB; còn warning >500 kB, không che warning.

HTTP thật: [record](run_free_input/http-isolated-confirm-command.json), [responses](run_free_input/generated_current/backend/tests/http_results.json). Hai reference raw `4.991136884533976` và `4.997267870097019`, absolute error 0. Quality Gate giữ `BASELINE_ONLY`.

Outage thật: [record](run_free_input/offline-isolated-confirm-command.json), [result](run_free_input/generated_current/tests/results/backend-offline.json). Không interception, không có ROI giả khi Backend tắt.

Audit production preview: [checks](run_free_input/browser_audit/checks.json), [log](run_free_input/browser-audit.log); hai viewport, không pageerror, console.error, network lỗi ngoài dự kiến hoặc overflow. [Teardown E2E](run_free_input/e2e-isolated-confirm/e2e-cleanup.json) xác nhận các server QA đóng đúng cách. QA dùng cổng 18000 riêng, không dừng server người dùng.

Các lượt lỗi trung gian được giữ trong `run_free_input`: Frontend first/second do kiểm tra cũ và nhãn encoding tạm thời trong khi chuyển form; third phát hiện hai khoảng lịch ngắn sai và hai thao tác nút ngày chưa cập nhật; đều đã sửa trước lượt cuối. E2E release 82 PASS/1 FAIL do C05 thiếu seed scenario khi cập nhật thao tác; sửa helper seed rồi full confirm 83 PASS, flaky 0. Không dùng các lượt lỗi để công bố nghiệm thu.

## Ảnh giao diện mới

- [Predict desktop](run_free_input/e2e-isolated-confirm-artifacts/free-input-T01-free-Vietna-6bf43-omparison-and-campaign-1440/free-predict-1440.png).
- [Predict mobile](run_free_input/e2e-isolated-confirm-artifacts/free-input-T01-free-Vietna-fa1f2-comparison-and-campaign-390/free-predict-390.png).
- [Chiến dịch mobile](run_free_input/e2e-isolated-confirm-artifacts/free-input-T01-free-Vietna-fa1f2-comparison-and-campaign-390/free-campaign-390.png).
- [Production preview mobile](run_free_input/browser_audit/predict-390.png).

## Giới hạn và kết luận

Giới hạn mỗi mô tả 500 ký tự; thời lượng là số nguyên dương an toàn, không phải mọi giá trị đều được mô hình hỗ trợ. Các nhãn chưa có template, kể cả biến thể chưa được template nhận diện, cần người phụ trách hoàn thiện checklist. Campaigns vẫn browser-local; không tự tạo quảng cáo hoặc triển khai trên nền tảng. ROI API chỉ phục vụ nghiên cứu; ROI tài chính từ dữ liệu người dùng nhập là thang đo riêng.

**READY_FOR_DEMO — bản local có giới hạn nghiên cứu**, sau khi kiểm thử cuối, outage, browser audit và kiểm SHA-256 đều thành công. Không tuyên bố mô hình được VALIDATED hay gợi ý là tối ưu ROI đã kiểm chứng. [Tổng hợp máy đọc được](run_free_input/acceptance_summary.json) lưu source hashes, file thay đổi, command exit codes, kết quả kiểm thử và hash ảnh; Backend/artifact và các báo cáo lịch sử được kiểm bảo toàn.

QA helpers mới: `free_input_run.py`, `free_input_browser_audit.mjs`, `free_input_evidence.py`; evidence đặt riêng tại `run_free_input/`. Dừng sau nâng cấp nhập tự do.
