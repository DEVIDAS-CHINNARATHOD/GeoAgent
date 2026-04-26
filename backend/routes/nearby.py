import logging
from fastapi import APIRouter, HTTPException
from models.schemas import NearbyRequest, NearbyResponse
from agents.orchestrator import run_nearby_pipeline

router = APIRouter(prefix="/nearby", tags=["nearby"])
logger = logging.getLogger(__name__)


@router.post("", response_model=NearbyResponse)
async def get_nearby(request: NearbyRequest) -> NearbyResponse:
    """
    Fetch nearby points of interest for given coordinates.
    """
    try:
        return await run_nearby_pipeline(request)
    except Exception as exc:
        logger.exception("Error fetching nearby places")
        raise HTTPException(status_code=500, detail="Failed to fetch nearby places.")
