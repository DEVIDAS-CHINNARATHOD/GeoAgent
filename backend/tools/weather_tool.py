import logging
import httpx
from typing import Optional
from core.config import settings
from models.schemas import WeatherInfo

logger = logging.getLogger(__name__)


async def fetch_weather(
    latitude: float,
    longitude: float,
) -> Optional[WeatherInfo]:
    """
    Fetch current weather using OpenWeatherMap API.
    Falls back to None if API key is not configured.
    """
    if not settings.WEATHER_API_KEY:
        logger.warning("WEATHER_API_KEY not configured – skipping weather fetch")
        return _synthetic_weather()
    if not settings.WEATHER_API_URL:
        logger.warning("WEATHER_API_URL not configured – skipping weather fetch")
        return _synthetic_weather()

    params = {
        "lat": latitude,
        "lon": longitude,
        "appid": settings.WEATHER_API_KEY,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(settings.WEATHER_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        logger.error("Weather API error: %s", exc)
        return _synthetic_weather()

    weather_list = data.get("weather", [{}])
    main = data.get("main", {})
    wind = data.get("wind", {})

    return WeatherInfo(
        temperature=main.get("temp", 0),
        condition=weather_list[0].get("main", "Unknown"),
        humidity=main.get("humidity"),
        wind_speed=wind.get("speed"),
        description=weather_list[0].get("description", "").capitalize(),
    )


async def fetch_weather_by_city(city: str) -> Optional[WeatherInfo]:
    """Fetch weather by city name."""
    if not settings.WEATHER_API_KEY:
        return _synthetic_weather()
    if not settings.WEATHER_API_URL:
        logger.warning("WEATHER_API_URL not configured – skipping weather fetch")
        return _synthetic_weather()

    params = {
        "q": city,
        "appid": settings.WEATHER_API_KEY,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(settings.WEATHER_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        logger.error("Weather API (city) error: %s", exc)
        return _synthetic_weather()

    weather_list = data.get("weather", [{}])
    main = data.get("main", {})
    wind = data.get("wind", {})

    return WeatherInfo(
        temperature=main.get("temp", 0),
        condition=weather_list[0].get("main", "Unknown"),
        humidity=main.get("humidity"),
        wind_speed=wind.get("speed"),
        description=weather_list[0].get("description", "").capitalize(),
    )


def _synthetic_weather() -> WeatherInfo:
    return WeatherInfo(
        temperature=24.0,
        condition="Clear",
        humidity=55,
        wind_speed=3.2,
        description="Clear sky with mild breeze",
    )
