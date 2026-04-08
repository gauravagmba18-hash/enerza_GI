from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "BFS Enerza"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-in-production-use-secrets-manager"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql://enerza:enerza@localhost:5432/enerza_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Billing
    BILLING_BATCH_HOUR: int = 6        # Run billing at 6am
    BILLING_BATCH_MINUTE: int = 0
    LATE_FEE_RATE: float = 0.18        # 18% p.a. = 1.5% per month
    GRACE_DAYS_DEFAULT: int = 20
    DISCONNECT_AFTER_DAYS: int = 60    # Disconnect if overdue > 60 days

    # Payment Gateways (fill from secrets manager in prod)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    PAYU_MERCHANT_KEY: Optional[str] = None
    PAYU_MERCHANT_SALT: Optional[str] = None
    BBPS_AGENT_ID: Optional[str] = None
    BBPS_API_KEY: Optional[str] = None

    # Notifications
    FCM_SERVER_KEY: Optional[str] = None
    SMS_API_KEY: Optional[str] = None
    SMS_SENDER_ID: str = "BFSENZ"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None

    # KYC
    UIDAI_API_URL: str = "https://stage1.uidai.gov.in/uidAuthService"
    UIDAI_AUA_CODE: Optional[str] = None
    UIDAI_LICENSE_KEY: Optional[str] = None

    # Storage
    S3_BUCKET: str = "bfs-enerza-docs"
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY: Optional[str] = None
    AWS_SECRET_KEY: Optional[str] = None

    # GSTN
    GSTN_API_URL: str = "https://api.gst.gov.in"
    GSTN_API_KEY: Optional[str] = None

    # Pagination
    DEFAULT_PAGE_SIZE: int = 25
    MAX_PAGE_SIZE: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
