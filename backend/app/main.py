from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from app.database import init_db
from app.routes import upload

api_router = APIRouter()

api_router.include_router(upload.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="PostOffice API", lifespan=lifespan)
app.include_router(api_router)
