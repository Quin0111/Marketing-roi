# Phase 4B.4 — Bổ sung tiêu chí nghiệm thu và quyết định sẵn sàng

Ngày: **03/11/2026**. Văn bản này ghi nhận yêu cầu bổ sung của người dùng và đánh giá readiness dựa trên bằng chứng hiện có. Không thay thế một đặc tả Phase 4B.4 khác nếu được cung cấp sau này; không tuyên bố đã hoàn tất ingestion audit hoặc thực nghiệm. **Không huấn luyện, không tải/nạp dataset, không chấm Test, không thay website. Quality Gate = BASELINE_ONLY.**

**Trạng thái thực nghiệm: BLOCKED. Quyết định hiện tại cho Phase 4B.5: NO-GO.** Có phương án đồ án khả thi về phạm vi, nhưng thiếu bằng chứng về đúng file, sampling, thời điểm feature và giao thức đánh giá để cho phép chạy thực nghiệm. NO-GO này có thể được xem xét lại khi đủ điều kiện ở mục 5; không phải kết luận uplift không khả thi.

## 1. Các yêu cầu nghiệm thu bắt buộc

| Yêu cầu bổ sung | Cách áp dụng |
|---|---|
| Không training trong Phase 4B.4 | Không fit, tuning, calibration có học tham số hoặc đánh giá thử để lựa chọn; không chạy lại pipeline cũ |
| Chỉ dùng nguồn có điều kiện sử dụng được xác minh | Tách xác minh trang nguồn/license khỏi xác minh đúng bản raw file; chưa qua cả hai thì không ingest cho thực nghiệm |
| Không giả định ROI | Conversion/visit/revenue không được đổi tên thành ROI; không tự đặt chi phí bằng 0 hoặc suy revenue từ ROI cũ |
| Phạm vi đồ án đại học | Chọn một outcome và binary treatment, ít baseline, dữ liệu giới hạn có protocol riêng; không xây multi-channel optimizer |
| Phân biệt ba bài toán | Dùng estimand và tiêu chí đánh giá riêng trong mục 2 |
| Thiếu điều kiện phải BLOCKED | Các mục thiếu bằng chứng không được ghi PASS hoặc ngầm giả định đúng |
| Chốt quyết định Phase 4B.5 | NO-GO hiện tại; không tự bắt đầu giai đoạn sau |
| Bảo vệ sản phẩm | Giữ Frontend/Backend, bảy artifact, lịch sử và BASELINE_ONLY; không Git/commit/push |

## 2. Ba bài toán không thay thế nhau

| Bài toán | Câu hỏi/đích ước lượng | Dữ liệu và kiểm chứng cần có | Không được suy ra |
|---|---|---|---|
| Dự đoán ROI trước chiến dịch | Ước lượng ROI của chiến dịch từ input có trước chạy; thường là kỳ vọng có điều kiện dưới cơ chế dữ liệu quan sát | Công thức ROI, currency/ratio/%, cost/revenue/window kiểm toán được; as-of features; baseline và holdout độc lập đúng đơn vị | Dự đoán chính xác không chứng minh đổi kênh làm ROI tăng |
| Ước lượng uplift | `tau(x)=E[Y(1)-Y(0)|X=x]`, ví dụ xác suất conversion tăng thêm do assignment quảng cáo | Treatment/control và context trước treatment; randomization hoặc giả định nhận diện đủ; sampling/overlap; metric effect/uplift phù hợp | Uplift conversion không phải uplift ROI; effect cá thể không quan sát trực tiếp đủ cả hai potential outcomes |
| Đánh giá policy lựa chọn | `V(pi)-V(pi0)`: lợi ích của quy tắc chọn action so với policy đối chứng | Policy cố định, utility rõ, holdout ngoài selection; assignment probabilities hợp lệ/overlap cho OPE hoặc RCT policy độc lập | Xếp hạng điểm dự đoán, AUUC hoặc một fold thắng không tự chứng minh policy đem lợi nhuận |

