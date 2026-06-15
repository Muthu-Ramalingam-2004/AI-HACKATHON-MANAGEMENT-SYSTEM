import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Hackathon Management System"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeychangeitinproduction1234567890!")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # PostgreSQL Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "hackathon_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Check if we should use SQLite fallback (highly useful for local execution without Docker/PostgreSQL)
        if os.getenv("USE_SQLITE", "true").lower() == "true":
            return "sqlite:///./hackathon_db.db"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # File uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    class Config:
        case_sensitive = True

settings = Settings()
