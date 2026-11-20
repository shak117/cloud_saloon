from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.core.database import get_db
from app.core.deps import get_current_tenant_id
from app.models.invoice import Invoice, InvoiceItem, Payment, PaymentMethod, PaymentStatus
from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.expense import Expense
from app.models.product import Product
from app.models.staff import Staff
from app.schemas.dashboard import (
    DashboardSummaryResponse, DashboardKPIs, RevenueTrendPoint,
    ServiceRevenueBreakdown, StaffPerformanceSummary
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    range_type: str = Query("today", regex="^(today|yesterday|last7days|thismonth|all)$"),
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    today = date.today()
    
    # Calculate date bounds based on range_type
    if range_type == "yesterday":
        start_date = today - timedelta(days=1)
        end_date = start_date
    elif range_type == "last7days":
        start_date = today - timedelta(days=6)
        end_date = today
    elif range_type == "thismonth":
        start_date = today.replace(day=1)
        end_date = today
    else:  # today
        start_date = today
        end_date = today

    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)

    # 1. Revenue & Invoices in range
    invoices_in_range = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.invoice_date >= start_dt,
        Invoice.invoice_date <= end_dt
    ).all()

    today_revenue = sum((inv.total_amount for inv in invoices_in_range), Decimal("0.0"))
    
    # 2. Payments collected in range
    payments_in_range = db.query(Payment).filter(
        Payment.tenant_id == tenant_id,
        Payment.payment_date >= start_dt,
        Payment.payment_date <= end_dt
    ).all()

    today_cash = sum((p.amount for p in payments_in_range if p.payment_method == PaymentMethod.CASH.value), Decimal("0.0"))
    today_digital = sum((p.amount for p in payments_in_range if p.payment_method != PaymentMethod.CASH.value), Decimal("0.0"))

    # 3. Appointments & walk-ins
    appts_in_range = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= end_date
    ).all()

    today_appts_count = len(appts_in_range)
    today_completed = len([a for a in appts_in_range if a.status == AppointmentStatus.COMPLETED.value])
    today_walkins = len([a for a in appts_in_range if a.is_walkin])

    # 4. Expenses in range
    expenses_in_range = db.query(Expense).filter(
        Expense.tenant_id == tenant_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).all()
    today_exp = sum((e.amount for e in expenses_in_range), Decimal("0.0"))

    # 5. Pending receivables (all outstanding balances for this salon)
    all_unpaid_invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.payment_status.in_([PaymentStatus.UNPAID.value, PaymentStatus.PARTIAL.value])
    ).all()
    pending_receivables = sum((inv.balance_amount for inv in all_unpaid_invoices), Decimal("0.0"))

    # 6. Low stock products alert count
    low_stock_count = db.query(Product).filter(
        Product.tenant_id == tenant_id,
        Product.is_active == True,
        Product.current_stock <= Product.reorder_level
    ).count()

    # Net estimated operating profit (Earned Revenue - Operating Expenses)
    net_operating_profit = today_revenue - today_exp

    # 7. Last 7 Days Revenue Trend Points
    trend_points: List[RevenueTrendPoint] = []
    for i in range(6, -1, -1):
        day_d = today - timedelta(days=i)
        d_start = datetime.combine(day_d, datetime.min.time(), tzinfo=timezone.utc)
        d_end = datetime.combine(day_d, datetime.max.time(), tzinfo=timezone.utc)
        
        day_invs = db.query(Invoice).filter(
            Invoice.tenant_id == tenant_id,
            Invoice.invoice_date >= d_start,
            Invoice.invoice_date <= d_end
        ).all()
        
        day_pays = db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.payment_date >= d_start,
            Payment.payment_date <= d_end
        ).all()
        
        day_appts = db.query(Appointment).filter(
            Appointment.tenant_id == tenant_id,
            Appointment.appointment_date == day_d
        ).count()
        
        trend_points.append(RevenueTrendPoint(
            date=day_d.strftime("%d %b"),
            revenue=sum((inv.total_amount for inv in day_invs), Decimal("0.0")),
            cash_collected=sum((p.amount for p in day_pays), Decimal("0.0")),
            appointments_count=day_appts
        ))

    # 8. Service-wise breakdown
    service_items = db.query(
        InvoiceItem.service_id,
        InvoiceItem.item_name,
        func.count(InvoiceItem.id).label("count"),
        func.sum(InvoiceItem.total_amount).label("rev")
    ).filter(
        InvoiceItem.tenant_id == tenant_id,
        InvoiceItem.item_type == "SERVICE"
    ).group_by(InvoiceItem.service_id, InvoiceItem.item_name).limit(5).all()

    service_breakdown = [
        ServiceRevenueBreakdown(
            service_id=item[0] or "svc",
            service_name=item[1],
            category_name="Salon Service",
            service_count=item[2] or 0,
            revenue=item[3] or Decimal("0.0")
        ) for item in service_items
    ]

    # 9. Staff Performance
    staff_members = db.query(Staff).filter(Staff.tenant_id == tenant_id, Staff.is_active == True).all()
    staff_summary = []
    for st in staff_members:
        st_items = db.query(InvoiceItem).filter(
            InvoiceItem.tenant_id == tenant_id,
            InvoiceItem.staff_id == st.id
        ).all()
        
        st_rev = sum((it.total_amount for it in st_items), Decimal("0.0"))
        st_comm = sum((it.commission_amount for it in st_items), Decimal("0.0"))
        
        staff_summary.append(StaffPerformanceSummary(
            staff_id=st.id,
            staff_name=st.name,
            designation=st.designation,
            color_code=st.color_code,
            services_completed=len(st_items),
            revenue_generated=st_rev,
            commission_earned=st_comm
        ))

    return DashboardSummaryResponse(
        kpis=DashboardKPIs(
            today_revenue=today_revenue,
            today_cash_collected=today_cash,
            today_digital_collected=today_digital,
            today_appointments=today_appts_count,
            today_completed_services=today_completed,
            today_walkin_customers=today_walkins,
            today_returning_customers=max(0, today_completed - today_walkins),
            pending_receivables=pending_receivables,
            today_expenses=today_exp,
            net_operating_profit=net_operating_profit,
            low_stock_count=low_stock_count
        ),
        revenue_trends=trend_points,
        service_breakdown=service_breakdown,
        staff_performance=staff_summary
    )
