from fastapi import APIRouter
from app.api.routes import infer, health

api_router = APIRouter()

api_router.include_router(infer.router, tags=["Inference"])
api_router.include_router(health.router, tags=["Health"])
