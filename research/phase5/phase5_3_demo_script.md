# Phase 5.3 — Kịch bản demo tiếng Việt, 7 phút

Ngày04/11/2026. Mục tiêu: trình diễn website nghiên cứu chạy thật, phân biệt rõ API prediction, mock và snapshot. **Không tuyên bố đã tối ưu Marketing hoặc chọn phương án tốt hơn.** Mã UC theo [contract/matrix](uc_acceptance_matrix.md).

## Chuẩn bị trước khi bấm giờ

Chạy Backend8000 và bản build/preview4173 theo [user guide](phase5_3_user_guide.md). `/health` phải `status=ok,model_ready=true`; `/model-info` LR1.0.0/BASELINE_ONLY. Mở browser profile/tab demo riêng để không ảnh hưởng scenario cá nhân. Không xóa storage ngoài profile demo. Kiểm tra font/UI, mạng loopback và chuẩn bị thư mục ảnh/JSON thực của Phase5.3 làm evidence dự phòng.

Chuẩn bị hai cấu hình dưới đây từ **backend/models/reference_prediction.json**, giữ nguyên chữ kỹ thuật dưới nhãn Việt:

| Feature | Chiến dịch tham chiếu A | Chiến dịch tham chiếu B |
|---|---|---|
| Campaign_Type | Social Media — Tiếp thị mạng xã hội | Search — Quảng cáo tìm kiếm |
| Channel_Used | Facebook | Google Ads |
| Target_Audience | Women25–34 — chọn giá trị `Women 25-34` | Women25–34 — chọn giá trị `Women 25-34` |
| Customer_Segment | Fashionistas — Người yêu thích thời trang | Fashionistas — Người yêu thích thời trang |
| Duration_days | 30 | 45 |
| Kết quả LR tham chiếu | **4.991136884533976** | **4.997267870097019** |

Trong UI dấu thập phân là dấu phẩy. Các giá trị này là output trên **thang đo dataset**, không phải% hoặc lợi nhuận. Reference chỉ kiểm tính nhất quán Colab/artifact/Backend/website, không chứng minh độ chính xác dự báo trên chiến dịch mới.

## Lời thoại và thao tác

