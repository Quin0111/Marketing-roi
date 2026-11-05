# DreamMakers — Tổng kết nhánh nghiên cứu Machine Learning

Ngày: **04/11/2026**, Asia/Bangkok. **Kết luận cuối: RESEARCH_LIMITED.** Đã thực nghiệm mới và đánh giá policy trên benchmark Criteo tách riêng, nhưng chưa đủ bằng chứng cho khuyến nghị kinh doanh, causal ROI hoặc tối ưu đa kênh. Mô hình ROI đang triển khai giữ **BASELINE_ONLY**; không sửa production.

## 1. Công việc thực sự hoàn thành

Đọc lại hồ sơ Phase 4B.1–4B.4, source notebook Colab `(8)`, metadata/metrics/reference và kết quả đã lưu. Không chạy lại notebook hoặc thí nghiệm ROI cũ; không sử dụng ROI Test cuối 30.000 dòng. Lần NO-GO trước giữ nguyên như hồ sơ lịch sử; reassessment mới có release, raw schema và tài liệu tác giả bổ sung, tạo quyết định GO **chỉ cho phạm vi benchmark học thuật có điều kiện**, không tự bỏ blocker về quần thể gốc.

| Phase | Nghiệm thu công việc | Quyết định/giới hạn | Bằng chứng |
|---|---|---|---|
| 4B.4 reassessment | PASS trong phạm vi benchmark có điều kiện | GO cho benchmark; NO-GO cho causal ROI thực tế | [Readiness audit](phase4b4/reassessment/dataset_readiness_report.md), [gate](phase4b4/reassessment/phase_gate.json) |
| 4B.5 | PASS — thực nghiệm mới đã chạy | Không nâng model ROI hoặc production gate | [Raw trials](phase4b5_criteo_v2/results/inner_trials.csv), [scores](phase4b5_criteo_v2/results/final_scores.json), [checks](phase4b5_criteo_v2/results/verification_results.json) |
| 4B.6 | PASS quy trình benchmark có điều kiện | NOT VALIDATED cho khuyến nghị Marketing thực tế | [Policy results](phase4b5_criteo_v2/results/policy_results.json), [bootstrap](phase4b5_criteo_v2/results/policy_bootstrap.csv), [sensitivity](phase4b5_criteo_v2/results/policy_sensitivity.csv) |

Đã tải và kiểm đếm Criteo thật; thiết kế/khóa giao thức; chạy S/T learner với CV và baseline; chọn model bằng validation; đánh giá final giữ riêng; chạy 400 bootstrap/sensitivity đã định trước; fit lại độc lập các cấu hình cuối và kiểm tra tính toàn vẹn. Không gửi thông điệp cho tác giả dataset, không tạo Git/commit/push, không thêm optimizer.

## 2. Dataset được xác minh đến đâu?

Criteo v2.1: **13.979.592 dòng ×16 cột**, 311.422.618 bytes compressed; SHA256 **2716e1bf0fd157a93b5bf86924d9088419dfbac2022c6cd90030220634f616dc**, revision **2424920019e49d52d72c13ac1143ec5d53af276b**. File/license/schema và timing theo nguồn sơ cấp đã đối chiếu; [audit đầy đủ](phase4b4/reassessment/dataset_readiness_report.md) phân biệt bằng chứng publisher với kiểm tra độc lập. Không có ROI/cost/revenue trong schema này.

Hillstrom chưa được dùng vì quyền tái sử dụng chưa đủ rõ; Lazada có license dataset/fingerprints nhưng chưa đủ timing/assignment để thay nguồn đã chọn; MT-LIFT chưa xác minh đủ quyền. Không gộp nguồn, không áp license của code cho dữ liệu khác, không dùng dữ liệu mô phỏng để thay chứng cứ thực.

## 3. Kết quả nghiên cứu mới

Một triệu row IDs được lấy mẫu đều trước khi xem outcome theo hàng; chia **600.000 train / 200.000 validation-selection / 200.000 final**. Primary outcome **visit**, conversion chỉ secondary. Không map feature ẩn danh sang năm dropdown website. Đây là split trong cùng public release, **không phải external out-of-time/pilot tại DreamMakers**. Aggregate toàn release đã được xem cho feasibility, không gọi final là hoàn toàn chưa từng có thông tin mô tả tổng thể.

