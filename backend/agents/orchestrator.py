import asyncio
import logging
from typing import Optional

from models.schemas import (
    ChatRequest,
    ChatResponse,
    PlanRequest,
    PlanResponse,
    ItineraryDay,
    NearbyRequest,
    NearbyResponse,
    UserProfile,
)
from agents.planner import PlannerAgent
from agents.explorer import ExplorerAgent
from agents.nearby import NearbyAgent
from agents.weather import WeatherAgent
from agents.safety import SafetyAgent
from agents.aggregator import AggregatorAgent

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from core.config import settings
import json
import re

logger = logging.getLogger(__name__)

_planner = PlannerAgent()
_explorer = ExplorerAgent()
_nearby_agent = NearbyAgent()
_weather_agent = WeatherAgent()
_safety_agent = SafetyAgent()
_aggregator = AggregatorAgent()


async def run_chat_pipeline(request: ChatRequest) -> ChatResponse:
    """Full multi-agent pipeline for chat queries."""
    query = request.query
    user_profile = request.user_profile
    lat = request.latitude
    lon = request.longitude

    # 1. Planner
    plan = _planner.run(query, user_profile, lat, lon)
    logger.info("Tasks planned: %s", plan.tasks)

    # 2. Run parallel tasks
    explorer_task = asyncio.create_task(
        asyncio.to_thread(
            _explorer.run,
            query,
            plan.personalization_context,
            plan.destination_hint or "",
        )
    )

    weather_task = None
    if plan.requires_weather and (lat and lon or plan.destination_hint):
        weather_task = asyncio.create_task(
            _weather_agent.run(
                latitude=lat,
                longitude=lon,
                city=plan.destination_hint,
            )
        )

    nearby_task = None
    if plan.requires_nearby and lat and lon:
        interests = (
            [i.value for i in user_profile.interests] if user_profile else []
        )
        nearby_task = asyncio.create_task(
            _nearby_agent.run(
                latitude=lat,
                longitude=lon,
                user_interests=interests,
            )
        )

    explorer_result = await explorer_task
    weather_result = await weather_task if weather_task else None
    nearby_result = await nearby_task if nearby_task else None

    # 3. Safety analysis
    safety_result = _safety_agent.run(
        weather=weather_result.weather if weather_result else None,
        destination=plan.destination_hint,
        query=query,
    )

    # 4. Aggregate
    final = _aggregator.run(
        query=query,
        planner=plan,
        explorer=explorer_result,
        nearby=nearby_result,
        weather=weather_result,
        safety=safety_result,
    )

    return ChatResponse(
        answer=final.final_answer,
        sources=final.sources,
        agent_trace=final.agent_trace,
        session_id=request.session_id,
    )


async def run_plan_pipeline(request: PlanRequest) -> PlanResponse:
    """Generate a multi-day travel itinerary."""
    destination = request.destination
    days = request.days
    user_profile = request.user_profile

    # Parallel: RAG + Weather + Safety
    rag_query = f"Travel guide for {destination}: top attractions, food, culture, tips"
    explorer_task = asyncio.create_task(
        asyncio.to_thread(_explorer.run, rag_query, "", destination)
    )
    weather_task = asyncio.create_task(
        _weather_agent.run(
            latitude=request.latitude,
            longitude=request.longitude,
            city=destination,
        )
    )

    explorer_result = await explorer_task
    weather_result = await weather_task

    safety_result = _safety_agent.run(
        weather=weather_result.weather if weather_result else None,
        destination=destination,
    )

    # Generate structured itinerary via LLM
    itinerary = await _generate_itinerary(
        destination=destination,
        days=days,
        knowledge=explorer_result.answer,
        weather_summary=weather_result.narrative if weather_result else "",
        user_profile=user_profile,
    )

    return PlanResponse(
        destination=destination,
        days=days,
        itinerary=itinerary,
        safety_notes=safety_result.safety_info.warnings
        + safety_result.safety_info.recommendations[:3],
        weather_summary=weather_result.narrative if weather_result else None,
        agent_trace=["Planner", "Explorer", "Weather", "Safety", "Aggregator"],
    )


async def _generate_itinerary(
    destination: str,
    days: int,
    knowledge: str,
    weather_summary: str,
    user_profile: Optional[UserProfile],
) -> list[ItineraryDay]:
    profile_str = ""
    if user_profile:
        interests = ", ".join(i.value for i in user_profile.interests) if user_profile.interests else "general"
        profile_str = f"Budget: {user_profile.budget.value}, Interests: {interests}"

    system = f"""You are a professional travel planner. Generate a {days}-day itinerary for {destination}.
User profile: {profile_str or 'General traveler'}
Weather: {weather_summary}
Local knowledge: {knowledge[:800]}

Return ONLY valid JSON with this exact structure, no markdown:
{{
  "itinerary": [
    {{
      "day": 1,
      "theme": "string",
      "activities": ["string", ...],
      "meals": ["string", ...],
      "tips": ["string", ...]
    }}
  ]
}}

Generate exactly {days} days. Each day must have 3-5 activities, 2-3 meal suggestions, and 2-3 practical tips."""

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0.5,
    )

    try:
        response = llm.invoke(
            [
                SystemMessage(content=system),
                HumanMessage(content=f"Generate {days}-day itinerary for {destination}"),
            ]
        )
        raw = response.content.strip()
        # Strip markdown fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        return [ItineraryDay(**d) for d in data["itinerary"]]
    except Exception as exc:
        logger.error("Itinerary generation failed: %s", exc)
        # Fallback: generate minimal days
        return [
            ItineraryDay(
                day=i + 1,
                theme=f"Explore {destination} – Day {i + 1}",
                activities=[
                    f"Morning: Visit top attractions in {destination}",
                    "Afternoon: Local cultural experience",
                    "Evening: Sunset viewpoint or leisure",
                ],
                meals=[
                    "Breakfast at local cafe",
                    "Lunch at recommended restaurant",
                    "Dinner with local cuisine",
                ],
                tips=["Stay hydrated", "Carry local currency", "Use offline maps"],
            )
            for i in range(days)
        ]


async def run_nearby_pipeline(request: NearbyRequest) -> NearbyResponse:
    """Standalone nearby places pipeline."""
    result = await _nearby_agent.run(
        latitude=request.latitude,
        longitude=request.longitude,
        radius_km=request.radius_km,
        categories=request.categories,
    )
    return NearbyResponse(
        places=result.places,
        total=len(result.places),
        location={"latitude": request.latitude, "longitude": request.longitude},
    )
