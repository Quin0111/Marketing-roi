"""Generate the final three deliverables only after actual evaluation and checks."""
from common import *


def read(name):
    return json.loads((RESULTS / name).read_text(encoding='utf-8'))


def table(headers, rows):
    return '\n'.join(['| '+' | '.join(headers)+' |','|'+'|'.join(['---']*len(headers))+'|']+
        ['| '+' | '.join(str(v).replace('|','/') for v in row)+' |' for row in rows])


def main():
    check, policy, complete = read('verification_results.json'), read('policy_results.json'), read('completion.json')
    assert check['status']=='PASS' and complete['status']=='COMPLETE'
    scores, selections = read('final_scores.json'), read('selection_results.json')
    selected=read('frozen_policy.json')['selected_model']
    primary=policy['primary_visit']; ci=policy['intervals']
    benchmark='ĐẠT' if policy['benchmark_success_by_preregistered_rule'] else 'CHƯA ĐẠT'
    metrics=table(['Model','AUUC','Qini','Log loss','Brier','ROC-AUC','Average precision'],
        [[s['model']]+[f'{s[k]:.9f}' for k in ['AUUC','Qini','log_loss','Brier','ROC_AUC','average_precision']] for s in scores])
    policy_table=table(['Policy/contrast','Point estimate','Paired bootstrap 95% CI'],
        [[k,f'{v:.9f}',f"[{ci[k]['lower_95']:.9f}; {ci[k]['upper_95']:.9f}]"] for k,v in primary.items() if k in ci])
    selection_table=table(['Model','Selected C','Inner Qini candidates .1 / 1','Validation Qini'],
        [[s['model'],s['selected_C'],str(s['inner_mean_Qini']),f"{s['validation']['Qini']:.9f}"] for s in selections])
    phases=table(['Phase','Nghiệm thu công việc','Quyết định/giới hạn','Bằng chứng'],[
        ['4B.4 reassessment','PASS trong phạm vi benchmark có điều kiện','GO cho benchmark; NO-GO cho causal ROI thực tế','[Readiness audit](phase4b4/reassessment/dataset_readiness_report.md), [gate](phase4b4/reassessment/phase_gate.json)'],
        ['4B.5','PASS — thực nghiệm mới đã chạy','Không nâng model ROI hoặc production gate','[Raw trials](phase4b5_criteo_v2/results/inner_trials.csv), [scores](phase4b5_criteo_v2/results/final_scores.json), [checks](phase4b5_criteo_v2/results/verification_results.json)'],
        ['4B.6','PASS quy trình benchmark có điều kiện','NOT VALIDATED cho khuyến nghị Marketing thực tế','[Policy results](phase4b5_criteo_v2/results/policy_results.json), [bootstrap](phase4b5_criteo_v2/results/policy_bootstrap.csv), [sensitivity](phase4b5_criteo_v2/results/policy_sensitivity.csv)']])
    summary=f'''# DreamMakers — Tổng kết nhánh nghiên cứu Machine Learning

Ngày: **04/11/2026**, Asia/Bangkok. **Kết luận cuối: RESEARCH_LIMITED.** Đã thực nghiệm mới và đánh giá policy trên benchmark Criteo tách riêng, nhưng chưa đủ bằng chứng cho khuyến nghị kinh doanh, causal ROI hoặc tối ưu đa kênh. Mô hình ROI đang triển khai giữ **BASELINE_ONLY**; không sửa production.

## 1. Công việc thực sự hoàn thành

Đọc lại hồ sơ Phase 4B.1–4B.4, source notebook Colab `(8)`, metadata/metrics/reference và kết quả đã lưu. Không chạy lại notebook hoặc thí nghiệm ROI cũ; không sử dụng ROI Test cuối 30.000 dòng. Lần NO-GO trước giữ nguyên như hồ sơ lịch sử; reassessment mới có release, raw schema và tài liệu tác giả bổ sung, tạo quyết định GO **chỉ cho phạm vi benchmark học thuật có điều kiện**, không tự bỏ blocker về quần thể gốc.

{phases}

Đã tải và kiểm đếm Criteo thật; thiết kế/khóa giao thức; chạy S/T learner với CV và baseline; chọn model bằng validation; đánh giá final giữ riêng; chạy 400 bootstrap/sensitivity đã định trước; fit lại độc lập các cấu hình cuối và kiểm tra tính toàn vẹn. Không gửi thông điệp cho tác giả dataset, không tạo Git/commit/push, không thêm optimizer.

## 2. Dataset được xác minh đến đâu?

Criteo v2.1: **13.979.592 dòng ×16 cột**, 311.422.618 bytes compressed; SHA256 **2716e1bf0fd157a93b5bf86924d9088419dfbac2022c6cd90030220634f616dc**, revision **2424920019e49d52d72c13ac1143ec5d53af276b**. File/license/schema và timing theo nguồn sơ cấp đã đối chiếu; [audit đầy đủ](phase4b4/reassessment/dataset_readiness_report.md) phân biệt bằng chứng publisher với kiểm tra độc lập. Không có ROI/cost/revenue trong schema này.

Hillstrom chưa được dùng vì quyền tái sử dụng chưa đủ rõ; Lazada có license dataset/fingerprints nhưng chưa đủ timing/assignment để thay nguồn đã chọn; MT-LIFT chưa xác minh đủ quyền. Không gộp nguồn, không áp license của code cho dữ liệu khác, không dùng dữ liệu mô phỏng để thay chứng cứ thực.

## 3. Kết quả nghiên cứu mới

Một triệu row IDs được lấy mẫu đều trước khi xem outcome theo hàng; chia **600.000 train / 200.000 validation-selection / 200.000 final**. Primary outcome **visit**, conversion chỉ secondary. Không map feature ẩn danh sang năm dropdown website. Đây là split trong cùng public release, **không phải external out-of-time/pilot tại DreamMakers**. Aggregate toàn release đã được xem cho feasibility, không gọi final là hoàn toàn chưa từng có thông tin mô tả tổng thể.

{metrics}

Policy/model đã khóa từ validation: **{selected}, capacity 20%**; không đổi khi thấy model khác có score final tốt hơn. Theo tiêu chí benchmark đăng ký trước, kết quả **{benchmark}**: gain visit so với expected random20 = **{primary['gain_vs_random20']:.9f}**, CI95% **[{ci['gain_vs_random20']['lower_95']:.9f}; {ci['gain_vs_random20']['upper_95']:.9f}]**. Đơn vị là expected visit per evaluation row theo functional benchmark, không phải tiền/ROI hoặc lift thực tế đã chứng minh.

Kết quả procedure: **{check['count']} PASS**, replay độc lập **3 classifier cuối**, {check['protected_files']} tệp có trước không đổi. Không tái chạy toàn bộ inner search lần hai. Chi tiết ở [final_ml_experiment_results.md](final_ml_experiment_results.md).

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
'''
    experiments=f'''# DreamMakers — Kết quả thực nghiệm và kiểm tra thực tế

Ngày **04/11/2026**. Experiment **{PROTOCOL['id']}**. Kết luận chung **RESEARCH_LIMITED**. Đây là kết quả mới từ public Criteo, không thay bảng CV ROI lịch sử.

## 1. Nguồn, cấu hình và tính độc lập

[Gate](phase4b4/reassessment/phase_gate.json), [protocol v002](phase4b4/reassessment/evaluation_protocol_compat.json), [run lock](phase4b5_criteo_v2/results/run_lock.json), [split manifest](phase4b5_criteo_v2/results/split_manifest.json). IDs đầy đủ tại NPZ trong cùng thư mục results. Sample seed 20261104, split seed 51042026, CV3 joint treatment×visit seed741104. Fit/tuning chỉ trên train600k; validation200k chỉ chọn S/T; final200k chỉ chấm sau khi [frozen_policy.json](phase4b5_criteo_v2/results/frozen_policy.json) được ghi.

Mỗi preprocessing được fit riêng trong phần fit và từng arm của T: median+scaler cho 4 continuous; imputer+OHE thưa cho 8 categorical, min_frequency200/max_categories64. S learner thêm assignment, T learner hai logistic response models. Không exposure, outcomes hoặc ROI làm X. C∈{{.1,1}}, solver lbfgs, max_iter300; mọi trial được lưu. Không class weighting, không target encoding, không tuning trên final.

{selection_table}

**{selected}** được chọn trước final. Không chọn lại theo model thắng ở final. Baseline model là hai mean response theo arm fit chỉ trên train; tie ranking dùng row-ID hash cố định, không outcome/treatment.

## 2. Final response/ranking metrics

{metrics}

AUUC = integral U(q), U(q)=sum(top-q z)/n, z=T*Y/.85−(1−T)*Y/.15. Qini=AUUC−U(1)/2. Đây là biến thể explicit của run này, không so số tuyệt đối với AUUC/Qini biến thể khác trong bài báo. Constant model có Qini hữu hạn khác 0 do tie ordering mẫu; random-policy kỳ vọng và baseline tie được báo riêng. ROC-AUC/AP chấm factual response probability theo arm đã quan sát; không phải causal accuracy.

## 3. Policy evaluation — Phase 4B.6

Action chỉ assignment0/1, không chọn kênh, budget hoặc duration. Candidate target đúng 40.000/200.000 row theo visit uplift; capacity20% khóa trước. Response20 là top treated-response score từ cùng model; random20 là policy ngẫu nhiên kỳ vọng .2, không phải một lần tung đồng xu. None và all không có chi phí giả.

HT value = mean(Y*[T*pi/e + (1−T)*(1−pi)/(1−e)]), e=.85 theo giả định benchmark. Chỉ nguyên tắc này được dùng; không tuyên bố đã triển khai doubly robust estimator. Giá trị tuyệt đối này không là business conversion rate hoặc ROI đã hiệu chỉnh selection.

{policy_table}

400 paired row bootstraps seed62061104, percentile95%; resample cùng rows cho mọi policy, rerank frozen scores theo rule capacity, không fit/chọn lại model. CI có điều kiện theo fitted model, không bao gồm training/selection uncertainty và không cluster-robust vì thiếu IDs. Chỉ gain_vs_random20 và Qini là rule primary đã khóa; các contrast khác/secondary không multiplicity-adjusted nên không tuyên bố confirmatory significance.

Primary success rule benchmark: **{benchmark}**. Dù benchmark đạt, khuyến nghị thực tế vẫn **NOT VALIDATED**. [policy_results.json](phase4b5_criteo_v2/results/policy_results.json) lưu đầy đủ CI, cells và conversion secondary với cùng visit policy; không dùng secondary để chọn rule.

Sensitivity đúng 9 tổ hợp capacity .1/.2/.3 × e .8/.85/.9 tại [policy_sensitivity.csv](phase4b5_criteo_v2/results/policy_sensitivity.csv). Không dùng grid này chọn policy mới. Nó kiểm tra thay đổi functional/weight/capacity, không giải quyết unknown outcome-selection probabilities hay hidden confounding.

**Phát hiện thực tế cần giữ trong kết luận:** tại capacity20%, e=.85, candidate và response20 chọn cùng tập 40.000 dòng, gain_vs_response20=0 và paired CI=[0;0]. Không có lợi ích bổ sung được quan sát so với response baseline này. Khi dùng weights e=.80/.85/.90, gain_vs_random20 lần lượt khoảng **+0.014290 / +0.004775 / −0.011876**: dấu không bền với weights bị giả định sai. Các weights ngoài thiết kế chỉ là stress test; không được coi là các estimator đúng đồng thời hoặc chọn weight có điểm tốt nhất.

Treat-all có point value cao hơn candidate ở thiết kế chính nhưng dùng capacity100% thay vì20%, chưa biết chi phí nên không kết luận nó hay candidate tối ưu profit. Không đổi policy sau final. Các kết quả này củng cố trạng thái RESEARCH_LIMITED dù primary benchmark rule đạt.

## 4. Chi phí và các lần chạy không thành công

Run hợp lệ có **12 trial scores /18 inner classifier fits +3 final classifier fits =21**, cộng **3 replay classifier fits**. Ngoài ra v001 có **1 fit S classifier bị loại trước khi chấm score** vì warning tương thích; tổng số lần classifier fit đã thực hiện gồm cả lần đó là **25**. Hai lỗi startup trước đó chưa fit. Không ẩn trial có metric xấu: [inner_trials.csv](phase4b5_criteo_v2/results/inner_trials.csv) có toàn bộ 12 trial.

V001 và các log startup được giữ ở `phase4b5_criteo/`. V002 chỉ cho phép đúng warning `Unknown solver options: iprint`, ghi **{complete['recorded_compatibility_warnings']} warning** trong main run; không có warning khác được chấp nhận. SciPy bỏ qua legacy print option; không đổi objective/grid theo điểm. Runtime cũng dùng wide-character module-enumeration fallback trong tiến trình để xử lý đường dẫn Unicode như hồ sơ trước; không sửa package/Backend trên đĩa.

Mean/total fit seconds từng trial và outer refit có trong JSON/CSV; không cộng chúng thành wall-clock toàn quy trình hoặc so thời gian với Colab như benchmark máy chuẩn. [Power design sensitivity](phase4b4/reassessment/evidence/prospective_power.csv) không phải achieved policy power.

## 5. PASS/FAIL có bằng chứng

{phases}

**{check['count']} kiểm tra mới PASS** tại [verification_results.json](phase4b5_criteo_v2/results/verification_results.json): code/protocol/gate hashes, sample/split uniqueness, inner scopes, selection rule, final rows/outcomes, fresh refits, metric algebra, preprocessing fit-only stats, bootstrap budget, policy size, sensitivity grid, original files/gate. **{check['protected_files']} tệp có trước không đổi**.

Thêm **20 kiểm tra tài liệu/toàn vẹn PASS** tại [handoff_checks.json](phase4b5_criteo_v2/results/handoff_checks.json), chạy riêng không huấn luyện.

Replay độc lập hai meta-learners (3 logistic classifiers), prediction tolerance1e−10; không lặp toàn bộ 18 inner classifier fits. Max errors được lưu riêng theo model. Không phát hiện leakage trong các scope/preprocessing/selection checks đã kiểm tra; không tuyên bố các check chứng minh không có leakage nào trong raw data hoặc chứng minh causal assumptions.

Structural dataset checks PASS không xác nhận original-population causality. Failed startup/compatibility attempt được khắc phục và giữ log; FAIL lịch sử về ROI vẫn nguyên trạng. Không đọc ROI Test cũ. Không sửa bảy artifact, source production hoặc Quality Gate.

## 6. Tái lập và phạm vi artifact mới

Mã chạy: `phase4b5_criteo_v2/common.py`, `run.py`, `evaluate_policy.py`, `verify.py`, `render_handoff.py`; versions và threadpools trong run_lock. Các model joblib mới chỉ ở results research; không được backend hiện tại nạp. Raw Criteo có điều kiện CC BY-NC-SA4.0, không tự redistrib raw/derived data ngoài điều kiện license.

Lệnh kiểm tra lại trên run đã có: `backend/.venv/Scripts/python.exe -X utf8 research/phase4b5_criteo_v2/verify.py`. Lệnh này fit lại đúng 3 classifier cuối. `run.py` cố ý từ chối overwrite/mix run_lock đã tồn tại; để lặp full search cần thư mục run riêng ở cùng cấp research, code/config được giữ hash, không xóa evidence gốc. Phase này chưa thực hiện full second CV run.

Không có interval cá thể/ROI calibration hoặc experiment profit. Kết quả đủ bàn giao một benchmark có giới hạn và tiếp tục đồ án minh bạch; chưa đủ phát hành khuyến nghị.
'''
    handoff='''# DreamMakers — Bàn giao Machine Learning sang website và đồ án

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
'''
    for name,text in [('final_ml_research_summary.md',summary),('final_ml_experiment_results.md',experiments),('ml_to_website_handoff.md',handoff)]:
        (ROOT/'research'/name).write_text(text,encoding='utf-8')
    print('Rendered three final deliverables from completed, verified run.')


if __name__=='__main__':
    main()
