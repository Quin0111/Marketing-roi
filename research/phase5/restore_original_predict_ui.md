# Khôi phục giao diện chọn option tại Predict ROI

Ngày 04/11/2026. Phạm vi: khôi phục giao diện Predict ROI; không hoàn tác các chức năng khác hoặc sửa báo cáo lịch sử.

## Kết quả triển khai

- Bốn trường `Campaign_Type`, `Channel_Used`, `Target_Audience`, `Customer_Segment` trở lại native dropdown với nhãn tiếng Việt.
- Bốn nút `15 ngày`, `30 ngày`, `45 ngày`, `60 ngày` thay ô nhập số; thể hiện lựa chọn bằng `aria-pressed` và màu blue.
- Option lấy từ `/model-info`, không dùng danh mục mock để thay thế. Nút thời lượng chỉ khả dụng nếu metadata cho phép. Khi chưa xác minh metadata hoặc mô hình chưa sẵn sàng, không cho dự đoán.
- Năm giá trị được kiểm tra khớp chính xác với metadata trước submit. Nếu một lựa chọn bị loại khỏi metadata, form hiển thị trạng thái thiếu tương thích, không tự đổi sang lựa chọn khác. Người dùng phải chọn lại chủ động.
- Khôi phục tóm tắt năm thuộc tính đang chọn, nhãn tiếng Việt và theme blue/slate. Giữ loading, reset, xóa/hủy kết quả cũ khi đổi lựa chọn, Quality Gate và cảnh báo nghiên cứu.
- Giữ cả nút **Lưu kịch bản để lập kế hoạch** và luồng lưu kết quả dự đoán sang So sánh. Không mất tính năng API prediction, suitability, kế hoạch Marketing hay quản lý chiến dịch.

## Dữ liệu đã lưu và các chức năng được giữ nguyên

Chỉ thay hai file runtime. Không đổi types, bộ đọc/ghi storage, mapper API, trang Compare hoặc template Marketing. Form nhập tự do tại modal kịch bản và quản lý chiến dịch được giữ để người dùng tiếp tục xem/sửa dữ liệu cũ.

Kịch bản hợp lệ đã lưu vẫn gọi `/predict` thật được. Kịch bản ngoài miền vẫn lưu nguyên mô tả và thời lượng; Compare hiển thị các trường chưa được hỗ trợ, khóa dự đoán, không sinh ROI thay thế. Kịch bản không có ROI vẫn xuất hiện trong bảng và tham gia đối chiếu tiêu chí minh bạch. Không dùng ROI để lựa chọn hoặc phá đồng hạng.

E2E seed hai bản ghi đại diện cho dữ liệu đã lưu trước thay đổi: một cấu hình mô hình hỗ trợ và một mô tả `Ra mắt sách / Hội chợ địa phương / Gia đình tại Đà Nẵng / Độc giả yêu sách / 21 ngày`. Sau Predict, điều hướng Compare và reload, test đối chiếu nguyên vẹn cả năm giá trị của bản ghi ngoài miền. Bản ghi này không phát sinh POST dự đoán, vẫn chọn được tiêu chí, xem kế hoạch 21 ngày và tạo/lưu/tải lại chiến dịch. Đây là fixtures kiểm thử, không phải dữ liệu vận hành của người dùng.

Không có migration xóa dữ liệu hoặc quy đổi giá trị không tương thích. Các guard corruption/quota/read-only đang có được giữ và chạy lại. Trình duyệt automation sử dụng context riêng; không thao tác localStorage của trình duyệt người dùng.

## File đã sửa/thêm

Runtime — **chỉ hai file sửa**:

| File | Thay đổi |
|---|---|
| [PredictionForm.tsx](../../src/components/prediction/PredictionForm.tsx) | Bốn dropdown, bốn nút ngày, validation metadata, tóm tắt cấu hình; giữ save/reset/loading |
| [PredictRoiPage.tsx](../../src/pages/PredictRoiPage.tsx) | Khôi phục subtitle chọn option; tên kịch bản mới phù hợp nguồn cấu hình |

Tests sửa trực tiếp cho giao diện mới:

- [integration.test.tsx](../../tests/frontend/integration.test.tsx): thao tác nút ngày thay ô số; giữ kiểm tra lifecycle/abort/stale ROI.
- [evaluation-upgrade.test.tsx](../../tests/frontend/evaluation-upgrade.test.tsx): chọn nút ngày, giữ luồng lưu/transfer và lỗi storage.
- [free-input.test.tsx](../../tests/frontend/free-input.test.tsx): ca UI sử dụng dropdown/nút ngày; các ca service/storage/mô tả nhập tự do cũ vẫn giữ nguyên.
- [prediction.spec.ts](../../tests/browser/prediction.spec.ts), [evaluation-upgrade.spec.ts](../../tests/browser/evaluation-upgrade.spec.ts), [phase5_2.spec.ts](../../tests/browser/phase5_2.spec.ts): thao tác selectOption và nút thời lượng; giữ API/reference/error/loading và preview acceptance.
- [free-input.spec.ts](../../tests/browser/free-input.spec.ts): giữ ba ca; chuyển phần Predict sang chọn option, giữ kiểm tra dữ liệu nhập tự do đã lưu, so sánh có/không ROI, kế hoạch và campaign. Kiểm tra thời lượng nhập sai vẫn chạy tại modal kịch bản có nhập số.

