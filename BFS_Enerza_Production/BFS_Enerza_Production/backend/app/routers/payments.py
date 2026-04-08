"""Payments router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_db
from app.auth import ReadUser, PaymentUser
from app.models import Bill, PaymentOrder, PaymentStatus, SystemUser
from app.services.payment_service import create_payment_order, process_payment_callback, initiate_refund
import asyncio

router = APIRouter()

class OrderRequest(BaseModel):
    bill_id: str; channel: str = "UPI"; gateway_id: str = "GW-RAZORPAY-01"
    amount: Optional[float] = None

class CallbackRequest(BaseModel):
    order_id: str; gateway_ref: str; gateway_status: str; amount_paid: float

class RefundRequest(BaseModel):
    order_id: str; amount: float; reason_code: str

@router.post("/orders")
def create_order(req: OrderRequest, db: Session = Depends(get_db), user: SystemUser = Depends(PaymentUser)):
    bill = db.query(Bill).get(req.bill_id)
    if not bill: raise HTTPException(404, "Bill not found")
    order = create_payment_order(bill, req.channel, req.gateway_id, db, req.amount)
    db.commit()
    return order

@router.post("/callback")
def payment_callback(req: CallbackRequest, db: Session = Depends(get_db)):
    result = process_payment_callback(req.order_id, req.gateway_ref,
                                      req.gateway_status, req.amount_paid, db)
    db.commit()
    return result

@router.post("/refunds")
def refund(req: RefundRequest, db: Session = Depends(get_db), user: SystemUser = Depends(PaymentUser)):
    loop = asyncio.new_event_loop()
    refund_obj = loop.run_until_complete(
        initiate_refund(req.order_id, req.amount, req.reason_code, user.user_id, db)
    )
    db.commit()
    return refund_obj

@router.get("")
def list_payments(account_id: Optional[str] = None, status: Optional[str] = None,
                  page: int = 1, size: int = 25,
                  db: Session = Depends(get_db), _=Depends(ReadUser)):
    q = db.query(PaymentOrder)
    if account_id: q = q.filter(PaymentOrder.account_id == account_id)
    if status:     q = q.filter(PaymentOrder.status == status)
    total = q.count()
    items = q.order_by(PaymentOrder.initiated_at.desc()).offset((page-1)*size).limit(size).all()
    return {"total": total, "items": items}
