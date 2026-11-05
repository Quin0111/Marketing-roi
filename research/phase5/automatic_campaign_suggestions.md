# Tự động đề xuất chiến dịch Marketing từ phương án phù hợp

Ngày 04/11/2026. Nâng cấp Frontend riêng; giữ các báo cáo lịch sử và giao diện Predict ROI đã khôi phục.

## Chức năng đã triển khai

Ngay dưới kết quả suitability, khu vực **CHIẾN DỊCH MARKETING ĐỀ XUẤT** tự sinh thẻ chiến dịch từ phương án được chọn. Mỗi thẻ có tên, mục tiêu/CTA, lý do phù hợp, đối tượng/phân khúc, kênh, hoạt động chính, thời lượng, điều kiện và dữ liệu còn thiếu. Nút **Xem kế hoạch chi tiết** mở lịch bốn giai đoạn với hoạt động, đầu ra và chỉ số cần theo dõi. Chi tiết mặc định thu gọn.

Một phương án hợp lệ duy nhất được dùng tự động. Đồng hạng giữ tất cả lựa chọn và yêu cầu người dùng chọn rõ; không dùng ROI để phá đồng hạng. Thiếu tiêu chí, không có eligible match, thiếu lĩnh vực/mục tiêu hoặc tổ hợp loại–kênh chưa xác định: không sinh chiến dịch cụ thể, hiển thị nguyên nhân. Kế hoạch chung theo cấu hình cũ vẫn tồn tại với nhãn riêng; đây không phải một bộ generator hoặc trang mới trùng chức năng.

Thay đổi tiêu chí, lĩnh vực/mục tiêu, lựa chọn đồng hạng, tên/feature kịch bản hoặc xóa kịch bản làm thay key đầu vào và đóng chi tiết cũ. Thay đổi ROI tham khảo không đổi đề xuất. Mọi nội dung dựa vào state hiện tại; không có danh sách kịch bản hardcode trong runtime.

**Lưu chiến dịch đề xuất** dùng lại Campaign Management: lưu đúng tên, mục tiêu, nguồn rule/template, lý do, điều kiện và nhiệm vụ của chiến dịch cụ thể đã chọn. Không thay bằng nhiệm vụ của kế hoạch chung. Campaign lưu là bản nháp độc lập, không có doanh thu/chi phí tự sinh; tiêu chí thay đổi sau đó không ghi đè chiến dịch người dùng đã lưu. Có thể tải lại, sửa công việc và dùng các chức năng tiến độ/tài chính sẵn có.

## Bộ quy tắc `campaign-suggestions-v1`

1. **Chọn phương án:** tái sử dụng nguyên `evaluateScenarioSuitability`: bắt buộc là filter, ưu tiên mỗi match 1 điểm, giữ đủ đồng hạng. Không cộng điểm ngành, đọc ROI hoặc tạo bộ xếp hạng mới.
2. **Điều kiện tạo thẻ:** phải có phương án được chọn, mô tả/thời lượng hợp lệ, lĩnh vực và mục tiêu được hỗ trợ. Tái sử dụng guard loại/kênh của `createMarketingActionPlan`. Kênh mới hoặc tổ hợp chưa xác định nhận thông báo cần xác minh; không bị tự chuyển sang một kênh khác.
3. **Cá nhân hóa:** ngành xác định chủ đề và tư liệu; mục tiêu xác định CTA, objective và chỉ số; loại/kênh xác định định dạng; nhóm/phân khúc được giữ làm brief và bổ sung vào nhiệm vụ. Không suy ra hành vi mua hàng hoặc khả năng nhắm chọn từ nhãn nhóm.
4. **Số lượng:** chỉ phát sinh các mẫu tương ứng; không bắt buộc ba chiến dịch. Các thẻ là lựa chọn tham khảo, không được xếp hạng theo hiệu quả.
5. **Kế hoạch:** dùng lại lịch và các kiểm tra của action-plan-v1; thêm nhiệm vụ cụ thể cho từng thẻ vào từng giai đoạn. Một component dùng chung trình bày cả lịch chung và lịch riêng, tránh sao chép renderer.
6. **Lưu:** chỉ thao tác lưu chủ động mới tạo campaign. Chỉ hiển thị thẻ không tạo bản ghi, gọi API hay phát hành hoạt động trên nền tảng.

