"""
BFS Enerza — Production Billing Engine
Handles: Meter Read → Rating → Bill Generation → Arrears → Late Fees →
         Subsidies → Bill Reversal → Re-billing → Disconnect/Reconnect
"""
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
import uuid
import logging
from sqlalchemy.orm import Session
from app.models import (
    Bill, BillLine, BillStatus, MeterReading, ServiceConnection,
    Account, RatePlan, ChargeComponent, BillCycle
)
from app.config import settings

logger = logging.getLogger(__name__)
D = lambda v: Decimal(str(v))
r2 = lambda v: D(v).quantize(D("0.01"), ROUND_HALF_UP)

# ─── Rate plan definitions (loaded from DB in production) ─────────────────────

RATE_PLANS = {
    "RP-GAS-DOM-01": {
        "utility": "GAS_PNG", "uom": "SCM",
        "components": [
            {"id": "FIX",  "name": "Fixed Monthly Charge",         "type": "FIXED",    "rate": 120.00},
            {"id": "V1",   "name": "Variable – Slab 1 (0–10 SCM)", "type": "VARIABLE", "rate": 30.00, "sf": 0,   "st": 10},
            {"id": "V2",   "name": "Variable – Slab 2 (10–30 SCM)","type": "VARIABLE", "rate": 35.00, "sf": 10,  "st": 30},
            {"id": "V3",   "name": "Variable – Slab 3 (>30 SCM)",  "type": "VARIABLE", "rate": 42.00, "sf": 30,  "st": None},
            {"id": "GST",  "name": "GST @ 5%",                     "type": "TAX",      "rate": 0.05,  "base": ["FIX","V1","V2","V3"]},
        ]
    },
    "RP-GAS-COM-01": {
        "utility": "GAS_PNG", "uom": "SCM",
        "components": [
            {"id": "FIX",  "name": "Fixed Monthly Charge", "type": "FIXED",    "rate": 350.00},
            {"id": "VAR",  "name": "Variable Charge",       "type": "VARIABLE", "rate": 38.00, "sf": 0, "st": None},
            {"id": "GST",  "name": "GST @ 5%",             "type": "TAX",      "rate": 0.05,  "base": ["FIX","VAR"]},
        ]
    },
    "RP-ELEC-DOM-01": {
        "utility": "ELECTRICITY", "uom": "kWh",
        "components": [
            {"id": "RENT", "name": "Meter Rent",                   "type": "FIXED",    "rate": 45.00},
            {"id": "E1",   "name": "Energy – Slab 1 (0–100 kWh)", "type": "VARIABLE", "rate": 3.50,  "sf": 0,   "st": 100},
            {"id": "E2",   "name": "Energy – Slab 2 (101–300 kWh)","type":"VARIABLE", "rate": 5.00,  "sf": 100, "st": 300},
            {"id": "E3",   "name": "Energy – Slab 3 (>300 kWh)",  "type": "VARIABLE", "rate": 7.50,  "sf": 300, "st": None},
            {"id": "DUTY", "name": "Electricity Duty @ 15%",       "type": "TAX",      "rate": 0.15,  "base": ["E1","E2","E3"]},
            {"id": "GST",  "name": "GST @ 18% (Meter Rent)",       "type": "TAX",      "rate": 0.18,  "base": ["RENT"]},
        ]
    },
    "RP-WATER-DOM-01": {
        "utility": "WATER", "uom": "KL",
        "components": [
            {"id": "FIX",  "name": "Fixed Water Charge",        "type": "FIXED",    "rate": 80.00},
            {"id": "W1",   "name": "Water – Slab 1 (0–10 KL)", "type": "VARIABLE", "rate": 8.00,  "sf": 0,  "st": 10},
            {"id": "W2",   "name": "Water – Slab 2 (>10 KL)",  "type": "VARIABLE", "rate": 14.00, "sf": 10, "st": None},
            {"id": "TAX",  "name": "Water Tax @ 5%",            "type": "TAX",      "rate": 0.05,  "base": ["FIX","W1","W2"]},
        ]
    },
    "RP-CNG-PRIV-01": {
        "utility": "CNG", "uom": "KG",
        "components": [
            {"id": "CNG",  "name": "CNG Fuel Charge", "type": "VARIABLE", "rate": 80.00, "sf": 0, "st": None},
            {"id": "GST",  "name": "GST @ 5%",        "type": "TAX",      "rate": 0.05,  "base": ["CNG"]},
        ]
    },
}

