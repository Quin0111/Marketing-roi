# DreamMakers — Kết quả thực nghiệm và kiểm tra thực tế

Ngày **04/11/2026**. Experiment **DM-CRITEO-V21-VISIT-002**. Kết luận chung **RESEARCH_LIMITED**. Đây là kết quả mới từ public Criteo, không thay bảng CV ROI lịch sử.

## 1. Nguồn, cấu hình và tính độc lập

[Gate](phase4b4/reassessment/phase_gate.json), [protocol v002](phase4b4/reassessment/evaluation_protocol_compat.json), [run lock](phase4b5_criteo_v2/results/run_lock.json), [split manifest](phase4b5_criteo_v2/results/split_manifest.json). IDs đầy đủ tại NPZ trong cùng thư mục results. Sample seed 20261104, split seed 51042026, CV3 joint treatment×visit seed741104. Fit/tuning chỉ trên train600k; validation200k chỉ chọn S/T; final200k chỉ chấm sau khi [frozen_policy.json](phase4b5_criteo_v2/results/frozen_policy.json) được ghi.

Mỗi preprocessing được fit riêng trong phần fit và từng arm của T: median+scaler cho 4 continuous; imputer+OHE thưa cho 8 categorical, min_frequency200/max_categories64. S learner thêm assignment, T learner hai logistic response models. Không exposure, outcomes hoặc ROI làm X. C∈{.1,1}, solver lbfgs, max_iter300; mọi trial được lưu. Không class weighting, không target encoding, không tuning trên final.

| Model | Selected C | Inner Qini candidates .1 / 1 | Validation Qini |
|---|---|---|---|
| S_Learner | 0.1 | [0.004292899336601308, 0.004291774633986928] | 0.004937034 |
| T_Learner | 1.0 | [0.0032335253921568635, 0.003406979339869283] | 0.004637568 |

**S_Learner** được chọn trước final. Không chọn lại theo model thắng ở final. Baseline model là hai mean response theo arm fit chỉ trên train; tie ranking dùng row-ID hash cố định, không outcome/treatment.

## 2. Final response/ranking metrics

| Model | AUUC | Qini | Log loss | Brier | ROC-AUC | Average precision |
|---|---|---|---|---|---|---|
| S_Learner | 0.007267533 | 0.003087141 | 0.106878959 | 0.030754211 | 0.941391395 | 0.490225293 |
| T_Learner | 0.007329818 | 0.003149426 | 0.106980155 | 0.030810040 | 0.941283015 | 0.487680143 |
| Constant_arm_means | 0.003757657 | -0.000422735 | 0.189913628 | 0.044909693 | 0.511873986 | 0.048235105 |

AUUC = integral U(q), U(q)=sum(top-q z)/n, z=T*Y/.85−(1−T)*Y/.15. Qini=AUUC−U(1)/2. Đây là biến thể explicit của run này, không so số tuyệt đối với AUUC/Qini biến thể khác trong bài báo. Constant model có Qini hữu hạn khác 0 do tie ordering mẫu; random-policy kỳ vọng và baseline tie được báo riêng. ROC-AUC/AP chấm factual response probability theo arm đã quan sát; không phải causal accuracy.

## 3. Policy evaluation — Phase 4B.6

Action chỉ assignment0/1, không chọn kênh, budget hoặc duration. Candidate target đúng 40.000/200.000 row theo visit uplift; capacity20% khóa trước. Response20 là top treated-response score từ cùng model; random20 là policy ngẫu nhiên kỳ vọng .2, không phải một lần tung đồng xu. None và all không có chi phí giả.

HT value = mean(Y*[T*pi/e + (1−T)*(1−pi)/(1−e)]), e=.85 theo giả định benchmark. Chỉ nguyên tắc này được dùng; không tuyên bố đã triển khai doubly robust estimator. Giá trị tuyệt đối này không là business conversion rate hoặc ROI đã hiệu chỉnh selection.

