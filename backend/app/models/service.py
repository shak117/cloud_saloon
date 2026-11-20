from sqlalchemy import Column, String, Boolean, Numeric, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TenantModelMixin

class ServiceCategory(Base, TenantModelMixin):
    __tablename__ = "service_categories"

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    services = relationship("Service", back_populates="category", cascade="all, delete-orphan")

class Service(Base, TenantModelMixin):
    __tablename__ = "services"

    category_id = Column(String(36), ForeignKey(f"service_categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, default=30, nullable=False)
    
    # Statutory GST Details
    sac_code = Column(String(10), default="999721")  # Salon/Hairdressing service SAC
    gst_rate = Column(Numeric(5, 2), default=18.0, nullable=False)  # Standard 18% GST in India
    
    # Commission rules
    is_commission_eligible = Column(Boolean, default=True, nullable=False)
    
    # Optional image
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    category = relationship("ServiceCategory", back_populates="services")
