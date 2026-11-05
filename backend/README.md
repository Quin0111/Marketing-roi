# DreamMakers Backend — Phase 2

API dự đoán ROI nghiên cứu bằng **Linear Regression** đã fit. Quality Gate **BASELINE_ONLY**: cho phép dự đoán minh họa, cấm xếp hạng/khuyến nghị tối ưu. Không có endpoint thay đổi Quality Gate hoặc `/optimize`.

## Chạy bằng PowerShell

Từ thư mục dự án:

```powershell
# Môi trường .venv hiện có dùng Python 3.13.17.
& .\backend\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
& .\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir .\backend --host 127.0.0.1 --port 8000
```

Swagger: http://127.0.0.1:8000/docs. Dừng server bằng Ctrl+C.

Nếu cần tạo môi trường mới, dùng Python 3.13 và chạy `python -m venv backend/.venv` với đúng executable 3.13. Không xóa Python 3.14 hiện có. `requirements.lock.txt` ghi đầy đủ môi trường đã chạy kiểm thử; `requirements.txt` ghim dependencies trực tiếp và dùng lại phiên bản ML của Phase 1.

## Cấu trúc

```text
backend/
  app/
    main.py                       # App factory, lifespan, CORS, lỗi an toàn
    api/routes.py                 # /health, /model-info, /predict
    schemas/prediction.py         # Pydantic strict, cấm trường thừa
    services/model_service.py     # Nạp artifact tin cậy, xác thực miền, predict thật
    config/settings.py            # Đường dẫn theo vị trí source, biến môi trường
    config/artifact_sha256.json   # SHA256 bảy artifact từ kết quả Phase 1
    config/deployment_metadata.json # Miền thời lượng đã đối chiếu CSV/notebook
  models/                         # Bảy artifact gốc, không sửa
  tests/
    verify_models.py             # Phase 1, bốn pipeline × hai reference
    test_api.py                  # T01–T16 và kiểm thử bổ sung
    verify_duration.py           # Chỉ đọc cột Duration từ CSV gốc
    verify_http.py               # Khởi động Uvicorn, HTTP thật trên 8000
    duration_verification.json   # Phân phối thời lượng + SHA256 nguồn
    phase1_results.json
    phase2_pytest.xml
    http_results.json            # Request/response HTTP và SHA256 trước/sau
    http_server.log
    phase2_acceptance.md          # Báo cáo nghiệm thu
  requirements.txt
  requirements.lock.txt
```

## Endpoint

- `GET /health`: HTTP 200 khi ứng dụng đang chạy; `status=ok`/`degraded`, `application_running`, `model_ready`, `model_name`, `api_version`. Mất pipeline vẫn có health nhưng `model_ready=false`.
- `GET /model-info`: tên, artifact version, feature, metrics gốc và toàn bộ 5-Fold CV, danh mục từ encoder, bốn thời lượng, Quality Gate, cảnh báo. Nếu metadata lỗi/mất: 503. Khi chỉ pipeline lỗi, thông tin metadata còn đọc được với `model_ready=false`.
- `POST /predict`: đúng năm feature bên dưới; 200 chứa ROI số hữu hạn không làm tròn, model/version, `quality_status=BASELINE_ONLY`, `is_research_only=true`, cảnh báo tiếng Việt. Lỗi đầu vào 422; model chưa sẵn sàng 503; lỗi suy luận hoặc ROI không hữu hạn 500 và không có ROI thay thế.

```powershell
$campaign = @{
  Campaign_Type = 'Social Media'
  Channel_Used = 'Facebook'
  Target_Audience = 'Women 25-34'
  Customer_Segment = 'Fashionistas'
  Duration_days = 30
} | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/model-info
Invoke-RestMethod http://127.0.0.1:8000/predict -Method Post -ContentType 'application/json' -Body $campaign
```

`Duration_days` phải là số nguyên **15, 30, 45, 60**; chuỗi `"30"`, số thực `30.0`, boolean, null và các giá trị khác bị từ chối. Danh mục phải khớp chính xác `allowed_categories` từ `/model-info`; không tự sửa tên hoặc bổ sung danh mục. Trường thừa, kể cả tên model/Quality Gate/path, bị từ chối. `/predict` và `/model-info` từ chối query; header không thay đổi trạng thái chất lượng.

