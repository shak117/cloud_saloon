from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id, get_current_tenant, require_active_subscription
from app.models.invoice import Invoice, InvoiceItem, Payment, InvoiceType, PaymentStatus, PaymentMethod, ItemType
from app.models.tenant import Tenant
from app.models.customer import Customer
from app.models.staff import Staff, CommissionType
from app.models.product import Product, StockLedger, StockTransactionType
from app.models.commission import StaffCommission
from app.models.appointment import Appointment, AppointmentStatus
from app.services.gst_engine import GSTEngine, round_curr
from app.services.recipe_engine import deduct_service_consumables
from app.services.pdf_service import generate_a4_tax_invoice, generate_thermal_receipt
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, PaymentCreate

router = APIRouter(prefix="/pos", tags=["POS Billing & Checkout"])

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    search: Optional[str] = None,
    limit: int = 50,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice).filter(Invoice.tenant_id == tenant_id)
    if search:
        query = query.filter(
            (Invoice.invoice_number.ilike(f"%{search}%")) |
            (Invoice.customer_name.ilike(f"%{search}%")) |
            (Invoice.customer_phone.ilike(f"%{search}%"))
        )
    return query.order_by(Invoice.invoice_date.desc()).limit(limit).all()

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return inv

@router.post("/checkout", response_model=InvoiceResponse)
def create_pos_invoice(
    req: InvoiceCreate,
    tenant: Tenant = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    tenant_id = tenant.id
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot create invoice with zero items.")

    # Simple non-GST launch mode by default; GST activated only when registered
    is_gst_enabled = bool(
        tenant.tax_configuration and tenant.tax_configuration.get("gst_enabled", False)
    )

    # 1. Generate Invoice Number (e.g. CS-202611-1043)
    prefix = tenant.invoice_prefix or "CS-"
    seq = (tenant.invoice_sequence or 1000) + 1
    tenant.invoice_sequence = seq
    inv_number = f"{prefix}{datetime.now().strftime('%Y%m')}-{seq}"

    # 2. Compute itemized line totals
    subtotal = Decimal("0.0")
    total_taxable = Decimal("0.0")
    total_cgst = Decimal("0.0")
    total_sgst = Decimal("0.0")
    total_igst = Decimal("0.0")
    grand_total = Decimal("0.0")

    invoice_items_to_add = []
    commissions_to_add = []

    for item_data in req.items:
        qty = item_data.quantity
        rate = item_data.unit_price
        line_gross = round_curr(qty * rate)
        line_discount = round_curr(item_data.discount)
        
        # Determine effective GST rate: 0.0% in default launch mode
        effective_gst_rate = item_data.gst_rate if is_gst_enabled else Decimal("0.0")
        
        gst_calc = GSTEngine.calculate_inclusive_line(
            inclusive_amount=line_gross,
            gst_rate=effective_gst_rate,
            discount=line_discount,
            is_interstate=False
        )
        
        subtotal += line_gross
        total_taxable += gst_calc["taxable_value"]
        total_cgst += gst_calc["cgst_amount"]
        total_sgst += gst_calc["sgst_amount"]
        total_igst += gst_calc["igst_amount"]
        grand_total += gst_calc["total_amount"]

        # Staff commission calculation
        comm_amount = Decimal("0.0")
        if item_data.staff_id and item_data.item_type == ItemType.SERVICE.value:
            staff = db.query(Staff).filter(Staff.id == item_data.staff_id, Staff.tenant_id == tenant_id).first()
            if staff and staff.commission_type != CommissionType.NONE.value:
                if staff.commission_type == CommissionType.PERCENTAGE.value:
                    comm_amount = round_curr(gst_calc["taxable_value"] * (staff.commission_rate / Decimal("100.0")))
                elif staff.commission_type == CommissionType.FIXED.value:
                    comm_amount = round_curr(staff.commission_rate)

        inv_item = InvoiceItem(
            tenant_id=tenant_id,
            item_type=item_data.item_type,
            service_id=item_data.service_id,
            product_id=item_data.product_id,
            package_id=item_data.package_id,
            staff_id=item_data.staff_id,
            item_name=item_data.item_name,
            hsn_sac=item_data.hsn_sac or ("999721" if item_data.item_type == "SERVICE" else "330510"),
            quantity=qty,
            unit_price=rate,
            discount=line_discount,
            taxable_value=gst_calc["taxable_value"],
            gst_rate=effective_gst_rate,
            cgst_amount=gst_calc["cgst_amount"],
            sgst_amount=gst_calc["sgst_amount"],
            total_amount=gst_calc["total_amount"],
            commission_amount=comm_amount
        )
        invoice_items_to_add.append(inv_item)

        # Immediate inventory decrement if retail product
        if item_data.item_type == ItemType.PRODUCT.value and item_data.product_id:
            prod = db.query(Product).filter(
                Product.id == item_data.product_id,
                Product.tenant_id == tenant_id
            ).with_for_update().first()
            if prod:
                new_stk = max(Decimal("0.0"), prod.current_stock - qty)
                prod.current_stock = new_stk
                db.add(StockLedger(
                    tenant_id=tenant_id,
                    product_id=prod.id,
                    transaction_type=StockTransactionType.SALE.value,
                    reference_id=inv_number,
                    quantity_in=Decimal("0.0"),
                    quantity_out=qty,
                    balance_after=new_stk,
                    notes=f"POS Retail sale #{inv_number}"
                ))

        # Consumable recipe auto-deduction if service
        if item_data.item_type == ItemType.SERVICE.value and item_data.service_id:
            deduct_service_consumables(
                db=db,
                tenant_id=tenant_id,
                service_id=item_data.service_id,
                reference_id=inv_number,
                service_name=item_data.item_name
            )

    # 3. Overall invoice discount adjustment
    overall_disc = round_curr(req.discount_amount)
    final_total = max(Decimal("0.0"), grand_total - overall_disc)

    # 4. Payments reconciliation
    total_paid = sum((p.amount for p in req.payments), Decimal("0.0"))
    balance = max(Decimal("0.0"), final_total - total_paid)

    if balance == Decimal("0.0"):
        pay_status = PaymentStatus.PAID.value
    elif total_paid > Decimal("0.0"):
        pay_status = PaymentStatus.PARTIAL.value
    else:
        pay_status = PaymentStatus.UNPAID.value

    # 5. Create Invoice
    invoice = Invoice(
        tenant_id=tenant_id,
        invoice_number=inv_number,
        invoice_type=req.invoice_type,
        appointment_id=req.appointment_id,
        customer_id=req.customer_id,
        customer_name=req.customer_name or "Walk-in Client",
        customer_phone=req.customer_phone,
        customer_gstin=req.customer_gstin,
        customer_address=req.customer_address,
        invoice_date=datetime.now(timezone.utc),
        subtotal=subtotal,
        discount_amount=overall_disc,
        taxable_amount=total_taxable,
        cgst_amount=total_cgst,
        sgst_amount=total_sgst,
        igst_amount=total_igst,
        total_amount=final_total,
        paid_amount=total_paid,
        balance_amount=balance,
        payment_status=pay_status,
        notes=req.notes
    )
    db.add(invoice)
    db.flush()

    # Link items and commissions
    for item in invoice_items_to_add:
        item.invoice_id = invoice.id
        db.add(item)
        db.flush()
        
        if item.commission_amount > Decimal("0.0") and item.staff_id:
            staff_comm = StaffCommission(
                tenant_id=tenant_id,
                staff_id=item.staff_id,
                invoice_item_id=item.id,
                commission_type="PERCENTAGE",
                commission_rate=Decimal("10.0"),
                service_amount=item.total_amount,
                commission_amount=item.commission_amount,
                is_paid=False
            )
            db.add(staff_comm)

    # Add payments
    for p_req in req.payments:
        pay = Payment(
            tenant_id=tenant_id,
            invoice_id=invoice.id,
            amount=p_req.amount,
            payment_method=p_req.payment_method,
            transaction_reference=p_req.transaction_reference,
            notes=p_req.notes
        )
        db.add(pay)

    # Update customer metrics if registered customer
    if req.customer_id:
        cust = db.query(Customer).filter(Customer.id == req.customer_id, Customer.tenant_id == tenant_id).first()
        if cust:
            cust.total_spend = (cust.total_spend or Decimal("0.0")) + final_total
            cust.total_visits = (cust.total_visits or 0) + 1
            cust.last_visit_date = datetime.now().date()

    # Mark appointment completed if linked
    if req.appointment_id:
        appt = db.query(Appointment).filter(Appointment.id == req.appointment_id, Appointment.tenant_id == tenant_id).first()
        if appt:
            appt.status = AppointmentStatus.COMPLETED.value
            appt.invoice_id = invoice.id

    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/invoices/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.tenant_id == tenant.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    pdf_bytes = generate_a4_tax_invoice(inv, tenant)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={inv.invoice_number}.pdf"}
    )

@router.get("/invoices/{invoice_id}/thermal")
def download_thermal_receipt(
    invoice_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.tenant_id == tenant.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    thermal_bytes = generate_thermal_receipt(inv, tenant)
    return Response(
        content=thermal_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={inv.invoice_number}_receipt.pdf"}
    )
