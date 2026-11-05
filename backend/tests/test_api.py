import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

from fastapi.testclient import TestClient
import joblib
import pandas as pd
import pytest

from app.config.settings import BACKEND_DIR, FEATURES, Settings
from app.main import create_app

MODELS = BACKEND_DIR / "models"
REFERENCE = json.loads((MODELS / "reference_prediction.json").read_text(encoding="utf-8"))
METADATA = json.loads((MODELS / "model_metadata.json").read_text(encoding="utf-8"))
METRICS = json.loads((MODELS / "model_metrics.json").read_text(encoding="utf-8"))
CASES = REFERENCE["cases"]


@pytest.fixture
def client():
    with TestClient(create_app(), raise_server_exceptions=False) as session:
        yield session


def test_T01_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "application_running": True,
                               "model_ready": True, "model_name": "Linear Regression", "api_version": "1.0.0"}


def test_T02_model_info(client):
    response = client.get("/model-info")
    assert response.status_code == 200
    info = response.json()
    assert info["features"] == METADATA["features"]
    assert info["model_name"] == METADATA["deployed_model"]
    assert info["model_version"] == METADATA["artifact_version"]
    assert info["metrics"] == METRICS["results"]["Linear Regression"]
    assert info["cross_validation"] == METRICS
    assert info["allowed_duration_days"] == [15, 30, 45, 60]
    encoder = client.app.state.model_service.pipeline.named_steps["preprocessor"].named_transformers_["cat"].named_steps["onehot"]
    assert info["allowed_categories"] == dict(zip(FEATURES[:-1], [x.tolist() for x in encoder.categories_], strict=True))


def test_T03_campaign_A(client):
    response = client.post("/predict", json=CASES[0]["features"])
    assert response.status_code == 200
    assert math.isfinite(response.json()["predicted_roi"])


def test_T04_campaign_B(client):
    response = client.post("/predict", json=CASES[1]["features"])
    assert response.status_code == 200
    assert math.isfinite(response.json()["predicted_roi"])


def test_T05_reference_A(client):
    result = client.post("/predict", json=CASES[0]["features"]).json()
    assert abs(result["predicted_roi"] - CASES[0]["expected_predictions"]["Linear Regression"]) <= 1e-6


def test_T06_reference_B(client):
    result = client.post("/predict", json=CASES[1]["features"]).json()
    assert abs(result["predicted_roi"] - CASES[1]["expected_predictions"]["Linear Regression"]) <= 1e-6


@pytest.mark.parametrize("feature", FEATURES)
def test_T07_missing_feature(client, feature):
    payload = dict(CASES[0]["features"])
    del payload[feature]
    assert client.post("/predict", json=payload).status_code == 422


