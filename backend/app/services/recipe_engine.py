import logging
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from app.models.product import Product, ServiceRecipe, StockLedger, StockTransactionType

logger = logging.getLogger("cloud_salon.recipe_engine")

def deduct_service_consumables(
    db: Session,
    tenant_id: str,
    service_id: str,
    reference_id: Optional[str] = None,
    service_name: Optional[str] = None
) -> int:
    """
    Deducts consumable inventory automatically based on active Service Recipes.
    Returns the number of products updated.
    """
    recipes = db.query(ServiceRecipe).filter(
        ServiceRecipe.tenant_id == tenant_id,
        ServiceRecipe.service_id == service_id
    ).all()
    
    if not recipes:
        return 0
        
    count = 0
    for rec in recipes:
        product = db.query(Product).filter(
            Product.tenant_id == tenant_id,
            Product.id == rec.consumable_product_id
        ).with_for_update().first()
        
        if product:
            new_stock = max(Decimal("0.0"), product.current_stock - rec.quantity_consumed)
            product.current_stock = new_stock
            
            ledger_entry = StockLedger(
                tenant_id=tenant_id,
                product_id=product.id,
                transaction_type=StockTransactionType.CONSUMPTION.value,
                reference_id=reference_id,
                quantity_in=Decimal("0.0"),
                quantity_out=rec.quantity_consumed,
                balance_after=new_stock,
                notes=f"Auto-deducted for completed service: {service_name or service_id}"
            )
            db.add(ledger_entry)
            count += 1
            logger.info(f"Deducted {rec.quantity_consumed} {rec.unit} of {product.name}. New stock: {new_stock}")
            
    return count
