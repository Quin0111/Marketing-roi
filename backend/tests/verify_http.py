"""Start a real Uvicorn process on port 8000, test HTTP and stop only that process."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import socket
import subprocess
import sys
import os
import time

import httpx

BACKEND = Path(__file__).resolve().parents[1]
PORT = int(os.getenv('DM_TEST_API_PORT', '8000'))


def hashes():
    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted((BACKEND / "models").iterdir()) if p.is_file()}


def main():
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", PORT)) == 0:
            raise RuntimeError(f"Port {PORT} already occupied; refusing to test an unrelated server")
    before = hashes()
    pinned = json.loads((BACKEND / "app/config/artifact_sha256.json").read_text())
    if before != pinned:
        raise RuntimeError("Original artifact hashes do not match Phase 1")
    reference = json.loads((BACKEND / "models/reference_prediction.json").read_text(encoding="utf-8"))
    report = {"executed_at": datetime.now(timezone.utc).isoformat(),
              "base_url": f"http://127.0.0.1:{PORT}", "responses": [], "predictions": [],
              "artifact_sha256_before": before}
    with (BACKEND / "tests/http_server.log").open("w", encoding="utf-8") as logfile:
        process = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--app-dir", str(BACKEND),
                                    "--host", "127.0.0.1", "--port", str(PORT)], stdout=logfile, stderr=logfile,
                                   cwd=BACKEND.parent, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        try:
            with httpx.Client(base_url=report["base_url"], timeout=5, trust_env=False) as client:
                deadline = time.monotonic() + 30
                while True:
                    if process.poll() is not None:
                        raise RuntimeError("Uvicorn exited before becoming ready; inspect http_server.log")
                    try:
                        ready = client.get("/health")
                        if ready.status_code == 200:
                            break
                    except httpx.TransportError:
                        pass
                    if time.monotonic() >= deadline:
                        raise TimeoutError("Uvicorn startup timed out")
                    time.sleep(0.2)

                def record(method, endpoint, payload=None):
                    response = client.request(method, endpoint, json=payload) if payload is not None else client.request(method, endpoint)
                    report["responses"].append({"method": method, "endpoint": endpoint,
                        "request": payload, "status_code": response.status_code, "response": response.json()})
                    return response

                health = record("GET", "/health")
                assert health.status_code == 200 and health.json()["model_ready"] is True
                info = record("GET", "/model-info")
                assert info.status_code == 200 and info.json()["quality_status"] == "BASELINE_ONLY"
                assert info.json()["allowed_duration_days"] == [15, 30, 45, 60]
                for case in reference["cases"]:
                    response = record("POST", "/predict", case["features"])
                    assert response.status_code == 200
                    roi = response.json()["predicted_roi"]
                    error = abs(roi - case["expected_predictions"]["Linear Regression"])
                    assert error <= 1e-6
                    assert response.json()["quality_status"] == "BASELINE_ONLY"
                    report["predictions"].append({"case": case["name"], "predicted_roi": roi,
                        "reference": case["expected_predictions"]["Linear Regression"], "absolute_error": error})
                for days in [15, 30, 45, 60]:
                    response = record("POST", "/predict", {**reference["cases"][0]["features"], "Duration_days": days})
                    assert response.status_code == 200
                assert record("POST", "/predict", {**reference["cases"][0]["features"], "Duration_days": 31}).status_code == 422
                report["artifact_sha256_after"] = hashes()
                assert report["artifact_sha256_after"] == before
                report["status"] = "PASS"
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
    output = BACKEND / "tests/http_results.json"
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "predictions": report["predictions"],
                      "artifacts_unchanged": before == report["artifact_sha256_after"]}, indent=2))


if __name__ == "__main__":
    main()
