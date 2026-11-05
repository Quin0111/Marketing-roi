# PHASE 4B.1 — Khả thi nâng cấp ML và đề xuất Marketing

Ngày: **03/11/2026**. **Kết luận khả thi hiện tại: chưa đủ căn cứ xây dựng bộ máy khuyến nghị tối ưu Marketing thực tế.** Có thể tiếp tục nghiên cứu có giới hạn, nhưng không bật khuyến nghị hoặc chuyển Quality Gate. BASELINE_ONLY được giữ nguyên.

## 1. Trả lời bảy câu hỏi nghiên cứu

| Câu hỏi | Kết luận dựa trên bằng chứng hiện có |
|---|---|
| Dataset có tín hiệu dự đoán ROI không? | Chưa phát hiện tín hiệu hữu ích ngoài mẫu trong các chẩn đoán đã thực hiện. Mỗi feature hiện tại giải thích <0,006% phương sai; joint permutation p≈0,61. Không kết luận toán học rằng mọi quan hệ đều bằng 0. |
| Vì sao chưa vượt Dummy? | Chênh trung bình nhóm nhỏ, độ phân tán ROI lớn; chia nhiều nhóm tăng variance; thiếu bối cảnh kinh tế và provenance. Chẩn đoán tuyến tính mới cũng chưa thắng Dummy về trung bình. |
| Có feature trước chiến dịch đáng bổ sung không? | Company/Location/Language hợp nghĩa nhưng thử thêm chưa cải thiện. Budget kế hoạch, giá/margin, creative, khuyến mãi và lịch sử có cutoff là dữ liệu cần thu thập, không có sẵn trong CSV. |
| Dùng cột khác có leakage không? | Clicks/Impressions/Conversion_Rate/Engagement là chỉ số sau triển khai. Cost/Duration/Date cần xác minh actual/planned và cutoff; công thức ROI chưa được kiểm toán. |
| Kỹ thuật khác có thể cải thiện không? | Có thể thử HGB/Gradient Boosting và FE có giới hạn trên Development, nhưng chưa có bằng chứng hứa hẹn cải thiện; không chạy tuning hoặc triển khai mô hình mới trong Phase 4B.1. |
| Đủ dữ liệu để tối ưu thực tế không? | Chưa: thiếu bằng chứng dự đoán ổn định, outcome kinh tế kiểm toán được, hành động khả thi/ràng buộc, nhóm đối chứng và cơ chế phân bổ để đánh giá tác động của lựa chọn. |
| Cần bổ sung gì? | Truy vết CV, data dictionary/as-of snapshot, dữ liệu kinh tế trước chiến dịch, historical logs đúng thời điểm, tập mới độc lập, và thiết kế thử nghiệm chính sách có đối chứng. |

## 2. Phân biệt bốn mức bằng chứng

| Mức | Bài toán | Điều gì cần chứng minh | Trạng thái DreamMakers |
|---|---|---|---|
| Dự đoán ROI | Ước lượng E[ROI\|X] từ dữ liệu quan sát | Sai số ngoài mẫu tốt hơn baseline, input có trước outcome | API hoạt động kỹ thuật; giá trị nghiên cứu, chưa vượt baseline |
| Xếp hạng ROI dự đoán | Sắp thứ tự điểm dự đoán | Thứ tự ổn định, chênh lệch vượt bất định, có khả năng phân biệt ngoài mẫu | Chưa có bằng chứng; argmax không tạo ra chất lượng mô hình |
| Đề xuất triển khai | Chọn hành động cho một bối cảnh và ràng buộc | Hành động khả thi, support đủ, utility/risk/budget đã định nghĩa; có quyền từ chối đề xuất | Thiếu dữ liệu và tiêu chí |
| Chứng minh cải thiện ROI | Đánh giá outcome nếu áp dụng chính sách so với chính sách đối chứng | Bằng chứng nhân quả hoặc thí nghiệm chính sách độc lập, đo chi phí đầy đủ | Chưa có thiết kế/phân bổ/đối chứng phù hợp |