PLAN_MAP = {
    ("GAS_PNG",     "DOM"): "RP-GAS-DOM-01",
    ("GAS_PNG",     "COM"): "RP-GAS-COM-01",
    ("GAS_PNG",     "IND"): "RP-GAS-COM-01",
    ("ELECTRICITY", "DOM"): "RP-ELEC-DOM-01",
    ("ELECTRICITY", "COM"): "RP-ELEC-DOM-01",
    ("ELECTRICITY", "IND"): "RP-ELEC-DOM-01",
    ("WATER",       "DOM"): "RP-WATER-DOM-01",
    ("WATER",       "COM"): "RP-WATER-DOM-01",
    ("WATER",       "IND"): "RP-WATER-DOM-01",
    ("GAS_CNG",     "PRIV"): "RP-CNG-PRIV-01",
    ("GAS_CNG",     "COMM"): "RP-CNG-PRIV-01",
}

# ─── 1. Meter Read Processor ──────────────────────────────────────────────────

def process_meter_read(
    current: float,
    previous: float,
    multiplier: float = 1.0,
    normal_monthly_avg: Optional[float] = None,
) -> dict:
    """
    Validate and compute consumption from meter readings.
    Returns dict with consumption and anomaly flag.
    """
    consumption = r2((D(current) - D(previous)) * D(multiplier))
    if consumption < 0:
        raise ValueError(
            f"Negative consumption {consumption}. "
            "Check meter rollover or incorrect reading."
        )
    anomaly = False
    if normal_monthly_avg and normal_monthly_avg > 0:
        # Flag if > 2.5x average
        anomaly = float(consumption) > normal_monthly_avg * 2.5
    return {
        "current_reading":  float(current),
        "previous_reading": float(previous),
        "consumption":      float(consumption),
        "multiplier":       multiplier,
        "anomaly_flag":     anomaly,
    }

# ─── 2. Estimated Read ───────────────────────────────────────────────────────

def estimate_consumption(
    conn_id: str,
    db: Session,
    lookback_months: int = 3,
) -> float:
    """
    Estimate consumption using average of last N actual readings.
    Falls back to utility-type default if no history.
    """
    readings = (
        db.query(MeterReading)
        .filter(
            MeterReading.connection_id == conn_id,
            MeterReading.reading_type == "ACTUAL",
        )
        .order_by(MeterReading.reading_date.desc())
        .limit(lookback_months)
        .all()
    )
    if readings:
        avg = sum(float(r.consumption) for r in readings) / len(readings)
        logger.info(f"Estimated {conn_id}: {avg:.3f} (avg of {len(readings)} readings)")
        return round(avg, 3)

    # Hardcoded defaults by utility
    conn = db.query(ServiceConnection).get(conn_id)
    defaults = {"GAS_PNG": 8.5, "ELECTRICITY": 150.0, "WATER": 12.0, "GAS_CNG": 4.0}
    default = defaults.get(conn.utility_type if conn else "GAS_PNG", 8.5)
    logger.warning(f"No history for {conn_id}, using default: {default}")
    return default

# ─── 3. Slab Rating Engine ────────────────────────────────────────────────────

def _apply_slabs(consumption: float, components: list) -> list:
    remaining, lines = D(consumption), []
    for c in components:
        if c["type"] != "VARIABLE":
            continue
        sf = D(c["sf"])
        st = D(c["st"]) if c["st"] is not None else None
        qty = min(remaining, st - sf) if st is not None else remaining
        qty = max(D(0), qty)
        lines.append({
            "cid":    c["id"],
            "name":   c["name"],
            "qty":    float(qty),
            "rate":   float(c["rate"]),
            "amount": float(r2(qty * D(c["rate"]))),
        })
        remaining -= qty
        if remaining <= 0:
            break
    return lines

