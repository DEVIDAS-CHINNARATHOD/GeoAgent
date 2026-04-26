import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.logging_config import logger
from routes import chat, plan, nearby, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.RAG_PREWARM_ON_STARTUP:
        logger.info("GeoAgent backend starting – initialising RAG pipeline...")
        try:
            from services.rag_service import get_vector_db

            get_vector_db()
            logger.info("RAG pipeline ready.")
        except Exception as exc:
            logger.warning("RAG pipeline init deferred: %s", exc)
    else:
        logger.info("GeoAgent backend starting – RAG prewarm disabled.")
    yield
    logger.info("GeoAgent backend shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Agentic Local Tourism Intelligence System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(plan.router, prefix="/api")
app.include_router(nearby.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/api/health")
async def health_api():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