| Model | AUUC | Qini | Log loss | Brier | ROC-AUC | Average precision |
|---|---|---|---|---|---|---|
| S_Learner | 0.007267533 | 0.003087141 | 0.106878959 | 0.030754211 | 0.941391395 | 0.490225293 |
| T_Learner | 0.007329818 | 0.003149426 | 0.106980155 | 0.030810040 | 0.941283015 | 0.487680143 |
| Constant_arm_means | 0.003757657 | -0.000422735 | 0.189913628 | 0.044909693 | 0.511873986 | 0.048235105 |

Policy/model đã khóa từ validation: **S_Learner, capacity 20%**; không đổi khi thấy model khác có score final tốt hơn. Theo tiêu chí benchmark đăng ký trước, kết quả **ĐẠT**: gain visit so với expected random20 = **0.004774902**, CI95% **[0.002825196; 0.006676725]**. Đơn vị là expected visit per evaluation row theo functional benchmark, không phải tiền/ROI hoặc lift thực tế đã chứng minh.

Kết quả procedure: **41 PASS**, replay độc lập **3 classifier cuối**, 433 tệp có trước không đổi. Không tái chạy toàn bộ inner search lần hai. Chi tiết ở [final_ml_experiment_results.md](final_ml_experiment_results.md).

Kiểm tra bàn giao riêng có **20 PASS** tại [handoff_checks.json](phase4b5_criteo_v2/results/handoff_checks.json): file/link/hash/nhãn kết luận, không fit thêm model và không thay cho kiểm chứng khoa học.

**Giới hạn quan trọng:** policy uplift đã chọn và response20 nhắm **cùng một tập người** ở final; gain so với response20 bằng **0**, CI [0;0]. Không có bằng chứng nhánh uplift tốt hơn response targeting đơn giản. Sensitivity với e=.90 còn đổi dấu gain_vs_random20 sang âm; đây là tính nhạy với misspecified evaluation weights, không phải một kết quả causal thay thế hợp lệ. Không tuyên bố đã tìm policy tối ưu.

## 4. Phân biệt ba mức kết luận

- **Prediction:** S/T có response loss tốt hơn constant-arm baseline trên final. Đây là dự đoán visit của benchmark, không cải thiện được chứng minh cho target ROI cũ.
- **Uplift/ranking:** AUUC/Qini là các functional với công thức/weights khóa trước; diễn giải causal dựa giả định bản release RCT-compatible của publisher và IID. Không quan sát được true individual treatment effects.
- **Policy:** đã có policy none/all/random20/response20 và candidate cố định, đánh giá riêng cùng final rows và bootstrap. Kết quả là bằng chứng benchmark có điều kiện; chưa đủ nhận diện policy value trên quần thể gốc sau undisclosed label sampling hoặc thị trường triển khai.

Không dùng RESEARCH_VALIDATED: không có selection probabilities để hoàn nguyên hiệu ứng gốc, không có IDs để kiểm tra phụ thuộc cụm, không có outcome economics hoặc pilot độc lập. Không dùng RESEARCH_BLOCKED cho toàn bộ lượt mới vì thực nghiệm benchmark hợp lệ trong phạm vi đã công bố đã thực sự chạy; các claim triển khai vẫn BLOCKED/NOT VALIDATED.

## 5. Nghiên cứu ROI cũ vẫn giữ kết luận

Phase 4B.2 Dummy RMSE **1.734476**, LR **1.734565**, DT **1.734714**, RF **1.734608**, HGB **1.734682**: không model nào vượt Dummy ổn định. Không so sánh ROC-AUC/Qini mới với RMSE cũ như cùng target hoặc cùng thang đo. [Kết quả cũ](phase4b2/model_experiment_report.md) và `model_metrics.json` không sửa. Chênh historical Dummy 1.732275 vẫn chưa giải thích; ba FAIL lịch sử của [audit](phase4b1a_reproducibility_audit.md) không bị đổi thành PASS.

## 6. Bàn giao và bước tiếp theo

Được chuyển sang hoàn thiện website/báo cáo đồ án với hai nhánh tách biệt: ROI demo chưa vượt baseline và benchmark visit/uplift có giới hạn. Không có quyền phát hành khuyến nghị thực tế từ lượt nghiên cứu này. [ml_to_website_handoff.md](ml_to_website_handoff.md) nêu phần tích hợp được phép, phần cấm và dữ liệu/pilot còn cần.

Các blocker còn lại: original-population selection/assignment calibration, external validity, cluster identity, business feature mapping, revenue/cost/margin và experimental policy validation trong population đích. Dữ liệu mới và pilot/RCT có power cần thiết trước mọi claim lợi ích kinh doanh. Không tự mở Phase phát hành, không thêm `/optimize`, giữ **BASELINE_ONLY**.
