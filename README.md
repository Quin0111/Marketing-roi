# DreamMakers – Marketing ROI Intelligence

> **Đồ án Đại học:** “Xây dựng website dự đoán và hỗ trợ tối ưu hiệu quả chiến dịch Marketing bằng Machine Learning”  
> **Nền tảng:** Marketing Analytics SaaS Dashboard (React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Lucide Icons)  
> **Ngôn ngữ giao diện:** 100% Tiếng Việt chuẩn mực, hỗ trợ thuật ngữ khoa học chính xác.

---

## 1. Giới thiệu tổng quan

**DreamMakers – Marketing ROI Intelligence** là hệ thống bảng điều khiển (Dashboard) phân tích thông minh dành cho các chiến dịch tiếp thị số (Digital Marketing). Hệ thống được thiết kế theo phong cách hiện đại của các phần mềm SaaS phân tích dữ liệu hàng đầu, chú trọng tính thẩm mỹ, tính khoa học, sự liêm chính học thuật và trải nghiệm người dùng cao cấp để phục vụ trình diễn trong buổi bảo vệ đồ án tốt nghiệp đại học.

### Đặc điểm thiết kế & Kiến trúc UI/UX:
- **Giao diện thuần Việt 100%:** Toàn bộ tiêu đề, nhãn danh mục, mô tả, thông báo lỗi, trạng thái và giải thích khoa học đều được Việt hóa tự nhiên, chuẩn mực theo ngữ cảnh tiếp thị số.
- **Bảo toàn dữ liệu kỹ thuật:** Các giá trị gửi đến mô hình Machine Learning (`Campaign_Type`, `Channel_Used`, `Target_Audience`, `Customer_Segment`, `Duration_days`) được bảo đảm giữ nguyên giá trị kỹ thuật gốc bên dưới thông qua bảng ánh xạ tập trung `src/constants/translations.ts`.
- **Phong cách Marketing Analytics SaaS:** Bảng màu chuyên nghiệp: Trắng, xanh chính `#2563EB` / hover `#1D4ED8`, sidebar `#0F172A` / active `#1E293B`, nền `#F8FAFC`, viền `#E2E8F0`; card trắng và không gradient.
- **Typography & Định dạng tiếng Việt:** Dùng font hệ thống dự phòng, không tải font ngoài khi chạy demo; số dùng định dạng tiếng Việt như `200.000`, `5,0024`. ROI theo thang đo dataset, chưa xác minh đơn vị kinh tế; không quy đổi sang phần trăm/lợi nhuận.
- **Cơ chế Quality Gate tích hợp:** Kiểm soát chặt chẽ chất lượng mô hình Machine Learning, đảm bảo tính liêm chính và trung thực học thuật.

---

## 2. Bảng Ánh xạ Giá trị Kỹ thuật sang Nhãn Tiếng Việt

