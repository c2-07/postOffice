from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_crud, routes_download, routes_search, routes_upload
from app.database import init_db

api_router = APIRouter()

api_router.include_router(routes_upload.router)
api_router.include_router(routes_download.router)
api_router.include_router(routes_search.router)
api_router.include_router(routes_crud.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the application."""
    init_db()  # Initialize database tables on startup
    yield


app = FastAPI(title="PostOffice API", lifespan=lifespan)

origins = [
    "http://localhost.com",
    "https://localhost.com",
    "http://localhost",
    "http://localhost:8080",
]

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the combined API router with all sub-routes
app.include_router(api_router)