| Policy/contrast | Point estimate | Paired bootstrap 95% CI |
|---|---|---|
| V_candidate | 0.046480392 | [0.045299902; 0.047661324] |
| V_none | 0.040033333 | [0.037732500; 0.042400833] |
| V_all | 0.048394118 | [0.047428971; 0.049347059] |
| V_random_20pct | 0.041705490 | [0.039871716; 0.043539755] |
| V_response_20pct | 0.046480392 | [0.045299902; 0.047661324] |
| gain_vs_random20 | 0.004774902 | [0.002825196; 0.006676725] |
| gain_vs_response20 | 0.000000000 | [0.000000000; 0.000000000] |
| gain_vs_none | 0.006447059 | [0.004021324; 0.008764461] |
| AUUC | 0.007267533 | [0.004970147; 0.009591936] |
| Qini | 0.003087141 | [0.002044142; 0.004157096] |
| U1_descriptive_benchmark_contrast | 0.008360784 | [0.005801863; 0.010835441] |

400 paired row bootstraps seed62061104, percentile95%; resample cùng rows cho mọi policy, rerank frozen scores theo rule capacity, không fit/chọn lại model. CI có điều kiện theo fitted model, không bao gồm training/selection uncertainty và không cluster-robust vì thiếu IDs. Chỉ gain_vs_random20 và Qini là rule primary đã khóa; các contrast khác/secondary không multiplicity-adjusted nên không tuyên bố confirmatory significance.

Primary success rule benchmark: **ĐẠT**. Dù benchmark đạt, khuyến nghị thực tế vẫn **NOT VALIDATED**. [policy_results.json](phase4b5_criteo_v2/results/policy_results.json) lưu đầy đủ CI, cells và conversion secondary với cùng visit policy; không dùng secondary để chọn rule.

Sensitivity đúng 9 tổ hợp capacity .1/.2/.3 × e .8/.85/.9 tại [policy_sensitivity.csv](phase4b5_criteo_v2/results/policy_sensitivity.csv). Không dùng grid này chọn policy mới. Nó kiểm tra thay đổi functional/weight/capacity, không giải quyết unknown outcome-selection probabilities hay hidden confounding.

**Phát hiện thực tế cần giữ trong kết luận:** tại capacity20%, e=.85, candidate và response20 chọn cùng tập 40.000 dòng, gain_vs_response20=0 và paired CI=[0;0]. Không có lợi ích bổ sung được quan sát so với response baseline này. Khi dùng weights e=.80/.85/.90, gain_vs_random20 lần lượt khoảng **+0.014290 / +0.004775 / −0.011876**: dấu không bền với weights bị giả định sai. Các weights ngoài thiết kế chỉ là stress test; không được coi là các estimator đúng đồng thời hoặc chọn weight có điểm tốt nhất.

Treat-all có point value cao hơn candidate ở thiết kế chính nhưng dùng capacity100% thay vì20%, chưa biết chi phí nên không kết luận nó hay candidate tối ưu profit. Không đổi policy sau final. Các kết quả này củng cố trạng thái RESEARCH_LIMITED dù primary benchmark rule đạt.

## 4. Chi phí và các lần chạy không thành công

Run hợp lệ có **12 trial scores /18 inner classifier fits +3 final classifier fits =21**, cộng **3 replay classifier fits**. Ngoài ra v001 có **1 fit S classifier bị loại trước khi chấm score** vì warning tương thích; tổng số lần classifier fit đã thực hiện gồm cả lần đó là **25**. Hai lỗi startup trước đó chưa fit. Không ẩn trial có metric xấu: [inner_trials.csv](phase4b5_criteo_v2/results/inner_trials.csv) có toàn bộ 12 trial.

V001 và các log startup được giữ ở `phase4b5_criteo/`. V002 chỉ cho phép đúng warning `Unknown solver options: iprint`, ghi **21 warning** trong main run; không có warning khác được chấp nhận. SciPy bỏ qua legacy print option; không đổi objective/grid theo điểm. Runtime cũng dùng wide-character module-enumeration fallback trong tiến trình để xử lý đường dẫn Unicode như hồ sơ trước; không sửa package/Backend trên đĩa.

