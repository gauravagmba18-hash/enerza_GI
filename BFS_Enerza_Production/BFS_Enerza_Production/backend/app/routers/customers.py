"""
BFS Enerza — Customers Router
Full CRUD with pagination, search, KYC update, approval workflow.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
import uuid
from app.database import get_db
from app.auth import ReadUser, WriteUser
from app.models import Customer, SystemUser, AuditLog
import json

router = APIRouter()

class CustomerCreate(BaseModel):
    full_name: str; customer_type: str = "Individual"
    mobile: str; email: Optional[str] = None
    pan_ref: Optional[str] = None; aadhaar_ref: Optional[str] = None
    kyc_status: str = "PENDING"; effective_from: date

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None; mobile: Optional[str] = None
    email: Optional[str] = None; kyc_status: Optional[str] = None
    status: Optional[str] = None; pan_ref: Optional[str] = None

def _paginate(query, page, size):
    total = query.count()
    items = query.offset((page-1)*size).limit(size).all()
    return {"total": total, "page": page, "size": size, "items": items}

@router.get("")
def list_customers(
    search: Optional[str] = None,
    status: Optional[str] = None,
    kyc_status: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: SystemUser = Depends(ReadUser),
):
    q = db.query(Customer)
    if search:
        q = q.filter(or_(
            Customer.full_name.ilike(f"%{search}%"),
            Customer.customer_id.ilike(f"%{search}%"),
            Customer.mobile.ilike(f"%{search}%"),
        ))
    if status:    q = q.filter(Customer.status == status)
    if kyc_status: q = q.filter(Customer.kyc_status == kyc_status)
    q = q.order_by(Customer.created_on.desc())
    return _paginate(q, page, size)

@router.get("/{customer_id}")
def get_customer(customer_id: str, db: Session = Depends(get_db), _=Depends(ReadUser)):
    c = db.query(Customer).get(customer_id)
    if not c: raise HTTPException(404, f"Customer {customer_id} not found")
    return c

@router.post("", status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db), user: SystemUser = Depends(WriteUser)):
    cid = f"CUST{uuid.uuid4().hex[:6].upper()}"
    c = Customer(customer_id=cid, **data.model_dump(), status="DRAFT", created_by=user.user_id)
    db.add(c)
    db.add(AuditLog(user_id=user.user_id, table_name="customers", record_id=cid,
                    action="CREATE", new_values=json.dumps(data.model_dump())))
    db.commit(); db.refresh(c)
    return c

@router.patch("/{customer_id}")
def update_customer(customer_id: str, data: CustomerUpdate,
                    db: Session = Depends(get_db), user: SystemUser = Depends(WriteUser)):
    c = db.query(Customer).get(customer_id)
    if not c: raise HTTPException(404, "Not found")
    old = {k: str(getattr(c, k)) for k in data.model_fields if getattr(c, k) is not None}
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    c.changed_by = user.user_id
    db.add(AuditLog(user_id=user.user_id, table_name="customers", record_id=customer_id,
                    action="UPDATE", old_values=json.dumps(old),
                    new_values=json.dumps(data.model_dump(exclude_none=True))))
    db.commit(); db.refresh(c)
    return c

@router.post("/{customer_id}/activate")
def activate_customer(customer_id: str, db: Session = Depends(get_db), user: SystemUser = Depends(WriteUser)):
    c = db.query(Customer).get(customer_id)
    if not c: raise HTTPException(404, "Not found")
    if c.kyc_status != "VERIFIED":
        raise HTTPException(400, "Cannot activate: KYC not verified")
    c.status = "ACTIVE"; c.changed_by = user.user_id
    db.commit()
    return {"customer_id": customer_id, "status": "ACTIVE"}

@router.post("/{customer_id}/block")
def block_customer(customer_id: str, db: Session = Depends(get_db), user: SystemUser = Depends(WriteUser)):
    c = db.query(Customer).get(customer_id)
    if not c: raise HTTPException(404, "Not found")
    c.status = "BLOCKED"; c.changed_by = user.user_id
    db.commit()
    return {"customer_id": customer_id, "status": "BLOCKED"}
