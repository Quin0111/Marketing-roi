from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    Campaign_Type: StrictStr = Field(min_length=1, max_length=100)
    Channel_Used: StrictStr = Field(min_length=1, max_length=100)
    Target_Audience: StrictStr = Field(min_length=1, max_length=100)
    Customer_Segment: StrictStr = Field(min_length=1, max_length=100)
    Duration_days: StrictInt = Field(gt=0)


class PredictionResponse(BaseModel):
    predicted_roi: float = Field(allow_inf_nan=False)
    model_name: Literal["Linear Regression"]
    model_version: str
    quality_status: Literal["BASELINE_ONLY"]
    is_research_only: Literal[True]
    warning: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    application_running: bool
    model_ready: bool
    model_name: Literal["Linear Regression"]
    api_version: str


class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    features: list[str]
    target: str
    model_ready: bool
    quality_status: Literal["BASELINE_ONLY"]
    is_research_only: Literal[True]
    quality_gate_rules: dict[str, bool]
    metrics: dict[str, float]
    cross_validation: dict[str, Any]
    allowed_categories: dict[str, list[str]]
    allowed_duration_days: list[int]
    duration_validation_source: str
    warning: str