| Kênh/loại | Mẫu phát sinh | Điều kiện/số lượng |
|---|---|---|
| Instagram, Social Media | Chuỗi ảnh/carousel theo ngành và mục tiêu; Reels theo cùng brief | 2 |
| Instagram, Display | Chuỗi nội dung ảnh đã duyệt | 1; không tự thêm Reels |
| Instagram, Influencer | Chuỗi ảnh, Reels; thêm hợp tác nhà sáng tạo khi awareness/launch | 2 hoặc 3; hợp tác chưa có đối tác/quyền/chi phí thì ghi rõ có điều kiện |
| Google Ads, Search | Tìm kiếm theo ý định và CTA; thêm đối chiếu từ khóa/nội dung nếu không phải awareness | 1 hoặc 2; cần trang đích, quyền tài khoản, cấu hình và ngân sách được chủ sở hữu duyệt |
| Google Ads, Display | Nội dung hiển thị/banner theo ngành và CTA | 1; không áp dụng nhiệm vụ Search cho Display |
| Facebook | Chuỗi bài Page và luồng phản hồi/CTA | 1; thêm hợp tác khi loại Influencer và mục tiêu awareness/launch |
| YouTube | Video với kịch bản, thumbnail, phụ đề và CTA theo brief | 1; thêm hợp tác khi loại Influencer và mục tiêu awareness/launch |
| Email | Nội dung email theo mục tiêu; thử gửi, kiểm liên kết và hủy đăng ký | 1; cần danh sách có sự đồng ý và quyền gửi |
| Website | Landing page, CTA, biểu mẫu và tracking theo mục tiêu | 1; Website chỉ là điểm đến, phải bổ sung nguồn truy cập |

Đây là quy tắc biên tập/heuristic minh họa, không phải kết luận nghiên cứu rằng một kênh tốt hơn cho một ngành. Chưa có sản phẩm/brand, lịch tuyệt đối, nhân sự, tài khoản hoặc dữ liệu vận hành đã xác minh; từng thẻ yêu cầu bổ sung và duyệt trước triển khai.

## Ví dụ sinh trực tiếp từ service

[rule_examples.json](run_campaign_suggestions/rule_examples.json) do Vite SSR gọi service thật, không viết tay kết quả. Đây là inputs minh họa có đánh dấu fixture, không phải chiến dịch hoặc hiệu quả quan sát được.

| Brief minh họa | Kết quả thực tế của service |
|---|---|
| Thời trang, Instagram/Social Media, nhận diện, 30 ngày | Instagram: giới thiệu bộ sưu tập thời trang; Reels: giới thiệu bộ sưu tập thời trang |
| Công nghệ, Google Ads/Search, leads, 30 ngày | Tìm kiếm: tư vấn sản phẩm công nghệ; Đối chiếu từ khóa và nội dung: sản phẩm công nghệ |
| Giáo dục, Facebook/Social Media, leads, 45 ngày | Facebook Page: tư vấn chương trình học |
| Thực phẩm, Instagram/Social Media, ra mắt, 15 ngày | Instagram và Reels: ra mắt thực đơn và sản phẩm ẩm thực |
| Dịch vụ, Website/Display, chuyển đổi, 60 ngày | Landing page: hành động chuyển đổi dịch vụ tư vấn |
| Khác, Email, nhận diện, 30 ngày | Email: giới thiệu sản phẩm hoặc dịch vụ theo brief; yêu cầu làm rõ ngành/sản phẩm |
| Công nghệ, YouTube/Social Media, ra mắt, 30 ngày | YouTube: video ra mắt sản phẩm công nghệ |
| Thời trang, Instagram/Influencer, nhận diện, 30 ngày | Ba mẫu: chuỗi ảnh, Reels và hợp tác nhà sáng tạo có điều kiện |

Ví dụ Reels thời trang 30 ngày, đối tượng Women 25–34/Fashionistas theo brief:

| Giai đoạn | Ngày | Hoạt động riêng của chiến dịch |
|---|---|---|
| Chuẩn bị | 1–6 | Soạn kịch bản Reels giới thiệu bộ sưu tập; quay tư liệu phối đồ, kiểm quyền hình/âm thanh, phụ đề, caption và CTA |
| Triển khai | 7–9 | Đăng Reels có đoạn mở đầu, phụ đề, CTA xem nội dung; kiểm hiển thị di động; quảng cáo chỉ khi được duyệt riêng |
| Theo dõi và điều chỉnh | 10–27 | Rà thời gian xem/tương tác khi có Insights, ghi nhận câu hỏi, lưu thay đổi đoạn mở đầu/caption dựa trên dữ liệu thực tế |
| Tổng kết | 28–30 | Lưu tư liệu, nhật ký và dữ liệu thực sự có, nêu tracking/chỉ số còn thiếu; không bịa doanh thu hoặc ROI |

Mỗi mẫu có đủ bốn giai đoạn trong cùng thời lượng nguồn. Với 15/30/45/60 ngày dùng lịch cũ; thời lượng nhập tự do hợp lệ vẫn dùng lịch tương đối của planner. Với 1–3 ngày, một số giai đoạn cùng ngày và có ghi chú. Các chiến dịch có thể chọn chạy riêng hoặc song song khi đủ nguồn lực; không cộng thời gian thành lịch nối tiếp. Không gọi lịch này là lịch tối ưu.

