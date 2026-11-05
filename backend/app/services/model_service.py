import hashlib
import json
import logging
import math
from pathlib import Path
import warnings

import joblib
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.utils.validation import check_is_fitted

from ..config.settings import FEATURES, MODEL_FILENAME, MODEL_NAME, WARNING, Settings
from ..schemas.prediction import PredictionRequest

LOGGER = logging.getLogger(__name__)
CONFIG_DIR = Path(__file__).resolve().parents[1] / "config"


class ModelUnavailable(Exception):
    pass


class InvalidFeatures(Exception):
    def __init__(self, errors):
        self.errors = errors


class ModelService:
    """Load only the pinned, team-supplied Linear Regression artifact at startup."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.pipeline = None
        self.metadata = None
        self.metrics = None
        self.allowed_categories = {}
        self.allowed_duration_days = []

    @property
    def ready(self):
        return self.pipeline is not None and self.metadata is not None

    def _verified_bytes(self, filename, manifest):
        path = self.settings.model_dir / filename
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != manifest[filename]:
            raise ValueError("Artifact integrity check failed")
        return data

    def load(self):
        self.pipeline = None
        self.metadata = None
        self.metrics = None
        self.allowed_categories = {}
        try:
            manifest = json.loads((CONFIG_DIR / "artifact_sha256.json").read_text(encoding="utf-8"))
            metadata = json.loads(self._verified_bytes("model_metadata.json", manifest))
            metrics = json.loads(self._verified_bytes("model_metrics.json", manifest))
            deployment = json.loads((CONFIG_DIR / "deployment_metadata.json").read_text(encoding="utf-8"))
            if (metadata["deployed_model"] != MODEL_NAME
                    or metadata["model_files"][MODEL_NAME] != MODEL_FILENAME
                    or metadata["features"] != list(FEATURES)
                    or metadata["target"] != "ROI"
                    or metadata["model_quality_status"] != "BASELINE_ONLY"
                    or metrics["quality_gate"] != "BASELINE_ONLY"
                    or metadata["quality_gate_rules"] != {
                        "allow_prediction": True, "allow_automatic_ranking": False,
                        "allow_optimization_recommendation": False}
                    or deployment["allowed_duration_days"] != [15, 30, 45, 60]):
                raise ValueError("Deployment contract or quality gate is invalid")
            self.metadata, self.metrics = metadata, metrics
            self.allowed_duration_days = deployment["allowed_duration_days"]
        except Exception as exc:
            LOGGER.error("Model metadata unavailable (%s)", type(exc).__name__)
            return
        try:
            # Verify bytes before unpickling; no client-controlled model path/name.
            import io
            model_bytes = self._verified_bytes(MODEL_FILENAME, manifest)
            with warnings.catch_warnings():
                warnings.simplefilter("error")
                pipeline = joblib.load(io.BytesIO(model_bytes))
            if not isinstance(pipeline, Pipeline) or not isinstance(pipeline.steps[-1][1], LinearRegression):
                raise TypeError("Unexpected model type")
            check_is_fitted(pipeline)
            check_is_fitted(pipeline.steps[0][1])
            check_is_fitted(pipeline.steps[-1][1])
            if list(pipeline.feature_names_in_) != list(FEATURES) or pipeline.n_features_in_ != 5:
                raise ValueError("Unexpected input features")
            transformer = pipeline.named_steps["preprocessor"]
            cat_columns = next(columns for name, _, columns in transformer.transformers_ if name == "cat")
            encoder = transformer.named_transformers_["cat"].named_steps["onehot"]
            if list(cat_columns) != list(FEATURES[:-1]) or len(encoder.categories_) != 4:
                raise ValueError("Unexpected categorical preprocessing")
            self.allowed_categories = {
                feature: [str(value) for value in values]
                for feature, values in zip(cat_columns, encoder.categories_, strict=True)
            }
            self.pipeline = pipeline
            LOGGER.info("Trusted Linear Regression pipeline ready; quality gate BASELINE_ONLY")
        except Exception as exc:
            LOGGER.error("Model unavailable (%s)", type(exc).__name__)

    def info(self):
        if self.metadata is None:
            raise ModelUnavailable()
        return {
            "model_name": MODEL_NAME, "model_version": self.metadata["artifact_version"],
            "features": self.metadata["features"], "target": self.metadata["target"],
            "model_ready": self.ready, "quality_status": self.metadata["model_quality_status"],
            "is_research_only": True, "quality_gate_rules": self.metadata["quality_gate_rules"],
            "metrics": self.metrics["results"][MODEL_NAME],
            "cross_validation": self.metrics,
            "allowed_categories": self.allowed_categories,
            "allowed_duration_days": self.allowed_duration_days,
            "duration_validation_source": "marketing_campaign_dataset.csv; quy trình Duration trong notebook Colab; deployment_metadata.json",
            "warning": WARNING,
        }

    def predict(self, request: PredictionRequest):
        if not self.ready:
            raise ModelUnavailable()
        values = request.model_dump()
        errors = []
        for feature, allowed in self.allowed_categories.items():
            if values[feature] not in allowed:
                errors.append({"loc": ["body", feature], "msg": "Giá trị danh mục không được mô hình hỗ trợ.", "type": "value_error"})
        if request.Duration_days not in self.allowed_duration_days:
            errors.append({"loc": ["body", "Duration_days"], "msg": "Thời lượng phải là 15, 30, 45 hoặc 60 ngày.", "type": "value_error"})
        if errors:
            raise InvalidFeatures(errors)
        frame = pd.DataFrame([values], columns=self.metadata["features"])
        result = self.pipeline.predict(frame)
        if len(result) != 1:
            raise ValueError("Unexpected prediction shape")
        roi = float(result[0])
        if not math.isfinite(roi):
            raise ValueError("Non-finite prediction")
        return {"predicted_roi": roi, "model_name": MODEL_NAME,
                "model_version": self.metadata["artifact_version"],
                "quality_status": self.metadata["model_quality_status"],
                "is_research_only": True, "warning": WARNING}