Tất cả các nhãn lựa chọn trên giao diện được quản lý tập trung tại [src/constants/translations.ts](file:///d:/HK7%20ĐẠI%20HỌC/MachineLearning/Marketing%20ROI%20Intelligence/src/constants/translations.ts):

| Tên đặc trưng (Feature) | Giá trị kỹ thuật gốc (Backend / Model) | Nhãn hiển thị Tiếng Việt trên giao diện |
|---|---|---|
| **Campaign_Type** | `Display` | Quảng cáo hiển thị |
| | `Email` | Tiếp thị qua Email |
| | `Influencer` | Tiếp thị qua người ảnh hưởng |
| | `Search` | Quảng cáo tìm kiếm |
| | `Social Media` | Tiếp thị mạng xã hội |
| **Channel_Used** | `Email` | Email |
| | `Facebook` | Facebook |
| | `Google Ads` | Google Ads |
| | `Instagram` | Instagram |
| | `Website` | Website |
| | `YouTube` | YouTube |
| **Target_Audience** | `All Ages` | Mọi độ tuổi |
| | `Men 18-24` | Nam từ 18–24 tuổi |
| | `Men 25-34` | Nam từ 25–34 tuổi |
| | `Women 25-34` | Nữ từ 25–34 tuổi |
| | `Women 35-44` | Nữ từ 35–44 tuổi |
| **Customer_Segment** | `Fashionistas` | Người yêu thích thời trang |
| | `Foodies` | Người yêu thích ẩm thực |
| | `Health & Wellness` | Người quan tâm sức khỏe |
| | `Outdoor Adventurers` | Người yêu thích hoạt động ngoài trời |
| | `Tech Enthusiasts` | Người yêu thích công nghệ |
| **Duration_days** | `15` | 15 ngày |
| | `30` | 30 ngày |
| | `45` | 45 ngày |
| | `60` | 60 ngày |

---

## 3. Cấu trúc 3 Trang Phân hệ Chính

### 1. Tổng quan (Dashboard)
- **Bốn chỉ số:** Dataset gốc 200.000 dòng theo kiểm toán cấu trúc; Development 170.000 dòng; 5 loại chiến dịch và 6 kênh.
- **Hai biểu đồ phân phối số đếm:** Loại chiến dịch và kênh quảng cáo trên Development. Snapshot `src/data/verifiedDataset.json` trích đúng số đếm đã công bố từ `research/outputs/phase4b1/development_group_statistics.csv`, kèm SHA-256. Không đọc ROI Test để tạo thống kê.
- **Bảng riêng DEMO_DATA:** 12 dòng minh họa, hỗ trợ tìm kiếm/lọc/phân trang, không phải bản ghi vận hành hoặc kết quả API.
- **Điều hướng:** Nút đến Predict và Compare. Nguồn và phạm vi thống kê trong mục mở xem chi tiết.

### 2. Dự đoán ROI của chiến dịch Marketing (Predict ROI)
- **Biểu mẫu cấu hình 5 đặc trưng:** Loại chiến dịch, Kênh Marketing, Đối tượng mục tiêu, Phân khúc khách hàng, Thời lượng chiến dịch.
- **Chức năng tương tác:** Kiểm tra dữ liệu đầu vào (Validation), nút "Dự đoán ROI", nút "Làm mới", hiệu ứng tính toán và tóm tắt trực quan các thuộc tính đã chọn.
- **Khu vực kết quả dự đoán:**
  - ROI dự đoán: Nhận trực tiếp từ `POST /predict`, giữ nguyên độ chính xác gốc; chỉ làm tròn bốn chữ số khi hiển thị. Không suy ra khoảng tin cậy từ RMSE.
  - Mô hình sử dụng: `Linear Regression`, hiển thị phiên bản artifact Backend trả về.
  - Chất lượng mô hình: Trạng thái `Chưa vượt mô hình cơ sở` (BASELINE_ONLY).
  - Thông tin chiến dịch: Tóm tắt 5 đặc trưng đã chọn bằng tiếng Việt.
  - Cảnh báo bắt buộc:
    > *"Các mô hình Machine Learning hiện chưa cải thiện hiệu năng so với Dummy Regressor. Vì vậy, kết quả dự đoán chỉ có giá trị tham khảo trong phạm vi nghiên cứu và chưa đủ cơ sở để đưa ra khuyến nghị tối ưu chiến dịch Marketing."*
  - **Lưu thành kịch bản so sánh:** Thêm cấu hình vào danh sách hiện có, chuyển kết quả API thật sang Compare trong bộ nhớ với fingerprint năm feature và metadata khớp. Không ghi kết quả mô hình vào localStorage; reload cần dự đoán lại. Lỗi đọc/ghi không ghi đè âm thầm hoặc báo lưu thành công.

#### Thông tin mô hình (mở rộng trong Dự đoán ROI)
Trang phân tích khoa học dành riêng cho hội đồng đánh giá đồ án:
- **Tổng quan ngắn:** Linear Regression hiện phục vụ ROI; Dummy là baseline trung bình, RMSE đo độ lớn sai số. Metadata API và snapshot lịch sử được ghi riêng. Mục nguồn, giới hạn mô hình và nghiên cứu bổ sung có thể mở xem.
| Mô hình cơ sở | 1,500843 | 1,732275 | -0,000045 | - | **Mô hình chuẩn (Baseline)** |
| **Linear Regression (Hồi quy tuyến tính)** | Mô hình học máy | 1,500916 | 1,732384 | -0,000171 | Chưa xác minh | **Chưa vượt mô hình cơ sở** |
| **Decision Tree (Cây quyết định)** | Mô hình học máy | 1,501221 | 1,732903 | -0,000771 | Chưa xác minh | **Chưa vượt mô hình cơ sở** |
| **Random Forest (Rừng ngẫu nhiên)** | Mô hình học máy | 1,502294 | 1,734325 | -0,002413 | Chưa xác minh | **Chưa vượt mô hình cơ sở** |

- **3 Biểu đồ đối chiếu chỉ số:** So sánh MAE, RMSE (tiêu chí then chốt), R² với trục tung được zoom chi tiết.
- **Giải thích metric:** Phân biệt định nghĩa và giả thuyết nguyên nhân. Snapshot lịch sử từ model_metrics.json ghi Development170k, Dummy RMSE1.732275 còn giới hạn tái lập theo4B.1A. Không thay số lịch sử bằng kết quả diagnostic mới.
- **Panel Phase4B read-only:** ROI4B.2 trên giao thức15fold riêng và Criteo visit/uplift RESEARCH_LIMITED. Không đổi Qini thành ROI hoặc phục vụ S-Learner. Snapshot có đường dẫn nguồn trong repository.
- **Tuyên bố liêm chính học thuật nguyên văn:**
  > *"Qua thực nghiệm 5-Fold Cross-Validation, các mô hình Linear Regression, Decision Tree và Random Forest chưa cải thiện hiệu năng so với Dummy Regressor. Vì vậy, kết quả dự đoán hiện tại chỉ phục vụ mục đích nghiên cứu và minh họa, chưa đủ cơ sở để đưa ra khuyến nghị tối ưu chiến dịch Marketing trong thực tế."*


### 3. So sánh & Đề xuất (Compare Scenarios)
- **Quản lý kịch bản:**
  - Tạo mới kịch bản qua cửa sổ pop-up (nhập tên kịch bản, 5 đặc trưng, ghi chú).
  - Chỉnh sửa thông tin kịch bản có sẵn.
  - Nhân bản kịch bản để thử nghiệm các biến thể nhỏ.
  - Xóa kịch bản (có hộp thoại xác nhận tiếng Việt và cơ chế an toàn).
  - Khởi tạo sẵn 2 kịch bản mẫu tiếng Việt: *Kịch bản A: Quảng cáo tìm kiếm khách hàng công nghệ* và *Kịch bản B: Tiếp thị thời trang nữ trên Instagram*.
- **Dự đoán từng kịch bản:** Nút riêng gọi POST /predict qua API client hiện có; validate domain từ model-info. Hiển thị loading/error/retry hoặc “Đã dự đoán bằng mô hình”, kèm ROI/model/version/BASELINE_ONLY/warning. Không gọi tự động khi chỉ CRUD.
- **Bảng đối chiếu:** Tách cột ROI mô phỏng và kết quả API; chỉ sort tên/thời lượng, không sort ROI hoặc chọn phương án tốt nhất. Scenario mới ở trạng thái chưa dự đoán, không tự sinh điểm mock.
- **Biểu đồ:** Mặc định chỉ vẽ kết quả API thành công của cấu hình hiện tại. Người dùng có thể chọn riêng nguồn minh họa cũ; hai nguồn không trộn hoặc tự fallback. Chênh output không chứng minh hiệu quả kinh doanh.
- **Kết quả API:** Chỉ giữ trong phiên trang hiện tại. Sửa/xóa hoặc xác minh lại metadata hủy request và bỏ kết quả cũ; không sao chép kết quả khi duplicate. Reload vẫn giữ cấu hình nhưng cần predict lại, không tin API metadata từ localStorage.
- **Persistence:** Envelope version1, đọc/migrate mảng cũ, lọc từng bản ghi sai/ID trùng; JSON/schema/storage lỗi có thông báo phục hồi. Cho phép xóa hết và lưu danh sách rỗng. Khi bị từ chối ghi, CRUD vẫn dùng state trong bộ nhớ.
- **Nguồn kết quả:** `MODEL_PREDICTION` cho response API đã kiểm tra hợp đồng, `DEMO_DATA` cho điểm minh họa cũ, `NOT_PREDICTED` khi chưa có kết quả API hiện hành. Không tự gắn mác chiến dịch tối ưu.


---

## 4. Cơ chế Kiểm chuẩn Quality Gate

Backend là nguồn xác thực trạng thái. Frontend đọc `/model-info` qua `ModelProvider`; `src/services/qualityGate.ts` chỉ mô tả quyền hiển thị, không tự đánh giá hoặc nâng trạng thái:
- **3 Trạng thái kỹ thuật:**
  1. `UNVERIFIED` → **Chưa được kiểm chứng**
  2. `BASELINE_ONLY` → **Chưa vượt mô hình cơ sở** *(Trạng thái kích hoạt hiện tại)*
  3. `VALIDATED` → **Đã đáp ứng tiêu chí kiểm chứng**
- **Quy tắc thực thi:**
  - Một nút Quality Gate tại Header; kết quả ghi quality_status bằng chữ, kèm cảnh báo nghiên cứu có thể mở xem. Tooltip hỗ trợ bàn phím, giới hạn theo viewport.
  - Khóa tuyệt đối các nhãn "Chiến dịch tối ưu", "Đề xuất tối ưu hóa ROI".
  - Không cho người dùng đổi trạng thái; Phase 3 không kích hoạt tối ưu/xếp hạng. Phản hồi trái hợp đồng (kể cả `VALIDATED`) bị từ chối; không đọc được Backend thì hiển thị `UNVERIFIED`.

---

## 5. Hướng dẫn Khởi chạy và Trình chiếu

### Yêu cầu hệ thống:
- Node.js version 18 trở lên (khuyến nghị Node 20 hoặc 24).
- Trình quản lý gói: npm.

### Các lệnh thực thi:

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Khởi chạy máy chủ phát triển (Development Server):**
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại địa chỉ: `http://localhost:5173`

3. **Kiểm tra biên dịch và đóng gói (Production Build):**
   ```bash
   npm run build
   ```

4. **Xem bản đóng gói thử nghiệm:**
   ```bash
   npm run preview
   ```

## 6. Tích hợp FastAPI — Phase 3

Chạy hai terminal PowerShell từ thư mục dự án:

```powershell
# Terminal 1: Backend (Python 3.13, môi trường đã kiểm chứng)
& .\backend\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
& .\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir .\backend --host 127.0.0.1 --port 8000
```

```powershell
# Terminal 2: Frontend
npm.cmd ci
# Tùy chọn: sao chép .env.example thành .env.local rồi sửa cấu hình.
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Mở http://127.0.0.1:5173/#predict. `npm.cmd` dùng được khi PowerShell chặn `npm.ps1`; không cần đổi Execution Policy. Swagger: http://127.0.0.1:8000/docs. CORS mặc định cho localhost/127.0.0.1 tại cổng5173 (dev) và4173 (preview). Không wildcard, origin khác vẫn bị từ chối. Nếu đã đặt DREAMMAKERS_CORS_ORIGINS thì biến đó thay thế danh sách mặc định; cần bổ sung preview vào cấu hình riêng và khởi động lại Backend.

Để demo bản build: giữ Backend ở8000, chạy `npm.cmd run build`, rồi `npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort`; mở http://127.0.0.1:4173/#predict. VITE_API_BASE_URL được đóng vào bundle lúc build nên phải build lại sau khi thay đổi biến này.

Biến môi trường Vite trong `.env.local` (khởi động lại Vite sau khi sửa):

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_API_TIMEOUT_MS=10000
```

API client tập trung tại `src/services/apiClient.ts`; không proxy trùng lặp. Mặc định giống `.env.example`. Không đặt bí mật trong biến `VITE_*` vì chúng được đưa vào frontend.

### Hợp đồng đang sử dụng

`GET /model-info` cung cấp `model_name`, `model_version`, `model_ready`, `features`, `allowed_categories`, `allowed_duration_days`, `quality_status`, `quality_gate_rules`, `is_research_only`, `warning`. Frontend kiểm tra cấu trúc và trạng thái trước khi cho phép dự đoán. Danh sách lựa chọn lấy từ Backend; bảng dịch chỉ chuyển nhãn hiển thị sang tiếng Việt.

`POST /predict` gửi đúng năm khóa, giá trị lựa chọn tiếng Anh nguyên gốc:

```json
{
  "Campaign_Type": "Social Media",
  "Channel_Used": "Facebook",
  "Target_Audience": "Women 25-34",
  "Customer_Segment": "Fashionistas",
  "Duration_days": 30
}
```

Response đọc đúng các khóa `predicted_roi`, `model_name`, `model_version`, `quality_status`, `is_research_only`, `warning`; kiểm tra ROI là số hữu hạn, model/version/status khớp metadata. Không hardcode ROI tham chiếu trong source giao diện, không mô phỏng thời gian dự đoán, không fallback. Giá trị đầy đủ hiển thị với dấu phẩy thập phân tiếng Việt.

Khi đổi bất kỳ feature hoặc nhấn **Làm mới**, kết quả cũ bị xóa và request đang chạy bị hủy. Bộ đếm request bảo vệ cả khi transport trả về muộn sau abort. Nút gửi bị khóa trong lúc chờ; người dùng vẫn được đổi lựa chọn hoặc làm mới. Rời trang cũng hủy request.

Lỗi mạng, timeout, `422/503/500`, JSON sai hoặc sai hợp đồng đều hiển thị thông báo tiếng Việt an toàn, không giữ ROI cũ. Khi chưa xác minh được trạng thái hiện tại, Quality Gate chuyển về `UNVERIFIED`; dùng **Tải lại thông tin mô hình** sau khi Backend phục hồi. `BASELINE_ONLY` chỉ cho phép nghiên cứu, luôn hiển thị cảnh báo Backend, không có tối ưu/xếp hạng.

Điều hướng hiện có ba trang: Tổng quan, Dự đoán ROI, So sánh & Đề xuất. Dashboard tách thống kê Development đã đối soát và bảng mẫu. Predict gọi API thật và lưu sang Compare. Compare giữ CRUD, API/retry, đối chiếu nguồn và gợi ý theo tiêu chí; gợi ý này không chứng minh tối ưu ROI. Bảy artifact, historical metrics và Quality Gate không thay đổi. Bằng chứng nâng cấp ở research/phase5/compare_scenarios_api_upgrade.md; các báo cáo Phase5.3 là trạng thái lịch sử trước nâng cấp.

### Kiểm thử Phase 3

```powershell
# Backend
Push-Location backend
try { & .\.venv\Scripts\python.exe -m pytest -q } finally { Pop-Location }
# Frontend service/component và build
npm.cmd test
npm.cmd run build
# Trình duyệt Edge đã cài: để cổng 8000 và 5173 trống trước khi chạy
npm.cmd run test:e2e
# Backend và frontend đã dừng: kiểm tra mất kết nối thật, không interception
npm.cmd run test:offline
```

Playwright tự chạy Backend và Vite, kiểm tra API thật A/B, chụp desktop/mobile và dừng server kiểm thử. Edge chạy headless, không cần tải browser mới. Các ca lỗi dùng interception riêng để tạo lỗi có kiểm soát; kết quả A/B và bốn thời lượng dùng Pipeline thật. Timeout trong cấu hình e2e là 1 giây để kiểm thử, cấu hình ứng dụng mặc định là 10 giây. Dự án không có cấu hình lint, nên không báo lint PASS.

Kết quả mặc định nằm trong `tests/results/`; `phase3_acceptance.md` là hồ sơ lịch sử, không đại diện kết quả Phase5.2. Báo cáo mới và evidence ở `research/phase5/phase5_2_*.md` và `research/phase5/run_phase5_2/`.

### E2E và preview sau Phase5.2

Playwright global setup sở hữu Vite API trong process và Uvicorn qua launcher test riêng, không dùng Windows shell/taskkill. Teardown gọi Vite.close và gửi shutdown qua kênh loopback riêng có token, chờ Uvicorn thoát; không thêm endpoint production. Deadline hữu hạn, lỗi cleanup làm test runner thất bại. Log cleanup ghi exit code/PID/cổng còn mở. Browser được Playwright fixture đóng bình thường.

Để chạy cả preview acceptance (cần Edge, các cổng8000/5173/4173 trống):

```powershell
npm.cmd run build
$env:DM_TEST_BUILD_DIR = 'dist'
$env:DM_TEST_RESULTS_DIR = 'tests/results'
npm.cmd run test:e2e
```

Không có DM_TEST_BUILD_DIR thì chỉ ca preview báo SKIP rõ lý do, các ca khác vẫn chạy. Nghiệm thu Phase5.2 phải cung cấp build dir và không skip ca này. Các bộ unit/API/reference/gate vẫn chạy riêng, không cộng trùng số ca.

## Cấu hình giao diện hiện tại

Đặt `VITE_DISPLAY_NAME` trong `.env.local` rồi khởi động lại Vite/build để đổi tên hiển thị. Giá trị trống dùng “Người dùng DreamMakers”; đây là cấu hình cục bộ, không phải xác thực tài khoản.

Bằng chứng nâng cấp: `research/phase5/marketing_evaluation_upgrade.md` và `research/phase5/compare_scenarios_api_upgrade.md`. Những báo cáo Phase 5.2/5.3 cũ là lịch sử nghiệm thu, không được sửa để phản ánh giao diện mới.

## Điều hướng ba trang và bookmark cũ

Sidebar và menu mobile chỉ có Tổng quan, Dự đoán ROI, So sánh & Đề xuất. Mục **Thông tin mô hình** trong Predict mặc định thu gọn, giữ MAE/RMSE/R² có nguồn, metadata API và BASELINE_ONLY. Mở **Bảng đánh giá và nghiên cứu chi tiết** để xem đầy đủ bảng/biểu đồ và nghiên cứu đã có.

Bookmark `#insights`, `#/insights`, `/insights` hoặc `/insights/` được chuyển trong Frontend sang `/#predict/model-info` và tự mở/focus mục thông tin. Không thêm route Backend. Khi dùng hosting khác Vite, cần cấu hình SPA fallback về index.html cho URL pathname như `/insights`; hash routes không cần fallback riêng.

Bàn giao lượt rút gọn điều hướng: `research/phase5/three_page_navigation.md`.