## Nguồn và giới hạn diễn giải

Các nguồn sơ cấp kiểm tra khả năng hoạt động/chỉ số, không chứng minh hiệu quả các mẫu ngành: [Google Ads Search](https://support.google.com/google-ads/answer/9510373?hl=en) mô tả nhóm quảng cáo/từ khóa và trang đích; [Meta Reels](https://about.fb.com/news/2023/04/instagram-reels-trending-audio-and-gifts-updates/) mô tả công cụ nội dung và thời gian xem; [YouTube Analytics](https://support.google.com/youtube/answer/9314486?hl=en) giải thích thumbnail impressions/CTR và watch time. Đã mở kiểm tra trong nhiệm vụ này. Các nguồn bổ trợ cho Page/Email/Website giữ trong [báo cáo action plan](marketing_action_plan_upgrade.md).

Ánh xạ ngành → tư liệu và mục tiêu → CTA là thiết kế rule của DreamMakers. Chưa có nghiên cứu kiểm chứng affinity ngành–kênh. Thử đối chiếu từ khóa/nội dung chưa được gọi là thí nghiệm nhân quả nếu không có giao thức phân nhóm và đo lường hợp lệ. Không dùng ROI, doanh thu hay tăng trưởng giả làm căn cứ.

## File sửa/thêm

| File runtime | Vai trò |
|---|---|
| [campaignSuggestions.ts](../../src/services/campaignSuggestions.ts) — mới | Service pure, guard thông tin, catalog ngành/mục tiêu, blueprint kênh, lịch riêng và điều kiện |
| [CampaignSuggestions.tsx](../../src/components/scenarios/CampaignSuggestions.tsx) — mới | Thẻ, thiếu dữ liệu, mở chi tiết/focus, lưu proposal |
| [ActionPlanPhases.tsx](../../src/components/scenarios/ActionPlanPhases.tsx) — mới | Renderer giai đoạn dùng chung, tách từ component cũ |
| [MarketingActionPlan.tsx](../../src/components/scenarios/MarketingActionPlan.tsx) | Tái sử dụng chọn unique/tie, nối thẻ, giữ lịch chung và reset theo nguồn |
| [ScenarioSuitability.tsx](../../src/components/scenarios/ScenarioSuitability.tsx) | Truyền callback lưu proposal, giữ scoring và key invalidation |
| [CompareScenariosPage.tsx](../../src/pages/CompareScenariosPage.tsx) | Nối thẻ được chọn vào workspace hiện có |
| [useCampaignWorkspace.ts](../../src/hooks/useCampaignWorkspace.ts) | Tạo snapshot với proposal tùy chọn, không đổi CRUD khác |
| [campaigns.ts](../../src/services/campaigns.ts) | Lưu tên/notes/tasks cụ thể; kiểm feature snapshot và lịch; giữ schema storage và luồng generic cũ |

Hai file test mới: [campaign-suggestions.test.tsx](../../tests/frontend/campaign-suggestions.test.tsx), [campaign-suggestions.spec.ts](../../tests/browser/campaign-suggestions.spec.ts). Không sửa/xóa các test lịch sử. QA helpers mới: `campaign_suggestions_run.py`, `campaign_suggestions_browser_audit.mjs`, `campaign_suggestions_examples.mjs`, `campaign_suggestions_evidence.py`; evidence riêng trong `run_campaign_suggestions/`.

## Kết quả kiểm thử mới

| Suite thực sự chạy | PASS | FAIL | SKIP | Evidence |
|---|---:|---:|---:|---|
| Backend pytest | 62 | 0 | 0 | [Record](run_campaign_suggestions/backend-final-command.json), [JUnit](run_campaign_suggestions/backend-final.xml) |
| Frontend Vitest/integration | 322 | 0 | 0 | [Record](run_campaign_suggestions/frontend-expanded-command.json), [JSON](run_campaign_suggestions/frontend-expanded.json) |
| Browser E2E | 89 | 0 | 0 | [Record](run_campaign_suggestions/e2e-isolated-final-command.json), [JSON](run_campaign_suggestions/e2e-isolated-final.json) |

**473 ca duy nhất PASS, 0 FAIL, 0 SKIP; E2E flaky = 0.** Thêm 50 Frontend và 6 E2E so với baseline 417; không cộng lượt chạy kiểm tra trung gian hoặc assertion trong vòng lặp.

Coverage mới: 24 cặp kênh–thời lượng đại diện, sáu lĩnh vực/bốn mục tiêu, số lượng mẫu và creator có điều kiện, thiếu context/kênh chưa rõ, không đọc ROI/economics getter, tính xác định, lưu đúng nhiệm vụ/persistence, feature mismatch/lịch sai, unique/tie/no match, criteria/context/edit/delete, có/không API ROI, kế hoạch không vượt thời lượng, không có số tiền/tăng trưởng giả, desktop/mobile. Backend và toàn bộ regression cũ vẫn chạy đầy đủ, gồm Predict dropdown và reference.

| Kiểm bổ trợ | Kết quả |
|---|---|
| TypeScript + build | PASS/exit 0: [default API 8000](run_campaign_suggestions/build-default-command.json), [isolated API 18000](run_campaign_suggestions/build-isolated-final-command.json). Bundle 721.70 kB/gzip 204.54 kB, vẫn có warning >500 kB |
| Startup và HTTP API thật | PASS: [record](run_campaign_suggestions/http-isolated-final-command.json), [9 responses](run_campaign_suggestions/generated_current/backend/tests/http_results.json) |
| Reference A/B | Raw `4.991136884533976` và `4.997267870097019`, absolute error 0 cả hai |
| Production preview | [Audit](run_campaign_suggestions/browser_audit/checks.json), [log](run_campaign_suggestions/browser-audit.log): hai viewport, tạo thẻ, xem lịch, lưu đúng proposal; 0 pageerror/console.error/unexpected network/overflow, không interception |
| Backend mất kết nối | [Record](run_campaign_suggestions/offline-isolated-final-command.json), [result](run_campaign_suggestions/generated_current/tests/results/backend-offline.json): không có ROI giả. Template là luồng độc lập với suy luận API |
| Bảo toàn | [Summary/hash/inventory](run_campaign_suggestions/acceptance_summary.json): Backend production, bảy artifact, Predict dropdown và báo cáo lịch sử không đổi; model gate vẫn BASELINE_ONLY |
| Teardown | [E2E](run_campaign_suggestions/e2e-isolated-final/e2e-cleanup.json), [audit](run_campaign_suggestions/browser_audit/e2e-cleanup.json): server/cổng QA đóng đúng cách, Backend exit 0 |

QA dùng cổng 18000 riêng, không dừng server người dùng ở 8000, không khởi tạo/rollback/push Git. Các số 100/150/50% trong audit tài chính là fixtures do automation nhập để kiểm chức năng cũ, không phải số liệu do đề xuất tự tạo hoặc kết quả kinh doanh.

## Ảnh giao diện và demo

- [Thẻ trên production desktop](run_campaign_suggestions/browser_audit/campaign-cards-1440.png), [mobile](run_campaign_suggestions/browser_audit/campaign-cards-390.png).
- [Kế hoạch chi tiết mobile](run_campaign_suggestions/browser_audit/compare-plan-390.png).
- [Thời trang Instagram desktop](run_campaign_suggestions/e2e-isolated-final-artifacts/campaign-suggestions-R01-a-72941-crete-draft-and-reload-1440/fashion-campaigns-1440.png).
- [Công nghệ Google Ads desktop](run_campaign_suggestions/e2e-isolated-final-artifacts/campaign-suggestions-R01-a-72941-crete-draft-and-reload-1440/technology-campaigns-1440.png).

Demo: tạo/giữ hai kịch bản → tùy chọn dự đoán ROI thật → chọn ngành/mục tiêu và tiêu chí trực tiếp → Đánh giá → xem các thẻ tự xuất hiện. Nếu đồng hạng, chọn phương án rõ ràng. Mở kế hoạch của một thẻ, lưu thẻ đó thành campaign nháp rồi tải lại để đối chiếu nhiệm vụ. Đổi ngành/mục tiêu, sửa hoặc xóa kịch bản để minh họa việc đóng lịch cũ. Dữ liệu giả lập trong tests/ảnh chỉ là fixtures được gắn nguồn.

## Giới hạn và quyết định

**READY_FOR_DEMO — bản local có giới hạn nghiên cứu.** Các chức năng trong phạm vi đã triển khai và có evidence mới. Đề xuất là template/rule cần người dùng hoàn thiện sản phẩm, nội dung, quyền, nhân sự, ngân sách và tracking. Tiêu chí/context của phiên làm việc không tự lưu; campaign được lưu riêng là snapshot độc lập. Tạo lại cấu hình draft qua chức năng cũ sẽ tạo lịch chung và cần người dùng rà soát nội dung.

Không tự gửi Email, phát hành quảng cáo hay kết nối tài khoản/CRM. Chưa có dữ liệu độc lập chứng minh các đề xuất cải thiện kinh doanh. Linear Regression chỉ dự đoán ROI; không tạo kế hoạch hoặc được gọi là mô hình tối ưu Marketing. Không đổi API contract, huấn luyện mô hình, triển khai Criteo, thêm `/optimize` hoặc đổi Quality Gate khỏi BASELINE_ONLY. Dừng sau nâng cấp này.
