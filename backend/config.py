from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    # LLM
    cerebras_api_key: str = ""
    cerebras_model: str = "llama3.1-8b"

    # Qdrant — cloud takes priority over local when qdrant_cloud_url is set
    qdrant_cloud_url: str = ""        # e.g. https://xyz.qdrant.io:6333
    qdrant_api_key: str = ""          # Qdrant Cloud API key
    qdrant_host: str = "localhost"    # fallback for local Docker
    qdrant_port: int = 6333
    qdrant_collection: str = "jobs"

    # Embedding
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    # CORS — comma-separated list of allowed origins
    cors_origins: str = "http://localhost:5173"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""   # Settings → API → JWT Secret in Supabase dashboard

    class Config:
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"


settings = Settings()
