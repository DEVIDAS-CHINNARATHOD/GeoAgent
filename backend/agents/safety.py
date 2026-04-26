import logging
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
from models.schemas import WeatherInfo, SafetyInfo

logger = logging.getLogger(__name__)


@dataclass
class SafetyOutput:
    safety_info: SafetyInfo
    risk_score: int  # 0–10


class SafetyAgent:
    """
    Analyzes travel risk by combining weather data,
    time context, and general safety heuristics.
    """

    def run(
        self,
        weather: Optional[WeatherInfo] = None,
        destination: Optional[str] = None,
        query: str = "",
    ) -> SafetyOutput:
        warnings: List[str] = []
        recommendations: List[str] = []
        risk_score = 0

        now = datetime.now()
        hour = now.hour

        # Time-based safety context
        if 0 <= hour < 5:
            warnings.append("Late-night travel carries elevated risk in unfamiliar areas.")
            recommendations.append("Use verified transport services after midnight.")
            risk_score += 2
        elif 20 <= hour < 24:
            recommendations.append(
                "Evening travel is generally safe; remain aware of your surroundings."
            )
            risk_score += 1

        # Weather-based risk
        if weather:
            condition_lower = weather.condition.lower()
            if "storm" in condition_lower or "thunder" in condition_lower:
                warnings.append("Severe weather: thunderstorms reported.")
                recommendations.append("Postpone outdoor activities until the storm passes.")
                risk_score += 3
            elif "rain" in condition_lower:
                warnings.append("Wet conditions increase slip hazards on roads and paths.")
                recommendations.append("Wear non-slip footwear and drive cautiously.")
                risk_score += 1
            elif "snow" in condition_lower or "blizzard" in condition_lower:
                warnings.append("Snow or ice on roads may disrupt transport.")
                recommendations.append("Check local transport advisories before departing.")
                risk_score += 2
            if weather.temperature > 38:
                warnings.append("Extreme heat alert. Heat exhaustion is a risk.")
                recommendations.append(
                    "Limit sun exposure between 11 AM and 3 PM. Drink water frequently."
                )
                risk_score += 2
            elif weather.temperature < 0:
                warnings.append("Sub-zero temperatures. Frostbite risk for exposed skin.")
                recommendations.append("Cover all exposed skin and limit time outdoors.")
                risk_score += 2

        # Universal travel safety recommendations
        recommendations += [
            "Keep digital and physical copies of important documents.",
            "Register with your country's embassy if traveling internationally.",
            "Share your itinerary with a trusted contact.",
            "Keep emergency contact numbers saved offline.",
        ]

        # Determine risk level
        if risk_score <= 2:
            risk_level = "Low"
        elif risk_score <= 5:
            risk_level = "Moderate"
        else:
            risk_level = "High"

        logger.info("Safety analysis complete. Risk: %s (%d)", risk_level, risk_score)

        return SafetyOutput(
            safety_info=SafetyInfo(
                risk_level=risk_level,
                warnings=warnings,
                recommendations=recommendations,
            ),
            risk_score=risk_score,
        )