## Cấu hình server

```powershell
# Tùy chọn; mặc định dùng bốn origin local dev/preview này.
$env:DREAMMAKERS_CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'
# Chỉ cấu hình server; đường dẫn tương đối được tính từ backend/, không từ cwd.
$env:DREAMMAKERS_MODEL_DIR = 'models'
```

CORS chỉ cho phép origin HTTP local được khai báo chính xác, có port; không wildcard, không credentials. Tham số Uvicorn chọn host/port. Chỉ server được cấu hình đường dẫn mô hình; client không có khả năng chọn artifact.

Pipeline được nạp một lần mỗi process qua [FastAPI lifespan](https://fastapi.tiangolo.com/advanced/events/). Trước unpickle, backend kiểm tra SHA256 của Linear Regression; metadata/metrics cũng phải khớp manifest Phase 1. Artifact hỏng/khác manifest khiến readiness thất bại, không fallback. Manifest giữ SHA256 của cả bảy file để nghiệm thu toàn bộ. Không nạp mô hình client upload hoặc mô hình tùy ý. Log lỗi ghi loại lỗi, không ghi payload, stack trace hoặc đường dẫn cho client.

## Bằng chứng thời lượng

Đã đọc file CSV gốc `D:\HK7 ĐẠI HỌC\MachineLearning\marketing_campaign_dataset.csv` và đối chiếu source notebook `C:\Users\ASUS\Downloads\MachineLearningcki (8).ipynb`, cell 34/115 (đánh số từ 0). Không thực thi notebook. Phép chuyển đổi: `Duration.str.extract(r'(\d+)').astype(int)`.

| Duration | Duration_days | Số dòng |
|---|---:|---:|
| 15 days | 15 | 49.779 |
| 30 days | 30 | 50.255 |
| 45 days | 45 | 50.100 |
| 60 days | 60 | 49.866 |

Tổng 200.000 dòng, không thiếu Duration. Chỉ đọc cột Duration để xác minh miền đầu vào, không đọc ROI để đánh giá, không chọn mô hình hoặc huấn luyện, không dùng mock. SHA256 CSV/notebook và kết quả nằm trong `tests/duration_verification.json`. Metadata triển khai bổ sung trong `app/config/deployment_metadata.json`; `models/model_metadata.json` và hai reference A/B giữ nguyên. API không cần CSV/notebook hoặc reference khi chạy suy luận.

## Kiểm thử

```powershell
# Từ thư mục dự án
& .\backend\.venv\Scripts\python.exe .\backend\tests\verify_models.py
Push-Location .\backend
try {
  & .\.venv\Scripts\python.exe -m pytest -q --junitxml=tests/phase2_pytest.xml
} finally { Pop-Location }
& .\backend\.venv\Scripts\python.exe .\backend\tests\verify_http.py
& .\backend\.venv\Scripts\python.exe -m pip check

# Chạy lại xác minh Duration khi CSV/notebook gốc còn ở máy
& .\backend\.venv\Scripts\python.exe .\backend\tests\verify_duration.py 'D:\HK7 ĐẠI HỌC\MachineLearning\marketing_campaign_dataset.csv' 'C:\Users\ASUS\Downloads\MachineLearningcki (8).ipynb'
```

`verify_http.py` yêu cầu cổng 8000 đang trống: tự khởi động server, gửi HTTP thật rồi dừng đúng process nó tạo. Không can thiệp server đang chạy của người dùng. Kiểm thử API dùng [TestClient trong context manager](https://fastapi.tiangolo.com/advanced/testing-events/) để chạy lifespan thật. HTTPX2 phục vụ TestClient Starlette hiện tại; HTTPX phục vụ HTTP thật trong script.

Python 3.13.17 khác patch với môi trường xuất 3.13.18; kiểm thử đối chiếu Phase 1 và API xác nhận sai số <= 1e-6. Đây là kiểm tra tính nhất quán suy luận, không phải bằng chứng mô hình vượt baseline. Phase 2 không sửa frontend và không tích hợp service frontend; đó là phạm vi Phase 3.