Response prediction `P(conversion|X)` còn khác uplift: người dễ mua có thể vẫn mua dù không quảng cáo. Với dữ liệu thiếu chi phí, policy value chỉ có thể được diễn giải theo outcome đã có, ví dụ conversions, không thành profit/ROI. Phân biệt này thống nhất với [kế hoạch Phase 4B.3](../phase4b3/recommended_research_plan.md).

## 3. Nguồn dữ liệu được xét và giới hạn xác minh

Đã mở lại tài liệu sơ cấp ngày 03/11/2026; đây là kiểm tra **tài liệu**, không dùng raw dataset.

**Criteo:** [publisher page](https://ailab.criteo.com/criteo-uplift-prediction-dataset/) công bố CC BY-NC-SA 4.0, các trường treatment/visit/conversion/exposure, feature ẩn danh và bản sửa lỗi leakage. Có mô tả nonuniform subsampling. Có thể cân nhắc cho nghiên cứu phi thương mại với attribution và các nghĩa vụ áp dụng; không coi giấy phép đó là quyền triển khai thương mại. Chưa khóa raw release/hash, chưa kiểm tra file/schema, feature timing hoặc sampling/assignment phù hợp OPE. **Không có cơ sở gán target ROI từ các trường được mô tả.**

**Hillstrom:** [thông báo của tác giả](https://blog.minethatdata.com/2008/03/minethatdata-e-mail-analytics-and-data.html) mô tả random email arms, outcomes trong hai tuần và customer spend. Spend này là tiền mua hàng, không phải marketing cost. Chưa tìm thấy điều kiện tái sử dụng rõ trong nguồn đã kiểm tra; không tự gán license từ mirror. **Không chọn để sử dụng thực nghiệm trước khi rõ quyền; không suy ROI khi thiếu cost/margin.** Không liên hệ tác giả hoặc gửi email trong giai đoạn này.

Chỉ Criteo được chọn làm **ứng viên chuẩn bị thẩm định**, không phải dataset đã được chấp thuận chạy. Hillstrom giữ làm phương án dự phòng có blocker quyền sử dụng. Không dùng dữ liệu mock/mô phỏng thay bằng chứng kinh doanh, không gộp nguồn với CSV cũ. Registry khảo sát rộng hơn: [source_evidence.json](../phase4b3/source_evidence.json).

## 4. Phương án vừa phạm vi đồ án

Đề xuất tên nhánh độc lập: **“Đánh giá uplift conversion của can thiệp quảng cáo trên benchmark công khai”**. Đây là hướng phương pháp, không thay tên hoặc target của website hiện tại.

- Một nguồn corrected Criteo đã vượt audit; một action binary theo assignment và một outcome chính `conversion`. Không dùng `exposure`, `visit` hoặc outcome làm context trước treatment; không chọn chỉ nhóm đã exposed.
- Một sample xác suất độc lập với outcomes, có seed/membership/hash đăng ký trước nếu cần giới hạn tài nguyên. Có thể đề xuất cap 200.000 quan sát ban đầu cho đồ án; **chưa lấy mẫu**, cap không phải chứng minh đủ power. Nếu events/control hoặc independent units không đủ, báo thiếu power, không cherry-pick mẫu có kết quả đẹp.
- Giới hạn tương lai tối đa hai baseline đơn giản: treatment effect trung bình và một phương pháp uplift regularized; không search dàn trải. Số cấu hình, CPU budget và split phải khóa trước training. Phase hiện tại không chạy baseline nào.
- Deliverables tương lai gói gọn: dataset card/quyền sử dụng, fixed split/protocol, bảng metric đầy đủ, effect uncertainty và báo cáo giới hạn. Policy evaluation chỉ thêm khi sampling/propensity/identification đã được bảo vệ; nếu không thì ghi BLOCKED riêng, không tự biến response metric thành policy metric.
- Ước lượng công việc: 2–3 tuần cho một sinh viên sau khi có dữ liệu và quyền phù hợp: khoảng một tuần audit/protocol, một tuần thực nghiệm có giới hạn, phần còn lại kiểm tra/báo cáo. Đây là kế hoạch nguồn lực, không cam kết kết quả tốt hoặc thời gian có đủ bằng chứng sampling.

Chưa hứa cải thiện, chưa đưa số hiệu năng mới. Giữ DM-DEV-170K-v1 và Test 30.000 cũ tách biệt. Không cần xây API hoặc UI mới để hoàn thành đồ án phương pháp này.

## 5. Bằng chứng còn thiếu và điều kiện xét lại Phase 4B.5

| Mã | Hiện trạng | Bằng chứng cần bổ sung trước thực nghiệm |
|---|---|---|
| B1 File/release | BLOCKED | Nguồn download chính thức cho corrected release, file version/header/count/hash và license/notices áp dụng cho đúng file |
| B2 Timing/context | BLOCKED | Data dictionary hoặc tài liệu tác giả xác nhận feature thuộc trước assignment; giải quyết khác biệt mô tả số feature với schema thực |
| B3 Sampling/identification | BLOCKED | Mô tả đủ về subsampling và randomization của bản phát hành; cách xác định estimand, propensity hoặc weighting đúng quần thể; không lấy treatment ratio chung làm xác suất theo mọi context |
| B4 Protocol độc lập | BLOCKED | Định nghĩa đơn vị, sampling/split/hash/seed, treatment/outcome, leakage exclusions, toàn bộ baseline/trials và ngân sách trước khi fit |
| B5 Cỡ mẫu và uncertainty | BLOCKED | Counts theo arm/event, dependence, MDE hoặc precision goal, power và phương pháp CI; protocol quy định cách kiểm tra khả thi mà không tuning theo holdout |
| B6 Policy claim | BLOCKED | Utility, no-action/incumbent, support/overlap và phương pháp heldout OPE đúng giả định hoặc thử nghiệm policy; nếu thiếu, loại claim policy khỏi scope thay vì tuyên bố đã chứng minh |
| B7 ROI/triển khai | BLOCKED | Revenue/cost/margin/window có thể kiểm toán và dữ liệu độc lập ở population đích; không phải điều kiện bắt buộc để học conversion uplift, nhưng bắt buộc nếu muốn tuyên bố ROI/tối ưu thực tế |

Có thể xem xét **CONDITIONAL GO** cho một Phase 4B.5 **đã thu hẹp sang benchmark uplift conversion** khi B1–B5 đạt, B6 được đáp ứng hoặc bỏ rõ claim policy, và B7 được ghi ngoài phạm vi. Không coi việc hứa bổ sung sau là điều kiện đã đạt. GO cho tối ưu ROI thực tế đòi hỏi B7 cùng kiểm chứng causal/policy và release review riêng. Không tự nâng gate khi bất kỳ phương án phương pháp nào đạt.

## 6. Bảo vệ và nghiệm thu yêu cầu bổ sung

Snapshot [protected_before.json](protected_before.json) và [verification_results.json](verification_results.json) đối chiếu các tệp ứng dụng/artifact/nghiên cứu trước. Không nạp CSV, NPZ outcomes, split joblib hoặc pipeline; không truy cập giá trị ROI Test. Việc đọc metadata/license và tạo biên bản này không là một thực nghiệm.

PASS về bảo toàn hoặc ghi đủ yêu cầu không làm các B1–B7 trở thành PASS. Các FAIL lịch sử giữ nguyên. Không gọi Phase 4B.4 đã hoàn thành ingestion audit khi chưa có file audit. Phần này là bổ sung nghiệm thu và quyết định readiness, không mở Phase 4B.5.

**Quyết định cuối: NO-GO cho Phase 4B.5 ở thời điểm này; thực nghiệm BLOCKED do B1–B5 chưa được xác minh. Website giữ nguyên, Quality Gate = BASELINE_ONLY.**
