# Phase 5.2 — Hạn chế còn lại và quyết định bàn giao

Ngày04/11/2026. **Không còn P0/P1 hoặc test FAIL/BLOCKED đang mở trong phạm vi nghiệm thu local Phase5.2.** 8Tasks,11findingsF01–F11 và9failure probes có regression PASS. Kết quả không là nghiệm thu khuyến nghị kinh doanh thực tế.

## 1. Công việc còn lại

| Mức / loại | Hạn chế | Ảnh hưởng và hướng xử lý |
|---|---|---|
| P3 | Bundle JS680.18kB, warning>500kB | Không chặn build/demo. Cân nhắc lazy-load page/chart nếu Phase5.3 có scope; đo trước/sau, không dùng thay correctness tests |
| P3 | Chưa có lint script/config | Báo SKIP/NOT CONFIGURED; có thể bổ sung ở nhiệm vụ riêng. Không gọi TypeScript build là lint |
| Phạm vi minh họa | Dashboard KPI ROI/charts/12sample rows vẫn hardcode | Đã gắn nhãn nguồn/đơn vị/giới hạn. Không là analytics API hoặc dữ liệu doanh nghiệp. Không cần đổi dataset để nghiệm thu demo trung thực |
| Phạm vi minh họa | Compare ROI preset/điểm cố định vẫn mock; CRUD lưu browser | Không gọi predict, không sort ROI, không chọn best. Chưa save prediction thật sang Compare, chưa server persistence/batch API. Không coi những chức năng này đã hoàn thành |
| Snapshot | Insights đọc snapshot aggregate lịch sử +snapshot4B read-only | Phải cập nhật thủ công khi có kết quả được review. Không có dynamic research-report API; source paths là file trong repository |
| Persistence | Storage bị từ chối hoặc vượt quota | CRUD trong bộ nhớ hoạt động, thông báo rõ; thay đổi có thể mất khi reload. Version tương lai không biết được phục hồi rỗng có cảnh báo, không tự bịa migration |
| QA chưa thực hiện | Screen-reader/WCAG toàn diện, Safari/Firefox/mọiOS, load/security/pilot external | Không ghi PASS ngoài Windows/Edge và các hành vi đã test; lên scope riêng nếu cần |
| Deployment | CORS default chỉ local HTTP5173/4173 | Phù hợp demo; host/HTTPS thực cần cấu hình/review riêng. Override env thay defaults nên runbook yêu cầu đủ origin |

F12 font ngoài đã bỏ, favicon Vite không tồn tại đã bỏ và title Unicode đã sửa; phần bundle của F12 vẫn P3. Modal/keyboard/empty/storage/global metadata recovery không còn là issue đang mở trong trạng thái đã kiểm tra.

## 2. Blocker nghiên cứu giữ nguyên

- Mô hình ROI chưa vượt Dummy ổn định; gate **BASELINE_ONLY**. Historical Dummy1.732275 còn thiếu provenance để tái lập; đã gắn nhãn, không sửa số.
- Đơn vị/công thức kinh tế ROI chưa đủ chứng cứ. UI giữ thang đo dataset, không %/profit/ROAS conversion và không ROI±RMSE interval.
- Criteo là visit/uplift benchmark **RESEARCH_LIMITED**, không có ROI economics/mapping năm feature, policy không vượt response20. Không triển khai learner hoặc khuyến nghị đa kênh.
- Chưa có dữ liệu/pilot chính sách kinh doanh độc lập với assignment/cost/revenue/uncertainty cần thiết. Những blocker này **chặn phát hành khuyến nghị thực tế**, không chặn demo nghiên cứu có giới hạn và nhãn trung thực.

## 3. Quyết định

**GO cho Phase5.3 trong phạm vi hoàn thiện demo/tài liệu/báo cáo đồ án**, căn cứ [implementation report](phase5_2_implementation_report.md) và [test results](phase5_2_test_results.md):171ca duy nhất PASS, E2E lặp exit0, build thành công, artifacts/history nguyên vẹn. Không tự thực hiện Phase5.3 trong lượt này.

**NO-GO cho optimizer/khuyến nghị Marketing thực tế hoặc nâng gate VALIDATED.** GO của website không thay thế validation khoa học, không cho phép mở Test ROI hoặc triển khai Criteo. Không train/model change/Git init/push/deployment được thực hiện trong Phase5.2.
