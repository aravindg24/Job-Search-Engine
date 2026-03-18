from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    cerebras_api_key: str = ""
    cerebras_model: str = "llama3.1-8b"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "jobs"
    embedding_model: str = "all-MiniLM-L6-v2"
    cors_origins: str = "http://localhost:5173"
    use_memory_qdrant: bool = True  # Set False when using Docker Qdrant

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""  # Use the anon/public key (or service_role for server-side)

    class Config:
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"


settings = Settings()
