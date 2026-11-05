from dataclasses import dataclass, field
import os
from pathlib import Path
from urllib.parse import urlsplit

BACKEND_DIR = Path(__file__).resolve().parents[2]
API_VERSION = "1.0.0"
MODEL_NAME = "Linear Regression"
MODEL_FILENAME = "linear_regression_pipeline.joblib"
FEATURES = ("Campaign_Type", "Channel_Used", "Target_Audience",
            "Customer_Segment", "Duration_days")
WARNING = (
    "Mô hình chưa vượt Dummy Regressor trong kiểm định chéo 5-Fold. "
    "Kết quả chỉ phục vụ minh họa nghiên cứu, không dùng để xếp hạng chiến dịch "
    "hoặc khuyến nghị tối ưu Marketing."
)


def model_directory():
    configured = Path(os.getenv("DREAMMAKERS_MODEL_DIR", str(BACKEND_DIR / "models")))
    return (BACKEND_DIR / configured).resolve() if not configured.is_absolute() else configured.resolve()


def cors_origins():
    origins = tuple(
        x.strip()
        for x in os.getenv(
            "DREAMMAKERS_CORS_ORIGINS",
            "http://localhost:5173,"
            "http://127.0.0.1:5173,"
            "http://localhost:4173,"
            "http://127.0.0.1:4173"
        ).split(",")
        if x.strip()
    )

    production_origin = "https://marketing-roi-omega.vercel.app"

    for origin in origins:
        url = urlsplit(origin)

        # Cho phép website production đã xác định
        if origin == production_origin:
            continue

        # Cho phép frontend local có cổng cụ thể
        is_local = (
            url.scheme == "http"
            and url.hostname in {"localhost", "127.0.0.1"}
            and url.port is not None
            and not url.path
            and not url.query
            and not url.fragment
            and not url.username
            and not url.password
        )

        if not is_local:
            raise ValueError(f"CORS origin is not allowed: {origin}")

    return origins


@dataclass(frozen=True)
class Settings:
    model_dir: Path = field(default_factory=model_directory)
    cors_origins: tuple[str, ...] = field(default_factory=cors_origins)
