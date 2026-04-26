import logging
from dataclasses import dataclass
from typing import List, Optional

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from core.config import settings
from agents.planner import PlannerOutput
from agents.explorer import ExplorerOutput
from agents.nearby import NearbyOutput
from agents.weather import WeatherOutput
from agents.safety import SafetyOutput

logger = logging.getLogger(__name__)


@dataclass
class AggregatorOutput:
    final_answer: str
    sources: List[str]
    agent_trace: List[str]


class AggregatorAgent:
    """
    Synthesizes outputs from all agents into a coherent,
    personalized final response using the Groq LLM.
    """

    def __init__(self):
        self._llm: Optional[ChatGroq] = None

    def _get_llm(self) -> ChatGroq:
        if self._llm is None:
            self._llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_MODEL,
                temperature=0.4,
            )
        return self._llm

    def run(
        self,
        query: str,
        planner: PlannerOutput,
        explorer: Optional[ExplorerOutput] = None,
        nearby: Optional[NearbyOutput] = None,
        weather: Optional[WeatherOutput] = None,
        safety: Optional[SafetyOutput] = None,
    ) -> AggregatorOutput:
        agent_trace: List[str] = []
        sources: List[str] = []

        context_blocks: List[str] = []

        if explorer:
            agent_trace.append(f"Explorer [{explorer.confidence} confidence]")
            sources.extend(explorer.sources)
            context_blocks.append(f"Knowledge Base:\n{explorer.answer}")

        if weather and weather.weather:
            agent_trace.append("Weather Agent")
            context_blocks.append(f"Weather:\n{weather.narrative}")

        if nearby and nearby.places:
            agent_trace.append(f"Nearby Agent [{len(nearby.places)} places]")
            place_lines = [
                f"- {p.name} ({p.category})" + (f", {p.distance_km} km away" if p.distance_km else "")
                for p in nearby.places[:6]
            ]
            context_blocks.append("Nearby Places:\n" + "\n".join(place_lines))

        if safety:
            agent_trace.append(f"Safety Agent [Risk: {safety.safety_info.risk_level}]")
            safety_lines = safety.safety_info.warnings + [
                f"Tip: {r}" for r in safety.safety_info.recommendations[:3]
            ]
            context_blocks.append("Safety:\n" + "\n".join(safety_lines))

        context_text = "\n\n".join(context_blocks)
        system_prompt = f"""You are GeoAgent, a premium local tourism intelligence assistant.
Synthesize the information below into a clear, helpful, and personalized response.
User context: {planner.personalization_context}

Gathered intelligence:
{context_text}

Instructions:
- Be specific and actionable
- Integrate weather and safety naturally into advice
- Mention nearby places when relevant
- Tailor tone and suggestions to user profile
- Do not use emojis
- Keep response well-structured but conversational
- Maximum 400 words"""

        try:
            llm = self._get_llm()
            response = llm.invoke(
                [SystemMessage(content=system_prompt), HumanMessage(content=query)]
            )
            final_answer = response.content
        except Exception as exc:
            logger.error("Aggregator LLM call failed: %s", exc)
            # Graceful fallback
            final_answer = (
                explorer.answer
                if explorer
                else "I was unable to process your request at this time."
            )

        agent_trace.append("Aggregator")
        return AggregatorOutput(
            final_answer=final_answer,
            sources=list(set(sources)),
            agent_trace=agent_trace,
        )