| Thời gian | Người thuyết trình nói | Thao tác trên website | Kết quả mong muốn |
|---|---|---|---|
| **00:00–00:40** | “DreamMakers minh họa quy trình nhập thông tin chiến dịch và suy luận ROI bằng mô hình đã lưu. Website có bốn trang. Chúng tôi phân biệt triển khai phần mềm thành công với hiệu lực mô hình: mô hình ROI chưa vượt baseline nên chỉ phục vụ nghiên cứu, chưa đưa ra khuyến nghị kinh doanh.” | Mở `/#dashboard`, chỉ sidebar và badge chất lượng | Bốn mục điều hướng, badge “Chưa vượt mô hình cơ sở”; không có nút nhận tối ưu |
| **00:40–01:25** | “Dashboard dùng biểu đồ và12chiến dịch minh họa để trình diễn giao diện. Quy mô200.000là hồ sơ dataset nghiên cứu; đây không phải200.000record vận hành đang được tải lên. Các bucket và điểm ROI hardcode đã được ghi nhãn, không dùng để kết luận kênh nào hiệu quả hơn.” | Lướt bốn biểu đồ, trỏ chú thích nguồn; tìm một campaign, đổi filter hoặc sang trang2 | Chart/table có nhãn minh họa, lọc/phân trang hoạt động; không gọi là thống kê kinh doanh đã kiểm toán |
| **01:25–02:15** | “Ở Predict, tôi nhập đúng năm feature của mẫuA: mạng xã hội, Facebook, nữ25–34, nhóm thời trang,30ngày. Domain lấy từ Backend; chỉ cho15,30,45,60ngày. Dữ liệu gửi API vẫn giữ giá trị kỹ thuật, nhãn Việt chỉ hỗ trợ người dùng.” | Chọn đủ năm giá trịA. Chỉ tóm tắt cấu hình; nếu muốn, chuyển duration45 rồi về30 để thấy phản hồi | Model sẵn sàng, cấu hìnhA đúng; nút Predict enabled. Không thay feature ngoài domain hoặc giả vờ UI có input ngân sách |
| **02:15–03:00** | “Tôi bấm Dự đoán. Website gọi FastAPI thật, sử dụng fitted Linear Regression Pipeline. Kết quảA là4,991136884533976, khớp reference. Thông tin model/version và warning được trả từ Backend. Số này chưa có đơn vị kinh tế được xác minh; chúng tôi không đổi nó thành499% hoặc lợi nhuận.” | Bấm Predict, đợi loading, trỏ ROI/model/version/warning. Có thể đối chiếu request/response đã chuẩn bị nếu hội đồng hỏi | API200, ROI A chính xác, LR1.0.0, BASELINE_ONLY; không confidence interval dựng từ RMSE |
| **03:00–03:45** | “Tiếp theo là mẫuB: Search, Google Ads, vẫn nữ25–34/thời trang,45ngày. Khi đổi input, kết quả cũ được xóa. OutputB là4,997267870097019. Chênh hai output không chứng minh B tốt hơn A, không chứng minh Google Ads gây tăng ROI.” | Đổi type/channel/duration; bấm Predict lại; trỏ kết quảB | Không stale ROI; API200, B khớp reference. Không xếp hạng hay khuyến nghị B |
| **03:45–04:50** | “Compare là phần quản lý và đối chiếu cấu hình minh họa, không dùng các kết quả API vừa xem. Tôi tạo cấu hình tham chiếuA/B ở đây để minh họa thao tác; điểm trên trang này là mock, không phải4,991… hay4,997… từ pipeline. Hệ thống không sort theo ROI hoặc chọn best campaign.” | Tạo hai scenario tênA/B với các feature trên; sửa tên/ghi chú một scenario, lưu; xem bảng; xóa scenario vừa tạo có confirm. Nếu thao tác chậm, chuẩn bị sẵnB bằng UI trước demo, tạo/sửa/xóaA trực tiếp | CRUD/save hoạt động; ROI minh họa được ghi rõ; không requestpredict từ Compare. Tên/thời lượng có thể sort, ROI không sort |
| **04:50–05:50** | “Model Insights tách metadata đang chạy và snapshot đánh giá lịch sử. Metrics lịch sử giữ nguyên, có nguồn và giới hạn tái lập; không khẳng định từng fold đã được kiểm chứng. Phase4B.2 là giao thức ROI khác, không model nào vượt Dummy ổn định. Criteo là visit/uplift benchmark có giới hạn, không phải ROI và không được triển khai vào API này.” | Mở Insights, chỉ panel provenance, bảng historical, xuống panel4B; trỏ RESEARCH_LIMITED và outcomevisit | LR/version/gate hiện tại rõ; historical vs4B.2 vsCriteo tách; không đổi Qini thành ROI hoặc gọi ROI VALIDATED |
| **05:50–06:25** | “Quality Gate là điều kiện giới hạn chức năng. Hiện Backend chỉ cho prediction research-only; automatic ranking và optimization recommendation đều false. Nếu chưa xác minh được Backend, UI chuyển UNVERIFIED. UC-08 nhận phương án tối ưu chưa được triển khai, không phải chức năng đã đạt nghiệm thu.” | Trỏ badge/warning và phần giới hạn. Không cần tắt Backend trong demo chính | Người xem hiểu BASELINE_ONLY khác VALIDATED, UC-08 NOT_IMPLEMENTED |
| **06:25–07:00** | “Website đạt kiểm thử kỹ thuật cho demo local: inference API thật, validation và các tình huống lỗi đã kiểm tra. Dashboard/Compare vẫn có phần minh họa, metrics là snapshot có nguồn. Để phát hành khuyến nghị thực tế cần dữ liệu economics và thử nghiệm chính sách độc lập; nhóm chưa có bằng chứng đó. Vì vậy kết luận là sẵn sàng demo nghiên cứu, không phải hệ thống tối ưu Marketing đã được chứng minh.” | Trở lại trang kết quả hoặc Insights; kết thúc | Đúng phạm vi READY_FOR_DEMO, không tự mở optimizer hoặc thay đổi gate |

Tổng7phút; nếu cần5–6phút, rút thao tác lọcDashboard và dùngB đã chuẩn bị ởCompare, vẫn phải cho thấy tạo/sửa/xóaA, predictionA/B thật và phần giới hạn. Không bỏ lời phân biệt mock/API hoặc dùng chênh ROI làm kết luận tốt hơn.

## Dự phòng khi Backend không hoạt động

1. Nói rõ: “Backend hiện chưa sẵn sàng; phần suy luận trực tiếp đang bị gián đoạn.” Giữ nguyên UNVERIFIED/alert/disabled, không nhập kết quả giả hoặc dùng mock thay API.
2. Kiểm `/health`, cửa sổBackend và origin theo runbook; khởi động lại **server do mình chạy**, bấm “Tải lại thông tin mô hình”, chỉ Predict tiếp khi ready.
3. Nếu chưa khôi phục, tiếp tục Dashboard/Compare/snapshot lịch sử với nhãn nguồn; mở [ảnh và request/response đã ghi](phase5_3_report_evidence.md), nói rõ **đây là evidence của lượt nghiệm thu04/11/2026, không phải dự đoán live hiện tại**.
4. Ghi UC-03 live đang BLOCKED tại buổi demo đó; không dùng ảnh cũ để tuyên bố request vừa thành công. Nếu bắt buộc demo live nhưng server không phục hồi, kết luận NOT_READY_FOR_LIVE_PREDICTION và chuyển sang trình bày evidence, không che sự cố.
