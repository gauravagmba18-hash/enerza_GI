"""
BFS Enerza — Payment Service
Handles: Order creation → Gateway dispatch → Callback processing →
         Reconciliation → Refunds → Suspense
"""
import hashlib, hmac, json, uuid, logging
from datetime import date, datetime, timezone
from typing import Optional
import httpx
from sqlalchemy.orm import Session
from app.models import (
    Bill, BillStatus, PaymentOrder, PaymentStatus,
    GatewayTxn, Settlement, Refund, SuspenseRecord
)
from app.config import settings

logger = logging.getLogger(__name__)

# ─── Payment Order ────────────────────────────────────────────────────────────

def create_payment_order(
    bill: Bill,
    channel: str,
    gateway_id: str,
    db: Session,
    amount: Optional[float] = None,
) -> PaymentOrder:
    pay_amount = amount or float(bill.balance_amount)
    order_id   = f"ORD{uuid.uuid4().hex[:12].upper()}"

    order = PaymentOrder(
        order_id      = order_id,
        bill_id       = bill.bill_id,
        account_id    = bill.account_id,
        channel_id    = channel,
        gateway_id    = gateway_id,
        amount        = pay_amount,
        convenience_fee = 0,
        total_charged = pay_amount,
        status        = PaymentStatus.INITIATED,
    )
    db.add(order)
    db.flush()
    logger.info(f"Payment order {order_id} created for bill {bill.bill_id} — ₹{pay_amount}")
    return order

# ─── Gateway Dispatch ─────────────────────────────────────────────────────────

