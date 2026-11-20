from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id, require_roles
from app.models.user import UserRole
from app.models.service import Service, ServiceCategory
from app.schemas.service import (
    ServiceCategoryCreate, ServiceCategoryResponse,
    ServiceCreate, ServiceUpdate, ServiceResponse
)

router = APIRouter(prefix="/services", tags=["Services Catalog"])

@router.get("/categories", response_model=List[ServiceCategoryResponse])
def get_categories(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    return db.query(ServiceCategory).filter(
        ServiceCategory.tenant_id == tenant_id,
        ServiceCategory.is_active == True
    ).order_by(ServiceCategory.display_order).all()

@router.post("/categories", response_model=ServiceCategoryResponse)
def create_category(
    req: ServiceCategoryCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    cat = ServiceCategory(
        tenant_id=tenant_id,
        name=req.name,
        description=req.description,
        display_order=req.display_order,
        is_active=True
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("", response_model=List[ServiceResponse])
def list_services(
    category_id: Optional[str] = None,
    active_only: bool = True,
    search: Optional[str] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.tenant_id == tenant_id)
    if active_only:
        query = query.filter(Service.is_active == True)
    if category_id:
        query = query.filter(Service.category_id == category_id)
    if search:
        query = query.filter(Service.name.ilike(f"%{search}%"))
        
    services = query.order_by(Service.name).all()
    results = []
    for s in services:
        res = ServiceResponse.model_validate(s)
        res.category_name = s.category.name if s.category else None
        results.append(res)
    return results

@router.post("", response_model=ServiceResponse)
def create_service(
    req: ServiceCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    category = db.query(ServiceCategory).filter(
        ServiceCategory.id == req.category_id,
        ServiceCategory.tenant_id == tenant_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
        
    service = Service(
        tenant_id=tenant_id,
        category_id=req.category_id,
        name=req.name,
        description=req.description,
        price=req.price,
        duration_minutes=req.duration_minutes,
        sac_code=req.sac_code,
        gst_rate=req.gst_rate,
        is_commission_eligible=req.is_commission_eligible,
        image_url=req.image_url,
        is_active=True
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    res = ServiceResponse.model_validate(service)
    res.category_name = category.name
    return res

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: str,
    req: ServiceUpdate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id, Service.tenant_id == tenant_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")
        
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(service, k, v)
        
    db.commit()
    db.refresh(service)
    res = ServiceResponse.model_validate(service)
    res.category_name = service.category.name if service.category else None
    return res

@router.delete("/{service_id}")
def delete_service(
    service_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id, Service.tenant_id == tenant_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")
        
    # Soft delete
    service.is_active = False
    db.commit()
    return {"message": "Service successfully disabled."}
