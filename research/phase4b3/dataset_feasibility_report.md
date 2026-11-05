# PHASE 4B.3 — Khả thi dữ liệu và khuyến nghị Marketing

Ngày rà soát: **03/11/2026**, Asia/Bangkok. Phạm vi: nghiên cứu tài liệu và đối chiếu bằng chứng đã lưu; **không huấn luyện, không nạp CSV gốc hoặc ROI Test cuối, không thay website**. Quality Gate giữ **BASELINE_ONLY**.

**Kết luận:** dataset hiện tại phù hợp làm hồ sơ thực nghiệm và demo suy luận, chưa phù hợp để chứng minh phương án Marketing tối ưu. Trong sáu nguồn ứng viên đã khảo sát, có nguồn đáng nghiên cứu cho dự đoán hoặc lựa chọn treatment hẹp, nhưng **chưa xác minh được nguồn nào đủ cho tối ưu đa kênh có lợi nhuận thực tế theo phạm vi DreamMakers**. Đây là kết luận trong phạm vi khảo sát, không phải khẳng định không có dữ liệu phù hợp ở mọi nơi.

## 1. Bằng chứng đã đối chiếu và giới hạn công việc

Đã đọc [data audit](../phase4b1_data_audit.md), [feature assessment](../phase4b1_feature_assessment.md), [recommendations](../phase4b1_recommendations.md), [reproducibility audit](../phase4b1a_reproducibility_audit.md), [thực nghiệm Phase 4B.2](../phase4b2/model_experiment_report.md), cùng metadata/metrics production và bảng tổng hợp số mới. Không chạy lại notebook, pipeline hoặc script thực nghiệm cũ.

Tài liệu web sơ cấp được đọc trong phiên này; danh mục, ngày truy cập và phạm vi xác minh nằm ở [source_evidence.json](source_evidence.json). Các con số dataset ứng viên là **số do bên phát hành công bố**, chưa phải kết quả kiểm đếm file tải về. Không cài package, không query BigQuery, không tải dữ liệu để fit hoặc gộp vào dữ liệu cũ. Các URL nhánh `main` có thể thay đổi; ingestion tương lai phải chốt commit/version, tải và hash riêng.

## 2. Tín hiệu dự báo đã xác minh

Phase 4B.2 dùng DM-DEV-170K-v1: Development 170.000 dòng, outer 5-Fold ×3 seed đóng băng, inner 3-Fold. Mọi mô hình dùng cùng assessment rows và năm input. Tóm tắt từ [model_summary.json](../phase4b2/results/model_summary.json):

| Mô hình | RMSE mean | Delta so với Dummy | Fold thắng /15 |
|---|---:|---:|---:|
| Dummy | 1.734476001 | 0 | — |
| Linear Regression | 1.734565278 | +0.000089276 | 4 |
| Decision Tree | 1.734713634 | +0.000237633 | 0 |
| Random Forest | 1.734608317 | +0.000132315 | 1 |
| HistGradientBoosting | 1.734681593 | +0.000205592 | 2 |

Chưa có cải thiện ngoài mẫu ổn định trong không gian đã thử. Kết quả này không chứng minh mọi thuật toán đều thất bại. SD của 15 fold không phải CI của 15 thí nghiệm độc lập vì dữ liệu và tập fit chồng lấn. Không mở rộng thuật toán trên CSV cũ trong Phase này.

Phase 4B.1 còn ghi nhận: eta² đơn biến của năm feature đều <0,006% phương sai; 3.000 tổ hợp có trung vị 57 dòng; joint permutation p≈0,61. Chọn tổ hợp có ROI trung bình cao nhất dễ chọn nhiễu; group-mean joint ngoài fold đã kém Dummy. Đây là kết quả khám phá Development, không phải chứng minh nhân quả hoặc tính độc lập tuyệt đối.

Benchmark lịch sử Dummy **1.732275** vẫn chưa tái lập được; số mới seed42 **1.7344738959662471** và mean ba repeat **1.7344760014629985** thuộc giao thức mới, không thay số lịch sử. Phase 4B.1A có **13 PASS, 3 FAIL lịch sử**; Phase 4B.2 có **969 PASS quy trình**, không xóa ba FAIL đó và không xác nhận giá trị kinh doanh.

## 3. ROI: điều biết được và điều chưa biết

| Trạng thái | Nội dung | Hệ quả |
|---|---|---|
| Đã xác minh từ audit Development | Cột số tên ROI; 601 mức cách 0,01, trong [2;8], mean≈4,999618; không có revenue/margin riêng | Có thể tính sai số trên thang số đã lưu; chưa gán được ý nghĩa kinh tế |
| Chưa xác minh | ROI là tỷ số, phần trăm hay ROAS; gross/net; currency; cửa sổ, attribution, hoàn tiền, thuế và chi phí | Không chuyển số 5 thành 5%, 500% hoặc “5 lần” trên cơ sở tên cột |
| Chưa xác minh | Acquisition_Cost là CAC, tổng spend, actual hay kế hoạch | Không lấy nó làm mẫu số ROI hoặc planned budget |
| Giả thuyết | Dữ liệu được sinh theo khuôn; kỳ vọng ROI theo input gần hằng số | Phù hợp hình dạng quan sát, chưa chứng minh cơ chế sinh |

