from typing import Optional
from decimal import Decimal
from pydantic import BaseModel

class StaffCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = None
    designation: str = "Stylist"
    specialization: str = "All Services"
    color_code: str = "#C5A059"
    commission_type: str = "PERCENTAGE"  # NONE, FIXED, PERCENTAGE
    commission_rate: Decimal = Decimal("10.0")
    working_hours_start: str = "10:00"
    working_hours_end: str = "20:00"

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None
    color_code: Optional[str] = None
    commission_type: Optional[str] = None
    commission_rate: Optional[Decimal] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None
    is_active: Optional[bool] = None

class StaffResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    mobile: str
    email: Optional[str] = None
    designation: str
    specialization: str
    color_code: str
    commission_type: str
    commission_rate: Decimal
    working_hours_start: str
    working_hours_end: str
    is_active: bool

    class Config:
        from_attributes = True
