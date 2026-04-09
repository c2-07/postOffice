from contextlib import asynccontextmanager
import asyncio

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_crud, routes_download, routes_search, routes_upload
from app.database import init_db
from app.worker import cleanup_expired_files_loop

api_router = APIRouter()

api_router.include_router(routes_upload.router)
api_router.include_router(routes_download.router)
api_router.include_router(routes_search.router)
api_router.include_router(routes_crud.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the application."""
    init_db()  # Initialize database tables on startup
    cleanup_task = asyncio.create_task(cleanup_expired_files_loop())
    yield
    cleanup_task.cancel()


app = FastAPI(title="PostOffice API", lifespan=lifespan)

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the combined API router with all sub-routes
app.include_router(api_router)