Đề xuất **data contract mới**, không áp ngược vào cột cũ:

- `attributed_ROAS = attributed_net_revenue / actual_ad_spend`, cùng currency và cửa sổ; chỉ là attribution, chưa phải doanh thu tăng thêm.
- `incremental_ROAS = (E[revenue(a)] - E[revenue(a0)]) / (E[ad_cost(a)] - E[ad_cost(a0)])`, chỉ báo khi mẫu số dương và hiệu ứng được nhận diện hợp lệ.
- `incremental_net_profit = E[contribution_before_marketing(a) - marketing_cost(a)] - E[contribution_before_marketing(a0) - marketing_cost(a0)]`. Contribution đã trừ COGS, hoàn hàng và biến phí fulfillment theo hợp đồng; tránh trừ marketing hai lần.
- Nếu cần `incremental_ROI`, đặt tên/version rõ bằng incremental net profit chia incremental marketing cost >0; không đồng nhất với ROI của nền tảng hoặc Meridian. Tổng hợp bằng ratio of sums khi thích hợp, không tùy tiện lấy trung bình các tỷ số.

Đây là định nghĩa nghiên cứu đề nghị. Chưa có dữ liệu để tính các target đó. Với control không chi tiền, ROI/ROAS riêng của control có thể không xác định; đánh giá chênh lệch profit/revenue trước. Không cộng/gộp target khác công thức, đơn vị, horizon hoặc counterfactual; đổi currency không sửa được khác biệt estimand.

## 4. Nguồn gốc: phân biệt bằng chứng và giả thuyết

**Đã xác minh trong báo cáo cũ:** Date của toàn bộ 170.000 Development khớp `2021-01-01 + ((Campaign_ID-1) mod 365)`; ROI gần đều và các nhóm gần cân bằng. Date hiện chưa có cơ sở để biểu diễn mùa vụ thật.

