# DreamMakers — User guide và runbook demo local

Phiên bản tài liệu04/11/2026, Phase5.3. Website nghiên cứu: Linear Regression1.0.0, **BASELINE_ONLY**; Criteo **RESEARCH_LIMITED** chỉ là snapshot báo cáo. Không có API tối ưu hoặc khuyến nghị Marketing thực tế.

Các lệnh dưới dựa trên package.json, cấu trúc app và requirements thực tế. Môi trường hiện có đã được kiểm thử; **không thực hiện lại cài đặt sạch/tải dependencies trong Phase5.3**. Không gọi hướng dẫn cài đặt là cold-install test đã PASS.

## 1. Môi trường và dependencies

Đã chạy: Windows/PowerShell, Node **24.19.0**, npm **11.17.0**, Python **3.13.17**, Edge cài sẵn chạy headless. ML requirements ghim sklearn1.6.1, pandas2.2.3, numpy2.4.6, joblib1.6.0; Backend requirements ghim FastAPI/Uvicorn/Pydantic/pytest/httpx. Python export artifact3.13.18 khác patch môi trường3.13.17 đã được ghi nhận, numerical/reference checks PASS; không cần đổi model để ép version.

Trong PowerShell, bắt đầu từ project root:

```powershell
Set-Location -LiteralPath 'D:\HK7 ĐẠI HỌC\MachineLearning\Marketing ROI Intelligence'
node --version
npm.cmd --version
& .\backend\.venv\Scripts\python.exe --version
```

Nếu thiết lập máy mới, dùng Python3.13 và lockfile hiện có. **Chỉ tạo venv khi backend/.venv chưa tồn tại**, không xóa/ghi đè môi trường đang dùng để demo:

```powershell
# Chỉ chạy khi chưa có venv. Windows Python Launcher đã có trên máy nghiệm thu.
py -3.13 -m venv backend/.venv
& .\backend\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
& .\backend\.venv\Scripts\python.exe -m pip check
npm.cmd ci
```

requirements.txt ghim dependencies trực tiếp và include requirements-models.txt; requirements.lock.txt là hồ sơ đầy đủ môi trường Backend. Không nâng phiên bản ML tùy tiện, không tạo lại joblib. `npm.cmd` tránh Execution Policy chặn npm.ps1, không cần đổi policy. Cài đặt cần quyền/network phù hợp; guide không khẳng định tải dependency đã kiểm thử trên mọi máy.

## 2. Khởi động Backend — terminal1

```powershell
# Bốn origin local kiểm soát cho dev và preview. Biến này thay thế defaults.
$env:DREAMMAKERS_CORS_ORIGINS='http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'
& .\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir .\backend --host 127.0.0.1 --port 8000
```

Giữ cửa sổ mở. Artifact mặc định ở backend/models; không chỉ đường dẫn đến model nghiên cứu/Criteo. Log cần báo startup hoàn tất. Swagger: http://127.0.0.1:8000/docs. Dừng server mình đã mở bằng Ctrl+C; không dừng process khác chỉ vì đang chiếm port.

## 3. Frontend development — terminal2

```powershell
$env:VITE_API_BASE_URL='http://127.0.0.1:8000'
$env:VITE_API_TIMEOUT_MS='10000'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Mở http://127.0.0.1:5173/#predict. API base/timeout nằm trong src/services/apiClient.ts, .env.example có mẫu. .env.local có thể dùng thay biến terminal; không đặt bí mật trong VITE_* vì được đưa vào frontend.

## 4. Production build và preview

Giữ Backend đang chạy. Dừng dev nếu muốn dùng duy nhất một cửa sổ Frontend. Mặc định package scripts:

```powershell
$env:VITE_API_BASE_URL='http://127.0.0.1:8000'
$env:VITE_API_TIMEOUT_MS='10000'
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Mở http://127.0.0.1:4173/#predict. Vite đóng API base vào bundle lúc build; thay biến phải build lại. Nếu muốn dùng **đúng bundle nghiệm thu Phase5.3** đã lưu:

```powershell
npm.cmd run preview -- --outDir research/phase5/run_phase5_3/build --host 127.0.0.1 --port 4173 --strictPort
```

