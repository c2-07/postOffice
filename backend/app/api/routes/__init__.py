from fastapi import APIRouter
from app.api.routes import file

api_router = APIRouter()

api_router.include_router(file.router)