@pytest.mark.parametrize("feature", FEATURES[:-1])
def test_T08_invalid_category(client, feature):
    payload = {**CASES[0]["features"], feature: "unsupported"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", feature]


@pytest.mark.parametrize("duration", [-1, 0, 1, 29, 31, 90])
def test_T09_invalid_duration(client, duration):
    assert client.post("/predict", json={**CASES[0]["features"], "Duration_days": duration}).status_code == 422


@pytest.mark.parametrize("feature,value", [("Duration_days", "30"), ("Duration_days", 30.0),
    ("Duration_days", True), ("Duration_days", None), ("Campaign_Type", 3),
    ("Channel_Used", []), ("Target_Audience", False), ("Customer_Segment", None)])
def test_T10_wrong_type(client, feature, value):
    assert client.post("/predict", json={**CASES[0]["features"], feature: value}).status_code == 422


@pytest.mark.parametrize("field", ["unknown_feature", "quality_status", "quality_gate", "model_name", "model_path"])
def test_T11_extra_field(client, field):
    assert client.post("/predict", json={**CASES[0]["features"], field: "VALIDATED"}).status_code == 422


def test_T12_missing_model(tmp_path):
    for filename in ["model_metadata.json", "model_metrics.json"]:
        shutil.copyfile(MODELS / filename, tmp_path / filename)
    with TestClient(create_app(Settings(model_dir=tmp_path))) as session:
        health = session.get("/health").json()
        assert health["application_running"] is True
        assert health["model_ready"] is False
        assert health["status"] == "degraded"
        assert session.get("/model-info").json()["model_ready"] is False
        response = session.post("/predict", json=CASES[0]["features"])
        assert response.status_code == 503
        assert "predicted_roi" not in response.json()
        assert str(tmp_path) not in response.text


def test_T13_quality_gate(client):
    response = client.post("/predict", json=CASES[0]["features"], headers={"quality_status": "VALIDATED", "X-Quality-Gate": "VALIDATED"})
    assert response.json()["quality_status"] == "BASELINE_ONLY"
    assert response.json()["is_research_only"] is True
    assert client.get("/model-info").json()["quality_status"] == "BASELINE_ONLY"
    assert client.post("/predict?quality_status=VALIDATED", json=CASES[0]["features"]).status_code == 422
    assert client.get("/model-info?quality_gate=VALIDATED").status_code == 422


def test_T14_no_recommendations(client):
    for response in [client.get("/model-info"), client.post("/predict", json=CASES[0]["features"])]:
        assert "best_campaign" not in response.text
        assert "recommended_campaign" not in response.text
    assert client.post("/optimize", json=CASES[0]["features"]).status_code == 404
    assert client.get("/model-info").json()["quality_gate_rules"] == METADATA["quality_gate_rules"]


def test_T15_pipeline_failure(client, monkeypatch):
    def broken(frame):
        raise RuntimeError("secret path C:/private/model.joblib")
    monkeypatch.setattr(client.app.state.model_service.pipeline, "predict", broken)
    response = client.post("/predict", json=CASES[0]["features"], headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "predicted_roi" not in response.json()
    assert "private" not in response.text and "Traceback" not in response.text


def test_T16_phase1_and_artifact_integrity():
    pinned = json.loads((BACKEND_DIR / "app/config/artifact_sha256.json").read_text())
    before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in MODELS.iterdir() if p.is_file()}
    assert before == pinned
    result = subprocess.run([sys.executable, str(BACKEND_DIR / "tests/verify_models.py")],
                            capture_output=True, encoding="utf-8", timeout=60)
    assert result.returncode == 0, result.stdout + result.stderr
    after = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in MODELS.iterdir() if p.is_file()}
    assert before == after


@pytest.mark.parametrize("duration", [15, 30, 45, 60])
def test_all_supported_durations(client, duration):
    payload = {**CASES[0]["features"], "Duration_days": duration}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    independent = joblib.load(MODELS / "linear_regression_pipeline.joblib")
    expected = float(independent.predict(pd.DataFrame([payload], columns=list(FEATURES)))[0])
    assert response.json()["predicted_roi"] == expected


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf")])
def test_nonfinite_output_is_safe_500(client, monkeypatch, value):
    monkeypatch.setattr(client.app.state.model_service.pipeline, "predict", lambda frame: [value])
    response = client.post("/predict", json=CASES[0]["features"])
    assert response.status_code == 500
    assert "predicted_roi" not in response.json()


def test_corrupt_artifact_not_unpickled(tmp_path, monkeypatch):
    for filename in ["model_metadata.json", "model_metrics.json"]:
        shutil.copyfile(MODELS / filename, tmp_path / filename)
    (tmp_path / "linear_regression_pipeline.joblib").write_bytes(b"untrusted bytes")
    def forbidden(*args, **kwargs):
        pytest.fail("Untrusted artifact must never be unpickled")
    monkeypatch.setattr("app.services.model_service.joblib.load", forbidden)
    with TestClient(create_app(Settings(model_dir=tmp_path))) as session:
        assert session.get("/health").json()["model_ready"] is False
        assert session.post("/predict", json=CASES[0]["features"]).status_code == 503


def test_metadata_tampering_fails_closed(tmp_path):
    metadata = {**METADATA, "model_quality_status": "VALIDATED"}
    (tmp_path / "model_metadata.json").write_text(json.dumps(metadata), encoding="utf-8")
    with TestClient(create_app(Settings(model_dir=tmp_path))) as session:
        assert session.get("/health").json()["model_ready"] is False
        assert session.get("/model-info").status_code == 503
        assert session.post("/predict", json=CASES[0]["features"]).status_code == 503


def test_cors_allowlist(client):
    for origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"]:
        response = client.options("/predict", headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"})
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == origin
    response = client.options("/predict", headers={"Origin": "https://example.com", "Access-Control-Request-Method": "POST"})
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_load_only_once(client, monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Pipeline must not reload per request")
    monkeypatch.setattr("app.services.model_service.joblib.load", forbidden)
    for _ in range(2):
        assert client.post("/predict", json=CASES[0]["features"]).status_code == 200


def test_path_independent_of_working_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    with TestClient(create_app()) as session:
        assert session.get("/health").json()["model_ready"] is True


def test_malformed_json(client):
    response = client.post("/predict", content='{ "private":', headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert "private" not in response.text