Lượt nghiệm thu đã build bằng `npm.cmd run build -- --outDir research/phase5/run_phase5_3/build`; E2E và browser acceptance dùng Vite preview API mở chính thư mục này ở4173 và gọi Backend thật. Hai A/B đều khớp reference. CLI preview dựa trên script `vite preview` trong package.json; không phải lệnh một framework khác.

## 5. Kiểm tra API — terminal kiểm tra riêng

```powershell
$health=Invoke-RestMethod 'http://127.0.0.1:8000/health'
$health | Format-List
$info=Invoke-RestMethod 'http://127.0.0.1:8000/model-info'
$info | ConvertTo-Json -Depth 8
```

Không chỉ nhìn HTTP200: cần `health.status=ok`, `application_running=true`, `model_ready=true`. Model-info cần Linear Regression/version1.0.0, targetROI, năm features, BASELINE_ONLY/research=true, allowed durations15/30/45/60; auto ranking/optimization=false. `/health` có thể200/degraded khi model không nạp được.

Gửi hai mẫu trực tiếp từ artifact reference, không gõ lại giá trị kỳ vọng:

```powershell
$reference=Get-Content -LiteralPath .\backend\models\reference_prediction.json -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($case in $reference.cases) {
  $body=$case.features | ConvertTo-Json
  $response=Invoke-RestMethod 'http://127.0.0.1:8000/predict' -Method Post -ContentType 'application/json' -Body $body
  $expected=[double]$case.expected_predictions.'Linear Regression'
  [pscustomobject]@{
    Case=$case.name
    Predicted=$response.predicted_roi
    Expected=$expected
    AbsoluteError=[Math]::Abs([double]$response.predicted_roi-$expected)
    Model=$response.model_name
    Gate=$response.quality_status
  }
}
```

Kỳ vọng A4.991136884533976, B4.997267870097019, error≤1e−6 (lượt nghiệm thu error0), LR/BASELINE_ONLY. ROI là target theo thang đo dataset, không tự hiểu là%/profit/ROAS. Payload cần đúng năm trường tiếng Anh; string `"30"`, float30.0, bool, null, missing/extra/query/invalid category hoặc duration31 bị422. Chỉ server quyết định model và gate.

## 6. Sử dụng bốn trang

- **Dashboard:** đọc chú thích minh họa; chart/KPI ROI/12sample records không là dữ liệu vận hành thực. Dùng tìm/lọc/pager để trình diễn UI.
- **Predict:** chọn đủ năm feature, đợi metadata ready, bấm Predict. Đổi input/reset xóa kết quả cũ. Khi lỗi, đọc alert và tải lại metadata sau khi Backend phục hồi; không dùng mock thay thế.
- **Compare:** tạo/sửa/nhân bản/xóa/lưu browser. ROI minh họa không lấy từ Predict; chỉ sort tên/thời lượng. Có thể xóa hết và reload vẫn giữ rỗng. Storage lỗi có recovery/notice; khi không ghi được thì state chỉ trong bộ nhớ.
- **Insights:** đọc metadata đang chạy và nguồn snapshot lịch sử. Phase4B.2 ROI và Criteo visit là hai khối riêng; RESEARCH_LIMITED không nâng production gate. Fold lịch sử và economics còn thiếu bằng chứng.

UC-06 là DEMO_ONLY, UC-08 NOT_IMPLEMENTED. Không có chức năng nhận chiến dịch tối ưu. Xem [ma trận UC](uc_acceptance_matrix.md) và [kịch bản7phút](phase5_3_demo_script.md).

## 7. Chạy test có evidence riêng

Dừng Backend/dev/preview **do mình chạy** trước E2E hoặc offline; runner từ chối reuse port của process khác. Sau E2E, server test được tự đóng. Các tên thư mục sau dành cho lần kiểm tra tiếp theo, không ghi đè hồ sơ nghiệm thu Phase5.3:

```powershell
New-Item -ItemType Directory -Force research/phase5/demo_checks | Out-Null
& .\backend\.venv\Scripts\python.exe -X utf8 -m pytest backend -c backend/pytest.ini --junitxml=research/phase5/demo_checks/backend.xml
npm.cmd test -- --reporter=default --reporter=json --outputFile.json=research/phase5/demo_checks/frontend.json
& .\backend\.venv\Scripts\python.exe -m compileall -q backend/app
npm.cmd run build -- --outDir research/phase5/demo_checks/build

$env:DM_TEST_BUILD_DIR='research/phase5/demo_checks/build'
$env:DM_TEST_RESULTS_DIR='research/phase5/demo_checks/e2e'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='research/phase5/demo_checks/e2e.json'
npm.cmd run test:e2e -- --reporter=list,json --output=research/phase5/demo_checks/browser-artifacts

# Chỉ khi cả Backend và Frontend không chạy, không interception:
npm.cmd run test:offline
```