def rate_bill(plan_id: str, consumption: float) -> dict:
    """
    Core rating: apply fixed + slab charges + taxes for a given plan and consumption.
    Returns full line breakdown plus net/tax/total.
    """
    plan = RATE_PLANS[plan_id]
    components = plan["components"]
    amounts = {}
    lines = []
    net = D(0)

    # Fixed
    for c in components:
        if c["type"] == "FIXED":
            amt = r2(D(c["rate"]))
            lines.append({"cid": c["id"], "name": c["name"], "qty": None,
                          "rate": c["rate"], "amount": float(amt), "line_type": "CHARGE"})
            amounts[c["id"]] = amt
            net += amt

    # Variable slabs
    for sl in _apply_slabs(consumption, components):
        lines.append({**sl, "line_type": "CHARGE"})
        amounts[sl["cid"]] = D(sl["amount"])
        net += D(sl["amount"])

    # Taxes
    tax_total = D(0)
    for c in components:
        if c["type"] == "TAX":
            base = sum(amounts.get(b, D(0)) for b in c.get("base", []))
            tax_amt = r2(base * D(c["rate"]))
            lines.append({"cid": c["id"], "name": c["name"], "qty": None,
                          "rate": c["rate"] * 100, "amount": float(tax_amt), "line_type": "TAX"})
            tax_total += tax_amt

    return {
        "plan_id": plan_id,
        "utility": plan["utility"],
        "uom":     plan["uom"],
        "consumption": consumption,
        "lines":   lines,
        "net":     float(net),
        "tax":     float(tax_total),
        "total":   float(r2(net + tax_total)),
    }

# ─── 4. Subsidy Engine ────────────────────────────────────────────────────────

def apply_subsidy(net_amount: float, connection: ServiceConnection) -> float:
    """
    Calculate applicable subsidies.
    - BPL domestic gas: 50% subsidy up to ₹300
    - Senior citizen domestic: ₹50 flat rebate
    Extend this with DB-driven subsidy rules in production.
    """
    subsidy = 0.0
    if not connection:
        return subsidy
    # BPL flag (would come from customer master in production)
    # Placeholder logic — integrate with Aadhaar-seeded BPL database
    return round(subsidy, 2)

# ─── 5. Arrears Carry-Forward ─────────────────────────────────────────────────

def get_arrears(account_id: str, before_period: str, db: Session) -> float:
    """
    Return unpaid balance from all previous periods for this account.
    """
    unpaid = (
        db.query(Bill)
        .filter(
            Bill.account_id == account_id,
            Bill.billing_period < before_period,
            Bill.status.in_([BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE]),
        )
        .all()
    )
    return round(sum(float(b.balance_amount or 0) for b in unpaid), 2)

# ─── 6. Late Fee Calculator ───────────────────────────────────────────────────

def calc_late_fee(amount: float, due_date: date, as_of: date = None) -> float:
    """
    Calculate late payment fee.
    18% p.a. = 1.5% per month on overdue balance.
    Charged per month or part thereof beyond due date.
    """
    as_of = as_of or date.today()
    if as_of <= due_date:
        return 0.0
    days_overdue = (as_of - due_date).days
    months_overdue = math.ceil(days_overdue / 30)
    monthly_rate = settings.LATE_FEE_RATE / 12
    return round(amount * monthly_rate * months_overdue, 2)

# ─── 7. Bill Generator ────────────────────────────────────────────────────────

def generate_bill(
    connection_id: str,
    account_id: str,
    plan_id: str,
    consumption: float,
    billing_period: str,
    bill_date: date,
    grace_days: int = 20,
    reading_type: str = "ACTUAL",
    db: Session = None,
    generated_by: str = "system",
) -> dict:
    """
    Full bill generation for one connection in one period.
    Includes rating + arrears + subsidy + late fees.
    """
    rating = rate_bill(plan_id, consumption)

    # Arrears from previous periods
    arrears = get_arrears(account_id, billing_period, db) if db else 0.0

    # Subsidy
    conn = db.query(ServiceConnection).get(connection_id) if db else None
    subsidy = apply_subsidy(rating["net"], conn)

    # Total
    total = round(rating["total"] + arrears - subsidy, 2)

    due_date = bill_date + timedelta(days=grace_days)
    bill_seq = int(billing_period.replace("-", "")) * 1000 + hash(connection_id) % 1000
    bill_id  = f"BILL{abs(bill_seq):010d}"

    return {
        "bill_id":         bill_id,
        "account_id":      account_id,
        "connection_id":   connection_id,
        "rate_plan_id":    plan_id,
        "billing_period":  billing_period,
        "bill_date":       str(bill_date),
        "due_date":        str(due_date),
        "consumption":     consumption,
        "uom":             rating["uom"],
        "net_amount":      rating["net"],
        "tax_amount":      rating["tax"],
        "arrears_amount":  arrears,
        "subsidy_amount":  subsidy,
        "late_fee":        0.0,
        "total_amount":    total,
        "paid_amount":     0.0,
        "balance_amount":  total,
        "status":          "GENERATED",
        "lines":           rating["lines"],
        "reading_type":    reading_type,
        "generated_by":    generated_by,
    }

# ─── 8. Bill Reversal & Re-billing ───────────────────────────────────────────

