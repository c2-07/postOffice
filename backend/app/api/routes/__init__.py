from fastapi import APIRouter
from app.api.routes import routes_file

api_router = APIRouter()

api_router.include_router(routes_file.router)
