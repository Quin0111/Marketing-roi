# Marketing Action Plan — triển khai và bàn giao

Ngày 04/11/2026. Tính năng được hoàn tất cùng đợt final implementation; số nghiệm thu chính thức ở [FINAL_TEST_RESULTS](FINAL_TEST_RESULTS.md), không kế thừa PASS cũ.

## Chức năng và quy tắc

Khảo sát ban đầu xác nhận source chỉ có `ScenarioSuitability`, chưa có generator kế hoạch. Đã thêm `marketingActionPlan.ts` và `MarketingActionPlan.tsx`, tái sử dụng kết quả lọc/chấm điểm hiện có. Một phương án duy nhất tự có bản kế hoạch thu gọn; tie phải chọn rõ phương án, không chọn thay theo ROI. Không có phương án hợp lệ thì không có kế hoạch. Nút **Xem kế hoạch triển khai** mở, focus và cuộn tới chi tiết; có nút thu gọn.

`action-plan-v1` là template xác định, không có random/LLM/ML. Chỉ đọc năm feature và context ngành/mục tiêu tùy chọn. ROI, giá trị tài chính hoặc trọng số mô hình không tham gia generator. Mỗi giai đoạn có ngày bắt đầu/kết thúc, hoạt động, đầu ra mong đợi và danh mục chỉ số có điều kiện.

| Thời lượng | Chuẩn bị | Khởi chạy | Theo dõi/điều chỉnh | Tổng kết |
|---:|---|---|---|---|
| 15 | 1–3 | 4–5 | 6–13 | 14–15 |
| 30 | 1–6 | 7–9 | 10–27 | 28–30 |
| 45 | 1–9 | 10–14 | 15–40 | 41–45 |
| 60 | 1–12 | 13–18 | 19–54 | 55–60 |

Đây là lịch tham khảo do thiết kế sản phẩm, không là lịch đã tối ưu/thực nghiệm. Khoảng ngày liên tục, bao gồm hai đầu, không overlap/gap hoặc vượt thời lượng.

## Hoạt động theo kênh

| Kênh | Nội dung riêng | Chỉ số gợi ý khi có dữ liệu |
|---|---|---|
| Instagram | Ảnh/video dọc, Reels, caption, lịch đăng, kiểm tra liên kết; thử ads chỉ khi được duyệt | Tiếp cận/tương tác, thời gian xem Reels, nhấp |
| Facebook | Page, mẫu trả lời bình luận/tin nhắn, lịch đăng, Meta Business Suite | Tiếp cận, tương tác, nhấp, phản hồi |
| Google Ads Search | Từ khóa/ý định/phủ định, quảng cáo tìm kiếm, landing page, bản nháp và tracking | Hiển thị/nhấp, CTR; conversion chỉ nếu tracking xác minh |
| Google Ads Display | Bộ ảnh/tiêu đề/mô tả và vị trí hiển thị; không áp hoạt động từ khóa phủ định của Search | Hiển thị/nhấp và đo chuyển đổi có điều kiện |
| Email | Danh sách đồng ý nhận tin, tiêu đề/CTA, gửi thử, hủy đăng ký và lỗi phân phối | Gửi thành công/bounce, nhấp, hủy đăng ký; lượt mở chỉ tham khảo |
| Website | Landing page, biểu mẫu, liên kết, UTM, sự kiện, nhật ký phiên bản | Truy cập, nhấp CTA/gửi form và lỗi khi có tracking |
| YouTube | Video/Shorts, thumbnail, phụ đề, lịch phát hành và YouTube Studio | Lượt xem, watch time, hiển thị/CTR thumbnail, nhấp nếu đo được |

Loại chiến dịch bổ sung brief Search/Display/Email/Social Media/Influencer; phân khúc bổ sung chuẩn bị tư liệu, không suy diễn hành vi mua hàng. Với tổ hợp loại/kênh chưa rõ (ví dụ Email–Instagram), generator ghi **bản nháp cần xác nhận**, bước khởi chạy có điều kiện; Campaign Management không cho chuyển sang active trước khi chỉnh cấu hình phù hợp. Website chỉ là điểm đến, chưa đủ xác định nguồn thu hút truy cập.

