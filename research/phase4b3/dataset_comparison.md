# PHASE 4B.3 — So sánh nguồn dữ liệu ứng viên

Ngày kiểm tra: **03/11/2026**. **Sáu ứng viên**, gồm bốn nguồn quan sát/thí nghiệm và hai nguồn mô phỏng. Đánh giá dựa trên tài liệu sơ cấp đã mở; không tải/đếm raw data, không query dữ liệu trả phí, không huấn luyện. Mọi kết quả hiệu năng trên ứng viên đều **NOT_RUN**. Quyền sử dụng chưa rõ được giữ là blocker, không suy từ giấy phép code/mirror.

## 1. Nội dung và giấy phép đã kiểm tra

| ID | Nguồn sơ cấp, phạm vi được công bố | Target, thời gian và đơn vị | Bằng chứng quyền sử dụng | Phân loại |
|---|---|---|---|---|
| C1 | [Criteo AI Lab](https://ailab.criteo.com/criteo-uplift-prediction-dataset/), corrected release 13.979.592 user records; source khai báo f0–f11, treatment, visit, conversion, exposure | Visit/conversion nhị phân; không có revenue/cost/horizon rõ trong field list | Cùng trang có **CC BY-NC-SA 4.0**; giới hạn noncommercial và nghĩa vụ attribution/share-alike khi áp dụng | Ưu tiên benchmark uplift có điều kiện |
| C2 | [Hillstrom / MineThatData, tác giả gốc](https://blog.minethatdata.com/2008/03/minethatdata-e-mail-analytics-and-data.html), 64.000 khách; random ba arm Mens/Womens/No E-Mail | Visit, conversion, tiền khách chi trong hai tuần; history/recency và thuộc tính mua trước đó | Lời mời challenge công khai; **chưa tìm thấy license tái sử dụng chuẩn trong thông báo đã kiểm tra** | Hứa hẹn cho email; chặn ingestion đến khi rõ quyền |
| C3 | [UCI Bank Marketing](https://archive.ics.uci.edu/dataset/222/bank+marketing), bản full cũ 45.211; additional-full 41.188, có thứ tự thời gian | `y`: đăng ký tiền gửi; thời gian contact, nhân khẩu, lịch sử | Trang dataset công bố **CC BY 4.0** | Dự đoán phản hồi; không phải ROI |
| C4 | [Google GA4 ecommerce sample](https://developers.google.com/analytics/bigquery/web-ecommerce-demo-dataset), 3 tháng 01/11/2020–31/01/2021; dữ liệu event được obfuscate | Event/purchase; exact count và completeness chưa query | **Chưa xác lập license riêng của raw dataset**; public BigQuery không tự đồng nghĩa unrestricted reuse | Học data pipeline/attribution có điều kiện |
| C5 | [Meta Robyn source](https://raw.githubusercontent.com/facebookexperimental/Robyn/main/R/R/data.R), `dt_simulated_weekly`, **simulated**; DATE, revenue, tv_S/ooh_S | Revenue và media series mô phỏng; chưa đếm rows hoặc xác minh cadence từ file | [Repository MIT](https://raw.githubusercontent.com/facebookexperimental/Robyn/main/LICENSE); cần pin file/notices trước ingestion | Demo phương pháp, không bằng chứng thực tế |
| C6 | [Google Meridian demo](https://developers.google.com/meridian/notebook/meridian-getting-started), **simulated** geo/time, conversions, revenue_per_conversion, spend/impressions 5 kênh | KPI và giá trị mỗi conversion mô phỏng; chưa đếm rows | [Repository Apache-2.0](https://raw.githubusercontent.com/google/meridian/main/LICENSE); cần kiểm tra notices của file cụ thể | Demo phương pháp, không bằng chứng thực tế |

Nguồn/version và quyền áp dụng cho **đúng file** phải được khóa trước khi dùng. Không coi MIT/Apache của framework là giấy phép cho dữ liệu bên ngoài. GA4 documentation/code license cũng không được tự gán cho dữ liệu BigQuery. Registry bằng chứng: [source_evidence.json](source_evidence.json).

## 2. Độ phủ theo nhu cầu DreamMakers

“Không” dưới đây nghĩa là tài liệu/schema đã xem không cung cấp trường tương ứng, không phải khẳng định mọi dữ liệu nội bộ của bên phát hành đều thiếu. “Chưa rõ” nghĩa là cần kiểm tra thêm, không xem là có.

| Nguồn | Kênh/action | Audience trước action | Planned budget/cost | Thời gian | Outcome tiền thực | Tính ROI/ROAS hợp lệ ngay? |
|---|---|---|---|---|---|---|
| C1 | Treatment/control; không phải tên 6 kênh website | Feature ẩn danh; timing chi tiết cần kiểm tra | Không | Timestamp/horizon không rõ | Không | Không |
| C2 | Hai email và không gửi; `channel` là lịch sử mua | Có thuộc tính lịch sử | Không | Horizon hai tuần; không có chuỗi campaign đa mùa đã xác minh | Có customer spend | Không: thiếu ad cost/margin |
| C3 | Phone contact type; không có no-contact randomized arm | Có covariates; phải kiểm tra cutoff | Không | Contact/day/month, bản additional có ordering | Không; balance không phải revenue | Không |
| C4 | Traffic-source/event attribution; không phải assignment | Snapshot trước cutoff cần dựng | Chưa có trong sample documentation | Event dates trong 3 tháng | Giá trị ecommerce bị obfuscate, cần audit | Không: chưa xác minh đủ spend và attribution |
| C5 | Media series mô phỏng | Không có audience user-level đã xác minh | Spend series, không chứng minh planned budget | Time series mô phỏng | Không có outcome kinh doanh thật | Chỉ tỷ số mô phỏng; không xác nhận incrementality |
| C6 | Năm kênh mô phỏng | Geo/population; không phải segments website | Spend mô phỏng | Geo/time | Không có outcome kinh doanh thật | Chỉ trong thế giới mô phỏng đã định nghĩa |

Không dataset nào ở đây đáp ứng đầy đủ danh sách kênh, audience, planned budget, thời gian, actual revenue và cost có thể kiểm toán **đồng thời**. Không nối các file không cùng đối tượng/campaign bằng tên kênh để “bổ sung” cột thiếu; đó không phải dữ liệu kết hợp hợp lệ.

## 3. Khả năng sử dụng và rủi ro của từng ứng viên

### C1 — Criteo corrected uplift

**Bằng chứng:** bản đầu có advertiser-related leakage, publisher đã công bố bản sửa; không dùng bản 25 triệu dòng thay thế chỉ vì lớn hơn. [Bài báo của nhóm tác giả](https://arxiv.org/abs/2111.10106) mô tả benchmark từ randomized trials. Có nonuniform subsampling/ẩn danh; tỷ lệ treatment công bố không mặc nhiên là propensity hợp lệ tại mọi context. Prose nói 11 features trong khi Fields liệt kê 12: phải xác minh header đúng release.

**Đánh giá của DreamMakers:** có thể nghiên cứu response/uplift với feature trước assignment được xác minh; loại `exposure`, `visit`, `conversion` khỏi context. Treatment là action, không phải biến nền để xếp hạng người mua. Cỡ mẫu công bố hứa hẹn nhưng hiệu quả phụ thuộc số conversion/control, sampling và dependence; chưa power-test. Dùng ITT theo assignment, không lọc exposed rồi coi như randomized. Chưa cho chọn kênh, budget, duration hoặc profit. Hợp đồ án nếu thu hẹp sang binary uplift phi thương mại và thẩm định license/sampling trước ingestion; external validity cần thử nghiệm first-party mới.

### C2 — Hillstrom

**Đánh giá của DreamMakers:** có thể dự đoán two-week response/revenue và kiểm tra policy chọn email trong ba arm, sau khi vượt gate quyền sử dụng. `visit`, `conversion`, `spend` là outcomes, không làm X; `segment` là action. Không diễn giải `channel` thành kênh được randomized. Với cỡ mẫu công bố, có thể tách tập độc lập theo khách hàng; chưa biết số event đủ cho uplift nhỏ hoặc subgroup. Cần power/variance audit, không bảo đảm chỉ từ n=64.000.

RCT giúp đánh giá lựa chọn trong miền email đã thử; không chứng minh hiệu quả Google Ads/Facebook. Thiếu marketing cost/margin nên chỉ báo incremental customer revenue/conversion, chưa ROI/profit. Đồ án có thể giải thích được nhưng dữ liệu cũ, một bối cảnh; cần replication mới cho triển khai. Public challenge invitation không được ghi thành CC license; không dùng quyền của mirror để thay quyền tác giả.

### C3 — UCI Bank Marketing

**Đánh giá của DreamMakers:** phù hợp benchmark xác suất đăng ký trước contact, khi loại last-call `duration`; `campaign` includes current contact cũng cần cutoff. Không nhầm duration tính **giây cuộc gọi** với Duration_days của website. `poutcome` là kết quả campaign trước, chỉ được dùng nếu có sẵn khi quyết định mới. Dữ liệu có thể tách theo thứ tự thời gian; chưa có customer IDs để xác nhận loại phụ thuộc/repeated contacts đầy đủ. Không dùng file 10% như dữ liệu độc lập bổ sung vào full file.

Target và license rõ nhưng không có outcome tiền, ngân sách hoặc cơ chế random/no-contact để đánh giá policy. Contact type tương quan với y không chứng minh đổi contact type làm y tăng. Cần randomized outreach hoặc identification assumptions/logs bổ sung. Hợp fallback cho phần **prediction**, không đáp ứng mục tiêu tối ưu ROI.

### C4 — GA4 obfuscated ecommerce

**Bằng chứng:** [schema chính thức](https://support.google.com/analytics/answer/7029846?hl=en) mô tả event timestamp, ecommerce và traffic structures; schema hiện tại không chứng minh mọi field đều được điền trong sample lịch sử. [BigQuery public-data docs](https://docs.cloud.google.com/bigquery/public-data) mô tả truy cập và metadata riêng từng dataset; phiên này không tạo Cloud project hoặc thực hiện query.

**Đánh giá của DreamMakers:** chỉ dự đoán tương lai nếu dựng lịch sử user/session as-of; purchase/revenue của horizon, session summaries sau cutoff và attribution sau conversion gây leakage. Chưa kiểm đếm độc lập users/events, chỉ ba tháng và internal consistency hạn chế do obfuscation: chưa kết luận đủ kiểm chứng hoặc seasonality. Traffic attribution không có randomized assignment, spend cũng chưa được xác minh. Cần rights metadata, ad-account join hợp lệ, costs, entity/time split và thí nghiệm; không chọn làm nhánh ROI/optimization chính.

### C5 — Robyn simulated demo

**Đánh giá của DreamMakers:** phù hợp kiểm thử parsing/time split/response curves hoặc bài giảng MMM, không chứng minh dự báo hoặc lựa chọn thực tế. Cần kiểm tra file: tên object weekly nhưng mô tả revenue dùng daily; không tự suy cadence, rows hay currency. Realized spend có thể là historical action, không phải planned input đã biết; future actual media/outcomes gây leakage khi forecast.

Có thể tạo holdout trong mô phỏng nhưng không tạo external validity. Không mặc định demo có toàn bộ DGP/counterfactual ground truth để tính policy regret; phải kiểm tra generator nếu muốn đánh giá đó. Ratio revenue/spend không tự là incremental ROAS. Không ưu tiên thêm nhánh mô hình ở Phase này; chỉ minh họa nếu được giao riêng sau này.

### C6 — Meridian simulated geo data

**Đánh giá của DreamMakers:** có thể thử pipeline MMM và scenario planning có nhãn simulation; chưa biết raw counts/time coverage từ file nên chưa kết luận đủ độc lập. Conversions và revenue_per_conversion là outcome/valuation, không phải context trước chiến dịch; future realized impressions/control có thể chưa biết và cần forecast riêng. Có dữ liệu mô phỏng để tính revenue tương ứng, không có margin/cost đầy đủ cho net profit thật.

Không đồng nhất mô hình dự báo tốt với nhận diện causal response. Ngay cả thử nghiệm thật để calibration còn khác window/population/counterfactual, theo [hướng dẫn calibration](https://developers.google.com/meridian/docs/advanced-modeling/roi-priors-and-calibration). Dataset này không cấp bằng chứng chọn chiến dịch thực. MMM thực tế chỉ cân nhắc khi có lịch sử spend/outcome/control và experiments phù hợp; không đưa MMM vào production vì demo có chức năng allocation.

## 4. Kiểm chứng và quyết định chung

| Ứng viên | Dữ liệu để đánh giá lựa chọn? | Cần bổ sung | Phù hợp đồ án / quyết định |
|---|---|---|---|
| C1 | Binary treatment/control có tiềm năng | Xác minh sampling/propensity, timing, rights, heldout; revenue/cost mới nếu cần kinh tế | **SHORTLIST_METHOD**, chưa ACCEPTED_FOR_INGESTION |
| C2 | Ba email arms có tiềm năng | License rõ, power/heldout; cost/margin và replication | **SHORTLIST_CONDITIONAL_RIGHTS** |
| C3 | Chưa có causal assignment | Randomized outreach hoặc giả định nhận diện đủ mạnh, outcome tiền | **PREDICTION_ONLY** |
| C4 | Chưa có policy log/đối chứng | License dataset, ad costs/join, action logging, experiments | **NOT_PRIMARY_SOURCE** |
| C5 | Chỉ môi trường mô phỏng | DGP/counterfactual nếu chấm regret; dữ liệu thật để ngoại suy | **SIMULATION_ONLY** |
| C6 | Chỉ môi trường mô phỏng | Như C5; real geo experiments nếu theo MMM | **SIMULATION_ONLY** |

Không có ứng viên **READY_FOR_REAL_OPTIMIZATION**. Kết quả này không loại trừ nghiên cứu có phạm vi nhỏ hơn. **Thứ tự đề nghị:** thẩm định C1 trước cho causal-method benchmark; C2 khi có quyền rõ; C3 nếu mục tiêu chỉ là minh họa dự đoán. Trong mọi trường hợp giữ nghiên cứu cũ, target/schema và test riêng. Kế hoạch cụ thể: [recommended_research_plan.md](recommended_research_plan.md).

## 5. Phạm vi tìm kiếm và thông tin chưa kiểm chứng

Đã tìm theo nguồn marketing public, uplift randomized, email challenge, response prediction, ecommerce và MMM demo; dùng publisher/tác giả/UCI/Google/Meta làm bằng chứng, không dùng kết luận của portfolio GitHub làm provenance. Không phải systematic review đầy đủ toàn bộ public datasets. Nguồn giấy phép chưa rõ bị chặn trước ingestion; nguồn mô phỏng được giữ để phân biệt tác dụng, không dùng như bằng chứng thực.

Chưa kiểm tra raw-file checksum/schema/count, unique IDs, duplicates, missingness, license tại file version cụ thể, horizon đầy đủ của C1, assignment probabilities theo strata, mức phụ thuộc và power. Chưa thực hiện hợp đồng truy cập BigQuery hoặc tải file Hillstrom. Những mục này là **PENDING**, không ghi PASS. Dataset gốc local không được đọc lại và không gộp với ứng viên. Quality Gate giữ **BASELINE_ONLY**; không bắt đầu training.
