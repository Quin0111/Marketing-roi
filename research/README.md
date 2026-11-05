# Nghiên cứu khả thi Phase 4B.1

Ba báo cáo:

- [Kiểm tra dữ liệu và bảo vệ Test](phase4b1_data_audit.md).
- [Đánh giá feature và tín hiệu ROI](phase4b1_feature_assessment.md).
- [Khuyến nghị, Quality Gate và kế hoạch tiếp theo](phase4b1_recommendations.md).

Chỉ tạo nội dung trong `research/`. Không sửa mã ứng dụng, API, bảy artifact hoặc Quality Gate. Phân tích ROI chỉ dùng Development 170.000 dòng khôi phục chính xác từ archive Colab. File membership chỉ chứa index, không chứa outcome của Test.

Thư viện bổ sung nằm trong `.deps/`, không cài vào backend/.venv. Dùng phiên bản ML đã có trong backend/.venv và danh sách thư viện vẽ/đọc PDF tại `requirements-extra.txt`.

Từ thư mục dự án, chạy tuần tự trong PowerShell:

```powershell
& .\backend\.venv\Scripts\python.exe -m pip install --target research/.deps --no-deps -r research/requirements-extra.txt
& .\backend\.venv\Scripts\python.exe -X utf8 research/scripts/audit_phase4b1.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/scripts/review_sources.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/scripts/render_reports.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/scripts/check_results.py
```

Script audit mặc định đọc CSV ở thư mục MachineLearning cấp trên, notebook và archive ở Downloads của máy hiện tại. Có thể truyền `--dataset`, `--notebook`, `--archive` để đổi vị trí cùng tệp gốc. Script sẽ dừng nếu hash/protocol/index không khớp. Không nạp joblib không rõ nguồn; archive được đối chiếu với ba artifact tin cậy và split hash trước khi nạp.

`templates/*.md.in` giữ nội dung báo cáo; `render_reports.py` ghép bảng từ output để tránh nhập lại số. Kết quả số, split/fold manifests, SHA256, 199 permutation tests, CV mới, 3 biểu đồ PNG và kiểm tra nguyên vẹn nằm trong `outputs/phase4b1/`.

Lưu ý quan trọng: chẩn đoán CV mới không tái lập được bộ metrics 5-Fold đã công bố và không thay thế bộ đó. Hồ sơ lịch sử cần được đối chiếu trước nâng cấp; không dùng Test để tìm split cho khớp số. Các mô hình research là đối tượng mới trong bộ nhớ, không lưu hoặc thay thế production.

Hai lỗi tái lập đã xử lý: notebook đặt tên hiển thị cho trục cột nên phép đối chiếu bỏ qua riêng metadata tên trục; threadpoolctl trên Windows không xử lý được đường dẫn Unicode của DLL, nên script giới hạn OpenBLAS/OMP bằng biến môi trường ngay trước import. Không sửa thư viện Backend để giải quyết hai lỗi này.

Dừng sau Phase 4B.1. Kết quả chạy script PASS chỉ xác nhận phân tích và kiểm tra toàn vẹn hoàn tất; không có nghĩa mô hình đạt Quality Gate.
