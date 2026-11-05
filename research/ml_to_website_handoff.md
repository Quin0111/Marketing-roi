# DreamMakers — Bàn giao Machine Learning sang website và đồ án

Ngày **04/11/2026**. Trạng thái nghiên cứu **RESEARCH_LIMITED**; Quality Gate mô hình ROI production **BASELINE_ONLY**. Văn bản này là bàn giao, không là thay đổi Frontend/Backend hoặc cho phép phát hành optimizer.

## 1. Hai nhánh phải giữ tách biệt

| Nhánh | Dữ liệu/input | Target và khả năng | Trạng thái sản phẩm |
|---|---|---|---|
| ROI hiện tại | Năm feature website và bảy artifact gốc | Predict ROI nghiên cứu; chưa vượt Dummy ổn định; đơn vị/công thức kinh tế còn thiếu | Giữ BASELINE_ONLY, không ranking/optimize |
| Criteo academic benchmark | f0–f11 ẩn danh, assignment0/1; release/hash riêng | Visit primary, conversion secondary; ranking/policy functionals có điều kiện benchmark | Chỉ research evidence; không phải predictor ROI, chưa dùng cho người dùng thật |

Không có mapping hợp lệ từ campaign type/channel/audience/segment/duration sang f0–f11. Không gọi model Criteo bằng payload năm feature cũ, không thay deployed model/joblib, không đổi target hoặc API contract âm thầm. Public treatment không có nghĩa chọn một trong sáu kênh hiện tại.

## 2. Thành phần được phép dùng khi hoàn thiện website sau này

- Giữ pipeline suy luận Linear Regression hiện tại, validation/reference checks và cảnh báo nghiên cứu; chỉ sửa UI/source ở một nhiệm vụ website riêng có phạm vi rõ.
- Có thể trình bày **báo cáo nghiên cứu read-only**: nguồn/license, outcome, phạm vi giả định, protocol/split và bảng metric từ file đã kiểm chứng. Tách tab/khối ROI lịch sử, ROI diagnostic mới và Criteo benchmark, không trộn metric.
- Đính kèm [tổng kết](final_ml_research_summary.md), [kết quả thực nghiệm](final_ml_experiment_results.md) và link evidence trong đồ án; ghi cả kết quả chưa đạt và điều kiện suy luận.
- Dùng danh sách blocker/data contract để mô tả hướng phát triển, không biểu diễn như chức năng đã có.

Không tích hợp research joblib vào production trong lượt này. Không public endpoint ranking, cá nhân hóa treatment hoặc `/optimize`; không thêm khuyến nghị ngân sách/kênh từ benchmark.

## 3. Thay đổi Frontend/Backend cần cân nhắc ở nhiệm vụ riêng

| Thành phần | Thay đổi đề nghị để bàn giao minh bạch | Điều không được làm |
|---|---|---|
| Frontend Model Insights | Gắn nhãn experiment/source/outcome/version; phân biệt historical metrics và run mới; hiện limitations và NOT VALIDATED rõ | Không thay số lịch sử để khớp, không đổi Qini thành ROI, không tô đậm “chiến dịch tốt nhất” |
| Frontend Dashboard/Compare | Rà lại nguồn static/mock, chú thích data provenance và semantics; chỉ trình bày mô phỏng đúng nhãn | Không gọi mô phỏng là pipeline prediction hoặc hiệu quả thực đã kiểm toán |
| Backend report metadata | Nếu cần, thiết kế contract **read-only** riêng cho research report đã reviewed, gồm experiment_id, target, scope, assumptions, evidence/status | Không thay `/predict` ROI hiện tại hoặc đồng nhất research status với production quality_status |
| Backend quality rules | Tiếp tục reject client promotion, allow_prediction research only, auto_rank=false, optimize=false | Không nâng VALIDATED từ một metric tốt hoặc tham số client |
| QA | Test provenance labels, no unsupported recommendation, API/reference consistency, failure states và responsive trong nhiệm vụ website | Không coi unit/API PASS là validation khoa học |

Các mục là đề xuất, **chưa code/triển khai**. Website audit Phase5 trước bị ngắt khi người dùng chuyển sang ML; một số build/test logs còn trong research/phase5, không được gọi đó là đã hoàn thành kiểm toán website toàn diện.

## 4. Khuyến nghị được phép và không được phép

**Được phép kết luận:** đã chạy một benchmark độc lập với ROI cũ, có so sánh baseline và kiểm chứng policy ở phạm vi dữ liệu/giả định công khai; báo kết quả chính xác và giới hạn. Được đề xuất thu thập dữ liệu/pilot hoặc làm đồ án phương pháp.

**Không được phép kết luận:** Google Ads/Facebook hoặc một campaign type/budget/duration tốt nhất; gửi treatment cho khách hàng cụ thể sẽ tăng lợi nhuận; ROI tăng một tỷ lệ xác định; model ROI đã cải thiện; marketing đa kênh đã được tối ưu. Không coi projected/attributed revenue là incremental profit, không lấy cost giả định 0 để dựng ROI.

Một policy có score tốt trên released benchmark chưa được phê duyệt áp dụng trong thị trường đích. RESEARCH_LIMITED cũng không phủ định mọi hướng causal; nó giữ đúng mức bằng chứng hiện có.

## 5. Điều kiện trước triển khai thực tế

1. Dữ liệu first-party có quyền sử dụng, snapshot covariates trước action, entity/cluster IDs được bảo vệ, action eligibility, assignment probabilities và outcome maturity/window.
2. Ledger revenue/refund/cost/margin và định nghĩa utility/ROI/ROAS kiểm toán được; không gộp các estimand khác nhau.
3. Policy, constraints, primary metric, business MDE/power, stopping và guardrails được khóa trước đánh giá. Dữ liệu evaluation mới độc lập với phát triển; không mở ROI Test cũ để chọn hướng.
4. Xác minh identification/selection/overlap cho population đích; nếu OPE chưa đủ, chạy pilot/RCT policy-vs-incumbent đủ power và xử lý interference/clusters.
5. Hiệu quả có cận uncertainty đủ và không vi phạm risk/cost; có abstain ngoài support, monitoring/rollback; review phát hành riêng trước nâng gate.

Chưa có các bằng chứng trên nên khuyến nghị thực tế **NOT VALIDATED**. Có thể chuyển sang hoàn thiện website demo và báo cáo đại học với các nhãn trung thực; không tự triển khai marketing optimizer.

## 6. File và kiểm tra bàn giao

- [Readiness và nguồn](phase4b4/reassessment/dataset_readiness_report.md).
- [Protocol thực sự dùng](phase4b4/reassessment/evaluation_protocol_compat.json), code và results trong `phase4b5_criteo_v2/`.
- [Final scores](phase4b5_criteo_v2/results/final_scores.json), [frozen policy](phase4b5_criteo_v2/results/frozen_policy.json), [policy/CI](phase4b5_criteo_v2/results/policy_results.json).
- [Kiểm tra và independent replay](phase4b5_criteo_v2/results/verification_results.json); source/artifact/history không đổi trong snapshot bảo vệ.

Đã kết thúc phần thực nghiệm/bàn giao được phép của nhánh này. Không tự chuyển sang sửa website hoặc phát hành. Giữ nguyên **BASELINE_ONLY**.
