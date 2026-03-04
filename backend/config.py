from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    gemini_api_key: str = ""
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "jobs"
    embedding_model: str = "all-MiniLM-L6-v2"
    cors_origins: str = "http://localhost:5173"
    use_memory_qdrant: bool = True  # Set False when using Docker Qdrant

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
