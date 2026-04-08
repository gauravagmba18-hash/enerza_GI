"""BFS Enerza — Reports & MIS API"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from app.database import get_db
from app.auth import ReadUser
from app.models import Bill, BillStatus, PaymentOrder, PaymentStatus, Customer, ServiceConnection

router = APIRouter()

@router.get("/dashboard-summary")
def dashboard_summary(db: Session = Depends(get_db), _=Depends(ReadUser)):
    total_customers   = db.query(func.count(Customer.customer_id)).scalar()
    active_customers  = db.query(func.count(Customer.customer_id)).filter(Customer.status=="ACTIVE").scalar()
    total_connections = db.query(func.count(ServiceConnection.connection_id)).scalar()
    active_conns      = db.query(func.count(ServiceConnection.connection_id)).filter(ServiceConnection.status=="ACTIVE").scalar()

    bills_this_month  = db.query(func.count(Bill.bill_id),
                                  func.sum(Bill.total_amount)).filter(
        Bill.billing_period == func.to_char(func.now(), 'YYYY-MM')
    ).first()
    overdue_bills = db.query(func.count(Bill.bill_id),
                              func.sum(Bill.balance_amount)).filter(
        Bill.status == BillStatus.OVERDUE
    ).first()
    payments_mtd = db.query(func.sum(PaymentOrder.amount)).filter(
        PaymentOrder.status == PaymentStatus.SUCCESS,
        extract('month', PaymentOrder.initiated_at) == extract('month', func.now()),
        extract('year',  PaymentOrder.initiated_at) == extract('year',  func.now()),
    ).scalar() or 0

    return {
        "customers":        {"total": total_customers, "active": active_customers},
        "connections":      {"total": total_connections, "active": active_conns},
        "bills_this_month": {"count": bills_this_month[0] or 0, "amount": float(bills_this_month[1] or 0)},
        "overdue":          {"count": overdue_bills[0] or 0, "amount": float(overdue_bills[1] or 0)},
        "payments_mtd":     float(payments_mtd),
    }

@router.get("/revenue-by-month")
def revenue_by_month(
    months: int = Query(12, le=24),
    db: Session = Depends(get_db), _=Depends(ReadUser),
):
    rows = (
        db.query(
            Bill.billing_period,
            func.sum(Bill.net_amount).label("net"),
            func.sum(Bill.tax_amount).label("tax"),
            func.sum(Bill.total_amount).label("total"),
            func.count(Bill.bill_id).label("count"),
        )
        .filter(Bill.status != BillStatus.REVERSED)
        .group_by(Bill.billing_period)
        .order_by(Bill.billing_period.desc())
        .limit(months)
        .all()
    )
    return [{"period": r.billing_period, "net": float(r.net or 0),
             "tax": float(r.tax or 0), "total": float(r.total or 0),
             "count": r.count} for r in rows]

@router.get("/collection-efficiency")
def collection_efficiency(
    period: Optional[str] = None,
    db: Session = Depends(get_db), _=Depends(ReadUser),
):
    q = db.query(
        func.sum(Bill.total_amount).label("billed"),
        func.sum(Bill.paid_amount).label("collected"),
        func.count(Bill.bill_id).label("total_bills"),
    ).filter(Bill.status != BillStatus.REVERSED)
    if period:
        q = q.filter(Bill.billing_period == period)
    r = q.first()
    billed    = float(r.billed or 0)
    collected = float(r.collected or 0)
    return {
        "billed": billed, "collected": collected,
        "efficiency_pct": round(collected / billed * 100, 2) if billed > 0 else 0,
        "total_bills": r.total_bills or 0,
    }

@router.get("/arrears-aging")
def arrears_aging(db: Session = Depends(get_db), _=Depends(ReadUser)):
    from datetime import date
    today = date.today()
    rows = (
        db.query(Bill)
        .filter(Bill.status.in_([BillStatus.OVERDUE, BillStatus.PARTIALLY_PAID]),
                Bill.balance_amount > 0)
        .all()
    )
    buckets = {"0-30": 0, "31-60": 0, "61-90": 0, "90+": 0}
    for b in rows:
        if not b.due_date: continue
        days = (today - b.due_date).days
        bal  = float(b.balance_amount or 0)
        if days <= 30:   buckets["0-30"] += bal
        elif days <= 60: buckets["31-60"] += bal
        elif days <= 90: buckets["61-90"] += bal
        else:            buckets["90+"]   += bal
    return {"aging": buckets, "total_overdue": sum(buckets.values())}

@router.get("/utility-consumption")
def utility_consumption(
    period: Optional[str] = None,
    db: Session = Depends(get_db), _=Depends(ReadUser),
):
    from app.models import MeterReading, ServiceConnection as SC
    q = (
        db.query(SC.utility_type, func.sum(MeterReading.consumption).label("total"))
        .join(MeterReading, MeterReading.connection_id == SC.connection_id)
    )
    if period:
        q = q.filter(func.to_char(MeterReading.reading_date, 'YYYY-MM') == period)
    rows = q.group_by(SC.utility_type).all()
    return {r.utility_type: float(r.total or 0) for r in rows}
