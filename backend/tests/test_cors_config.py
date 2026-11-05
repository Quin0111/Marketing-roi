from fastapi.testclient import TestClient
import pytest
from app.config.settings import Settings, cors_origins
from app.main import create_app

@pytest.mark.parametrize('origin',[
    'http://localhost:4174','http://127.0.0.1.evil.test:4173','null','https://localhost:4173',
])
def test_unlisted_origin_rejected(origin):
    with TestClient(create_app()) as client:
        response=client.options('/predict',headers={'Origin':origin,'Access-Control-Request-Method':'POST'})
        assert response.status_code==400
        assert 'access-control-allow-origin' not in response.headers

@pytest.mark.parametrize('value',['*','http://example.com:4173','http://localhost','http://localhost:4173/path','http://user:pass@localhost:4173'])
def test_cors_configuration_rejects_uncontrolled_origins(monkeypatch,value):
    monkeypatch.setenv('DREAMMAKERS_CORS_ORIGINS',value)
    with pytest.raises(ValueError):cors_origins()

def test_explicit_cors_env_replaces_defaults(monkeypatch):
    monkeypatch.setenv('DREAMMAKERS_CORS_ORIGINS','http://localhost:5173')
    settings=Settings()
    assert settings.cors_origins==('http://localhost:5173',)
    with TestClient(create_app(settings)) as client:
        response=client.options('/predict',headers={'Origin':'http://localhost:4173','Access-Control-Request-Method':'POST'})
        assert response.status_code==400
