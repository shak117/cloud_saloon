from decimal import Decimal
from sqlalchemy import Column, String, Numeric, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_name = Column(String(100), nullable=False, unique=True)  # "Professional", "Business"
    code = Column(String(50), nullable=True, unique=True)  # "PROFESSIONAL", "BUSINESS"
    description = Column(Text, nullable=True)
    monthly_price = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    setup_fee = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    annual_price = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    branch_limit = Column(Integer, default=1, nullable=False)
    staff_limit = Column(Integer, default=3, nullable=False)  # Excludes owner
    trial_days = Column(Integer, default=14, nullable=False)
    feature_configuration = Column(JSON, nullable=True)
    user_limit = Column(Integer, default=5, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE, ARCHIVED
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    subscriptions = relationship("Subscription", back_populates="plan", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    salon_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("subscription_plans.id"), nullable=False, index=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    billing_cycle = Column(String(20), default="MONTHLY", nullable=False)  # MONTHLY, ANNUAL, TRIAL
    amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    payment_status = Column(String(20), default="PAID", nullable=False)  # PAID, PENDING, FAILED, WAIVED
    subscription_status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, TRIAL, PAST_DUE, CANCELLED, SUSPENDED
    payment_reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    tenant = relationship("Tenant")
