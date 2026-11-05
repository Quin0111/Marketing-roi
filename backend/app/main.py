from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.routes import router
from .config.settings import API_VERSION, Settings
from .services.model_service import ModelService

LOGGER = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        service = ModelService(settings)
        service.load()
        application.state.model_service = service
        yield
        service.pipeline = None

    application = FastAPI(title="DreamMakers – Marketing ROI Intelligence",
                          version=API_VERSION, lifespan=lifespan, debug=False)
    application.add_middleware(
        CORSMiddleware, allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
        allow_credentials=False,
    )

    @application.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        # Do not echo arbitrary input, parsing errors or sensitive payloads.
        errors = [{"loc": list(error["loc"]), "type": error["type"],
                   "msg": "Dữ liệu đầu vào không hợp lệ hoặc sai kiểu."} for error in exc.errors()]
        return JSONResponse(status_code=422, content={"detail": errors})

    @application.exception_handler(Exception)
    async def internal_error(request: Request, exc: Exception):
        LOGGER.error("Internal API error (%s)", type(exc).__name__)
        return JSONResponse(status_code=500, content={"detail": "Không thể xử lý yêu cầu. Vui lòng thử lại sau."})

    application.include_router(router)
    return application


app = create_app()
