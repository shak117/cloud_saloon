from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

class ServiceCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: int = 0

class ServiceCategoryResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True

class ServiceCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    price: Decimal
    duration_minutes: int = 30
    sac_code: str = "999721"
    gst_rate: Decimal = Decimal("18.0")
    is_commission_eligible: bool = True
    image_url: Optional[str] = None

class ServiceUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration_minutes: Optional[int] = None
    sac_code: Optional[str] = None
    gst_rate: Optional[Decimal] = None
    is_commission_eligible: Optional[bool] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceResponse(BaseModel):
    id: str
    tenant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: Decimal
    duration_minutes: int
    sac_code: str
    gst_rate: Decimal
    is_commission_eligible: bool
    image_url: Optional[str] = None
    is_active: bool
    category_name: Optional[str] = None

    class Config:
        from_attributes = True
