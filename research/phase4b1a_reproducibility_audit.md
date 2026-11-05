# PHASE 4B.1A — Đối soát kết quả Machine Learning

Ngày: **03/11/2026**, Asia/Bangkok. Phạm vi: đối soát, không nâng cấp mô hình hoặc triển khai tối ưu.

**Kết luận:** tái lập chính xác RMSE chẩn đoán mới **1,7344738959662471**. **Chưa tái lập được RMSE lịch sử 1,732275** vì thiếu mã tạo kết quả và nguồn gốc mẫu/fold. Đã đo được rằng khác biệt mean-fold/pooled, tiền xử lý và sai số số học trong các kiểm tra thực tế không giải thích khoảng chênh. Chưa có bằng chứng đủ để xác định một nguyên nhân lịch sử duy nhất.

Việc hoàn thành đối soát không đồng nghĩa kết quả gốc đạt kiểm tra tái lập. Bảng PASS/FAIL dưới đây giữ riêng hai kết luận này. **Quality Gate vẫn BASELINE_ONLY.**

## 1. Nguồn đã đọc và tìm kiếm

Đã đọc đầy đủ ba báo cáo Phase 4B.1 và đối chiếu số liệu với script/output:

- `phase4b1_data_audit.md`.
- `phase4b1_feature_assessment.md`.
- `phase4b1_recommendations.md`.

Phạm vi tìm mã cũ: thư mục MachineLearning, Downloads, Documents/Desktop, các notebook Marketing đã tải và lịch sử Antigravity liên quan. Đã tìm **chín phiên bản MachineLearningcki**, gồm `(8)`. Notebook `(8)` ghi cách chia 70/15/15 ở cell 104/117, preprocessing, fit Dummy trên Train ở cell 136/173 và tuning 3-Fold tại cell 147. Không tìm được mã tạo bảng 5-Fold trên Development 170.000 dòng hoặc raw fold indices trong các nguồn được kiểm tra. Không lấy code 5-Fold của California Housing làm giao thức ROI.

Phát hiện thêm `C:/Users/ASUS/Downloads/DreamMakers_Models_Complete.zip`: bảy thành viên khớp SHA256 với **cả bảy artifact production**, nhưng gói chỉ chứa mô hình/metadata/metrics/reference, không có script thực nghiệm, dataset hash hay fold manifest. Ba bản CSV trong các ZIP truy cập được có cùng SHA256 với CSV hiện tại. Đây không phải bằng chứng CSV của lần CV lịch sử cũng cùng phiên bản, vì metadata lịch sử không ghi hash dataset.

Tìm kiếm metadata trên Google Drive kết nối với từ khóa `MachineLearningcki` và `DreamMakers` trả về 0 kết quả truy cập được. Điều này chỉ giới hạn phạm vi tìm kiếm hiện tại, không chứng minh tệp không tồn tại ở tài khoản hoặc phiên Colab khác.

Lịch sử Antigravity có bảng số lịch sử trong nội dung yêu cầu đầu vào và mã giao diện khai báo tĩnh. Không có lệnh `KFold(...)`, `cross_validate(...)`, `cross_val_score(...)` hoặc `train_test_split(...)` trong transcript liên quan đã tìm được. Đây là bằng chứng về **luồng sao chép số vào ứng dụng**, không xác nhận cũng không phủ định kết quả nghiên cứu trước đó.

`src/data/modelResults.ts` khai báo năm Dummy RMSE giao diện `[1.7321, 1.7324, 1.7320, 1.7325, 1.7321]`, có trung bình **1,732220**, khác `1,732275`. Các con số bốn chữ số này không có hàng/fold ID hoặc log fit đi kèm, nên không được dùng làm fold gốc để ép tái lập. Frontend giữ nguyên theo giới hạn của nhiệm vụ.

Bằng chứng đọc máy: [source_discovery.json](outputs/phase4b1a/source_discovery.json). Báo cáo không tuyên bố đã tìm hết mọi tệp trên máy/cloud.