async def dispatch_to_razorpay(order: PaymentOrder) -> dict:
    """
    Create a Razorpay payment order.
    Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in settings.
    Returns Razorpay order object with id for client-side SDK.
    """
    if not settings.RAZORPAY_KEY_ID:
        # Return mock response for sandbox/development
        return {
            "id":       f"order_mock_{uuid.uuid4().hex[:16]}",
            "entity":   "order",
            "amount":   int(float(order.total_charged) * 100),
            "currency": "INR",
            "status":   "created",
            "mock":     True,
        }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.razorpay.com/v1/orders",
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
            json={
                "amount":   int(float(order.total_charged) * 100),
                "currency": "INR",
                "receipt":  order.order_id,
                "notes":    {"bill_id": order.bill_id, "account_id": order.account_id},
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

async def dispatch_to_bbps(order: PaymentOrder, bill: Bill) -> dict:
    """
    Submit payment via BBPS (BharatBillPay System).
    Requires BBPS_AGENT_ID and BBPS_API_KEY.
    """
    if not settings.BBPS_API_KEY:
        return {
            "transactionId": f"BBPS{uuid.uuid4().hex[:12].upper()}",
            "status":        "SUCCESS",
            "mock":          True,
        }

    payload = {
        "head": {
            "ver": "1.0",
            "ts":  datetime.now(timezone.utc).isoformat(),
            "orgId": settings.BBPS_AGENT_ID,
            "refId": order.order_id,
        },
        "body": {
            "customerMobileNo": "",
            "inputParams": {
                "input": [{"paramName": "Consumer Number", "paramValue": order.account_id}]
            },
            "transactionAmount": str(int(float(order.total_charged) * 100)),
            "paymentMode":       "Internet Banking",
            "splitPay":          "N",
        }
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.billpay.npci.org.in/BillPayUI/api/payBill",
            json=payload,
            headers={"apiKey": settings.BBPS_API_KEY},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

# ─── Webhook / Callback Handler ───────────────────────────────────────────────

def verify_razorpay_webhook(payload: bytes, signature: str) -> bool:
    """Verify Razorpay webhook HMAC-SHA256 signature."""
    if not settings.RAZORPAY_KEY_SECRET:
        return True  # Skip in dev
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

def process_payment_callback(
    order_id: str,
    gateway_ref: str,
    gateway_status: str,
    amount_paid: float,
    db: Session,
) -> dict:
    """
    Process gateway callback. Update order, bill, and create gateway txn.
    """
    order = db.query(PaymentOrder).filter(PaymentOrder.order_id == order_id).first()
    if not order:
        raise ValueError(f"Order {order_id} not found")

    # Create gateway transaction record
    txn = GatewayTxn(
        txn_id        = f"GTXN{uuid.uuid4().hex[:12].upper()}",
        order_id      = order_id,
        gateway_ref   = gateway_ref,
        gateway_status = gateway_status,
        response_at   = datetime.now(timezone.utc),
    )
    db.add(txn)

    if gateway_status in ("SUCCESS", "CAPTURED"):
        order.status        = PaymentStatus.SUCCESS
        order.gateway_ref   = gateway_ref
        order.completed_at  = datetime.now(timezone.utc)

        # Update bill
        bill = db.query(Bill).filter(Bill.bill_id == order.bill_id).first()
        if bill:
            bill.paid_amount    = float(bill.paid_amount or 0) + amount_paid
            bill.balance_amount = float(bill.total_amount) - float(bill.paid_amount)
            if float(bill.balance_amount) <= 0.01:
                bill.status = BillStatus.PAID
            else:
                bill.status = BillStatus.PARTIALLY_PAID

        logger.info(f"Payment SUCCESS: order {order_id}, ref {gateway_ref}, ₹{amount_paid}")
    else:
        order.status = PaymentStatus.FAILED
        logger.warning(f"Payment FAILED: order {order_id}, ref {gateway_ref}, status {gateway_status}")

    db.flush()
    return {"order_id": order_id, "status": order.status.value, "gateway_ref": gateway_ref}

# ─── Refund ───────────────────────────────────────────────────────────────────

async def initiate_refund(
    order_id: str,
    amount: float,
    reason_code: str,
    initiated_by: str,
    db: Session,
) -> Refund:
    order = db.query(PaymentOrder).filter(PaymentOrder.order_id == order_id).first()
    if not order or order.status != PaymentStatus.SUCCESS:
        raise ValueError(f"Cannot refund order {order_id} — not in SUCCESS state")

    refund_id = f"RFD{uuid.uuid4().hex[:10].upper()}"

    # Call gateway refund API
    if settings.RAZORPAY_KEY_ID and order.gateway_ref:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"https://api.razorpay.com/v1/payments/{order.gateway_ref}/refund",
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                    json={"amount": int(amount * 100), "notes": {"reason": reason_code}},
                    timeout=30,
                )
                resp.raise_for_status()
        except Exception as e:
            logger.error(f"Razorpay refund failed for {order_id}: {e}")

    refund = Refund(
        refund_id    = refund_id,
        order_id     = order_id,
        reason_code  = reason_code,
        amount       = amount,
        status       = "INITIATED",
        initiated_by = initiated_by,
    )
    db.add(refund)

    # Reopen bill balance
    bill = db.query(Bill).filter(Bill.bill_id == order.bill_id).first()
    if bill:
        bill.paid_amount    = float(bill.paid_amount or 0) - amount
        bill.balance_amount = float(bill.total_amount) - float(bill.paid_amount)
        bill.status         = BillStatus.PARTIALLY_PAID if float(bill.balance_amount) > 0 else BillStatus.GENERATED

    db.flush()
    logger.info(f"Refund {refund_id} initiated for order {order_id} ₹{amount}")
    return refund

# ─── Reconciliation ───────────────────────────────────────────────────────────

def run_reconciliation(
    gateway_id: str,
    settlement_date: date,
    gateway_transactions: list[dict],
    db: Session,
) -> Settlement:
    """
    Match gateway settlements against internal payment orders.
    Unmatched go to suspense.
    """
    settlement_id = f"STL{settlement_date.strftime('%Y%m%d')}{gateway_id[-6:]}"
    matched, exceptions = [], []
    gross = 0.0

    internal_by_ref = {
        o.gateway_ref: o
        for o in db.query(PaymentOrder)
        .filter(
            PaymentOrder.gateway_id == gateway_id,
            PaymentOrder.status == PaymentStatus.SUCCESS,
        )
        .all()
        if o.gateway_ref
    }

    for txn in gateway_transactions:
        ref    = txn["gateway_ref"]
        gw_amt = float(txn["amount"])
        order  = internal_by_ref.get(ref)

        if not order:
            exceptions.append({"ref": ref, "reason": "UNKNOWN_ORDER", "amount": gw_amt})
            susp = SuspenseRecord(
                suspense_id      = f"SUSP{uuid.uuid4().hex[:10].upper()}",
                reason           = "UNKNOWN_ORDER",
                amount           = gw_amt,
                resolution_status = "OPEN",
            )
            db.add(susp)
            continue

        diff = abs(float(order.total_charged) - gw_amt)
        if diff > 1.0:
            exceptions.append({"ref": ref, "reason": "AMOUNT_MISMATCH",
                                "gw_amount": gw_amt, "internal": float(order.total_charged)})
            continue

        matched.append({"ref": ref, "order_id": order.order_id, "amount": gw_amt})
        gross += gw_amt

        # Update gateway txn with settlement
        gt = db.query(GatewayTxn).filter(GatewayTxn.gateway_ref == ref).first()
        if gt:
            gt.settlement_id = settlement_id
            gt.settled_at    = datetime.now(timezone.utc)

    fee  = round(gross * 0.002, 2)
    stl  = Settlement(
        settlement_id   = settlement_id,
        gateway_id      = gateway_id,
        settlement_date = settlement_date,
        gross_amount    = gross,
        fee_deducted    = fee,
        net_amount      = round(gross - fee, 2),
        matched_count   = len(matched),
        exception_count = len(exceptions),
        status          = "RECONCILED" if not exceptions else "EXCEPTION",
    )
    db.add(stl)
    db.flush()

    logger.info(
        f"Settlement {settlement_id}: gross=₹{gross:.2f} fee=₹{fee:.2f} "
        f"matched={len(matched)} exceptions={len(exceptions)}"
    )
    return stl
