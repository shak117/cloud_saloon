import csv
import io
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_tenant_id
from app.models.invoice import Invoice, InvoiceItem, Payment
from app.models.commission import StaffCommission
from app.models.expense import Expense
from app.models.product import Product

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/financial-overview")
def get_financial_overview(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    today = date.today()
    s_date = start_date or (today - timedelta(days=30))
    e_date = end_date or today
    
    start_dt = datetime.combine(s_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(e_date, datetime.max.time(), tzinfo=timezone.utc)
    
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.invoice_date >= start_dt,
        Invoice.invoice_date <= end_dt
    ).all()
    
    total_sales = sum((inv.total_amount for inv in invoices), Decimal("0.0"))
    total_discount = sum((inv.discount_amount for inv in invoices), Decimal("0.0"))
    total_tax = sum(((inv.cgst_amount + inv.sgst_amount + inv.igst_amount) for inv in invoices), Decimal("0.0"))
    total_paid = sum((inv.paid_amount for inv in invoices), Decimal("0.0"))
    total_unpaid = sum((inv.balance_amount for inv in invoices), Decimal("0.0"))
    
    # Payments by mode
    payments = db.query(
        Payment.payment_method,
        func.sum(Payment.amount).label("total")
    ).filter(
        Payment.tenant_id == tenant_id,
        Payment.payment_date >= start_dt,
        Payment.payment_date <= end_dt
    ).group_by(Payment.payment_method).all()
    
    # Expenses
    expenses = db.query(Expense).filter(
        Expense.tenant_id == tenant_id,
        Expense.expense_date >= s_date,
        Expense.expense_date <= e_date
    ).all()
    total_expenses = sum((e.amount for e in expenses), Decimal("0.0"))
    
    # Commissions
    commissions = db.query(StaffCommission).filter(
        StaffCommission.tenant_id == tenant_id,
        StaffCommission.created_at >= start_dt,
        StaffCommission.created_at <= end_dt
    ).all()
    total_commissions = sum((c.commission_amount for c in commissions), Decimal("0.0"))
    
    # Estimated Operating Profit = Total Sales - Total Expenses - Total Commissions
    estimated_profit = total_sales - total_expenses - total_commissions
    
    return {
        "period": {"start": s_date.isoformat(), "end": e_date.isoformat()},
        "total_sales": float(total_sales),
        "total_discount": float(total_discount),
        "total_tax_collected": float(total_tax),
        "total_paid_collections": float(total_paid),
        "total_outstanding_receivables": float(total_unpaid),
        "total_operating_expenses": float(total_expenses),
        "total_staff_commissions": float(total_commissions),
        "estimated_net_profit": float(estimated_profit),
        "payment_modes_breakdown": [
            {"method": p[0], "amount": float(p[1])} for p in payments
        ]
    }

@router.get("/export/sales-csv")
def export_sales_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    today = date.today()
    s_date = start_date or (today - timedelta(days=30))
    e_date = end_date or today
    
    start_dt = datetime.combine(s_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(e_date, datetime.max.time(), tzinfo=timezone.utc)
    
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.invoice_date >= start_dt,
        Invoice.invoice_date <= end_dt
    ).order_by(Invoice.invoice_date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Invoice Number", "Date", "Customer Name", "Customer Phone",
        "Type", "Subtotal", "Discount", "Taxable Value", "CGST", "SGST",
        "Grand Total", "Paid Amount", "Balance Due", "Status"
    ])
    
    for inv in invoices:
        writer.writerow([
            inv.invoice_number,
            inv.invoice_date.strftime("%Y-%m-%d %H:%M"),
            inv.customer_name,
            inv.customer_phone or "",
            inv.invoice_type,
            f"{inv.subtotal:.2f}",
            f"{inv.discount_amount:.2f}",
            f"{inv.taxable_amount:.2f}",
            f"{inv.cgst_amount:.2f}",
            f"{inv.sgst_amount:.2f}",
            f"{inv.total_amount:.2f}",
            f"{inv.paid_amount:.2f}",
            f"{inv.balance_amount:.2f}",
            inv.payment_status
        ])
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=salon_sales_{s_date}_to_{e_date}.csv"}
    )
