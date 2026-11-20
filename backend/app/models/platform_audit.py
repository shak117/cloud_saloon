from sqlalchemy import Column, String, Text, DateTime
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class PlatformAuditLog(Base):
    __tablename__ = "platform_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    platform_user_id = Column(String(36), nullable=True, index=True)
    salon_id = Column(String(64), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