Mean/total fit seconds từng trial và outer refit có trong JSON/CSV; không cộng chúng thành wall-clock toàn quy trình hoặc so thời gian với Colab như benchmark máy chuẩn. [Power design sensitivity](phase4b4/reassessment/evidence/prospective_power.csv) không phải achieved policy power.

## 5. PASS/FAIL có bằng chứng

| Phase | Nghiệm thu công việc | Quyết định/giới hạn | Bằng chứng |
|---|---|---|---|
| 4B.4 reassessment | PASS trong phạm vi benchmark có điều kiện | GO cho benchmark; NO-GO cho causal ROI thực tế | [Readiness audit](phase4b4/reassessment/dataset_readiness_report.md), [gate](phase4b4/reassessment/phase_gate.json) |
| 4B.5 | PASS — thực nghiệm mới đã chạy | Không nâng model ROI hoặc production gate | [Raw trials](phase4b5_criteo_v2/results/inner_trials.csv), [scores](phase4b5_criteo_v2/results/final_scores.json), [checks](phase4b5_criteo_v2/results/verification_results.json) |
| 4B.6 | PASS quy trình benchmark có điều kiện | NOT VALIDATED cho khuyến nghị Marketing thực tế | [Policy results](phase4b5_criteo_v2/results/policy_results.json), [bootstrap](phase4b5_criteo_v2/results/policy_bootstrap.csv), [sensitivity](phase4b5_criteo_v2/results/policy_sensitivity.csv) |

**41 kiểm tra mới PASS** tại [verification_results.json](phase4b5_criteo_v2/results/verification_results.json): code/protocol/gate hashes, sample/split uniqueness, inner scopes, selection rule, final rows/outcomes, fresh refits, metric algebra, preprocessing fit-only stats, bootstrap budget, policy size, sensitivity grid, original files/gate. **433 tệp có trước không đổi**.

Thêm **20 kiểm tra tài liệu/toàn vẹn PASS** tại [handoff_checks.json](phase4b5_criteo_v2/results/handoff_checks.json), chạy riêng không huấn luyện.

Replay độc lập hai meta-learners (3 logistic classifiers), prediction tolerance1e−10; không lặp toàn bộ 18 inner classifier fits. Max errors được lưu riêng theo model. Không phát hiện leakage trong các scope/preprocessing/selection checks đã kiểm tra; không tuyên bố các check chứng minh không có leakage nào trong raw data hoặc chứng minh causal assumptions.

Structural dataset checks PASS không xác nhận original-population causality. Failed startup/compatibility attempt được khắc phục và giữ log; FAIL lịch sử về ROI vẫn nguyên trạng. Không đọc ROI Test cũ. Không sửa bảy artifact, source production hoặc Quality Gate.

## 6. Tái lập và phạm vi artifact mới

Mã chạy: `phase4b5_criteo_v2/common.py`, `run.py`, `evaluate_policy.py`, `verify.py`, `render_handoff.py`; versions và threadpools trong run_lock. Các model joblib mới chỉ ở results research; không được backend hiện tại nạp. Raw Criteo có điều kiện CC BY-NC-SA4.0, không tự redistrib raw/derived data ngoài điều kiện license.

Lệnh kiểm tra lại trên run đã có: `backend/.venv/Scripts/python.exe -X utf8 research/phase4b5_criteo_v2/verify.py`. Lệnh này fit lại đúng 3 classifier cuối. `run.py` cố ý từ chối overwrite/mix run_lock đã tồn tại; để lặp full search cần thư mục run riêng ở cùng cấp research, code/config được giữ hash, không xóa evidence gốc. Phase này chưa thực hiện full second CV run.

Không có interval cá thể/ROI calibration hoặc experiment profit. Kết quả đủ bàn giao một benchmark có giới hạn và tiếp tục đồ án minh bạch; chưa đủ phát hành khuyến nghị.
