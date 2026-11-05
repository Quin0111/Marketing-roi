# Nghi?m thu PHASE 2 ? DreamMakers

Th?i ?i?m HTTP th?c t? (UTC): 2026-11-03T07:57:11.038580+00:00

**K?t qu?: PASS.** 52 ki?m th? pytest, kh?ng failure/error; server Uvicorn th?t tr?n 127.0.0.1:8000 tr? HTTP th?nh c?ng. Phase 1 ti?p t?c PASS. `pip check`: No broken requirements found.

## T01?T16

| M? | N?i dung | S? ca | K?t qu? |
|---|---|---:|---|
| T01 | /health ho?t ??ng | 1 | PASS |
| T02 | /model-info ??ng metadata v? CV | 1 | PASS |
| T03 | D? ?o?n chi?n d?ch A | 1 | PASS |
| T04 | D? ?o?n chi?n d?ch B | 1 | PASS |
| T05 | A kh?p reference <= 1e-6 | 1 | PASS |
| T06 | B kh?p reference <= 1e-6 | 1 | PASS |
| T07 | Thi?u feature tr? 422 | 5 | PASS |
| T08 | Danh m?c kh?ng h?p l? tr? 422 | 4 | PASS |
| T09 | Th?i l??ng kh?ng h?p l? tr? 422 | 6 | PASS |
| T10 | Sai ki?u d? li?u tr? 422 | 8 | PASS |
| T11 | Tr??ng th?a tr? 422 | 5 | PASS |
| T12 | Thi?u model: degraded v? 503 | 1 | PASS |
| T13 | Quality Gate BASELINE_ONLY; kh?ng cho client thay ??i | 1 | PASS |
| T14 | Kh?ng c? khuy?n ngh? t?i ?u ho?c /optimize | 1 | PASS |
| T15 | Pipeline l?i: 500 an to?n, kh?ng ROI gi?; c? CORS | 1 | PASS |
| T16 | Phase 1 PASS; SHA256 kh?ng ??i | 1 | PASS |

C?c ca b? sung: c? b?n th?i l??ng ??i chi?u tr?c ti?p pipeline; NaN/?Infinity tr? 500; model h?ng kh?ng ???c unpickle; metadata thay ??i b? t? ch?i; CORS allowlist; kh?ng n?p l?i model m?i request; ch?y t? cwd kh?c; JSON h?ng.

## D? ?o?n HTTP th?t

| Chi?n d?ch | ROI API | Reference | Sai s? tuy?t ??i |
|---|---:|---:|---:|
| Chien dich A | 4.991136884533976 | 4.991136884533976 | 0.0 |
| Chien dich B | 4.997267870097019 | 4.997267870097019 | 0.0 |

Quality Gate gi? **BASELINE_ONLY**. `is_research_only=true`; kh?ng x?p h?ng/khuy?n ngh? t?i ?u.

## X?c minh th?i l??ng g?c

?? t?m th?y CSV g?c v? notebook, ch? ??c Duration; kh?ng th?c thi notebook, kh?ng s? d?ng ROI/t?p Test ?? tinh ch?nh ho?c l?a ch?n m? h?nh. Kh?ng d?ng mock.

| Duration_days | S? d?ng |
|---:|---:|
| 15 | 49779 |
| 30 | 50255 |
| 45 | 50100 |
| 60 | 49866 |

T?ng: 200000 d?ng; thi?u: 0. Chuy?n ??i ??ng notebook: `Duration.str.extract(r'(\d+)').astype(int)`. SHA256 ngu?n v? cell notebook n?m trong `duration_verification.json`. Mi?n 15/30/45/60 ???c b? sung trong **app/config/deployment_metadata.json**, kh?ng s?a model_metadata.json g?c.

## Request/response th?c t?

B?n ??y ?? (k? c? b?n th?i l??ng v? request l?i 422) n?m trong `http_results.json`. D??i ??y l? b?n request nghi?m thu ch?nh.

### GET /health ? HTTP 200

Response:
```json
{
  "status": "ok",
  "application_running": true,
  "model_ready": true,
  "model_name": "Linear Regression",
  "api_version": "1.0.0"
}
```

### GET /model-info ? HTTP 200

