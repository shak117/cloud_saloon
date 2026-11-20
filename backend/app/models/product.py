import enum
from sqlalchemy import Column, String, Boolean, Numeric, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TenantModelMixin

class ProductType(str, enum.Enum):
    RETAIL = "RETAIL"
    CONSUMABLE = "CONSUMABLE"
    BOTH = "BOTH"

class ProductUnit(str, enum.Enum):
    PIECE = "PIECE"
    BOTTLE = "BOTTLE"
    ML = "ML"
    GRAM = "GRAM"
    BOX = "BOX"

class StockTransactionType(str, enum.Enum):
    OPENING = "OPENING"
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    CONSUMPTION = "CONSUMPTION"
    ADJUSTMENT = "ADJUSTMENT"
    DAMAGE = "DAMAGE"

class ProductCategory(Base, TenantModelMixin):
    __tablename__ = "product_categories"

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")

class Product(Base, TenantModelMixin):
    __tablename__ = "products"

    category_id = Column(String(36), ForeignKey("product_categories.id", ondelete="CASCADE"), nullable=False)
    product_type = Column(String(50), default=ProductType.RETAIL.value, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(100), nullable=True)
    sku = Column(String(50), nullable=True, index=True)
    barcode = Column(String(50), nullable=True, index=True)
    description = Column(Text, nullable=True)
    unit = Column(String(50), default=ProductUnit.PIECE.value, nullable=False)
    
    purchase_price = Column(Numeric(10, 2), default=0.0, nullable=False)
    retail_price = Column(Numeric(10, 2), default=0.0, nullable=False)
    hsn_code = Column(String(10), default="330510", nullable=False)
    gst_rate = Column(Numeric(5, 2), default=18.0, nullable=False)
    
    current_stock = Column(Numeric(10, 2), default=0.0, nullable=False)
    reorder_level = Column(Numeric(10, 2), default=5.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    category = relationship("ProductCategory", back_populates="products")

class ServiceRecipe(Base, TenantModelMixin):
    __tablename__ = "service_recipes"

    service_id = Column(String(36), ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    consumable_product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity_consumed = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(20), default="ML", nullable=False)

    service = relationship("Service")
    consumable_product = relationship("Product")

class StockLedger(Base, TenantModelMixin):
    __tablename__ = "stock_ledger"

    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    reference_id = Column(String(36), nullable=True)
    quantity_in = Column(Numeric(10, 2), default=0.0, nullable=False)
    quantity_out = Column(Numeric(10, 2), default=0.0, nullable=False)
    balance_after = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text, nullable=True)

    product = relationship("Product")