Học uplift tập trung vào tác động **tăng thêm** của hành động, khác với dự đoán outcome của người vốn đã có khả năng mua cao. Có thể nhận diện từ dữ liệu quan sát dưới các giả định mạnh, nhưng dataset này chưa có covariates/log phân bổ để bảo vệ các giả định đó. [Gutierrez & Gérardy, PMLR 2017](https://proceedings.mlr.press/v67/gutierrez17a.html). Một hướng marketing bandit nhân quả cũng tối ưu incremental outcome, không đơn thuần mức ROI dự đoán. [Sawant và cộng sự, 2018](https://arxiv.org/abs/1810.01859).

Dataset có nhiều giá trị Campaign_Type/Channel không tự tạo thành thí nghiệm ngẫu nhiên. Không gán nhãn “đối chứng” tùy ý cho một kênh hoặc tự sinh counterfactual outcome/propensity.

## 3. Các hướng nâng cấp có thể kiểm tra

| Phương án | Vì sao đáng thử | Cách giới hạn rủi ro nghiên cứu | Điều chưa được khẳng định |
|---|---|---|---|
| Dọn semantic và provenance | Giá trị thực tế phụ thuộc định nghĩa target/input đúng | Xác nhận ROI, đơn vị, planned/actual, lịch sử fold và hash | Không hứa sẽ tự tăng điểm |
| Feature engineering từ biến A | Tương tác loại×kênh, kênh×đối tượng; duration dạng category so với numeric | Quy định trước một số ít tương tác; mọi thống kê học trong fit fold; regularization | Tương tác hiện tại chưa cho tín hiệu đủ mạnh |
| Thêm Company/Location/Language | Có thể mô tả bối cảnh chiến dịch | Xác minh snapshot, đánh giá theo nhóm; giữ ablation riêng | Chẩn đoán tuyến tính bổ sung hiện kém Dummy |
| HistGradientBoosting | Kiểm tra phi tuyến và tương tác, có sẵn trong sklearn 1.6.1 | Khai báo categorical đúng, complexity nhỏ, early stopping chỉ trong fit fold | Chưa benchmark ở Phase 4B.1; không suy từ bài toán nhà ở |
| GradientBoostingRegressor | Đối chứng boosting khác | One-hot trong pipeline, depth nhỏ, giới hạn số trial | Phức tạp hơn có thể chỉ học nhiễu |
| CatBoost | Xử lý categorical và ordered statistics | Môi trường research riêng, xác minh wheel/Python; không bật ghi file ngoài research | Chưa cài/chạy; chưa xác minh tương thích môi trường hiện tại |
| Đổi mục tiêu/thiết kế dữ liệu | Profit tăng thêm hoặc outcome có thể kiểm toán có ý nghĩa quyết định hơn ROI mơ hồ | Thu thập revenue, margin, spend, baseline/control và cửa sổ ghi nhận | Không tạo target mới bằng công thức không có dữ liệu nguồn |

HGB có hỗ trợ categorical trong phiên bản đang dùng; đây là lý do kỹ thuật để cân nhắc, không phải bằng chứng tốt hơn trên DreamMakers. [Ví dụ chính thức scikit-learn 1.6](https://scikit-learn.org/1.6/auto_examples/ensemble/plot_gradient_boosting_categorical.html). Cách CatBoost xử lý categorical/ordered statistics cần được dùng đúng và kiểm tra trong fold. [Tài liệu CatBoost](https://catboost.ai/docs/en/concepts/faq).

Không làm trong Phase 4B.1: chạy hàng trăm trial, fit lại pipeline deploy, chọn winner trên Test, thay mô hình production, hoặc tạo /optimize.

## 4. Dữ liệu cần thu thập — chưa có trong dataset

| Nhóm | Các trường cần bổ sung | Mục đích và điều kiện |
|---|---|---|
| Kế hoạch kinh tế | planned_budget, bid, unit_price, gross_margin, planned_discount, planned_start/end | Mô tả quyết định trước triển khai; phân biệt với actual spend/cost |
| Nội dung và sản phẩm | product/category, offer, creative/content attributes, campaign objective | Nắm khác biệt giá trị bán và thông điệp; chỉ dùng phiên bản chốt trước cutoff |
| Lịch sử | Lagged channel performance, spend, conversions, baseline demand | Chỉ từ chiến dịch đã kết thúc và outcome đã đến trước thời điểm dự đoán; phải tính lại theo từng fold/cutoff |
| Bối cảnh | Lịch thật, sự kiện/mùa vụ, khu vực, thông tin cạnh tranh khi biết trước | Cần nhiều chu kỳ và timestamp thực; không suy từ Date đang lặp theo ID |
| Outcome kiểm toán | actual_spend, attributed/incremental revenue, profit, conversions, attribution window | Định nghĩa ROI rõ ràng, đối soát với dữ liệu nguồn; đây là outcome/label chứ không phải X trước chiến dịch |
| Đánh giá chính sách | context trước phân bổ, action, assignment probability, experiment/control ID, eligibility | Cho phép đánh giá causal/policy, kiểm tra overlap và spillover; không tạo propensity giả |
| Truy vết | event_time, available_at, prediction_time, source/version, customer/product/creative IDs | Kiểm soát leakage, nhóm phụ thuộc, thay đổi schema và OOD |

Không có cỡ mẫu “đủ” chỉ dựa vào tổng 200.000 dòng: cần power theo minimal detectable effect, variance, đơn vị ngẫu nhiên hóa và số action; các nhóm hiếm hiện tại mới có trung vị 57 dòng/tổ hợp.

## 5. Quality Gate định lượng đề xuất

Đây là **đề xuất để nhóm khóa trước thí nghiệm**, chưa phải chính sách đã được xác nhận hoặc trạng thái hiện tại. Ngưỡng phải gắn chi phí kinh doanh và được duyệt trước khi nhìn dữ liệu nghiệm thu. Không dùng việc chọn ngưỡng sau khi xem kết quả để “đạt gate”.

| Gate | Tiêu chí dự kiến có thể kiểm chứng | Cách đánh giá |
|---|---|---|
| G0 — provenance và thời điểm | 100% feature có định nghĩa/as-of; ROI kiểm toán; data/split/fold hash và code tái lập; giải thích chênh CV | Kiểm toán nguồn, không chỉ kiểm tra API trả số |
| G1 — dự đoán hơn baseline | Trên dữ liệu độc lập khóa trước: giảm RMSE >=5% và MAE không xấu hơn; R²>0; khoảng 95% cho cải thiện RMSE có cận dưới >0 | Baseline fit đúng tập fit; cùng mẫu đánh giá; paired resampling theo đơn vị độc lập/cluster; chưa mở Test trong Phase này |
| G2 — ổn định Development | Tối thiểu 3 lần 5-Fold đã định trước; thắng >=4/5 fold mỗi lần và cải thiện trung bình >=5% mỗi lần | Báo mọi fold/seed và mọi trial; nested CV nếu có tuning; không coi 15 fold là 15 quan sát độc lập |
| G3 — sai số/bất định | Khoảng dự đoán 90% được hiệu chuẩn riêng, coverage tổng 88–92%; subgroup có n>=500 đạt coverage >=85%; báo width | Dữ liệu calibration tách khỏi fit/selection; kiểm tra shift; RMSE không phải interval; width phải hữu ích cho chênh lợi ích cần quyết định |
| G4 — nhóm và support | Nhóm triển khai chính không có RMSE >110% baseline nhóm; đánh dấu nhóm n<500 chưa kết luận; context/action đề xuất có tối thiểu 200 quan sát liên quan như ngưỡng sàng lọc ban đầu | Kiểm tra uncertainty và overlap; số mẫu không tự bảo đảm causal identifiability; abstain ngoài support |
| G5 — phân phối/phạm vi | Category mới/giá trị ngoài phạm vi thì không khuyến nghị; kiểm tra out-of-time và leave-company-out phù hợp; giám sát drift | Cảnh báo PSI>0,2 có thể dùng như heuristic ban đầu, phải hiệu chỉnh theo biến/cỡ mẫu; không coi đó là kiểm định có mức ý nghĩa cố định |
| G6 — lợi ích của lựa chọn | Chính sách cố định có cận dưới 95% của incremental net profit so với control >0 và vượt ngưỡng lợi ích kinh doanh khóa trước | Ưu tiên RCT/pilot; OPE chỉ khi có propensities/overlap đủ, báo effective sample size và sensitivity; xác nhận độc lập, đủ power |

G1/G2 chỉ đánh giá **dự đoán**, không thay G6. Một mô hình dự đoán tốt cũng không tự đủ điều kiện khuyến nghị hành động. Nếu không phân biệt được hai phương án trong mức bất định hoặc ràng buộc chưa rõ, hệ thống phải từ chối kết luận tối ưu.

Các ngưỡng 5%, 88–92%, 500, 200, 110% và PSI 0,2 là **đề xuất nghiên cứu minh bạch**, không phải chuẩn chung đã được chứng minh phù hợp dataset. Nhóm cần khóa/điều chỉnh bằng business requirements và phân tích power trước Phase nghiệm thu, không chỉnh để chạy theo kết quả hiện tại.

## 6. Kế hoạch Phase 4B.2 đề xuất — chưa thực hiện

1. **Giải quyết provenance:** lấy notebook tạo model_metrics.json, CV row/fold manifests, raw metrics, code/version của CSV. Giữ nguyên kết quả đã công bố; tạo biên bản đối chiếu riêng. Không thử split khác để khớp chỉ số.
2. **Chốt data contract:** ROI và cửa sổ đo, Duration planned/actual, Cost, Date và `available_at`. Giữ bốn feature phân loại có nghĩa trước chiến dịch; chỉ thêm cột sau khi vượt kiểm toán thời điểm.
3. **Đăng ký thử nghiệm nhỏ trên Development gốc:** Dummy, Linear hiện tại dưới dạng research instance, Ridge/FE nhỏ, HGB/GB nhỏ, và CatBoost chỉ nếu môi trường riêng hỗ trợ. Cap ví dụ <=12 cấu hình cho mỗi họ; mọi trial được ghi, không ẩn thất bại.
4. **Nested/repeated CV:** outer 5-fold ×3 seed khóa trước; inner CV phục vụ tuning, fit preprocessing bên trong. Đánh giá random split để đối chiếu nghiên cứu, đồng thời kiểm tra group/out-of-time khi timestamp được xác minh. Không đổi membership Test gốc.
5. **Kiểm định hữu ích:** loss, ablation, subgroup errors, label-permutation toàn quy trình trên Development. Các permutation hiện tại mới kiểm tra liên hệ feature–ROI, chưa phải permutation test của toàn bộ quy trình chọn model.
6. **Quy tắc dừng:** nếu các họ đều chưa cải thiện ngoài mẫu một cách ổn định, dừng tăng độ phức tạp; chuyển ưu tiên sang dữ liệu thực, provenance và thiết kế thí nghiệm.
7. **Nghiệm thu độc lập sau khi khóa thiết kế:** chỉ cân nhắc mở Test gốc một lần sau khi toàn bộ lựa chọn đã chốt và được rà soát; do EDA lịch sử chưa bảo đảm blinded, cần thêm tập mới/out-of-time thực sự độc lập cho quyết định kinh doanh. Không dùng Test để sửa/chọn model nếu thất bại.
8. **Pilot chính sách:** sau khi có dữ liệu action/control và lợi ích dự đoán đủ lớn, thiết kế RCT có đủ power. Chỉ sau đánh giá chính sách mới cân nhắc chức năng đề xuất có điều kiện và khả năng abstain.

Không thể hoàn thành hướng B bằng cách chọn argmax từ các điểm Linear Regression hiện tại. Các mục trên là đề xuất cho lượt làm việc sau, chưa được thực thi trong Phase 4B.1.

## 7. Blocker và quyết định hiện tại

| Blocker | Ảnh hưởng | Cần bổ sung |
|---|---|---|
| Metrics lịch sử chưa tái lập đúng | Chưa kiểm toán đầy đủ bằng chứng đánh giá | Code/fold/dataset version và log 5-Fold gốc |
| Không có tín hiệu hữu ích được phát hiện | Không có căn cứ chọn cấu hình tốt hơn | Dữ liệu thông tin hơn hoặc thử nghiệm Development có giới hạn |
| Target/time semantics chưa rõ | Có thể dự đoán nhầm bài toán hoặc leakage | Công thức ROI, planned/actual, cutoff/as-of |
| Date lặp theo ID, provenance thực/tổng hợp chưa xác nhận | Không bảo vệ suy luận mùa vụ/khái quát hóa thực tế | Tài liệu từ bên tạo dữ liệu, lịch sự kiện thật |
| Không có dữ liệu kinh tế đủ và action constraints | Chưa định nghĩa được utility tối ưu | Budget, revenue/margin/spend, mục tiêu và tập hành động khả thi |
| Thiếu control/assignment và tập mới độc lập | Không chứng minh tác động của việc lựa chọn | Logs thí nghiệm, propensity nếu có, RCT/pilot và power analysis |

**Quyết định:** giữ website dự đoán nghiên cứu và Quality Gate **BASELINE_ONLY**; không sửa Frontend/Backend, artifact hoặc kết quả đã công bố. Hoàn thành báo cáo Phase 4B.1 và dừng để người dùng kiểm tra trước Phase 4B.2.

## 8. Tài liệu và bằng chứng

- [Kiểm tra dữ liệu, split và provenance](phase4b1_data_audit.md).
- [Phân loại toàn bộ feature và phân tích tín hiệu](phase4b1_feature_assessment.md).
- Script, bảng số gốc và hình: `scripts/`, `outputs/phase4b1/`.
- [scikit-learn 1.6 — tránh leakage](https://scikit-learn.org/1.6/common_pitfalls.html).
- [scikit-learn 1.6 — cross-validation](https://scikit-learn.org/1.6/modules/cross_validation.html).
- [scikit-learn 1.6 — HGB categorical](https://scikit-learn.org/1.6/auto_examples/ensemble/plot_gradient_boosting_categorical.html).
- [CatBoost — FAQ và categorical statistics](https://catboost.ai/docs/en/concepts/faq).
- [Gutierrez & Gérardy — causal inference/uplift](https://proceedings.mlr.press/v67/gutierrez17a.html).
- [Sawant và cộng sự — causal marketing bandits](https://arxiv.org/abs/1810.01859).
