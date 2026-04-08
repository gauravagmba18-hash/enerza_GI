"""Stub routers — premises, accounts, connections, meters, rates, cng, mobile, api_partners"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.auth import ReadUser, WriteUser
from app.models import (
    Premise, Account, ServiceConnection, Meter, MeterReading,
    RatePlan, ChargeComponent, BillCycle, CNGStation, CNGSale,
    AppUser, AppDevice, AppServiceRequest, APIPartner
)

# ─── Premises ────────────────────────────────────────────────────────────────

premises_router = APIRouter()

@premises_router.get("")
def list_premises(search: Optional[str]=None, page:int=1, size:int=25,
                  db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(Premise)
    if search: q = q.filter(Premise.address_line1.ilike(f"%{search}%"))
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

@premises_router.get("/{premise_id}")
def get_premise(premise_id:str, db:Session=Depends(get_db), _=Depends(ReadUser)):
    p = db.query(Premise).get(premise_id)
    if not p: raise HTTPException(404, "Not found")
    return p

# ─── Accounts ─────────────────────────────────────────────────────────────────

accounts_router = APIRouter()

@accounts_router.get("")
def list_accounts(customer_id:Optional[str]=None, page:int=1, size:int=25,
                  db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(Account)
    if customer_id: q = q.filter(Account.customer_id == customer_id)
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

@accounts_router.get("/{account_id}")
def get_account(account_id:str, db:Session=Depends(get_db), _=Depends(ReadUser)):
    a = db.query(Account).get(account_id)
    if not a: raise HTTPException(404, "Not found")
    return a

# ─── Connections ──────────────────────────────────────────────────────────────

connections_router = APIRouter()

@connections_router.get("")
def list_connections(account_id:Optional[str]=None, utility:Optional[str]=None,
                     page:int=1, size:int=25, db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(ServiceConnection)
    if account_id: q = q.filter(ServiceConnection.account_id == account_id)
    if utility:    q = q.filter(ServiceConnection.utility_type == utility)
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

@connections_router.post("/{connection_id}/disconnect")
def disconnect(connection_id:str, reason:str="MANUAL",
               db:Session=Depends(get_db), _=Depends(WriteUser)):
    from datetime import date
    c = db.query(ServiceConnection).get(connection_id)
    if not c: raise HTTPException(404, "Not found")
    c.status = "SUSPENDED"; c.disconnect_date = date.today(); c.disconnect_reason = reason
    db.commit()
    return {"connection_id": connection_id, "status": "SUSPENDED"}

@connections_router.post("/{connection_id}/reconnect")
def reconnect(connection_id:str, db:Session=Depends(get_db), user=Depends(WriteUser)):
    from app.services.billing_engine import reconnect_connection
    conn = reconnect_connection(connection_id, user.user_id, db)
    db.commit()
    return {"connection_id": conn.connection_id, "status": conn.status}

# ─── Meters ───────────────────────────────────────────────────────────────────

meters_router = APIRouter()

@meters_router.get("")
def list_meters(utility:Optional[str]=None, status:Optional[str]=None,
                page:int=1, size:int=25, db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(Meter)
    if utility: q = q.filter(Meter.utility_type == utility)
    if status:  q = q.filter(Meter.status == status)
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

@meters_router.get("/readings")
def list_readings(connection_id:Optional[str]=None, page:int=1, size:int=25,
                  db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(MeterReading)
    if connection_id: q = q.filter(MeterReading.connection_id == connection_id)
    q = q.order_by(MeterReading.reading_date.desc())
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

# ─── Rates ────────────────────────────────────────────────────────────────────

rates_router = APIRouter()

@rates_router.get("/plans")
def list_rate_plans(utility:Optional[str]=None, page:int=1, size:int=25,
                    db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(RatePlan)
    if utility: q = q.filter(RatePlan.utility_type == utility)
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

@rates_router.get("/plans/{plan_id}/components")
def plan_components(plan_id:str, db:Session=Depends(get_db), _=Depends(ReadUser)):
    return db.query(ChargeComponent).filter(ChargeComponent.rate_plan_id==plan_id).all()

@rates_router.get("/cycles")
def list_cycles(db:Session=Depends(get_db), _=Depends(ReadUser)):
    return db.query(BillCycle).all()

# ─── CNG ──────────────────────────────────────────────────────────────────────

cng_router = APIRouter()

@cng_router.get("/stations")
def list_stations(city:Optional[str]=None, page:int=1, size:int=25,
                  db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(CNGStation)
    if city: q = q.filter(CNGStation.city == city)
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

@cng_router.get("/sales")
def list_sales(station_id:Optional[str]=None, page:int=1, size:int=25,
               db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(CNGSale)
    if station_id: q = q.filter(CNGSale.station_id == station_id)
    q = q.order_by(CNGSale.sale_date.desc())
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

# ─── Mobile App ───────────────────────────────────────────────────────────────

mobile_router = APIRouter()

@mobile_router.get("/users")
def list_app_users(page:int=1, size:int=25, db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(AppUser)
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

@mobile_router.post("/users/{app_user_id}/lock")
def lock_app_user(app_user_id:str, db:Session=Depends(get_db), _=Depends(WriteUser)):
    u = db.query(AppUser).get(app_user_id)
    if not u: raise HTTPException(404, "Not found")
    u.status = "LOCKED"; db.commit()
    return {"app_user_id": app_user_id, "status": "LOCKED"}

@mobile_router.get("/service-requests")
def list_srs(status:Optional[str]=None, page:int=1, size:int=25,
             db:Session=Depends(get_db), _=Depends(ReadUser)):
    q = db.query(AppServiceRequest)
    if status: q = q.filter(AppServiceRequest.status == status)
    return {"total": q.count(), "items": q.offset((page-1)*size).limit(size).all()}

# ─── API Partners ─────────────────────────────────────────────────────────────

api_partners_router = APIRouter()

@api_partners_router.get("")
def list_partners(db:Session=Depends(get_db), _=Depends(ReadUser)):
    return db.query(APIPartner).all()

@api_partners_router.get("/{partner_id}")
def get_partner(partner_id:str, db:Session=Depends(get_db), _=Depends(ReadUser)):
    p = db.query(APIPartner).get(partner_id)
    if not p: raise HTTPException(404, "Not found")
    return p

# ─── Expose all routers for main.py ──────────────────────────────────────────

premises    = type('M', (), {'router': premises_router})()
accounts    = type('M', (), {'router': accounts_router})()
connections = type('M', (), {'router': connections_router})()
meters      = type('M', (), {'router': meters_router})()
rates       = type('M', (), {'router': rates_router})()
cng         = type('M', (), {'router': cng_router})()
mobile      = type('M', (), {'router': mobile_router})()
api_partners = type('M', (), {'router': api_partners_router})()
