from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id
from app.models.product import (
    Product, ProductCategory, StockLedger, ProductType, StockTransactionType
)
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductCategoryCreate, ProductCategoryResponse, StockAdjustmentRequest
)

router = APIRouter(prefix="/inventory", tags=["Products & Inventory"])

@router.get("/categories", response_model=List[ProductCategoryResponse])
def list_categories(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    return db.query(ProductCategory).filter(ProductCategory.tenant_id == tenant_id).all()

@router.post("/categories", response_model=ProductCategoryResponse)
def create_category(
    req: ProductCategoryCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    cat = ProductCategory(tenant_id=tenant_id, name=req.name, description=req.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("/products", response_model=List[ProductResponse])
def list_products(
    product_type: Optional[str] = None,  # RETAIL, CONSUMABLE, BOTH
    low_stock_only: bool = False,
    search: Optional[str] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.tenant_id == tenant_id, Product.is_active == True)
    if product_type:
        query = query.filter(Product.product_type == product_type)
    if low_stock_only:
        query = query.filter(Product.current_stock <= Product.reorder_level)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.brand.ilike(f"%{search}%")) |
            (Product.barcode.ilike(f"%{search}%"))
        )
        
    products = query.order_by(Product.name).all()
    results = []
    for p in products:
        res = ProductResponse.model_validate(p)
        res.category_name = p.category.name if p.category else None
        results.append(res)
    return results

@router.post("/products", response_model=ProductResponse)
def create_product(
    req: ProductCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    cat = db.query(ProductCategory).filter(
        ProductCategory.id == req.category_id,
        ProductCategory.tenant_id == tenant_id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
        
    product = Product(
        tenant_id=tenant_id,
        category_id=req.category_id,
        product_type=req.product_type,
        name=req.name,
        brand=req.brand,
        sku=req.sku,
        barcode=req.barcode,
        description=req.description,
        unit=req.unit,
        purchase_price=req.purchase_price,
        retail_price=req.retail_price,
        hsn_code=req.hsn_code,
        gst_rate=req.gst_rate,
        current_stock=req.current_stock,
        reorder_level=req.reorder_level,
        is_active=True
    )
    db.add(product)
    db.flush()
    
    if req.current_stock > Decimal("0.0"):
        db.add(StockLedger(
            tenant_id=tenant_id,
            product_id=product.id,
            transaction_type=StockTransactionType.OPENING.value,
            quantity_in=req.current_stock,
            quantity_out=Decimal("0.0"),
            balance_after=req.current_stock,
            notes="Opening stock entry"
        ))
        
    db.commit()
    db.refresh(product)
    res = ProductResponse.model_validate(product)
    res.category_name = cat.name
    return res

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    req: ProductUpdate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id, Product.tenant_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(prod, k, v)
        
    db.commit()
    db.refresh(prod)
    res = ProductResponse.model_validate(prod)
    res.category_name = prod.category.name if prod.category else None
    return res

@router.post("/adjust-stock")
def adjust_stock(
    req: StockAdjustmentRequest,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == req.product_id, Product.tenant_id == tenant_id).with_for_update().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    qty = req.quantity
    adj_type = req.adjustment_type.upper()
    
    if adj_type in ["PURCHASE", "OPENING"]:
        new_balance = prod.current_stock + qty
        qty_in = qty
        qty_out = Decimal("0.0")
    else:  # DAMAGE, ADJUSTMENT, CONSUMPTION
        new_balance = max(Decimal("0.0"), prod.current_stock - qty)
        qty_in = Decimal("0.0")
        qty_out = qty
        
    prod.current_stock = new_balance
    
    db.add(StockLedger(
        tenant_id=tenant_id,
        product_id=prod.id,
        transaction_type=adj_type,
        quantity_in=qty_in,
        quantity_out=qty_out,
        balance_after=new_balance,
        notes=req.notes or f"Manual {adj_type} adjustment"
    ))
    db.commit()
    
    return {
        "message": "Stock adjusted successfully.",
        "product_id": prod.id,
        "product_name": prod.name,
        "new_stock": float(new_balance)
    }

@router.get("/ledger/{product_id}")
def get_product_stock_ledger(
    product_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    ledger = db.query(StockLedger).filter(
        StockLedger.tenant_id == tenant_id,
        StockLedger.product_id == product_id
    ).order_by(StockLedger.created_at.desc()).limit(50).all()
    
    return [
        {
            "id": l.id,
            "type": l.transaction_type,
            "reference": l.reference_id,
            "qty_in": float(l.quantity_in),
            "qty_out": float(l.quantity_out),
            "balance": float(l.balance_after),
            "notes": l.notes,
            "date": l.created_at.isoformat()
        } for l in ledger
    ]
