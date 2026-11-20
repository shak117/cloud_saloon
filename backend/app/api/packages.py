from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id, get_current_tenant, require_active_subscription, require_feature
from app.models.package import Package, CustomerPackage, PackageRedemption, CustomerPackageStatus
from app.models.customer import Customer
from app.models.service import Service
from app.models.invoice import Invoice, InvoiceItem, Payment, InvoiceType, PaymentStatus, ItemType
from app.models.tenant import Tenant
from app.schemas.package import (
    PackageCreate, PackageResponse, PackagePurchaseRequest, PackageRedeemRequest, CustomerPackageResponse
)

router = APIRouter(prefix="/packages", tags=["Packages & Memberships"])

@router.get("", response_model=List[PackageResponse])
def list_package_plans(
    active_only: bool = True,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Package).filter(Package.tenant_id == tenant_id)
    if active_only:
        query = query.filter(Package.is_active == True)
    packages = query.all()
    results = []
    for p in packages:
        res = PackageResponse.model_validate(p)
        res.applicable_service_name = p.applicable_service.name if p.applicable_service else "General Salon Package"
        results.append(res)
    return results

@router.post("", response_model=PackageResponse)
def create_package_plan(
    req: PackageCreate,
    tenant: Tenant = Depends(require_feature("packages")),
    db: Session = Depends(get_db)
):
    tenant_id = tenant.id
    pkg = Package(
        tenant_id=tenant_id,
        name=req.name,
        description=req.description,
        price=req.price,
        total_sessions=req.total_sessions,
        validity_days=req.validity_days,
        applicable_service_id=req.applicable_service_id,
        discount_percentage=req.discount_percentage,
        is_active=True
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    res = PackageResponse.model_validate(pkg)
    res.applicable_service_name = pkg.applicable_service.name if pkg.applicable_service else None
    return res

@router.get("/customer/{customer_id}", response_model=List[CustomerPackageResponse])
def list_customer_packages(
    customer_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    cps = db.query(CustomerPackage).filter(
        CustomerPackage.tenant_id == tenant_id,
        CustomerPackage.customer_id == customer_id
    ).all()
    results = []
    for cp in cps:
        res = CustomerPackageResponse(
            id=cp.id,
            tenant_id=cp.tenant_id,
            customer_id=cp.customer_id,
            package_id=cp.package_id,
            package_name=cp.package.name if cp.package else "Package",
            purchase_date=cp.purchase_date,
            expiry_date=cp.expiry_date,
            total_sessions=cp.total_sessions,
            used_sessions=cp.used_sessions,
            remaining_sessions=cp.remaining_sessions,
            status=cp.status,
            customer_name=cp.customer.full_name if cp.customer else None
        )
        results.append(res)
    return results

@router.post("/purchase")
def purchase_package(
    req: PackagePurchaseRequest,
    tenant: Tenant = Depends(require_feature("packages")),
    db: Session = Depends(get_db)
):
    tenant_id = tenant.id
    customer = db.query(Customer).filter(Customer.id == req.customer_id, Customer.tenant_id == tenant_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    package = db.query(Package).filter(Package.id == req.package_id, Package.tenant_id == tenant_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found.")

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    seq = (tenant.invoice_sequence or 1000) + 1
    tenant.invoice_sequence = seq
    inv_number = f"{tenant.invoice_prefix or 'CS-'}{datetime.now().strftime('%Y%m')}-{seq}"

    # Record Package Sale invoice (Generates fresh cash revenue)
    invoice = Invoice(
        tenant_id=tenant_id,
        invoice_number=inv_number,
        invoice_type=InvoiceType.B2C.value,
        customer_id=customer.id,
        customer_name=customer.full_name,
        customer_phone=customer.mobile,
        invoice_date=datetime.now(timezone.utc),
        subtotal=package.price,
        discount_amount=Decimal("0.0"),
        taxable_amount=package.price / Decimal("1.18"),
        cgst_amount=(package.price - (package.price / Decimal("1.18"))) / Decimal("2.0"),
        sgst_amount=(package.price - (package.price / Decimal("1.18"))) / Decimal("2.0"),
        igst_amount=Decimal("0.0"),
        total_amount=package.price,
        paid_amount=package.price,
        balance_amount=Decimal("0.0"),
        payment_status=PaymentStatus.PAID.value,
        notes=f"Purchased package: {package.name}"
    )
    db.add(invoice)
    db.flush()

    # Invoice item
    db.add(InvoiceItem(
        tenant_id=tenant_id,
        invoice_id=invoice.id,
        item_type=ItemType.PACKAGE.value,
        package_id=package.id,
        item_name=package.name,
        hsn_sac="999721",
        quantity=Decimal("1.0"),
        unit_price=package.price,
        taxable_value=package.price / Decimal("1.18"),
        gst_rate=Decimal("18.0"),
        cgst_amount=(package.price - (package.price / Decimal("1.18"))) / Decimal("2.0"),
        sgst_amount=(package.price - (package.price / Decimal("1.18"))) / Decimal("2.0"),
        total_amount=package.price
    ))

    # Payment
    db.add(Payment(
        tenant_id=tenant_id,
        invoice_id=invoice.id,
        amount=package.price,
        payment_method=req.payment_method,
        transaction_reference=req.transaction_reference,
        notes=f"Payment for {package.name}"
    ))

    # Activate Customer Package
    today = date.today()
    expiry = today + timedelta(days=package.validity_days)
    
    cp = CustomerPackage(
        tenant_id=tenant_id,
        customer_id=customer.id,
        package_id=package.id,
        invoice_id=invoice.id,
        purchase_date=today,
        expiry_date=expiry,
        total_sessions=package.total_sessions,
        used_sessions=0,
        remaining_sessions=package.total_sessions,
        status=CustomerPackageStatus.ACTIVE.value
    )
    db.add(cp)
    
    # Update customer spend
    customer.total_spend = (customer.total_spend or Decimal("0.0")) + package.price
    
    db.commit()
    db.refresh(cp)
    
    return {
        "message": f"Successfully purchased package '{package.name}'",
        "customer_package_id": cp.id,
        "invoice_number": inv_number,
        "remaining_sessions": cp.remaining_sessions,
        "expiry_date": cp.expiry_date.isoformat()
    }

@router.post("/redeem")
def redeem_package_session(
    req: PackageRedeemRequest,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    """
    Redeems 1 session from a customer package.
    Crucial Rule: Redemption does NOT count as fresh cash revenue.
    """
    cp = db.query(CustomerPackage).filter(
        CustomerPackage.id == req.customer_package_id,
        CustomerPackage.tenant_id == tenant_id
    ).with_for_update().first()
    
    if not cp:
        raise HTTPException(status_code=404, detail="Customer package not found.")
        
    if cp.status != CustomerPackageStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail=f"Package is not active (Status: {cp.status}).")
        
    if cp.expiry_date < date.today():
        cp.status = CustomerPackageStatus.EXPIRED.value
        db.commit()
        raise HTTPException(status_code=400, detail="This package has expired.")
        
    if cp.remaining_sessions <= 0:
        cp.status = CustomerPackageStatus.EXHAUSTED.value
        db.commit()
        raise HTTPException(status_code=400, detail="All sessions for this package have already been redeemed.")
        
    # Deduct 1 session
    cp.used_sessions += 1
    cp.remaining_sessions -= 1
    if cp.remaining_sessions == 0:
        cp.status = CustomerPackageStatus.EXHAUSTED.value
        
    # Record redemption
    redemption = PackageRedemption(
        tenant_id=tenant_id,
        customer_package_id=cp.id,
        appointment_id=req.appointment_id,
        service_id=req.service_id,
        staff_id=req.staff_id,
        redemption_date=datetime.now(timezone.utc),
        notes=req.notes or "Package session redeemed at salon"
    )
    db.add(redemption)
    db.commit()
    
    return {
        "message": "Session redeemed successfully.",
        "remaining_sessions": cp.remaining_sessions,
        "used_sessions": cp.used_sessions,
        "status": cp.status
    }
