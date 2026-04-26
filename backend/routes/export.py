import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models.schemas import ExportRequest
from services.pdf_service import generate_itinerary_pdf

router = APIRouter(prefix="/export", tags=["export"])
logger = logging.getLogger(__name__)


@router.post("")
async def export_plan(request: ExportRequest) -> Response:
    """
    Export a travel plan as a downloadable PDF itinerary.
    """
    try:
        pdf_bytes = generate_itinerary_pdf(request.plan)
        filename = f"geoagent_{request.plan.destination.replace(' ', '_').lower()}_itinerary.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except RuntimeError as exc:
        logger.warning("PDF export dependency error: %s", exc)
        raise HTTPException(status_code=501, detail=str(exc))
    except Exception as exc:
        logger.exception("Error generating PDF export")
        raise HTTPException(status_code=500, detail="Failed to generate PDF export.")
