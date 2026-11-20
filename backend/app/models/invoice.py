import enum
from sqlalchemy import Column, String, Boolean, Numeric, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TenantModelMixin, utc_now

class InvoiceType(str, enum.Enum):
    B2C = "B2C"
    B2B = "B2B"

class PaymentStatus(str, enum.Enum):
    PAID = "PAID"
    PARTIAL = "PARTIAL"
    UNPAID = "UNPAID"
    REFUNDED = "REFUNDED"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"

class ItemType(str, enum.Enum):
    SERVICE = "SERVICE"
    PRODUCT = "PRODUCT"
    PACKAGE = "PACKAGE"

class Invoice(Base, TenantModelMixin):
    __tablename__ = "invoices"

    invoice_number = Column(String(50), nullable=False, index=True)
    invoice_type = Column(String(20), default=InvoiceType.B2C.value, nullable=False)
    appointment_id = Column(String(36), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    
    customer_name = Column(String(255), default="Walk-in Client", nullable=False)
    customer_phone = Column(String(20), nullable=True)
    customer_gstin = Column(String(15), nullable=True)
    customer_address = Column(Text, nullable=True)
    
    invoice_date = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    
    subtotal = Column(Numeric(12, 2), default=0.0, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    taxable_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    cgst_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    sgst_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    igst_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    balance_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    
    payment_status = Column(String(20), default=PaymentStatus.PAID.value, nullable=False)
    notes = Column(Text, nullable=True)
    created_by_id = Column(String(36), nullable=True)

    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    customer = relationship("Customer")

class InvoiceItem(Base, TenantModelMixin):
    __tablename__ = "invoice_items"

    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(20), default=ItemType.SERVICE.value, nullable=False)
    
    service_id = Column(String(36), nullable=True)
    product_id = Column(String(36), nullable=True)
    package_id = Column(String(36), nullable=True)
    staff_id = Column(String(36), ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)
    
    item_name = Column(String(255), nullable=False)
    hsn_sac = Column(String(10), default="999721", nullable=False)
    quantity = Column(Numeric(10, 2), default=1.0, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0.0, nullable=False)
    taxable_value = Column(Numeric(10, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), default=18.0, nullable=False)
    cgst_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    sgst_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    
    commission_amount = Column(Numeric(10, 2), default=0.0, nullable=False)

    invoice = relationship("Invoice", back_populates="items")
    staff = relationship("Staff")

class Payment(Base, TenantModelMixin):
    __tablename__ = "payments"

    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), default=PaymentMethod.CASH.value, nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    payment_date = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    notes = Column(Text, nullable=True)
    created_by_id = Column(String(36), nullable=True)

    invoice = relationship("Invoice", back_populates="payments")