def reverse_bill(
    original_bill: Bill,
    reason: str,
    reversed_by: str,
    db: Session,
) -> Bill:
    """
    Create a reversal bill (negative amounts) for an existing bill.
    The original bill status is set to REVERSED.
    Use before re-billing with corrected meter read.
    """
    reversal_id = f"REV{original_bill.bill_id[4:]}"
    reversal = Bill(
        bill_id          = reversal_id,
        account_id       = original_bill.account_id,
        connection_id    = original_bill.connection_id,
        cycle_id         = original_bill.cycle_id,
        rate_plan_id     = original_bill.rate_plan_id,
        billing_period   = original_bill.billing_period,
        bill_date        = date.today(),
        due_date         = date.today(),
        consumption      = -original_bill.consumption if original_bill.consumption else 0,
        uom              = original_bill.uom,
        net_amount       = -original_bill.net_amount,
        tax_amount       = -original_bill.tax_amount,
        subsidy_amount   = -original_bill.subsidy_amount,
        arrears_amount   = 0,
        late_fee         = 0,
        total_amount     = -original_bill.total_amount,
        paid_amount      = 0,
        balance_amount   = -original_bill.total_amount,
        status           = BillStatus.GENERATED,
        reversed_by      = original_bill.bill_id,
        generated_by     = reversed_by,
    )

    # Reversal lines
    for orig_line in original_bill.lines:
        db.add(BillLine(
            line_id      = f"RL{orig_line.line_id}",
            bill_id      = reversal_id,
            component_id = orig_line.component_id,
            description  = f"REVERSAL: {orig_line.description}",
            quantity     = -orig_line.quantity if orig_line.quantity else None,
            rate         = orig_line.rate,
            amount       = -orig_line.amount,
            line_type    = orig_line.line_type,
        ))

    original_bill.status    = BillStatus.REVERSED
    original_bill.reversed_by = reversal_id

    db.add(reversal)
    db.flush()
    logger.info(f"Bill {original_bill.bill_id} reversed → {reversal_id} by {reversed_by}. Reason: {reason}")
    return reversal

# ─── 9. Disconnection Engine ─────────────────────────────────────────────────

def check_disconnections(db: Session, as_of: date = None) -> list[str]:
    """
    Find all connections eligible for disconnection (overdue > threshold).
    Returns list of connection_ids disconnected.
    """
    import math
    as_of = as_of or date.today()
    threshold_date = as_of - timedelta(days=settings.DISCONNECT_AFTER_DAYS)

    overdue_bills = (
        db.query(Bill)
        .filter(
            Bill.status == BillStatus.OVERDUE,
            Bill.due_date <= threshold_date,
            Bill.balance_amount > 0,
        )
        .all()
    )

    disconnected = []
    for bill in overdue_bills:
        conn = (
            db.query(ServiceConnection)
            .filter(
                ServiceConnection.account_id == bill.account_id,
                ServiceConnection.status == "ACTIVE",
            )
            .first()
        )
        if conn:
            conn.status = "SUSPENDED"
            conn.disconnect_date = as_of
            conn.disconnect_reason = f"OVERDUE_BILL:{bill.bill_id}"
            disconnected.append(conn.connection_id)
            logger.warning(f"Disconnected {conn.connection_id} — overdue since {bill.due_date}")

    if disconnected:
        db.flush()
    return disconnected

def reconnect_connection(
    connection_id: str,
    reconnect_by: str,
    db: Session,
) -> ServiceConnection:
    """Reconnect a suspended connection after payment is confirmed."""
    conn = db.query(ServiceConnection).get(connection_id)
    if not conn or conn.status != "SUSPENDED":
        raise ValueError(f"Connection {connection_id} is not suspended")
    conn.status = "ACTIVE"
    conn.reconnect_date = date.today()
    db.flush()
    logger.info(f"Connection {connection_id} reconnected by {reconnect_by}")
    return conn

# ─── 10. Batch Billing Run ────────────────────────────────────────────────────

