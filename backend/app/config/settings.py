import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"), override=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerPilot AI"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/careerpilot")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_JWT_SIGNING_KEY_CAREERPILOT_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # AI Credentials
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    LINKEDIN_DATA_PROVIDER: str = os.getenv("LINKEDIN_DATA_PROVIDER", "")
    LINKEDIN_DATA_API_KEY: str = os.getenv("LINKEDIN_DATA_API_KEY", "")
    
    # Task Queue Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    class Config:
        case_sensitive = True

settings = Settings()
