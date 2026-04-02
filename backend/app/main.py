from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from app.database import init_db
from app.routes import crud, downloads, search, upload

api_router = APIRouter()

api_router.include_router(upload.router)
api_router.include_router(downloads.router)
api_router.include_router(search.router)
api_router.include_router(crud.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="PostOffice API", lifespan=lifespan)
app.include_router(api_router)