def run_batch_billing(
    billing_period: str,
    bill_date: date,
    db: Session,
    dry_run: bool = False,
    generated_by: str = "scheduler",
) -> dict:
    """
    Batch billing run for a full period.
    Processes all active connections, generates bills with arrears + late fees.
    Returns summary dict.
    """
    import math
    logger.info(f"{'DRY RUN: ' if dry_run else ''}Batch billing started for {billing_period}")

    active_connections = (
        db.query(ServiceConnection)
        .filter(ServiceConnection.status == "ACTIVE")
        .all()
    )

    results = {"period": billing_period, "processed": 0, "skipped": 0,
               "errors": [], "bills_generated": [], "dry_run": dry_run}

    for conn in active_connections:
        try:
            # Determine utility / segment
            seg = "DOM"
            if conn.account and conn.account.customer:
                btype = conn.account.customer.accounts[0].premise if hasattr(conn.account, 'premise') else None
            plan_id = PLAN_MAP.get((conn.utility_type, seg), "RP-GAS-DOM-01")

            # Get latest meter reading for this period
            reading = (
                db.query(MeterReading)
                .filter(
                    MeterReading.connection_id == conn.connection_id,
                    MeterReading.status == "PENDING",
                )
                .order_by(MeterReading.reading_date.desc())
                .first()
            )

            if reading:
                consumption = float(reading.consumption)
                r_type = reading.reading_type
            else:
                # No reading — use estimate
                consumption = estimate_consumption(conn.connection_id, db)
                r_type = "ESTIMATED"

            # Get previous bill for arrears calc
            prev_bill = (
                db.query(Bill)
                .filter(
                    Bill.account_id == conn.account_id,
                    Bill.billing_period < billing_period,
                    Bill.status.in_([BillStatus.OVERDUE, BillStatus.PARTIALLY_PAID]),
                )
                .order_by(Bill.billing_period.desc())
                .first()
            )
            arrears = float(prev_bill.balance_amount) if prev_bill and prev_bill.balance_amount else 0.0

            # Calculate late fee on arrears
            late_fee = 0.0
            if prev_bill and prev_bill.due_date:
                days_late = (bill_date - prev_bill.due_date).days
                if days_late > 0:
                    months = math.ceil(days_late / 30)
                    late_fee = round(arrears * (settings.LATE_FEE_RATE / 12) * months, 2)

            bill_data = generate_bill(
                connection_id  = conn.connection_id,
                account_id     = conn.account_id,
                plan_id        = plan_id,
                consumption    = consumption,
                billing_period = billing_period,
                bill_date      = bill_date,
                db             = db,
                generated_by   = generated_by,
            )
            bill_data["arrears_amount"] = arrears
            bill_data["late_fee"]       = late_fee
            bill_data["total_amount"]   = round(
                bill_data["total_amount"] + arrears + late_fee, 2
            )
            bill_data["balance_amount"] = bill_data["total_amount"]

            if not dry_run:
                _persist_bill(bill_data, db)
                if reading:
                    reading.status = "BILLED"

            results["processed"] += 1
            results["bills_generated"].append(bill_data["bill_id"])

        except Exception as e:
            logger.error(f"Error billing {conn.connection_id}: {e}")
            results["errors"].append({"connection_id": conn.connection_id, "error": str(e)})
            results["skipped"] += 1

    if not dry_run:
        db.commit()

    logger.info(
        f"Batch billing complete: {results['processed']} processed, "
        f"{results['skipped']} skipped, {len(results['errors'])} errors"
    )
    return results


def _persist_bill(bill_data: dict, db: Session):
    bill = Bill(
        bill_id        = bill_data["bill_id"],
        account_id     = bill_data["account_id"],
        connection_id  = bill_data["connection_id"],
        rate_plan_id   = bill_data.get("rate_plan_id"),
        billing_period = bill_data["billing_period"],
        bill_date      = date.fromisoformat(bill_data["bill_date"]),
        due_date       = date.fromisoformat(bill_data["due_date"]),
        consumption    = bill_data["consumption"],
        uom            = bill_data.get("uom"),
        net_amount     = bill_data["net_amount"],
        tax_amount     = bill_data["tax_amount"],
        subsidy_amount = bill_data.get("subsidy_amount", 0),
        arrears_amount = bill_data.get("arrears_amount", 0),
        late_fee       = bill_data.get("late_fee", 0),
        total_amount   = bill_data["total_amount"],
        paid_amount    = 0,
        balance_amount = bill_data["total_amount"],
        status         = BillStatus.GENERATED,
        generated_by   = bill_data.get("generated_by"),
    )
    db.add(bill)

    for i, ln in enumerate(bill_data.get("lines", [])):
        db.add(BillLine(
            line_id      = f"{bill_data['bill_id']}L{i+1:03d}",
            bill_id      = bill_data["bill_id"],
            component_id = ln.get("cid"),
            description  = ln["name"],
            quantity     = ln.get("qty"),
            rate         = ln["rate"],
            amount       = ln["amount"],
            line_type    = ln.get("line_type", "CHARGE"),
        ))
    db.flush()

import math
