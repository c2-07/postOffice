from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from app.api import routes_crud, routes_download, routes_search, routes_upload
from app.database import init_db

api_router = APIRouter()

api_router.include_router(routes_upload.router)
api_router.include_router(routes_download.router)
api_router.include_router(routes_search.router)
api_router.include_router(routes_crud.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="PostOffice API", lifespan=lifespan)
app.include_router(api_router)