Test mới [restored-predict.test.tsx](../../tests/frontend/restored-predict.test.tsx): **8 ca** gồm loại/count option thực tế, bốn trường thiếu, metadata thay đổi không tự chọn thay, mất metadata, lưu/reset/tóm tắt. Không xóa hoặc skip test để đạt PASS.

QA helpers mới: `restore_predict_run.py`, `restore_predict_browser_audit.mjs`, `restore_predict_evidence.py`. Output mới nằm riêng tại `run_restore_predict/`; các JSON/ảnh do verifier cũ ghi được lưu làm evidence mới và khôi phục bản trước nhiệm vụ.

## Kiểm thử thực tế

| Suite chạy mới | PASS | FAIL | SKIP | Evidence |
|---|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | [Record](run_restore_predict/backend-final-command.json), [JUnit](run_restore_predict/backend-final.xml) |
| Frontend Vitest/integration | 272 | 0 | 0 | [Record](run_restore_predict/frontend-first-command.json), [JSON](run_restore_predict/frontend-first.json) |
| Browser E2E | 83 | 0 | 0 | [Record](run_restore_predict/e2e-isolated-final-command.json), [JSON](run_restore_predict/e2e-isolated-final.json) |

**Tổng 417 ca duy nhất PASS, 0 FAIL, 0 SKIP; E2E flaky = 0.** Đây là output mới, không kế thừa số PASS cũ. So baseline 409, thêm 8 ca Frontend; không cộng các assertion trong vòng lặp thành test riêng.

| Kiểm tra bổ trợ | Kết quả và bằng chứng |
|---|---|
| TypeScript và frontend build | PASS/exit 0; [default API 8000](run_restore_predict/build-default-command.json), [isolated API 18000](run_restore_predict/build-isolated-final-command.json). Bundle 706.24 kB/gzip 200.59 kB; warning >500 kB còn tồn tại |
| Backend startup/API HTTP thật | PASS; [record](run_restore_predict/http-isolated-final-command.json), [9 responses](run_restore_predict/generated_current/backend/tests/http_results.json) |
| Reference predictions | Hai mẫu raw `4.991136884533976` và `4.997267870097019`, absolute error 0; HTTP verifier và browser I01/S06 đều chạy |
| Desktop/mobile | PASS; viewport 1440/390 trong luồng Predict/legacy data/Compare/plan/campaign; regression responsive khác cũng chạy đầy đủ |
| Production console/network | [Audit](run_restore_predict/browser_audit/checks.json), [log](run_restore_predict/browser-audit.log): hai viewport, không pageerror, console.error, unexpected network error hoặc overflow |
| Backend mất kết nối thật | PASS; [record](run_restore_predict/offline-isolated-final-command.json), [result](run_restore_predict/generated_current/tests/results/backend-offline.json). Không interception, không có ROI giả |
| Teardown | [E2E cleanup](run_restore_predict/e2e-isolated-final/e2e-cleanup.json), [audit cleanup](run_restore_predict/browser_audit/e2e-cleanup.json): Backend QA exit 0, các cổng QA đóng đúng cách |
| Bảo toàn source/artifact | [Summary/hash/inventory](run_restore_predict/acceptance_summary.json): runtime chỉ hai file trên; Backend và báo cáo lịch sử không đổi; đủ 7 SHA-256 artifact khớp manifest |

QA dùng Backend 18000 riêng; không dừng server người dùng ở 8000, không khởi tạo hoặc hoàn tác repository. API `/predict` vẫn nhận đúng năm feature theo contract cũ. Quality Gate giữ `BASELINE_ONLY`; không có `/optimize` hoặc Criteo production.

## Ảnh giao diện

- [Predict desktop](run_restore_predict/e2e-isolated-final-artifacts/free-input-T01-retained-fr-6e1a2-omparison-and-campaign-1440/restored-predict-1440.png).
- [Predict mobile](run_restore_predict/e2e-isolated-final-artifacts/free-input-T01-retained-fr-21fa4-comparison-and-campaign-390/restored-predict-390.png).
- [Production preview mobile](run_restore_predict/browser_audit/predict-390.png).

## Kết luận

**READY_FOR_DEMO — bản local có giới hạn nghiên cứu.** Trải nghiệm chọn option đã được khôi phục; lưu kịch bản, so sánh, gợi ý theo tiêu chí, kế hoạch và quản lý chiến dịch vẫn hoạt động. Không phát hiện hồi quy trong các suite trên.

Các giới hạn cũ vẫn còn: browser-local persistence, bundle warning, mô hình ROI chưa vượt baseline, template cho kênh mới cần xác minh. Không coi gợi ý theo tiêu chí hoặc kế hoạch là tối ưu ROI đã kiểm chứng. Dừng sau nhiệm vụ khôi phục giao diện.