## 2. Chính xác Development nào được sử dụng?

CSV: `marketing_campaign_dataset.csv`, SHA256 **`f06c1b95a8207b4631c35e6b83b4a2a7872892a8bfa133967e1e7ec401c7bb60`**.

Membership gốc theo notebook và archive đã xác minh ở Phase 4B.1:

```python
train_ids, temporary_ids = train_test_split(
    original_row_ids, test_size=0.30, random_state=42
)
validation_ids, final_test_ids = train_test_split(
    temporary_ids, test_size=0.50, random_state=42
)
development_ids = concatenate([train_ids, validation_ids])
```

Train 140.000 + Validation 30.000 = Development 170.000. Giữ thứ tự do train_test_split trả về, không sort và không reset membership. Test cuối 30.000 không đổi. Phase 4B.1 đã đối chiếu toàn bộ index/thứ tự với `models_roi (4).zip/splits/data_splits.joblib`; Phase này replay **chỉ số nguyên** từ 200.000 row IDs và kiểm tra lại membership cũ, không nạp lại joblib chứa `y_test`.

**Bảo vệ ROI Test trong lần đối soát này:** pandas được gọi với `skiprows` theo membership trước khi materialize các hàng CSV. Chỉ 170.000 hàng Development xuất hiện trong DataFrame/NumPy. Không nạp `data_splits.joblib`, không đọc/describe/predict/score `y_test`. Việc hash byte stream toàn CSV để kiểm tra toàn vẹn không diễn giải các giá trị ROI của Test. [data_access.json](outputs/phase4b1a/data_access.json).

Không thay bằng `train_test_split(..., test_size=0.15)` một lần. Kiểm tra **index-only** cho công thức đó cho thấy tập 170.000 dòng mới sẽ chứa **15.072** dòng thuộc Test đang khóa. Không nạp ROI hoặc chấm điểm trên phép chia này.

## 3. Giao thức chẩn đoán mới đã tái lập

| Thành phần | Giá trị đã kiểm tra |
|---|---|
| Input rows | Development gốc, Train nối Validation |
| KFold | n_splits=5, shuffle=True, random_state=42 |
| Mỗi assessment fold | 34.000 dòng |
| Mỗi fit fold | 136.000 dòng; phần bù trong Development |
| Dummy | strategy='mean', sample_weight=None |
| Target | ROI gốc dạng float64, không log/scale/winsorize |
| Giá trị dự đoán fold k | Trung bình ROI của fit fold k, không phải trung bình toàn Development |
| RMSE fold | sqrt(mean((y_assess - mean(y_fit))**2)) |
| Metric chính | Trung bình số học năm RMSE chưa làm tròn |
| Rounding | Chỉ để hiển thị; không làm tròn trước tổng hợp |

