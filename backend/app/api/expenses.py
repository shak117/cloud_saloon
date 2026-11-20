from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_tenant_id
from app.models.expense import Expense, ExpenseCategory
from app.schemas.expense import ExpenseCreate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expense Management"])

@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.tenant_id == tenant_id)
    if category:
        query = query.filter(Expense.category == category)
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
    return query.order_by(Expense.expense_date.desc()).all()

@router.post("", response_model=ExpenseResponse)
def create_expense(
    req: ExpenseCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    expense = Expense(
        tenant_id=tenant_id,
        title=req.title,
        category=req.category,
        amount=req.amount,
        expense_date=req.expense_date,
        payment_method=req.payment_method,
        description=req.description,
        receipt_url=req.receipt_url
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/summary")
def get_expenses_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total_amount"),
        func.count(Expense.id).label("count")
    ).filter(Expense.tenant_id == tenant_id)
    
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
        
    results = query.group_by(Expense.category).all()
    total_all = sum((r[1] for r in results), Decimal("0.0"))
    
    return {
        "total_expenses": float(total_all),
        "breakdown": [
            {
                "category": r[0],
                "total_amount": float(r[1]),
                "count": r[2]
            } for r in results
        ]
    }
