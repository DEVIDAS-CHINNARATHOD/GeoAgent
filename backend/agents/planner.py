import logging
from dataclasses import dataclass, field
from typing import List, Optional
from models.schemas import UserProfile

logger = logging.getLogger(__name__)


@dataclass
class PlannerOutput:
    tasks: List[str]
    requires_weather: bool
    requires_nearby: bool
    requires_rag: bool
    destination_hint: Optional[str]
    days_requested: Optional[int]
    personalization_context: str


class PlannerAgent:
    """
    Decomposes an incoming query into structured sub-tasks
    and determines which downstream agents to activate.
    """

    WEATHER_KEYWORDS = {
        "weather", "rain", "climate", "temperature", "forecast",
        "hot", "cold", "season", "monsoon", "snow",
    }
    NEARBY_KEYWORDS = {
        "near", "nearby", "close", "around", "local", "restaurant",
        "hotel", "attraction", "visit", "explore",
    }
    PLAN_KEYWORDS = {
        "plan", "itinerary", "schedule", "days", "trip", "travel",
        "tour", "journey", "visit",
    }

    def run(
        self,
        query: str,
        user_profile: Optional[UserProfile] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> PlannerOutput:
        lower = query.lower()
        tokens = set(lower.split())

        requires_weather = bool(tokens & self.WEATHER_KEYWORDS)
        requires_nearby = bool(tokens & self.NEARBY_KEYWORDS) and (
            latitude is not None and longitude is not None
        )
        requires_rag = True  # Always consult the knowledge base

        tasks: List[str] = ["rag_lookup"]
        if requires_weather:
            tasks.append("weather_lookup")
        if requires_nearby:
            tasks.append("nearby_lookup")
        tasks.append("safety_analysis")
        tasks.append("aggregate_response")

        # Extract destination hint from query
        destination_hint = self._extract_destination(query)

        # Extract day count
        days_requested = self._extract_days(query)

        # Build personalization context string
        context_parts: List[str] = []
        if user_profile:
            context_parts.append(f"Budget: {user_profile.budget.value}")
            if user_profile.interests:
                context_parts.append(
                    f"Interests: {', '.join(i.value for i in user_profile.interests)}"
                )
            if user_profile.travel_style:
                context_parts.append(f"Style: {user_profile.travel_style}")
        personalization_context = "; ".join(context_parts) if context_parts else "General traveler"

        logger.info(
            "Planner decomposed query into %d tasks. Destination: %s",
            len(tasks),
            destination_hint,
        )

        return PlannerOutput(
            tasks=tasks,
            requires_weather=requires_weather,
            requires_nearby=requires_nearby,
            requires_rag=requires_rag,
            destination_hint=destination_hint,
            days_requested=days_requested,
            personalization_context=personalization_context,
        )

    @staticmethod
    def _extract_destination(query: str) -> Optional[str]:
        import re
        patterns = [
            r"\bin\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)",
            r"\bto\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)",
            r"\bvisit\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)",
            r"\bexplore\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)",
        ]
        for pattern in patterns:
            match = re.search(pattern, query)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def _extract_days(query: str) -> Optional[int]:
        import re
        match = re.search(r"(\d+)\s*(?:day|days|night|nights)", query, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return None
