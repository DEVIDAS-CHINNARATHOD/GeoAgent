import logging
from dataclasses import dataclass
from typing import Optional
from models.schemas import WeatherInfo
from tools.weather_tool import fetch_weather, fetch_weather_by_city

logger = logging.getLogger(__name__)


@dataclass
class WeatherOutput:
    weather: Optional[WeatherInfo]
    narrative: str


class WeatherAgent:
    """
    Retrieves real-time weather data and converts it
    into a human-readable travel narrative.
    """

    async def run(
        self,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        city: Optional[str] = None,
    ) -> WeatherOutput:
        weather: Optional[WeatherInfo] = None

        if latitude is not None and longitude is not None:
            logger.info("Weather agent fetching by coordinates")
            weather = await fetch_weather(latitude, longitude)
        elif city:
            logger.info("Weather agent fetching by city: %s", city)
            weather = await fetch_weather_by_city(city)
        else:
            logger.warning("Weather agent: no location provided")

        narrative = self._build_narrative(weather, city)
        return WeatherOutput(weather=weather, narrative=narrative)

    @staticmethod
    def _build_narrative(weather: Optional[WeatherInfo], location: Optional[str]) -> str:
        if not weather:
            return "Weather information is currently unavailable."

        loc_str = f" in {location}" if location else ""
        base = (
            f"Current conditions{loc_str}: {weather.condition} with "
            f"{weather.temperature:.1f}\u00b0C"
        )
        if weather.humidity:
            base += f", {weather.humidity}% humidity"
        if weather.wind_speed:
            base += f", wind at {weather.wind_speed} m/s"
        base += f". {weather.description}."

        # Add travel recommendation based on conditions
        condition_lower = weather.condition.lower()
        if "rain" in condition_lower or "storm" in condition_lower:
            base += " Carry rain gear and plan indoor alternatives."
        elif "snow" in condition_lower:
            base += " Dress in layers and check road conditions before traveling."
        elif weather.temperature > 35:
            base += " Heat advisory: stay hydrated and avoid outdoor activities at midday."
        elif weather.temperature < 5:
            base += " Cold conditions: warm clothing and hand warmers recommended."
        else:
            base += " Conditions are suitable for outdoor exploration."

        return base
