from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime
from pydantic import BaseModel

class PackageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    total_sessions: int = 5
    validity_days: int = 90
    applicable_service_id: Optional[str] = None
    discount_percentage: Decimal = Decimal("0.0")

class PackageResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    price: Decimal
    total_sessions: int
    validity_days: int
    applicable_service_id: Optional[str] = None
    discount_percentage: Decimal
    is_active: bool
    applicable_service_name: Optional[str] = None

    class Config:
        from_attributes = True

class PackagePurchaseRequest(BaseModel):
    customer_id: str
    package_id: str
    payment_method: str = "UPI"
    transaction_reference: Optional[str] = None

class PackageRedeemRequest(BaseModel):
    customer_package_id: str
    appointment_id: Optional[str] = None
    service_id: str
    staff_id: Optional[str] = None
    notes: Optional[str] = None

class CustomerPackageResponse(BaseModel):
    id: str
    tenant_id: str
    customer_id: str
    package_id: str
    package_name: str
    purchase_date: date
    expiry_date: date
    total_sessions: int
    used_sessions: int
    remaining_sessions: int
    status: str
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True