Response:
```json
{
  "model_name": "Linear Regression",
  "model_version": "1.0.0",
  "features": [
    "Campaign_Type",
    "Channel_Used",
    "Target_Audience",
    "Customer_Segment",
    "Duration_days"
  ],
  "target": "ROI",
  "model_ready": true,
  "quality_status": "BASELINE_ONLY",
  "is_research_only": true,
  "quality_gate_rules": {
    "allow_prediction": true,
    "allow_automatic_ranking": false,
    "allow_optimization_recommendation": false
  },
  "metrics": {
    "MAE_mean": 1.500916,
    "RMSE_mean": 1.732384,
    "R2_mean": -0.000171
  },
  "cross_validation": {
    "evaluation_method": "5-Fold Cross-Validation",
    "development_samples": 170000,
    "n_splits": 5,
    "random_state": 42,
    "scoring": [
      "MAE",
      "RMSE",
      "R2"
    ],
    "results": {
      "Dummy Regressor": {
        "MAE_mean": 1.500843,
        "RMSE_mean": 1.732275,
        "R2_mean": -4.5e-05
      },
      "Linear Regression": {
        "MAE_mean": 1.500916,
        "RMSE_mean": 1.732384,
        "R2_mean": -0.000171
      },
      "Decision Tree": {
        "MAE_mean": 1.501221,
        "RMSE_mean": 1.732903,
        "R2_mean": -0.000771
      },
      "Random Forest": {
        "MAE_mean": 1.502294,
        "RMSE_mean": 1.734325,
        "R2_mean": -0.002413
      }
    },
    "quality_gate": "BASELINE_ONLY",
    "models_beating_baseline": 0,
    "notes": "Không mô hình học nào vượt Dummy Regressor theo RMSE trong cả 5 Fold."
  },
  "allowed_categories": {
    "Campaign_Type": [
      "Display",
      "Email",
      "Influencer",
      "Search",
      "Social Media"
    ],
    "Channel_Used": [
      "Email",
      "Facebook",
      "Google Ads",
      "Instagram",
      "Website",
      "YouTube"
    ],
    "Target_Audience": [
      "All Ages",
      "Men 18-24",
      "Men 25-34",
      "Women 25-34",
      "Women 35-44"
    ],
    "Customer_Segment": [
      "Fashionistas",
      "Foodies",
      "Health & Wellness",
      "Outdoor Adventurers",
      "Tech Enthusiasts"
    ]
  },
  "allowed_duration_days": [
    15,
    30,
    45,
    60
  ],
  "duration_validation_source": "marketing_campaign_dataset.csv; quy trình Duration trong notebook Colab; deployment_metadata.json",
  "warning": "Mô hình chưa vượt Dummy Regressor trong kiểm định chéo 5-Fold. Kết quả chỉ phục vụ minh họa nghiên cứu, không dùng để xếp hạng chiến dịch hoặc khuyến nghị tối ưu Marketing."
}
```

### POST /predict ? HTTP 200

Request:
```json
{
  "Campaign_Type": "Social Media",
  "Channel_Used": "Facebook",
  "Target_Audience": "Women 25-34",
  "Customer_Segment": "Fashionistas",
  "Duration_days": 30
}
```

Response:
```json
{
  "predicted_roi": 4.991136884533976,
  "model_name": "Linear Regression",
  "model_version": "1.0.0",
  "quality_status": "BASELINE_ONLY",
  "is_research_only": true,
  "warning": "Mô hình chưa vượt Dummy Regressor trong kiểm định chéo 5-Fold. Kết quả chỉ phục vụ minh họa nghiên cứu, không dùng để xếp hạng chiến dịch hoặc khuyến nghị tối ưu Marketing."
}
```

### POST /predict ? HTTP 200

Request:
```json
{
  "Campaign_Type": "Search",
  "Channel_Used": "Google Ads",
  "Target_Audience": "Women 25-34",
  "Customer_Segment": "Fashionistas",
  "Duration_days": 45
}
```

Response:
```json
{
  "predicted_roi": 4.997267870097019,
  "model_name": "Linear Regression",
  "model_version": "1.0.0",
  "quality_status": "BASELINE_ONLY",
  "is_research_only": true,
  "warning": "Mô hình chưa vượt Dummy Regressor trong kiểm định chéo 5-Fold. Kết quả chỉ phục vụ minh họa nghiên cứu, không dùng để xếp hạng chiến dịch hoặc khuyến nghị tối ưu Marketing."
}
```

## SHA256 b?y artifact g?c tr??c/sau

?? ??i chi?u c?ng manifest t? Phase 1. C?t SHA256 d??i ??y l? c? gi? tr? tr??c v? sau (b?ng nhau).