Các guard này là quy tắc workflow thận trọng của sản phẩm, không tuyên bố là danh mục tương thích exhaustive của mọi tài khoản quảng cáo. Không tự đặt ngân sách, mục tiêu doanh thu hoặc chỉ số hiệu quả.

## Ví dụ 30 ngày

Brief: Social Media · Instagram · Women 25-34 · Fashionistas, ngành Thời trang, mục tiêu Thu hút khách hàng tiềm năng. Đây là ví dụ template, không phải kết quả chiến dịch thực tế.

| Ngày | Hoạt động cụ thể | Đầu ra |
|---|---|---|
| 1–6 | Chuẩn bị ảnh/video sản phẩm, kịch bản Reels/caption/CTA, thông tin kích cỡ/chất liệu; kiểm form tư vấn và quy trình nhận liên hệ | Bộ tư liệu, lịch nội dung và checklist quyền/tracking |
| 7–9 | Đăng theo lịch, kiểm di động và liên kết; chỉ thử quảng cáo nếu tài khoản/ngân sách được chủ sở hữu duyệt | Bài/Reels đã kiểm tra, cấu hình thử nếu có |
| 10–27 | Ghi nhận tương tác/nhấp và form nếu tracking xác minh; rà phản hồi, sửa đoạn mở đầu/caption, lưu thay đổi | Nhật ký và báo cáo thực sự có thể truy cập |
| 28–30 | Tổng hợp dữ liệu có thật, nêu chỉ số còn thiếu và việc cần thử ở vòng sau | Báo cáo có hạn chế, không bịa ROI/lợi nhuận |

## Nguồn kiểm tra khả năng đo lường

Nguồn sơ cấp dùng để kiểm tên hoạt động/chỉ số, không là bằng chứng template hiệu quả hoặc lịch tối ưu. Search dựa trên [Google Ads Search](https://support.google.com/google-ads/answer/9510373?hl=en); chuyển đổi chỉ có ý nghĩa khi đã cấu hình tracking, theo [Google conversion tracking](https://support.google.com/google-ads/answer/6308?hl=en). Reels có chỉ số thời gian xem theo [Meta](https://about.fb.com/news/2023/04/instagram-reels-trending-audio-and-gifts-updates/); workflow Page/insights tham khảo [Meta professional dashboard](https://about.fb.com/news/2023/11/helping-creators-test-content-and-earn-rewards/). Website events theo [GA4](https://developers.google.com/analytics/devguides/collection/ga4/events); thumbnail/watch time theo [YouTube Help](https://support.google.com/youtube/answer/9314486?hl=en). Việc quản lý hủy đăng ký tham khảo [Mailchimp](https://mailchimp.com/help/about-unsubscribes/).

Không giả định tài khoản luôn có mọi report/định dạng; không trích các con số marketing uplift từ tài liệu nền tảng làm kết quả của DreamMakers.

## Kiểm thử, file và giới hạn

- `tests/frontend/action-plan.test.tsx`: lịch 24 kênh×duration, toàn bộ ma trận Backend trong một ca bổ trợ, nội dung theo kênh/type/segment, invalid input, không đọc ROI, tie/edit/delete/reset.
- `tests/browser/action-plan.spec.ts`: 11 ca, sáu kênh gọi API thật, bốn durations, chọn tie, sửa/xóa, empty và desktop/mobile.
- `final-business.*`: ngành/mục tiêu, tạo campaign snapshot, tiến độ và tài chính.
- File runtime: `marketingActionPlan.ts`, `MarketingActionPlan.tsx`, tích hợp trong `ScenarioSuitability.tsx`; context ở `marketingContext.ts`.
- Lượt đầu từng phát hiện chuỗi duration `'30'` được object key coerced chấp nhận. Đã thêm kiểm typeof/integer, giữ ca regression và log `run_action_plan/frontend-first.*` (191 PASS/1 FAIL); kết quả sau sửa ở full suite final.

Ảnh và số liệu nghiệm thu cuối: [FINAL_ACCEPTANCE_REPORT](FINAL_ACCEPTANCE_REPORT.md), [FINAL_TEST_RESULTS](FINAL_TEST_RESULTS.md). Template chưa được kiểm chứng hiệu quả kinh doanh, không phát hành quảng cáo hoặc kết nối tài khoản nền tảng. BASELINE_ONLY giữ nguyên; kế hoạch khác với output Linear Regression.
