import logging
from services.rag_service import query_rag

logger = logging.getLogger(__name__)


def rag_query(question: str) -> dict:
    """
    Wrapper around the RAG chain for use by agents.
    Returns: {"answer": str, "sources": list[str]}
    """
    try:
        return query_rag(question)
    except Exception as exc:
        logger.error("RAG query failed: %s", exc)
        return {
            "answer": "Unable to retrieve information from the knowledge base at this time.",
            "sources": [],
        }
