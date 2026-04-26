import logging
import os
from typing import Optional

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

from core.config import settings

logger = logging.getLogger(__name__)

_vector_db: Optional[Chroma] = None
_rag_chain = None
_embeddings: Optional[HuggingFaceEmbeddings] = None
_llm: Optional[ChatGroq] = None


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        logger.info("Initializing HuggingFace embeddings: %s", settings.EMBEDDING_MODEL)
        _embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
    return _embeddings


def get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        logger.info("Initializing Groq LLM: %s", settings.GROQ_MODEL)
        _llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
            temperature=0.3,
        )
    return _llm


def get_vector_db() -> Chroma:
    global _vector_db
    if _vector_db is not None:
        return _vector_db

    embeddings = get_embeddings()

    # If a persisted DB exists, load it
    if os.path.exists(settings.CHROMA_PERSIST_DIR):
        logger.info("Loading persisted Chroma DB from %s", settings.CHROMA_PERSIST_DIR)
        _vector_db = Chroma(
            persist_directory=settings.CHROMA_PERSIST_DIR,
            embedding_function=embeddings,
        )
        return _vector_db

    # Otherwise, build from source documents
    logger.info("Building Chroma DB from %s", settings.TOURISM_DATA_PATH)
    if not os.path.exists(settings.TOURISM_DATA_PATH):
        raise FileNotFoundError(
            f"Tourism data file not found: {settings.TOURISM_DATA_PATH}"
        )

    loader = TextLoader(settings.TOURISM_DATA_PATH)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(documents)
    logger.info("Split into %d chunks", len(chunks))

    _vector_db = Chroma.from_documents(
        chunks,
        embeddings,
        persist_directory=settings.CHROMA_PERSIST_DIR,
    )
    return _vector_db


def get_rag_chain():
    global _rag_chain
    if _rag_chain is not None:
        return _rag_chain

    vector_db = get_vector_db()
    retriever = vector_db.as_retriever(search_kwargs={"k": 4})
    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are GeoAgent, an expert local tourism assistant.
Use the provided context to answer questions about travel destinations.
Be specific, helpful, and accurate. If the context does not contain the answer,
say so clearly and suggest alternative resources.
Always consider safety, local customs, and practical travel advice.

Context:
{context}
""",
            ),
            ("human", "{input}"),
        ]
    )

    qa_chain = create_stuff_documents_chain(llm, prompt)
    _rag_chain = create_retrieval_chain(retriever, qa_chain)
    return _rag_chain


def query_rag(question: str) -> dict:
    chain = get_rag_chain()
    result = chain.invoke({"input": question})
    sources = [
        doc.metadata.get("source", "tourism_data")
        for doc in result.get("context", [])
    ]
    return {
        "answer": result.get("answer", ""),
        "sources": list(set(sources)),
    }
