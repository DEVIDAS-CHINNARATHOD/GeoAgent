import logging
from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from agents.orchestrator import run_chat_pipeline

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Multi-agent chat endpoint.
    Accepts a natural language query with optional location and user profile.
    Returns a synthesized response with sources and agent trace.
    """
    try:
        return await run_chat_pipeline(request)
    except ValueError as exc:
        logger.warning("Validation error in chat: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in chat pipeline")
        raise HTTPException(status_code=500, detail="Internal agent error.")
