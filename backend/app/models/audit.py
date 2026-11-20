from sqlalchemy import Column, String, Text
from app.core.database import Base
from app.models.base import TenantModelMixin

class AuditLog(Base, TenantModelMixin):
    __tablename__ = "audit_logs"

    user_id = Column(String(36), nullable=True)
    user_name = Column(String(255), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, CANCEL, REFUND, DEMO_RESET
    entity_type = Column(String(50), nullable=False)  # INVOICE, APPOINTMENT, CUSTOMER, EXPENSE
    entity_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
