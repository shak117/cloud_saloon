from typing import Optional
from decimal import Decimal
from pydantic import BaseModel

class ProductCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProductCategoryResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    category_id: str
    product_type: str = "RETAIL"  # RETAIL, CONSUMABLE, BOTH
    name: str
    brand: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    unit: str = "PIECE"
    purchase_price: Decimal = Decimal("0.0")
    retail_price: Decimal = Decimal("0.0")
    hsn_code: str = "330510"
    gst_rate: Decimal = Decimal("18.0")
    current_stock: Decimal = Decimal("0.0")
    reorder_level: Decimal = Decimal("5.0")

class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    product_type: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    retail_price: Optional[Decimal] = None
    hsn_code: Optional[str] = None
    gst_rate: Optional[Decimal] = None
    reorder_level: Optional[Decimal] = None
    is_active: Optional[bool] = None

class StockAdjustmentRequest(BaseModel):
    product_id: str
    adjustment_type: str  # PURCHASE, ADJUSTMENT, DAMAGE
    quantity: Decimal
    unit_cost: Optional[Decimal] = None
    notes: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    tenant_id: str
    category_id: str
    product_type: str
    name: str
    brand: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    unit: str
    purchase_price: Decimal
    retail_price: Decimal
    hsn_code: str
    gst_rate: Decimal
    current_stock: Decimal
    reorder_level: Decimal
    is_active: bool
    category_name: Optional[str] = None

    class Config:
        from_attributes = True
