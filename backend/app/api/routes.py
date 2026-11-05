import logging

from fastapi import APIRouter, HTTPException, Request

from ..config.settings import API_VERSION, MODEL_NAME
from ..schemas.prediction import HealthResponse, ModelInfoResponse, PredictionRequest, PredictionResponse
from ..services.model_service import InvalidFeatures, ModelUnavailable

router = APIRouter()
LOGGER = logging.getLogger(__name__)


def reject_query(request: Request):
    if request.query_params:
        raise HTTPException(422, detail="Endpoint không chấp nhận tham số query.")


@router.get("/health", response_model=HealthResponse)
def health(request: Request):
    service = request.app.state.model_service
    return {"status": "ok" if service.ready else "degraded", "application_running": True,
            "model_ready": service.ready, "model_name": MODEL_NAME, "api_version": API_VERSION}


@router.get("/model-info", response_model=ModelInfoResponse)
def model_info(request: Request):
    reject_query(request)
    try:
        return request.app.state.model_service.info()
    except ModelUnavailable:
        raise HTTPException(503, detail="Thông tin mô hình chưa sẵn sàng.") from None


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest, request: Request):
    reject_query(request)
    try:
        return request.app.state.model_service.predict(payload)
    except ModelUnavailable:
        raise HTTPException(503, detail="Mô hình chưa sẵn sàng. Vui lòng thử lại sau.") from None
    except InvalidFeatures as exc:
        raise HTTPException(422, detail=exc.errors) from None
    except Exception as exc:
        # Handle inference failures inside CORS middleware so the frontend can read 500 responses.
        LOGGER.error("Prediction failed (%s)", type(exc).__name__)
        raise HTTPException(500, detail="Không thể xử lý yêu cầu. Vui lòng thử lại sau.") from None