| Artifact | SHA256 tr??c = sau | K?t qu? |
|---|---|---|
| decision_tree_pipeline.joblib | `385652846c12e7a2846d15b445872df286a416a73dfbff33aad0689210978cae` | PASS |
| dummy_regressor_pipeline.joblib | `26a1fbeb9d62114ba46d3d7bcb3c8d6e4c365ddeb16218db85ca6667d2e5527e` | PASS |
| linear_regression_pipeline.joblib | `d99fb493de5f4972d2670d713a0f7d8996cb9c2751ab465e788c09af2fb3ed50` | PASS |
| model_metadata.json | `89b3661708f3b2e38c56d55ac38ce07bff23a1651673c2c575945bb001684639` | PASS |
| model_metrics.json | `97c3ac45bab448d37fd4da181ee76f0b01645b868533af5dc60312d24f699df2` | PASS |
| random_forest_pipeline.joblib | `d1a605d0498718d2b20270b6463cb3fd93bc7546a9eef9ba3145c40e8da5bcc0` | PASS |
| reference_prediction.json | `e8128d06d9383ac70795bc522b9b95e7a5c6bc068c1dc60a290cddad56f07784` | PASS |

## T?p tri?n khai

Kh?ng s?a frontend, kh?ng hu?n luy?n ho?c ghi l?i Joblib, kh?ng ??i nghi?n c?u 5-Fold/reference/Quality Gate, kh?ng kh?i t?o Git/commit/push.

?? t?o:
- `backend/app/__init__.py`
- `backend/app/api/__init__.py`
- `backend/app/api/routes.py`
- `backend/app/config/__init__.py`
- `backend/app/config/artifact_sha256.json`
- `backend/app/config/deployment_metadata.json`
- `backend/app/config/settings.py`
- `backend/app/main.py`
- `backend/app/schemas/__init__.py`
- `backend/app/schemas/prediction.py`
- `backend/app/services/__init__.py`
- `backend/app/services/model_service.py`
- `backend/README.md`
- `backend/requirements.txt`
- `backend/requirements.lock.txt`
- `backend/pytest.ini`
- `backend/tests/test_api.py`
- `backend/tests/verify_duration.py`
- `backend/tests/duration_verification.json`
- `backend/tests/verify_http.py`
- `backend/tests/http_results.json`
- `backend/tests/http_server.log`
- `backend/tests/phase2_pytest.xml`
- `backend/tests/phase2_acceptance.md`

`tests/phase1_results.json` ???c c?p nh?t b?i l?n ch?y l?i script Phase 1 hi?n c?; kh?ng s?a logic `verify_models.py` trong Phase 2. C?c file requirements-models g?c gi? nguy?n.

## Ch?y backend b?ng PowerShell

T? th? m?c d? ?n:

```powershell
& .\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir .\backend --host 127.0.0.1 --port 8000
```

Quy tr?nh c?i ??t, bi?n m?i tr??ng, c?u tr?c v? l?nh ki?m th?: xem `backend/README.md`.

## L?i ?? x? l? v? gi?i h?n

- Thi?u dependencies API: ?? c?i trong .venv, ghim phi?n b?n tr?c ti?p v? ghi lock ??y ??.
- Ch?a r? mi?n Duration t? pipeline: ?? x?c minh CSV/notebook g?c v? cho ph?p ??ng b?n gi? tr?, t?ch metadata tri?n khai kh?i artifact g?c.
- TestClient c?nh b?o HTTPX deprecated: c?i HTTPX2 ph? h?p Starlette; l?n pytest cu?i kh?ng c?n c?nh b?o.
- ??m b?o l?i suy lu?n 500 ?i qua CORS ?? frontend local ??c ???c ph?n h?i l?i.
- Model h?ng/m?t, metadata kh?ng ??ng tin, ROI kh?ng h?u h?n ??u ???c ki?m th? v? kh?ng c? fallback.
- Kh?ng c?n blocker Phase 2. Python th?c t? 3.13.17 kh?c patch so v?i metadata xu?t 3.13.18; Phase 1 v? HTTP A/B ?? x?c nh?n t?nh nh?t qu?n. Quality Gate v?n BASELINE_ONLY.
- Script HTTP ?? d?ng process ki?m th? sau khi ho?n t?t; d?ng l?nh tr?n ?? kh?i ??ng server s? d?ng.
- D?ng t?i Phase 2; frontend v?n ?ang d?ng mock, ch?a t?ch h?p API (Phase 3).
