import logging
import httpx
from typing import List, Optional
from core.config import settings
from models.schemas import NearbyPlace

logger = logging.getLogger(__name__)


CATEGORY_MAP = {
    "attractions": "16000",
    "food": "13000",
    "hotels": "19014",
    "essentials": "17000",
    "nightlife": "13003",
    "shopping": "17000",
    "nature": "16032",
}


async def fetch_nearby_places(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    categories: Optional[List[str]] = None,
) -> List[NearbyPlace]:
    """
    Fetch nearby places using Foursquare Places API.
    Falls back to synthetic data if API key is not configured.
    """
    if not settings.MAPS_API_KEY:
        logger.warning("MAPS_API_KEY not configured – returning synthetic nearby data")
        return _synthetic_nearby(latitude, longitude)
    if not settings.MAPS_API_URL:
        logger.warning("MAPS_API_URL not configured – returning synthetic nearby data")
        return _synthetic_nearby(latitude, longitude)

    selected_cats = categories or ["attractions", "food", "essentials"]
    fsq_categories = ",".join(
        CATEGORY_MAP[c] for c in selected_cats if c in CATEGORY_MAP
    )

    params = {
        "ll": f"{latitude},{longitude}",
        "radius": int(radius_km * 1000),
        "categories": fsq_categories,
        "limit": 15,
        "fields": "name,categories,location,rating,geocodes,distance",
    }
    headers = {
        "Accept": "application/json",
        "Authorization": settings.MAPS_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(settings.MAPS_API_URL, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        logger.error("Maps API error: %s", exc)
        return _synthetic_nearby(latitude, longitude)

    places: List[NearbyPlace] = []
    for item in data.get("results", []):
        cat_list = item.get("categories", [])
        category = cat_list[0]["name"] if cat_list else "Place"
        location = item.get("location", {})
        geocodes = item.get("geocodes", {}).get("main", {})

        places.append(
            NearbyPlace(
                name=item.get("name", "Unknown"),
                category=category,
                address=location.get("formatted_address"),
                distance_km=round(item.get("distance", 0) / 1000, 2),
                rating=item.get("rating"),
                latitude=geocodes.get("latitude"),
                longitude=geocodes.get("longitude"),
            )
        )

    return places


def _synthetic_nearby(lat: float, lon: float) -> List[NearbyPlace]:
    """Return plausible synthetic places when API is unavailable."""
    return [
        NearbyPlace(
            name="Central Heritage Museum",
            category="Museum",
            address="Heritage District",
            distance_km=0.8,
            rating=4.5,
            latitude=lat + 0.007,
            longitude=lon + 0.004,
            description="Historical artifacts and local cultural exhibits.",
        ),
        NearbyPlace(
            name="The Riverside Kitchen",
            category="Restaurant",
            address="Riverside Walk",
            distance_km=0.4,
            rating=4.3,
            latitude=lat - 0.003,
            longitude=lon + 0.006,
            description="Local cuisine with seasonal ingredients.",
        ),
        NearbyPlace(
            name="City Botanical Garden",
            category="Nature",
            address="Garden Boulevard",
            distance_km=1.2,
            rating=4.7,
            latitude=lat + 0.011,
            longitude=lon - 0.005,
            description="Extensive collection of native and exotic flora.",
        ),
        NearbyPlace(
            name="Night Bazaar Market",
            category="Shopping",
            address="Market Square",
            distance_km=0.6,
            rating=4.1,
            latitude=lat - 0.005,
            longitude=lon - 0.008,
            description="Evening market with crafts, street food, and local goods.",
        ),
        NearbyPlace(
            name="Summit Viewpoint",
            category="Attraction",
            address="Hill Road",
            distance_km=2.3,
            rating=4.8,
            latitude=lat + 0.018,
            longitude=lon + 0.012,
            description="Panoramic views of the city and surrounding landscape.",
        ),
    ]
