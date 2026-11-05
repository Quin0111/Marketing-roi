# DreamMakers — thực nghiệm ROI Phase 4B.2

Benchmark nghiên cứu mới, tách khỏi bảng 5-Fold lịch sử chưa tái lập được. Dùng **DM-DEV-170K-v1** đã đóng băng trong Phase 4B.1A. Chỉ đọc Development; không thay đổi ứng dụng, artifact gốc hoặc Quality Gate BASELINE_ONLY.

## Thiết kế đã đăng ký trước

- Development = Train gốc 140.000 nối Validation gốc 30.000, giữ order.
- Outer 5-Fold ×3 seed: 42, 2026, 20261103; toàn bộ 15 fold, fit 136.000/assessment 34.000 mỗi fold.
- Inner 3-Fold; seed `100000*repeat_1based + 1000*outer_fold_1based + 17`; mọi bước học tham số nằm trong pipeline fit riêng.
- Model random_state = 314159; hai thread; một fit tại một thời điểm.
- Cùng năm feature gốc cho tất cả mô hình. Không ROI trong X, Date, ID hoặc chỉ số sau chiến dịch.
- Dummy/OLS mỗi mô hình 1 cấu hình cố định; DT/RF/HGB mỗi mô hình 2 cấu hình. Đánh giá cả cấu hình cố định trong inner để lưu cùng cấu trúc log.
- Tổng 360 fit inner và 75 outer refit. Chọn cấu hình chỉ theo mean RMSE inner, tie-break theo thứ tự cấu hình. Không chỉnh grid/seed sau khi xem outer score.
- RF giới hạn 32 cây cho cả hai cấu hình; kết quả chỉ đại diện ngân sách này, không phải thử lại RF production 200 cây.
- HGB dùng ordinal encoding từ fit fold và native categorical mask cho bốn cột phân loại; early_stopping=False, không dùng outer assessment để dừng. OLS dùng One-hot + StandardScaler; DT/RF/Dummy dùng One-hot, cùng input gốc.
- Không chạy feature mở rộng: Phase 4B.1 mới có giả định semantic, chưa có snapshot xác nhận availability trước chiến dịch. CatBoost là tùy chọn, không thêm vào không gian tìm kiếm lần này.

Toàn bộ tham số trong `experiment_config.json`, được hash cùng code/protocol trước preflight. `results/preregistered_run.json` lưu môi trường, thư viện, threadpool và manifest outer/inner.

## Chạy từ thư mục dự án (PowerShell)

Môi trường Python 3.13.17 `backend/.venv` đã có đủ dependencies. Không cần cài hoặc sửa môi trường production. `requirements.txt` ghi các thư viện ML sử dụng; vẽ hình dùng `research/.deps` theo `research/requirements-extra.txt` đã có từ Phase 4B.1.

```powershell
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b2/run_experiment.py --preflight-only
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b2/run_experiment.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b2/analyze.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b2/reproduce.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b2/verify_results.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b2/render_report.py
```

Runner resume ở checkpoint `results/jobs/*/completed.json`; code/config/data/fold hash thay đổi sẽ bị từ chối, không trộn run. Chạy lại lệnh runner khi đã COMPLETE chỉ kiểm tra/skips checkpoint. Để lặp lại mô hình, dùng `reproduce.py`, không gọi thao tác skip là tái huấn luyện.

## Bảo vệ Test và lịch sử

`load_verified()` kiểm tra hash CSV/membership/schedule, replay split bằng row IDs rồi gọi `read_csv(skiprows=...)` để loại Test trước khi materialize ROI. Không đọc/nạp `y_test` hoặc `data_splits.joblib`. Hash byte stream CSV chỉ phục vụ toàn vẹn. Chỉ input source + Duration thô + ROI Development được parse; Date không được đọc.

Snapshot SHA256 bảo vệ Frontend, Backend, bảy artifact, các báo cáo/script/output nghiên cứu trước. Chỉ tạo file trong `research/phase4b2/`. Không tạo hoặc ghi lại model joblib mới, không endpoint optimize, không Git commit/push.

## Kiểm tra tái lập

`reproduce.py` fit lại độc lập cả 75 cấu hình outer đã chọn, kiểm tra prediction/metric trong dung sai 1e-12 và thống kê preprocessor chỉ từ fit fold. Nó còn lặp toàn bộ 24 fit inner của outer repeat1/fold1. Đây **không phải** lần chạy lặp đầy đủ cả 360 inner fit; phạm vi được ghi rõ trong `reproducibility.json`.

## Các file kết quả

- `model_experiment_report.md`: báo cáo chính.
- `results/preregistered_run.json`, `preflight.json`, `progress.json`: nguồn, protocol, status và feasibility.
- `results/jobs/*/inner_trials.json`: mọi cấu hình/fold inner, train/validation score, thời gian, warnings.
- `results/jobs/*/completed.json`: lựa chọn từ inner và outer metrics, train gap, hash scope/prediction.
- `results/jobs/*/outer_predictions.npz`: row IDs, y thật **Development** và OOF prediction; không có Test.
- `results/all_inner_trials.csv`, `outer_fold_scores.csv`, `repeat_summary.csv`, `model_summary.csv/json`: raw và tổng hợp.
- `results/reproducibility.json`, `verification_checks.json`, `final_integrity.json`: tái lập và nghiệm thu.
- `results/outer_deltas_and_train_gap.png`: hình khoa học standalone.

Mean RMSE qua fold và pooled OOF được lưu riêng. Fold SD chỉ mô tả, không là CI. Thời gian fit gồm preprocessing + estimator fit, không gồm prediction; outer refit và tổng inner cost tách riêng. Các phép fit dùng cùng máy, tuần tự, giới hạn hai thread, nhưng thuật toán có cơ chế song song khác nhau; không so sánh thời gian với Colab/prod như một benchmark phần cứng chuẩn.

## Lỗi đường dẫn Unicode của threadpoolctl

Trên Windows/Python 3.13, snapshot module discovery trả đường dẫn DLL bị biến đổi cho workspace tiếng Việt. `runtime()` chỉ trong tiến trình nghiên cứu chuyển sang nhánh fallback `EnumProcessModulesEx` wide-character **đã có trong threadpoolctl** khi gặp FileNotFoundError. Sau đó kiểm tra số thread thực tế. Không sửa package trên đĩa hoặc thay thuật toán fit/scoring. Môi trường và việc dùng fallback được ghi lại.