Phải cung cấp DM_TEST_BUILD_DIR để chạy ca preview; nếu thiếu, chính ca đó SKIP và chưa đạt full acceptance. Các env DM_TEST_* chỉ điều khiển test infrastructure, không đổi model/gate. Kiểm `$LASTEXITCODE`, JSON stats và cleanup JSON; không coi log có vài dòng “ok” là toàn runner PASS.

Lượt mới Phase5.3:62BE+78FE+31E2E=171PASS,0FAIL/0SKIP/0BLOCKED; browser acceptance cuối bổ sung46assertions, không cộng trùng vào171ca. Một lượt helper kiểm cột sau full-page capture từng FAIL, đã chẩn đoán và kiểm lại bằng viewport thực, không thay sản phẩm; xem final acceptance để không bỏ qua lịch sử FAIL. Lint chưa có script nên NOT_CONFIGURED, không báo lint PASS. Tests có thể ghi generated outputs ở backend/tests và tests/results; khi cần giữ nguyên evidence cũ hãy sao lưu/khôi phục như guard của lượt nghiệm thu này.

## 8. Lỗi thường gặp và phục hồi

| Hiện tượng | Kiểm tra / xử lý | Điều không được kết luận hoặc làm |
|---|---|---|
| npm.ps1 bị chặn | Dùng npm.cmd như hướng dẫn | Không cần đổi Execution Policy toàn máy |
| Port8000/5173/4173 đã có process | Xem terminal mình đang mở; dùng đúng server hoặc Ctrl+C server của mình trước chạy test | Không kill process không rõ chủ sở hữu; không đổi port frontend tùy tiện rồi quên CORS |
| Health200 nhưng degraded/model_ready=false | Kiểm đủ bảy files và SHA manifest; xem log model loading; giữ đúng venv/dependencies/path mặc định | Không fallback ROI giả, không sửa/retrain joblib hoặc manifest để bỏ lỗi |
| Metadata/predict không kết nối được | Backend phải ở8000; build API_BASE_URL đúng; restart/build lại khi đổi env; bấm tải lại | Không giả Backend đang chạy bằng screenshot cũ |
| Preview bị CORS | Dùng originlocalhost/127.0.0.1:4173; nếu DREAMMAKERS_CORS_ORIGINS override, thêm đủ bốn origin và restart Backend | Không mở wildcard hoặc nâng gate |
| HTTP422 | Đối chiếu đúng key/type/category và15/30/45/60; dùng payload reference | Không coi mọi lỗi422 là lỗi model |
| HTTP503 hoặc500 | 503kiểm readiness/metadata;500xem log Backend an toàn, giữ input hợp lệ và dependency đúng | Không giữ ROI stale hoặc sửa artifact để ép trả200 |
| Compare phục hồi dữ liệu | Đọc notice; invalid records bị bỏ, current/legacy hợp lệ được giữ; khi denied/quota thì chỉ state bộ nhớ | Không hứa đã lưu server; không xóa storage cá nhân ngoài profile demo |
| E2E không thoát / không có JSON cuối | Kiểm cleanup/backend log, port và PID do test ghi; thu evidence và báo BLOCKED nếu còn treo | Không process.exit(0), bỏ assertion hoặc force kill để gọi PASS |
| Build cảnh báo chunk>500kB | Build hiện vẫn thành công; ghi nhận P3 về bundle | Không gọi warning này là build FAIL hoặc đã tối ưu hiệu năng |

## 9. Kết thúc phiên demo

Dừng preview/dev và Backend của mình bằng Ctrl+C. Test runner/capture script tự đóng resource của nó và ghi cleanup; không để các server test tồn đọng. Giữ screenshot/log/JSON gốc nếu cần dẫn Chương5. Không sửa artifact, metrics lịch sử hoặc Test ROI để làm đẹp kết quả demo. Không tự triển khai Phase5.4, optimizer hay Criteo serving.
