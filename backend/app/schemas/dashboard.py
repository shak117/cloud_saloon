from typing import List, Optional
from decimal import Decimal
from datetime import date
from pydantic import BaseModel

class DashboardKPIs(BaseModel):
    # Today's core metrics
    today_revenue: Decimal
    today_cash_collected: Decimal
    today_digital_collected: Decimal
    today_appointments: int
    today_completed_services: int
    today_walkin_customers: int
    today_returning_customers: int
    pending_receivables: Decimal
    today_expenses: Decimal
    net_operating_profit: Decimal
    
    # Inventory & alert counts
    low_stock_count: int

class RevenueTrendPoint(BaseModel):
    date: str
    revenue: Decimal
    cash_collected: Decimal
    appointments_count: int

class ServiceRevenueBreakdown(BaseModel):
    service_id: str
    service_name: str
    category_name: str
    service_count: int
    revenue: Decimal

class StaffPerformanceSummary(BaseModel):
    staff_id: str
    staff_name: str
    designation: str
    color_code: str
    services_completed: int
    revenue_generated: Decimal
    commission_earned: Decimal

class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPIs
    revenue_trends: List[RevenueTrendPoint]
    service_breakdown: List[ServiceRevenueBreakdown]
    staff_performance: List[StaffPerformanceSummary]