Dummy chiến lược mean dùng giá trị trung bình target của phần fit; X không quyết định giá trị dự đoán. [DummyRegressor — sklearn 1.6](https://scikit-learn.org/1.6/modules/generated/sklearn.dummy.DummyRegressor.html). Các fold được sinh từ thứ tự hàng cố định; seed giống nhau nhưng thứ tự/membership khác nhau không tạo cùng fold. [KFold — sklearn 1.6](https://scikit-learn.org/1.6/modules/generated/sklearn.model_selection.KFold.html).

**Fold indices mới đã khôi phục khớp Phase 4B.1:** mỗi assessment fold có row IDs và thứ tự khớp hoàn toàn file `development_fold_membership.csv`. File [dummy_fold_metrics.csv](outputs/phase4b1a/dummy_fold_metrics.csv) có SHA256 của cả fit/assessment row IDs, mã hóa int64 little-endian theo đúng thứ tự. Toàn bộ row IDs của seed 42 nằm trong repeat 1 của [frozen_outer_fold_schedule.csv](outputs/phase4b1a/frozen_outer_fold_schedule.csv); fit IDs là phần bù có thứ tự trong Development.

**Fold indices của kết quả lịch sử 1,732275 vẫn chưa khôi phục được.** Không gán indices chẩn đoán mới làm indices lịch sử.

| Fold | Fit rows | Assessment rows | Mean ROI fit | RMSE assessment |
|---|---|---|---|---|
| 1 | 136000 | 34000 | 4,998639044117647 | 1,735902190220626 |
| 2 | 136000 | 34000 | 5,000157132352941 | 1,739641991392783 |
| 3 | 136000 | 34000 | 4,99917 | 1,734795875600354 |
| 4 | 136000 | 34000 | 4,998127205882353 | 1,73491291971426 |
| 5 | 136000 | 34000 | 5,001995147058824 | 1,727116502903214 |

### Tiền xử lý và cách fit

Dummy production được kiểm tra read-only: `strategy='mean'`, constant **4,999906285714286**, bằng trung bình Train 140.000 dòng. Đây là constant của artifact phục vụ dự đoán, không phải constant được dùng cho cả năm fit fold của CV.

Preprocessor trong artifact: categorical → SimpleImputer(most_frequent) → OneHotEncoder(handle_unknown='ignore', sparse_output=False); Duration_days → SimpleImputer(median). Không có target transformer. Với CV đúng, mỗi lần fit phải dùng đối tượng mới và chỉ fit trên fit fold.

Đã chạy cùng indices bằng bốn cách: công thức fsum độc lập, Dummy trực tiếp, `cross_validate(scoring='neg_root_mean_squared_error')`, và pipeline có bản clone riêng của preprocessor cùng Dummy research mới. Không fit pipeline production. Mean RMSE của ba cách sklearn/pipeline **bằng nhau đến độ chính xác đã lưu**; khác biệt lớn nhất từng fold giữa pipeline và Dummy trực tiếp là **0**. Vì Dummy mean bỏ qua X, imputation/OHE chỉ trên X không giải thích được chênh khi các hàng/target/weights giữ nguyên.

## 4. Trung bình RMSE và RMSE gộp

Hai phép tổng hợp khác nhau:

```text
R_k = sqrt(SSE_k / n_k)
mean_fold_RMSE = (R_1 + ... + R_5) / 5
pooled_OOF_RMSE = sqrt((SSE_1 + ... + SSE_5) / (n_1 + ... + n_5))
```

Trong lần này, n_k bằng nhau nên pooled OOF cũng bằng `sqrt(mean(MSE_k))`, không bằng `mean(sqrt(MSE_k))` nói chung. [Định nghĩa RMSE — sklearn 1.6](https://scikit-learn.org/1.6/modules/generated/sklearn.metrics.root_mean_squared_error.html).

| Đại lượng | Giá trị |
|---|---|
| RMSE lịch sử giữ nguyên | 1,732275 |
| Mean RMSE năm fold hiện tại | 1,734473895966247 |
| Pooled OOF RMSE hiện tại | 1,734478691470258 |
| sqrt(weighted mean fold MSE) | 1,734478691470258 |
| Pooled − mean-fold | 4,795504011223528e-06 |
| Mean-fold hiện tại − lịch sử | 0,002198895966247116 |

Chênh lệch lịch sử–chẩn đoán lớn khoảng **458,53 lần** chênh do hai cách tổng hợp đo được. Vì vậy **không thể giải thích hai số đang đối soát chỉ bằng mean-fold vs pooled trên các fold đã khôi phục này**. Làm tròn RMSE tổng về sáu chữ số chỉ tạo sai số tối đa khoảng 0,0000005, cũng không đủ giải thích.

Không có RMSE từng fold lịch sử, nên chưa thể tính mean/pooled của **lần chạy lịch sử** hoặc chứng minh họ đã dùng cách nào.

## 5. Kiểm tra tập mẫu, thứ tự và shuffle — danh sách hữu hạn

Các kiểm tra sau được chọn theo các khả năng giao thức đã thấy trong notebook/mã Phase 4B.1, không dò hàng trăm seed/split để tìm số gần 1,732275. Không chọn biến thể có RMSE thấp nhất làm giao thức mới.

| Profile | Số dòng | KFold | Shuffle/seed | Mean RMSE | Khớp lịch sử <=1e-6 |
|---|---|---|---|---|---|
| dev_train_then_validation_shuffle42 | 170000 | 5 | True/42 | 1,734473895966247 | Không |
| dev_sorted_csv_order_shuffle42 | 170000 | 5 | True/42 | 1,73448827073284 | Không |
| dev_train_then_validation_no_shuffle | 170000 | 5 | False/None | 1,734483704665499 | Không |
| dev_sorted_csv_order_no_shuffle | 170000 | 5 | False/None | 1,734476445662169 | Không |
| original_train140k_fivefold_shuffle42 | 140000 | 5 | True/42 | 1,73376981784413 | Không |
| original_train140k_threefold_notebook147 | 140000 | 3 | True/42 | 1,733769252288871 | Không |

Hai dòng Train 140.000 chỉ dùng **tập con nằm hoàn toàn trong Development**, nhằm kiểm tra nhầm lẫn giữa Train và Development. Dòng 3-Fold phát lại thiết lập cell 147 với Dummy đối chứng, **không phải** tuyên bố đã tìm được benchmark Dummy gốc: cell 147 là tuning Decision Tree/Random Forest.

Các biến thể thứ tự/shuffle trên cùng Development đã thử chỉ thay đổi mean RMSE rất nhỏ; không biến thể nào khớp số lịch sử trong dung sai 1e-6. Không thể từ một danh sách hữu hạn loại trừ mọi cách chia fold khác; indices lịch sử vẫn là bằng chứng thiếu. Nguồn gốc tập mẫu hoặc giao thức cũ khác/ghi nhầm vẫn là giả thuyết, chưa là nguyên nhân đã chứng minh.

## 6. Phiên bản thư viện và sai số số học

| Thành phần | Metadata lúc xuất | Đối soát hiện tại |
|---|---|---|
| Python | 3.13.18 | 3.13.17 |
| NumPy | 2.4.6 | 2.4.6 |
| pandas | 2.2.3 | 2.2.3 |
| scikit-learn | 1.6.1 | 1.6.1 |
| joblib | 1.6.0 | 1.6.0 |
| SciPy | Không ghi | 1.18.1 |

Metadata ghi môi trường **xuất artifact**, chưa chứng minh đó cũng là môi trường của benchmark 5-Fold. Bốn thư viện được ghi trong metadata khớp phiên bản hiện tại; Python khác patch 3.13.18/3.13.17, SciPy lúc xuất không được ghi.

Trên **cùng Development và fold**, công thức dùng `math.fsum` độc lập với phép giảm NumPy/sklearn chênh tối đa **2,220446049250313e-16** mỗi fold. Kiểm tra ép tính toán float32 làm chênh tối đa khoảng **1,1919709907992626e-7**; đây chỉ là sensitivity check, không sửa CSV/target gốc.

Các kết quả đo này không ủng hộ giải thích rằng sai số floating-point thông thường gây ra chênh khoảng 0,0022. Không cài đổi phiên bản để tìm số khớp. Chưa chạy lại môi trường Colab lịch sử vì thiếu run/code gốc; do đó không tuyên bố đã kiểm tra mọi khác biệt có thể xảy ra của lịch sử.

Source sklearn đang dùng và hash được lưu trong `installed_sklearn_source_extract.txt`/`audit_results.json`, cùng các công thức và số liệu đầy đủ.

## 7. Date–Campaign_ID được kiểm tra lại

Trên đúng Development gốc:

```text
Date = 2021-01-01 + ((Campaign_ID - 1) mod 365) ngày
Số hàng kiểm tra: 170.000
Khớp chính xác:   170.000
Không khớp:            0
```

Phát hiện Phase 4B.1 được xác nhận. Đây là quy luật quan sát trong Development, không tự chứng minh nguồn gốc tổng hợp hoặc cơ chế nhân quả. Chưa xác nhận Date là planned start date hoặc tồn tại trước chiến dịch. **Date, Month, Weekday và Campaign_ID không được dùng để huấn luyện** trong lần đối soát; giao thức Phase 4B.2 cũng loại các cột này cho đến khi kiểm chứng timing/provenance.

## 8. Bảng PASS/FAIL có bằng chứng

| Mã | Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|---|
| R01 | Đọc và bảo toàn ba báo cáo Phase 4B.1 | PASS | SHA256 ba báo cáo có trong protected_integrity.json |
| R02 | Khôi phục mã và fold indices tạo benchmark lịch sử | FAIL | Chín notebook Marketing và phạm vi tìm script chưa có nguồn 5-Fold; archive chỉ chứa bảy artifact; Drive không có kết quả truy cập được |
| R03 | Khôi phục membership/order Development mới đúng split gốc | PASS | Replay hai bước seed 42 khớp membership Phase 4B.1; không giao Test |
| R04 | Tái lập RMSE mới bằng Dummy/cross_validate/pipeline | PASS | Mean RMSE = 1.7344738959662471; sai số với Phase 4B.1 < 1e-12 |
| R05 | Tái lập RMSE lịch sử 1.732275 | FAIL | Không khớp: chênh 0.002198895966247116; số gốc giữ nguyên |
| R06 | Đối soát mean-fold và pooled OOF | PASS | Gap = 4.795504011223528e-06, không đủ giải thích chênh lịch sử |
| R07 | Kiểm tra ảnh hưởng preprocessing của Dummy | PASS | Clone preprocessor trong research; max chênh fold = 0; không fit production |
| R08 | Đối soát sai số số học | PASS | fsum và float32 sensitivity nhỏ hơn nhiều chênh cần giải thích |
| R09 | Kiểm tra hữu hạn các khả năng mẫu/order/shuffle | PASS | Sáu profile đã ghi trước; không dò seed/split; một-step 85/15 không chấm vì giao Test |
| R10 | Xác định duy nhất nguyên nhân của lần chạy lịch sử | FAIL | Thiếu dataset/row/fold/run provenance, raw scores và scoring code; không suy đoán thành sự thật |
| R11 | Kiểm tra lại Date–Campaign_ID | PASS | 170000/170000 khớp; Date không dùng để fit |
| R12 | Không materialize ROI Test cho nghiên cứu | PASS | skiprows trước DataFrame; không nạp split joblib; lịch folds chỉ có Development |
| R13 | Giữ nguyên production, artifact và lịch sử | PASS | 105 tệp được bảo vệ khớp hash trước/sau và hiện tại |
| R14 | Đóng băng giao thức Development mới và lịch fold | PASS | DM-DEV-170K-v1; ba repeat, mỗi row được assessment đúng một lần/repeat; không có ROI |
| R15 | Giữ Quality Gate BASELINE_ONLY | PASS | Không sửa metadata hoặc bật khuyến nghị |
| R16 | Không thực hiện Phase 4B.2 | PASS | Chỉ Dummy đối soát và tạo lịch indices; không thuật toán nâng cấp/tuning |

**13 PASS, 3 FAIL chưa giải quyết được về provenance/tái lập lịch sử.**

Các FAIL về nguồn gốc và tái lập lịch sử là kết quả thực sự của đối soát, không bị đổi thành PASS chỉ vì script chạy xong. Các PASS về tính toàn vẹn/tái lập số mới không đủ để xác nhận con số lịch sử hoặc nâng Quality Gate.

## 9. Vì sao hai RMSE khác nhau?

**Nguyên nhân chính xác: chưa xác định được từ bằng chứng truy cập được.** Chỉ có thể kết luận một bên là kết quả tính lại trên Development/folds cụ thể đã lưu, còn bên lịch sử thiếu dây chuyền tái lập tương ứng.

| Khả năng | Kết quả đối soát |
|---|---|
| Mean RMSE vs pooled RMSE | Có khác, nhưng chỉ 0,000004796 trên folds hiện tại; không giải thích 0,002198896 |
| Imputer/OHE trên X | Chênh 0 khi cùng folds/target/weights; không giải thích trong kiểm tra này |
| Thứ tự Development và shuffle | Các biến thể hữu hạn đã thử không khớp lịch sử; chưa biết indices gốc |
| Nhầm Train 140k với Development 170k | Hai đối chứng 140k không khớp số lịch sử |
| Bản CSV local khác nhau | Các bản ZIP tìm được khớp cùng hash; không thấy khác biệt local để giải thích |
| Dataset/membership của lần CV lịch sử khác | Có thể, nhưng thiếu hash/row manifest lịch sử để kiểm chứng; không được mở Test để dò |
| Scoring/weighting/target transform/strategy khác | Chưa có mã gốc để xác định; benchmark hiện tại khóa mean/unweighted/raw target |
| Sai số float/khác phiên bản thông thường | Sai số đo được rất nhỏ; metadata core versions khớp; không có bằng chứng đủ lớn |
| Sao chép/làm tròn/ghi nhãn kết quả | Luồng copy vào frontend có bằng chứng, nhưng chưa có log tính gốc; không đủ để kết luận số lịch sử bị tạo sai |

Bằng chứng cần xin lại từ người thực hiện benchmark: notebook/script sinh `model_metrics.json`, hash và row IDs Development, order trước KFold, shuffle/seed và indices từng fold, weights/target transform, fitted strategy/constant từng fold, raw SSE/n/RMSE, cách aggregate, versions và timestamp/run ID. Chỉ có `n_splits=5`, `random_state=42`, `development_samples=170000` trong metadata là chưa đủ.

### Ảnh hưởng đến kết luận nghiên cứu

- Độ tin cậy của **giá trị tuyệt đối và tuyên bố fold cụ thể trong benchmark lịch sử** chưa được xác nhận lại. Không dùng bảng đó làm bằng chứng độc lập đủ cho nâng cấp.
- Kết luận thận trọng “chưa đủ bằng chứng khuyến nghị tối ưu” vẫn được giữ: các phân tích Development mới cũng không cho thấy cải thiện ổn định; không phát hiện lý do nâng gate.
- Kiểm tra API/reference ở Phase 1–3 xác nhận tính nhất quán suy luận của artifact, **không tái lập cross-validation**. Hai loại PASS này không thay thế nhau.
- Không kết luận toán học rằng dữ liệu hoàn toàn không có tín hiệu, hoặc mô hình mới chắc chắn thất bại. Việc nghiên cứu tiếp theo cần giao thức thống nhất và bằng chứng độc lập.

## 10. Giao thức thống nhất cho Phase 4B.2

Đã ghi [phase4b2_evaluation_protocol.json](outputs/phase4b1a/phase4b2_evaluation_protocol.json), ID **DM-DEV-170K-v1**, trạng thái **đóng băng để rà soát; chưa thực hiện Phase 4B.2**.

1. **Dữ liệu:** cùng CSV hash và cùng membership Train140k + Validation30k; giữ order Train rồi Validation. Test30k không đổi, không nạp hoặc chấm trong Phase 4B.2.
2. **Outer evaluation:** 3 lần 5-Fold, shuffle=True, seed khóa trước **42, 2026, 20261103**. Đã tạo lịch indices độc lập với y; mọi mô hình phải dùng cùng lịch. Repeat 1 khớp chẩn đoán Phase 4B.1.
3. **Inner selection nếu tuning:** 3-Fold chỉ trên outer-fit; seed `100000*repeat_1based + 1000*outer_fold_1based + 17`; tiền xử lý và chọn feature bên trong inner-fit. Không dùng outer assessment cho early stopping/tuning.
4. **Baseline:** DummyRegressor(mean), fit riêng mỗi fit fold, không sample weights/target transform. Mỗi lần đánh giá candidate so với Dummy trên **cùng assessment rows**.
5. **Metric:** primary = mean RMSE chưa làm tròn của năm outer folds; primary toàn thử nghiệm = mean của ba repeat means. Pooled OOF RMSE, MAE, R², paired delta và fold SD được lưu riêng; SD là mô tả, không coi các fold chồng lấn là độc lập để dựng CI.
6. **Feature:** benchmark current5 dùng năm feature gốc; Duration chỉ được diễn giải trước chiến dịch khi xác nhận planned/actual. Không Date/Month/Weekday/ID hoặc chỉ số sau triển khai. Feature bổ sung cần đăng ký data contract/ablation trước khi chạy, không tự thêm theo kết quả đối soát.
7. **Tái lập:** lưu dataset/split/fold/code/environment hash, thông số toàn bộ trial, prediction OOF và metric chưa làm tròn vào thư mục run research mới. Không chọn seed/protocol để khớp lịch sử hoặc để model thắng.
8. **Ranh giới:** chỉ chuẩn bị protocol và lịch index trong Phase 4B.1A. Không fit thuật toán mới của Phase 4B.2, không tối ưu, không thay production hoặc Quality Gate. Quyết định nghiệp vụ sau này cần bằng chứng độc lập và xử lý hạn chế EDA lịch sử.

Lịch frozen chứa 510.000 dòng (170.000 ×3 repeat); mỗi repeat đánh giá mỗi Development row đúng một lần; mỗi assessment fold 34.000 dòng. SHA256 lịch và order membership có trong JSON protocol. Không chứa ROI.

## 11. Blocker ảnh hưởng tính khách quan

1. **Benchmark lịch sử thiếu provenance:** chưa thể khẳng định đã tái lập 1,732275 hoặc 0/5 fold của lần chạy cũ. Giữ nguyên số trong archive/metadata, ghi tình trạng chưa tái lập ở báo cáo này.
2. **EDA và output lịch sử:** notebook chứa EDA toàn bộ trước split; execution_count thiếu ở một số cell. Không thể bảo đảm Test gốc chưa từng ảnh hưởng gián tiếp tới nghiên cứu trước đây.
3. **Data contract:** ROI, planned/actual Duration/Cost/Date và timestamp chưa đủ rõ cho ứng dụng trước chiến dịch.
4. **Dữ liệu độc lập thực tế:** nguồn gốc và Date theo khuôn chưa được xác minh; lịch split thống nhất chỉ giải quyết tái lập, không tự giải quyết external validity hoặc causality.
5. **Multiple testing/model selection:** mọi trial/seed phải đăng ký và ghi đầy đủ; không dùng kết quả audit như một vòng tuning ngầm. Sau Phase 4B.2 vẫn chưa tự động đủ điều kiện khuyến nghị.

Thiếu mã lịch sử không ngăn chạy một benchmark **mới, được ghi nhãn riêng** trên Development khi người dùng cho phép; nó ngăn gọi benchmark mới là tái lập bảng cũ. Không sử dụng 1,732275 làm ngưỡng baseline tuyệt đối cho run mới: dùng Dummy fit cùng fold.

## 12. Tệp tạo và lệnh tái lập

- Báo cáo này: `research/phase4b1a_reproducibility_audit.md`.
- Script: `research/scripts/audit_phase4b1a.py`, `render_phase4b1a.py`, `check_phase4b1a.py`.
- Template báo cáo mới và output tại `research/templates/phase4b1a_reproducibility_audit.md.in`, `research/outputs/phase4b1a/`.
- Không sửa ba báo cáo trước, Frontend, Backend production, bảy artifact hoặc kết quả lịch sử. Snapshot toàn vẹn bảo vệ **105 tệp**, trước/sau giống nhau.

```powershell
& .\backend\.venv\Scripts\python.exe -X utf8 research/scripts/audit_phase4b1a.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/scripts/check_phase4b1a.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/scripts/render_phase4b1a.py
```

Script audit kết thúc 0 khi hoàn tất đối soát; trong JSON và báo cáo vẫn ghi riêng **FAIL_NOT_REPRODUCED_MISSING_PROVENANCE** cho tái lập lịch sử. Không sửa số để làm PASS. **Dừng sau Phase 4B.1A.**
