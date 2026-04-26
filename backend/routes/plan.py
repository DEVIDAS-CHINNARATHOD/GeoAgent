import logging
from fastapi import APIRouter, HTTPException
from models.schemas import PlanRequest, PlanResponse
from agents.orchestrator import run_plan_pipeline

router = APIRouter(prefix="/plan", tags=["plan"])
logger = logging.getLogger(__name__)


@router.post("", response_model=PlanResponse)
async def create_plan(request: PlanRequest) -> PlanResponse:
    """
    Generate a multi-day travel itinerary for a destination.
    Combines RAG knowledge, weather, and safety analysis.
    """
    try:
        return await run_plan_pipeline(request)
    except Exception as exc:
        logger.exception("Error generating travel plan")
        raise HTTPException(status_code=500, detail="Failed to generate travel plan.")
