from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Real Estate CRM"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/realestate_crm"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/realestate_crm"
    SECRET_KEY: str = "change-this-to-a-secure-random-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = "realestate-crm"
    AWS_REGION: str = "us-east-1"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMS_API_KEY: str = ""
    WHATSAPP_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