**Chưa xác minh:** nhà thu thập, log nguồn, generator, đơn vị tiền tệ, hợp đồng sử dụng và tính tương ứng byte với bản phát hành công khai. [URL Kaggle nghi là nguồn](https://www.kaggle.com/datasets/rohitgrewal/marketing-campaign-performance-dataset) vẫn không truy cập được bằng công cụ web trong lần rà soát này. Không dùng mirror hoặc lời khẳng định của project khác để xác nhận “synthetic”, giấy phép hay công thức ROI. Có URL giống tên dataset không xác lập provenance của CSV local.

**Giả thuyết hợp lý nhưng chưa kết luận:** dữ liệu tổng hợp hoặc được tạo/ẩn danh theo khuôn. Cần bên tạo cung cấp dataset card, version/hash, generator nếu có và bằng chứng thu thập. Nếu xác nhận synthetic, vai trò vẫn là demo/kiểm thử phương pháp; không biến kết quả đó thành bằng chứng lợi nhuận thật.

## 5. Feature website và thời điểm biết thông tin

Đây là **đề xuất thiết kế tương lai**, không thay schema/API/UI trong Phase 4B.3.

| Feature/nhóm | Đề xuất | Điều kiện cần |
|---|---|---|
| Campaign_Type, Channel_Used | Giữ khái niệm kế hoạch; tách action có thể chọn khỏi context | Phải là cấu hình trước chạy, có danh mục và tổ hợp tương thích được xác nhận |
| Target_Audience, Customer_Segment | Giữ nếu định nghĩa từ snapshot trước phân bổ | Không tính lại segment bằng người đã phản hồi; bảo vệ quyền riêng tư và eligibility |
| Duration_days | Giữ trong demo hiện tại; tương lai đổi thành trường planned duration rõ nghĩa | Bốn mức 15/30/45/60 đã được xác nhận và kiểm tra trước; chưa chứng minh đó là planned thay vì actual |
| Budget, bid, objective, product/offer/creative, geography, language, margin | Bổ sung vào **data contract tương lai** khi có nguồn | Không thêm form chỉ vì hợp lý; cần training support, cutoff, validation và schema version mới |
| Company/Location/Language cũ | Chưa tự thêm vào website | Chưa có timing provenance; chẩn đoán tuyến tính mở rộng cũ không cải thiện |
| Date, Campaign_ID, Month/Weekday dẫn xuất | Không dùng làm tín hiệu huấn luyện/đề xuất hiện tại | ID chỉ để trace; lịch thật cần nguồn và timestamp khác đã kiểm chứng |
| Conversion_Rate, Clicks, Impressions, Engagement_Score | Chỉ outcome/reporting sau chạy | Không làm input dự đoán trước chiến dịch; forecast riêng phải có nguồn, timestamp và sai số riêng |
| Acquisition_Cost | Chưa dùng như ngân sách | Tách planned budget, actual spend và CAC; không suy chúng từ nhau khi thiếu counts |

Không ép schema của Criteo/Hillstrom/UCI vào năm input cũ. Ví dụ historical purchase channel không phải kênh quảng cáo được chọn. Nếu đồ án chuyển bài toán sang email treatment hoặc subscription propensity, cần module nghiên cứu và mục tiêu riêng; không thay backend phục vụ ROI âm thầm.

## 6. Dataset thay thế và quyết định khả thi

[dataset_comparison.md](dataset_comparison.md) phân loại sáu ứng viên. Kết luận chọn hướng nghiên cứu, không tuyên bố đã fit hoặc đã có điểm tốt:

- **Criteo corrected uplift:** ưu tiên cho benchmark phương pháp uplift ở phạm vi quảng cáo/không quảng cáo; chưa giải quyết target lợi nhuận hoặc biểu mẫu đa kênh. License và sampling phải được kiểm tra đúng phiên bản.
- **Hillstrom:** gần bài toán lựa chọn giữa các email và không gửi, có outcome tiền; chỉ tiến tới ingestion khi quyền sử dụng được làm rõ. Không mặc định chi phí email bằng 0 hoặc historical channel là action.
- **UCI Bank:** fallback có license rõ cho bài toán dự đoán phản hồi; không đủ chứng minh tối ưu chiến lược.
- **GA4 sample:** có ích cho hiểu event/outcome pipeline; chưa đủ dữ liệu ngân sách/đối chứng hoặc license dataset đã kiểm chứng.
- **Meridian/Robyn demo:** chỉ thử cấu trúc MMM và kiểm tra phần mềm trên mô phỏng; không dùng làm chứng cứ hiệu quả thực tế.

Hướng phù hợp nhất là **thu hẹp nghiên cứu phương pháp bằng dữ liệu có treatment/control**, song song xin dữ liệu first-party theo contract ở [recommended_research_plan.md](recommended_research_plan.md). Chưa có ứng viên nào trong khảo sát được chấp thuận làm nguồn chứng minh tối ưu Marketing thực tế cho DreamMakers.

## 7. Điều kiện và blocker trước khuyến nghị

Phải có đủ: quyền sử dụng rõ; target/outcome kiểm toán được; snapshot trước action; feasible actions/constraints; giao thức độc lập được khóa; bằng chứng dự đoán nếu tuyên bố dự đoán; bằng chứng policy value nếu tuyên bố lựa chọn; uncertainty, support và khả năng từ chối. Các tiêu chí cụ thể và phương pháp kiểm chứng có trong kế hoạch nghiên cứu.

Blocker hiện tại: provenance/ROI cũ; timing planned/actual; thiếu action assignment/đối chứng và chi phí; dữ liệu độc lập mới chưa có; rights và sampling của ứng viên chưa qua ingestion audit; chưa xác định MDE và quy mô pilot. Kết quả public benchmark dù tốt cũng không tự chuyển sang khách hàng/thị trường DreamMakers.

**Quyết định Phase 4B.3:** giữ website hiện tại trong phạm vi demo nghiên cứu; đề xuất điều chỉnh target và feature cho **nhánh mới trong tương lai**, không sửa hiện tại. Không triển khai `/optimize`, không nâng gate hoặc mở Test gốc.

## 8. Nghiệm thu và bảo vệ

[protected_before.json](protected_before.json) lưu SHA256 trước thay đổi; [verification_results.json](verification_results.json) đối chiếu sau cho source ứng dụng, bảy artifact và toàn bộ nghiên cứu trước trong phạm vi bảo vệ. Script [audit_deliverables.py](audit_deliverables.py) chỉ dùng thư viện chuẩn, hash file và đọc báo cáo/metadata; không nạp dataset/model.

Kết quả kiểm tra bàn giao: **14/14 PASS**, **404 tệp bảo vệ không đổi**, gồm đủ bảy artifact. Kiểm tra bao gồm gate hiện tại, toàn vẹn tệp, nội dung UTF-8, liên kết bằng chứng nội bộ và registry nguồn. Có thể chạy lại bằng `backend/.venv/Scripts/python.exe -X utf8 research/phase4b3/audit_deliverables.py`; không chạy lại script training cũ.

PASS kiểm tra tài liệu/toàn vẹn không có nghĩa các dataset ứng viên đã được kiểm đếm hoặc mô hình/policy đã được xác nhận. Tình trạng triển khai khoa học: **BLOCKED_INSUFFICIENT_EVIDENCE**. Các FAIL lịch sử giữ nguyên. Chỉ tạo file dưới `research/phase4b3/`; dừng tại Phase 4B.3.
