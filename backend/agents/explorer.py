import logging
from dataclasses import dataclass
from typing import List
from tools.rag_tool import rag_query

logger = logging.getLogger(__name__)


@dataclass
class ExplorerOutput:
    answer: str
    sources: List[str]
    confidence: str  # "high" | "medium" | "low"


class ExplorerAgent:
    """
    Retrieves tourism knowledge using the RAG pipeline
    built on Chroma vector store + HuggingFace embeddings + Groq LLM.
    """

    def run(
        self,
        query: str,
        personalization_context: str = "",
        destination: str = "",
    ) -> ExplorerOutput:
        enriched_query = query
        if destination:
            enriched_query = f"[Destination: {destination}] {query}"
        if personalization_context:
            enriched_query += f" [User context: {personalization_context}]"

        logger.info("Explorer querying RAG: %s", enriched_query[:80])

        result = rag_query(enriched_query)
        answer = result.get("answer", "")
        sources = result.get("sources", [])

        # Simple heuristic: confidence based on answer length and source count
        if len(answer) > 150 and sources:
            confidence = "high"
        elif len(answer) > 50:
            confidence = "medium"
        else:
            confidence = "low"

        return ExplorerOutput(
            answer=answer,
            sources=sources,
            confidence=confidence,
        )
