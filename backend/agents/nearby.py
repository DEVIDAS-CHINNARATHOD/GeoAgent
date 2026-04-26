import logging
from dataclasses import dataclass
from typing import List, Optional
from models.schemas import NearbyPlace
from tools.maps_tool import fetch_nearby_places

logger = logging.getLogger(__name__)


@dataclass
class NearbyOutput:
    places: List[NearbyPlace]
    summary: str


class NearbyAgent:
    """
    Fetches and categorizes nearby points of interest
    using the Maps API.
    """

    async def run(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        categories: Optional[List[str]] = None,
        user_interests: Optional[List[str]] = None,
    ) -> NearbyOutput:
        logger.info(
            "Nearby agent fetching places at (%.4f, %.4f)", latitude, longitude
        )

        # Merge categories with user interests
        effective_cats = categories or []
        if user_interests:
            interest_cat_map = {
                "food": "food",
                "history": "attractions",
                "culture": "attractions",
                "nature": "nature",
                "shopping": "shopping",
                "nightlife": "nightlife",
                "adventure": "nature",
            }
            for interest in user_interests:
                mapped = interest_cat_map.get(interest.lower())
                if mapped and mapped not in effective_cats:
                    effective_cats.append(mapped)

        if not effective_cats:
            effective_cats = ["attractions", "food", "essentials"]

        places = await fetch_nearby_places(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            categories=effective_cats,
        )

        summary = self._build_summary(places)
        return NearbyOutput(places=places, summary=summary)

    @staticmethod
    def _build_summary(places: List[NearbyPlace]) -> str:
        if not places:
            return "No nearby places found in the specified radius."
        categories = {}
        for p in places:
            categories.setdefault(p.category, []).append(p.name)

        lines = []
        for cat, names in categories.items():
            snippet = ", ".join(names[:3])
            lines.append(f"{cat}: {snippet}")
        return "Nearby highlights – " + " | ".join(lines)
