import enum
from sqlalchemy import Column, String, Boolean, Numeric, Integer, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TenantModelMixin, utc_now

class CustomerPackageStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    EXHAUSTED = "EXHAUSTED"
    CANCELLED = "CANCELLED"

class Package(Base, TenantModelMixin):
    __tablename__ = "packages"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    total_sessions = Column(Integer, default=5, nullable=False)
    validity_days = Column(Integer, default=90, nullable=False)
    applicable_service_id = Column(String(36), ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    discount_percentage = Column(Numeric(5, 2), default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    applicable_service = relationship("Service")

class CustomerPackage(Base, TenantModelMixin):
    __tablename__ = "customer_packages"

    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="RESTRICT"), nullable=False)
    invoice_id = Column(String(36), nullable=True)
    
    purchase_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    total_sessions = Column(Integer, nullable=False)
    used_sessions = Column(Integer, default=0, nullable=False)
    remaining_sessions = Column(Integer, nullable=False)
    status = Column(String(50), default=CustomerPackageStatus.ACTIVE.value, nullable=False)

    customer = relationship("Customer")
    package = relationship("Package")
    redemptions = relationship("PackageRedemption", back_populates="customer_package", cascade="all, delete-orphan")

class PackageRedemption(Base, TenantModelMixin):
    __tablename__ = "package_redemptions"

    customer_package_id = Column(String(36), ForeignKey("customer_packages.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(String(36), nullable=True)
    service_id = Column(String(36), ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    staff_id = Column(String(36), ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)
    redemption_date = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    notes = Column(Text, nullable=True)

    customer_package = relationship("CustomerPackage", back_populates="redemptions")
    service = relationship("Service")
    staff = relationship("Staff")
