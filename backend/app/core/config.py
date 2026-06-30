import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file from the current directory or the parent directory
if os.path.exists(".env"):
    load_dotenv(".env")
elif os.path.exists("../.env"):
    load_dotenv("../.env")

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
    
    # DB configuration flag - defaults to True (SQLite) but auto-switched to False if PostgreSQL settings are found
    USE_SQLITE: bool = True

    def __init__(self, **values):
        super().__init__(**values)
        # If USE_SQLITE is not explicitly set in the environment, auto-detect if PostgreSQL is configured
        if "USE_SQLITE" not in os.environ:
            has_postgres = "POSTGRES_SERVER" in os.environ or "DATABASE_URL" in os.environ
            if has_postgres:
                self.USE_SQLITE = False

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.USE_SQLITE:
            return "sqlite:///./hackathon_db.db"
        
        # Support DATABASE_URL if provided (common in Render, Supabase, Heroku, etc.)
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            if database_url.startswith("postgres://"):
                database_url = database_url.replace("postgres://", "postgresql://", 1)
            return database_url
            
        import urllib.parse
        user = urllib.parse.quote_plus(self.POSTGRES_USER)
        password = urllib.parse.quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql://{user}:{password}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # File uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    class Config:
        case_sensitive = True

settings = Settings()
