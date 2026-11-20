import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cloud Salon API"
    COMPANY_NAME: str = "Cloud Technologies"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/cloud_billing"
    )
    DB_SCHEMA: str = "salon"
    
    SECRET_KEY: str = "dev-insecure-jwt-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    PORT: int = 8001
    HOST: str = "127.0.0.1"
    
    PILOT_TENANT_ID: str = "sk-relax-satara"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = (os.path.join(BACKEND_DIR, ".env"), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
