from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    business_type: Optional[str] = "SALON_AND_SPA"
    owner_name: Optional[str] = None
    legal_name: Optional[str] = None
    gstin: Optional[str] = None
    phone: str
    email: str
    address: Optional[str] = None
    city: str
    state: str
    state_code: Optional[str] = "27"
    pincode: str
    currency: str
    logo_url: Optional[str] = None
    subscription_plan_id: Optional[str] = None
    subscription_status: Optional[str] = "ACTIVE"
    subscription_end_date: Optional[datetime] = None
    tax_configuration: Optional[Dict[str, Any]] = None
    opening_time: str
    closing_time: str
    default_appointment_duration: int
    invoice_prefix: str
    thermal_header: Optional[str] = None
    thermal_footer: Optional[str] = None
    is_demo: bool
    is_active: bool

    class Config:
        from_attributes = True

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    legal_name: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    tax_configuration: Optional[Dict[str, Any]] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    default_appointment_duration: Optional[int] = None
    invoice_prefix: Optional[str] = None
    thermal_header: Optional[str] = None
    thermal_footer: Optional[str] = None
