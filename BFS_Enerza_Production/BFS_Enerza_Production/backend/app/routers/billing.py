from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import date
from io import BytesIO
from pydantic import BaseModel
from app.database import get_db
from app.auth import ReadUser, BillingUser, BillingReversal
from app.models import Bill, BillStatus, SystemUser, ServiceConnection, Account, Customer, Premise
from app.services.billing_engine import generate_bill, run_batch_billing, reverse_bill, PLAN_MAP
from app.services.pdf_service import generate_bill_pdf
from app.services.notification_service import send_bill_email

router = APIRouter()

class BatchBillingRequest(BaseModel):
    billing_period: str      # "2026-04"
    bill_date: date
    dry_run: bool = False

class ManualBillRequest(BaseModel):
    connection_id: str; account_id: str
    plan_id: str; consumption: float
    billing_period: str; bill_date: date
    grace_days: int = 20

class ReversalRequest(BaseModel):
    reason: str

@router.get("")
def list_bills(
    account_id: Optional[str] = None,
    status: Optional[str] = None,
    period: Optional[str] = None,
    overdue_only: bool = False,
    page: int = Query(1, ge=1),
    size: int = Query(25, le=100),
    db: Session = Depends(get_db), _=Depends(ReadUser),
):
    q = db.query(Bill)
    if account_id:   q = q.filter(Bill.account_id == account_id)
    if status:       q = q.filter(Bill.status == status)
    if period:       q = q.filter(Bill.billing_period == period)
    if overdue_only: q = q.filter(Bill.status == BillStatus.OVERDUE)
    q = q.order_by(Bill.bill_date.desc())
    total = q.count()
    items = q.offset((page-1)*size).limit(size).all()
    return {"total": total, "page": page, "size": size, "items": items}

@router.get("/{bill_id}")
def get_bill(bill_id: str, db: Session = Depends(get_db), _=Depends(ReadUser)):
    b = db.query(Bill).get(bill_id)
    if not b: raise HTTPException(404, "Bill not found")
    return b

@router.get("/{bill_id}/pdf")
def download_bill_pdf(bill_id: str, db: Session = Depends(get_db), _=Depends(ReadUser)):
    bill = db.query(Bill).get(bill_id)
    if not bill: raise HTTPException(404, "Bill not found")

    # Fetch customer details
    account  = db.query(Account).get(bill.account_id)
    customer = db.query(Customer).get(account.customer_id) if account else None
    premise  = db.query(Premise).get(account.premise_id) if account else None

    bill_data = {
        "bill_id":         bill.bill_id,
        "billing_period":  bill.billing_period,
        "bill_date":       str(bill.bill_date),
        "due_date":        str(bill.due_date),
        "consumption":     float(bill.consumption or 0),
        "uom":             bill.uom or "SCM",
        "net_amount":      float(bill.net_amount),
        "tax_amount":      float(bill.tax_amount),
        "arrears_amount":  float(bill.arrears_amount or 0),
        "late_fee":        float(bill.late_fee or 0),
        "subsidy_amount":  float(bill.subsidy_amount or 0),
        "total_amount":    float(bill.total_amount),
        "status":          bill.status.value if bill.status else "GENERATED",
        "utility":         "GAS_PNG",
        "lines":           [
            {"name": ln.description, "qty": float(ln.quantity) if ln.quantity else None,
             "rate": float(ln.rate), "amount": float(ln.amount), "line_type": ln.line_type}
            for ln in (bill.lines or [])
        ],
    }
    customer_data = {
        "name":       customer.full_name if customer else "—",
        "address":    f"{premise.address_line1}, {premise.city}" if premise else "—",
        "mobile":     customer.mobile if customer else "—",
        "email":      customer.email if customer else "—",
        "account_id": bill.account_id,
    }
    pdf_bytes = generate_bill_pdf(bill_data, customer_data)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="BFS_Enerza_{bill_id}.pdf"'},
    )

@router.post("/batch-run")
def run_batch(
    req: BatchBillingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: SystemUser = Depends(BillingUser),
):
    if req.dry_run:
        result = run_batch_billing(req.billing_period, req.bill_date, db,
                                   dry_run=True, generated_by=user.user_id)
        return result

    # Run in background for production (non-blocking)
    def _run():
        from app.database import SessionLocal
        _db = SessionLocal()
        try:
            run_batch_billing(req.billing_period, req.bill_date, _db,
                              generated_by=user.user_id)
            _db.commit()
        except Exception as e:
            _db.rollback()
        finally:
            _db.close()

    background_tasks.add_task(_run)
    return {"status": "started", "period": req.billing_period,
            "message": "Batch billing running in background. Check /api/v1/billing?period=... for results."}

@router.post("/manual")
def create_manual_bill(
    req: ManualBillRequest,
    db: Session = Depends(get_db),
    user: SystemUser = Depends(BillingUser),
):
    from app.services.billing_engine import _persist_bill
    bill_data = generate_bill(
        connection_id  = req.connection_id,
        account_id     = req.account_id,
        plan_id        = req.plan_id,
        consumption    = req.consumption,
        billing_period = req.billing_period,
        bill_date      = req.bill_date,
        grace_days     = req.grace_days,
        db             = db,
        generated_by   = user.user_id,
    )
    _persist_bill(bill_data, db)
    db.commit()
    return bill_data

@router.post("/{bill_id}/reverse")
def reverse_bill_endpoint(
    bill_id: str,
    req: ReversalRequest,
    db: Session = Depends(get_db),
    user: SystemUser = Depends(BillingReversal),
):
    bill = db.query(Bill).get(bill_id)
    if not bill: raise HTTPException(404, "Bill not found")
    if bill.status == BillStatus.REVERSED:
        raise HTTPException(400, "Bill is already reversed")
    reversal = reverse_bill(bill, req.reason, user.user_id, db)
    db.commit()
    return {"reversal_bill_id": reversal.bill_id, "original_bill_id": bill_id,
            "status": "reversed", "reason": req.reason}
