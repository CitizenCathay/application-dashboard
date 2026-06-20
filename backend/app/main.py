from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (swap for Alembic migrations in prod)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Application Dashboard API",
    description="Job application tracker with LLM-powered enrichment",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS so the React frontend can talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)


@app.get("/health")
def health():
    return {"status": "ok"}
