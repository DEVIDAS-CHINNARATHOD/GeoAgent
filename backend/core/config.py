import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "GeoAgent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    MAPS_API_KEY: str = os.getenv("MAPS_API_KEY", "")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    MAPS_API_URL: str = os.getenv("MAPS_API_URL", "")
    WEATHER_API_URL: str = os.getenv("WEATHER_API_URL", "")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    GROQ_MODEL: str = "llama-3.1-8b-instant"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    CHROMA_PERSIST_DIR: str = "./chroma_db"
    TOURISM_DATA_PATH: str = "./data/tourism_data.txt"

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
