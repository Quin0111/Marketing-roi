# Phase 4B.4 — Đối soát lại nguồn và giao thức nghiên cứu

Ngày hoàn tất rà soát: **04/11/2026**, Asia/Bangkok. Bổ sung bằng chứng mới; không sửa [acceptance addendum lịch sử](../acceptance_addendum.md). Phase 4B.4 không fit mô hình.

**Quyết định: GO có phạm vi xác định cho benchmark học thuật trên bản Criteo công khai; NO-GO cho tối ưu ROI hoặc khuyến nghị kinh doanh thực tế.** GO là quyền thực hiện Phase 4B.5 theo [gate đã ghi trước fit](phase_gate.json), không phải Quality Gate production. Các kết luận về policy sau này phải giữ điều kiện của benchmark; không được tự nâng thành bằng chứng causal trên quần thể quảng cáo gốc.

## 1. Bằng chứng mới so với lần NO-GO trước

Đã đối chiếu toàn bộ hồ sơ Phase 4B.1–4B.4, notebook Colab `(8)` ở dạng source-only và metadata/reference cần thiết. Không thực thi notebook, không mở ROI Test cũ. ROI hiện tại chưa vượt Dummy; sai khác lịch sử chưa được giải quyết.

Đọc đầy đủ các phần liên quan của [bài báo tác giả Criteo, §3, §5.1 và Appendix A/C](https://arxiv.org/html/2111.10106v1): covariates được ghi trước assignment, outcomes trong hai tuần; v2 cân bằng treatment ratio giữa advertiser tests và được tác giả kiểm tra cho benchmark uplift. Dữ liệu vẫn có negative sampling theo nhãn; không có probabilities để hoàn nguyên hiệu ứng gốc. Đây là căn cứ cho **giả định benchmark của tác giả**, không phải kiểm chứng độc lập mọi giả định nhân quả.

[Publisher terms](https://ailab.criteo.com/criteo-uplift-prediction-dataset/) và [card ở revision cố định](https://huggingface.co/datasets/criteo/criteo-uplift/blob/2424920019e49d52d72c13ac1143ec5d53af276b/README.md) ghi CC BY-NC-SA 4.0. Chỉ dùng cho nghiên cứu phi thương mại này; giữ nguồn, attribution và điều kiện liên quan. Không gán license này cho ứng dụng thương mại hoặc artifact ROI cũ.

Thông tin download tại [download_manifest.json](evidence/download_manifest.json), API revision và LFS hash tại [hf_file_manifest.json](evidence/hf_file_manifest.json). Đã tải thực, không chỉ đọc mô tả:

| Thuộc tính | Kết quả |
|---|---|
| Revision | `2424920019e49d52d72c13ac1143ec5d53af276b` |
| File | `criteo-research-uplift-v2.1.csv.gz` |
| Compressed bytes | 311.422.618 |
| SHA256 thực = LFS SHA256 | `2716e1bf0fd157a93b5bf86924d9088419dfbac2022c6cd90030220634f616dc` |
| Số dòng kiểm đếm thực | 13.979.592 |
| Header | f0–f11, treatment, conversion, visit, exposure |
| Missing / nonfinite / binary invalid | 0 / 0 / 0 |
| Control có exposure / conversion không visit | 0 / 0 |
| Control / treatment | 2.096.937 / 11.882.655 |

Raw audit: [criteo_schema_audit.json](evidence/criteo_schema_audit.json), [script](audit_criteo.py), [log](evidence/criteo_audit.log). Chỉ mô tả cấu trúc/count, không fit. Các rate theo arm trong JSON **không được gọi là effect nhân quả**. Không có cột revenue/cost/ROI; không tự tạo chúng. Không suy category business từ f0–f11 ẩn danh.

## 2. Sampling và giới hạn nhận diện

Gọi `S=1` là được đưa vào release. Về đại số, nếu xác suất giữ dòng phụ thuộc nhãn/action:

```text
P(Y=1 | T=t,X=x,S=1)
  = s_1t(x)*p_t(x) / [s_1t(x)*p_t(x) + s_0t(x)*(1-p_t(x))]
```

Không biết `s_yt(x)` thì không thể nói đã khôi phục `p_t(x)` của quần thể gốc. Khả năng dự đoán treatment kém hoặc balance tốt cũng không tự chứng minh toàn bộ potential outcomes độc lập assignment sau mọi bước selection. Thay e từ .80 sang .90 chỉ là sensitivity về weights, không thay cho unknown label-selection correction.

**Cách xử lý trong nghiên cứu này:** dùng mục đích benchmark và giả định RCT-compatible của publisher để kiểm tra một quy trình ranking/policy **có điều kiện trên bản release**, lưu metric như benchmark functionals. Không báo original-population ATE, personalized causal truth, causal ROI hay policy benefit thực tế. Các điều kiện IID user rows, consistency, không interference đáng kể được khai báo; không có IDs/strata để tự kiểm tra cluster dependence. Nếu đề bài bắt buộc absolute causal lift hoặc external business policy value, gate tương ứng vẫn BLOCKED và không được dùng benchmark này làm nghiệm thu.

Vì vậy việc GO không bỏ qua B3: nó dựa vào bằng chứng thiết kế mới và **thu hẹp đúng kết luận có thể đánh giá**, đồng thời giữ B3 nguyên trạng cho mục tiêu quần thể gốc. Không dùng thành tích của tác giả làm metric của DreamMakers.

## 3. Nguồn dự phòng đã khảo sát tiếp

| Nguồn | Bằng chứng mới và quyết định |
|---|---|
| Hillstrom | [Thông báo tác giả](https://blog.minethatdata.com/2008/03/minethatdata-e-mail-analytics-and-data.html) xác định email arms và outcomes. Quyền tái sử dụng vẫn chưa được xác lập rõ trong nguồn đã kiểm tra; không tải dữ liệu để thực nghiệm. Customer spend không là ad cost hoặc ROI. **BLOCKED quyền sử dụng**. |
| Lazada/DESCN | Đã tìm [README dataset riêng](https://raw.githubusercontent.com/kailiang-zhong/DESCN/80fd11e02d05af241eeaf67d701be599da528cb1/data/Lazada_dataset/README.md), fingerprints và [license trong thư mục dataset](https://raw.githubusercontent.com/kailiang-zhong/DESCN/80fd11e02d05af241eeaf67d701be599da528cb1/data/Lazada_dataset/LICENSE), không chỉ license code. [Bài báo gốc](https://arxiv.org/html/2207.09920v1) phân biệt biased train và randomized test. Chưa đủ timing chi tiết của từng f0–f82/assignment để thay ứng viên đã có bằng chứng rõ hơn; không tự cho mọi covariate là pre-treatment. **NOT_SELECTED, timing còn thiếu**; không fit hoặc tải raw archive. |
| MT-LIFT | [Publisher README](https://raw.githubusercontent.com/MTDJDSP/MT-LIFT/main/README.md) có mô tả coupon RCT; [tree metadata](evidence/mtlift_tree.json) chỉ có README, chưa tìm thấy điều kiện dùng dataset đủ rõ tại nguồn đã xét. **BLOCKED quyền sử dụng**; không tải raw. |

Không tuyên bố đã vét hết mọi public dataset hoặc các nguồn trên bất khả thi mãi mãi. Không cần mở thêm nhiều nguồn khi đã có một benchmark hẹp đủ căn cứ. Hồ sơ nguồn được tải tại [source_downloads.json](evidence/source_downloads.json) và [additional_source_downloads.json](evidence/additional_source_downloads.json); lỗi tải arXiv trực tiếp được giữ FAIL, trong khi nội dung HTML đã đọc bằng web. Không biến lỗi download thành “không tồn tại bài báo”.

## 4. Giao thức, power và compute trước fit

[Giao thức v001](evaluation_protocol.json) ghi trước first fit. [Bản sửa tương thích v002](evaluation_protocol_compat.json) chỉ ghi nhận warning `Unknown solver options: iprint`, không đổi sample, seed, estimator objective, grid, metric hoặc split. Bản đầu dừng trước khi chấm bất kỳ CV score nào, log được bảo tồn ở nhánh v001; không dùng lỗi kỹ thuật làm lý do chọn cấu hình theo kết quả.

- Một triệu row IDs chọn đều, độc lập outcomes; seed 20261104. Chia **600k train / 200k validation-selection / 200k final** bằng index-only permutation seed 51042026. Manifest chứa source row IDs/hash, không dùng dataset ROI cũ.
- `visit` là primary vì đây là benchmark engagement phù hợp phạm vi; conversion chỉ secondary với cùng policy, không chọn outcome dựa kết quả model. Không đánh đồng visit, conversion và tiền.
- Input chỉ f0–f11 trước assignment theo publisher; exposure và outcomes bị loại. Treatment chỉ là action của S/T learner.
- Sparse preprocessing fit trong từng fold; hai logistic meta-learners S/T, C∈{.1,1}, inner joint-stratified 3-fold trên train; chọn config bằng inner Qini. Chọn model bằng validation Qini, không refit trên validation; policy capacity **20%** đã khóa trước final metrics.
- Baseline response là mean từng arm fit trên train. Policy baselines none/all/expected random20/response20. Qini và HT functional có công thức cụ thể trong JSON, không trộn các biến thể AUUC khác nhau.
- 18 classifier fits inner +3 fits cuối, một fit tuần tự, hai thread. Replay riêng ba classifier; 400 paired row bootstraps, không model/policy reselection trong bootstrap.

[prospective_power.csv](evidence/prospective_power.csv) là **design sensitivity** dưới giả định IID RCT, α hai phía .05 và power .80. Với n=200.000 evaluation, e≈.85, p giả định .05: MDE contrast hai arm khoảng **0,3824 điểm phần trăm**; subset n=40.000 khoảng **0,8550 điểm phần trăm**. Ở p=.003 và n=40.000 chỉ kỳ vọng khoảng 18 control events nên normal approximation yếu. Đây không phải power đã đạt của policy gain, không dùng observed gain để tính “post-hoc power”. Policy effect nhỏ có thể cho CI rộng và negative/inconclusive result vẫn là kết quả hợp lệ. Cluster design effect và training-selection uncertainty chưa có dữ liệu để định lượng.

Audit 14M dòng đã chạy bằng chunk 250k trong khoảng 40,8 giây; compressed raw≈311MB, sample/features khoảng 128MB trước overhead. Sparse OHE có cap 64 category mỗi cột giúp giới hạn bộ nhớ; không hứa thời gian fit trước đo. Chỉ logistic và sampling vừa phạm vi đồ án đại học; không triển khai optimizer hoặc thêm kênh/budget giả.

## 5. Bảng nghiệm thu Phase 4B.4

| Điều kiện | Trạng thái | Bằng chứng/phạm vi |
|---|---|---|
| Exact file/release + integrity | PASS | Download manifest, LFS hash, actual streaming count |
| Điều kiện sử dụng cho academic noncommercial | PASS | Publisher terms + pinned card, source snapshots |
| Treatment/control/outcome/schema | PASS | Actual 16-column audit; không có ROI |
| Timing feature trước action | PASS theo tài liệu sơ cấp | §3/Data collection; không có timestamp raw để kiểm tra độc lập |
| Cơ sở causal assumptions | PASS cho benchmark có điều kiện | Publisher v2 design/validation; assumptions và giới hạn ghi rõ |
| Nhận diện absolute original-population effects | BLOCKED | Không có selection probabilities/strata/identity; không thuộc claim GO |
| Independent selection/evaluation protocol | PASS thiết kế | Protocol + run lock trước fit, final tách validation; không phải external prospective sample |
| Statistical/compute feasibility | PASS để thử có giới hạn | Power sensitivity, sparse logistic budget; không bảo đảm thắng baseline |
| Mục tiêu thực tế của website | BLOCKED/NO-GO | Chưa có ROI economics, population đích hoặc pilot |

GO này không sửa NO-GO lịch sử, không nâng trạng thái các Phase cũ. Kết quả Phase 4B.5/4B.6 và hạn chế thực tế được tổng kết trong [final_ml_research_summary.md](../../final_ml_research_summary.md). Quality Gate ROI tiếp tục **BASELINE_ONLY**.
