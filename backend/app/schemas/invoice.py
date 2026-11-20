from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

class InvoiceItemCreate(BaseModel):
    item_type: str = "SERVICE"  # SERVICE, PRODUCT, PACKAGE
    service_id: Optional[str] = None
    product_id: Optional[str] = None
    package_id: Optional[str] = None
    staff_id: Optional[str] = None
    item_name: str
    hsn_sac: Optional[str] = None
    quantity: Decimal = Decimal("1.0")
    unit_price: Decimal
    discount: Decimal = Decimal("0.0")
    gst_rate: Decimal = Decimal("18.0")

class PaymentCreate(BaseModel):
    amount: Decimal
    payment_method: str = "CASH"  # CASH, UPI, CARD, BANK_TRANSFER
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

class InvoiceCreate(BaseModel):
    invoice_type: str = "B2C"  # B2C, B2B
    appointment_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = "Walk-in Client"
    customer_phone: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    discount_amount: Decimal = Decimal("0.0")
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]
    payments: List[PaymentCreate] = []

class InvoiceItemResponse(BaseModel):
    id: str
    item_type: str
    service_id: Optional[str] = None
    product_id: Optional[str] = None
    package_id: Optional[str] = None
    staff_id: Optional[str] = None
    item_name: str
    hsn_sac: str
    quantity: Decimal
    unit_price: Decimal
    discount: Decimal
    taxable_value: Decimal
    gst_rate: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    total_amount: Decimal
    commission_amount: Decimal
    staff_name: Optional[str] = None

    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: str
    amount: Decimal
    payment_method: str
    transaction_reference: Optional[str] = None
    payment_date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: str
    tenant_id: str
    invoice_number: str
    invoice_type: str
    appointment_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    customer_gstin: Optional[str] = None
    invoice_date: datetime
    subtotal: Decimal
    discount_amount: Decimal
    taxable_amount: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    balance_amount: Decimal
    payment_status: str
    notes: Optional[str] = None
    items: List[InvoiceItemResponse] = []
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True
