"""
BFS Enerza — Utility Billing Engine  (production version)
Meter Read → Rating → Bill Generation → GST → Payment → Reconciliation
Utilities: Gas PNG · Electricity · Water · CNG
"""
import json
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

D = lambda v: Decimal(str(v))

# ─────────────────────────────────────────────────────────────────────
# RATE PLANS MASTER
# ─────────────────────────────────────────────────────────────────────
RATE_PLANS = {
    "RP-GAS-DOM-01": {
        "name":"Domestic PNG Slab 2024","utility":"GAS_PNG","uom":"SCM",
        "components":[
            {"id":"FIX","name":"Fixed Monthly Charge",           "type":"FIXED",   "rate":120.00},
            {"id":"V1", "name":"Variable – Slab 1 (0–10 SCM)",  "type":"VARIABLE","rate":30.00,"slab_from":0,  "slab_to":10},
            {"id":"V2", "name":"Variable – Slab 2 (10–30 SCM)", "type":"VARIABLE","rate":35.00,"slab_from":10, "slab_to":30},
            {"id":"V3", "name":"Variable – Slab 3 (>30 SCM)",   "type":"VARIABLE","rate":42.00,"slab_from":30, "slab_to":None},
            {"id":"GST","name":"GST @ 5%",                       "type":"TAX",     "rate":0.05, "base":["FIX","V1","V2","V3"]},
        ]
    },
    "RP-GAS-COM-01": {
        "name":"Commercial PNG Flat 2024","utility":"GAS_PNG","uom":"SCM",
        "components":[
            {"id":"FIX","name":"Fixed Monthly Charge",   "type":"FIXED",   "rate":350.00},
            {"id":"VAR","name":"Variable Charge",         "type":"VARIABLE","rate":38.00,"slab_from":0,"slab_to":None},
            {"id":"GST","name":"GST @ 5%",               "type":"TAX",     "rate":0.05, "base":["FIX","VAR"]},
        ]
    },
    "RP-ELEC-DOM-01": {
        "name":"Domestic Electricity 2024","utility":"ELECTRICITY","uom":"kWh",
        "components":[
            {"id":"RENT","name":"Meter Rent",                        "type":"FIXED",   "rate":45.00},
            {"id":"E1",  "name":"Energy – Slab 1 (0–100 kWh)",      "type":"VARIABLE","rate":3.50,"slab_from":0,   "slab_to":100},
            {"id":"E2",  "name":"Energy – Slab 2 (101–300 kWh)",    "type":"VARIABLE","rate":5.00,"slab_from":100, "slab_to":300},
            {"id":"E3",  "name":"Energy – Slab 3 (>300 kWh)",       "type":"VARIABLE","rate":7.50,"slab_from":300, "slab_to":None},
            {"id":"DUTY","name":"Electricity Duty @ 15%",            "type":"TAX",     "rate":0.15,"base":["E1","E2","E3"]},
            {"id":"GST", "name":"GST @ 18% (Meter Rent)",            "type":"TAX",     "rate":0.18,"base":["RENT"]},
        ]
    },
    "RP-WATER-DOM-01": {
        "name":"Domestic Water 2024","utility":"WATER","uom":"KL",
        "components":[
            {"id":"FIX","name":"Fixed Water Charge",          "type":"FIXED",   "rate":80.00},
            {"id":"W1", "name":"Water – Slab 1 (0–10 KL)",   "type":"VARIABLE","rate":8.00, "slab_from":0,  "slab_to":10},
            {"id":"W2", "name":"Water – Slab 2 (>10 KL)",    "type":"VARIABLE","rate":14.00,"slab_from":10, "slab_to":None},
            {"id":"TAX","name":"Water Tax @ 5%",              "type":"TAX",     "rate":0.05, "base":["FIX","W1","W2"]},
        ]
    },
    "RP-CNG-PRIV-01": {
        "name":"CNG Private Vehicle 2024","utility":"CNG","uom":"KG",
        "components":[
            {"id":"CNG","name":"CNG Fuel Charge",  "type":"VARIABLE","rate":80.00,"slab_from":0,"slab_to":None},
            {"id":"GST","name":"GST @ 5%",         "type":"TAX",     "rate":0.05, "base":["CNG"]},
        ]
    },
}

# ─────────────────────────────────────────────────────────────────────
# MODULE 1 — METER READ PROCESSOR
# ─────────────────────────────────────────────────────────────────────
def process_meter_read(current, previous, multiplier=1, normal_daily=None):
    consumption = (D(current) - D(previous)) * D(multiplier)
    if consumption < 0:
        raise ValueError(f"Negative consumption {consumption} — check meter rollover")
    anomaly = False
    if normal_daily and normal_daily > 0:
        period_days = 30
        expected = D(normal_daily) * period_days
        anomaly = consumption > expected * D("2.0")
    return {
        "current_reading":  D(current),
        "previous_reading": D(previous),
        "consumption":      consumption,
        "multiplier":       D(multiplier),
        "anomaly_flag":     anomaly,
        "reading_type":     "ACTUAL",
    }

# ─────────────────────────────────────────────────────────────────────
# MODULE 2 — SLAB RATING ENGINE
# ─────────────────────────────────────────────────────────────────────
def apply_slabs(consumption, components):
    lines, remaining = [], D(consumption)
    for c in components:
        if c["type"] != "VARIABLE":
            continue
        sf = D(c["slab_from"])
        st = D(c["slab_to"]) if c["slab_to"] is not None else None
        if remaining <= 0:
            lines.append({"cid":c["id"],"name":c["name"],"qty":D(0),"rate":D(c["rate"]),"amount":D(0)})
            continue
        qty = min(remaining, st - sf) if st is not None else remaining
        amt = (qty * D(c["rate"])).quantize(D("0.01"), ROUND_HALF_UP)
        lines.append({"cid":c["id"],"name":c["name"],"qty":qty,"rate":D(c["rate"]),"amount":amt})
        remaining -= qty
    return lines

def rate_bill(rate_plan_id, consumption):
    plan  = RATE_PLANS[rate_plan_id]
    comps = plan["components"]
    lines, amounts = [], {}

    # Fixed
    for c in comps:
        if c["type"] == "FIXED":
            amt = D(c["rate"]).quantize(D("0.01"), ROUND_HALF_UP)
            lines.append({"cid":c["id"],"name":c["name"],"qty":None,"rate":D(c["rate"]),"amount":amt,"line_type":"CHARGE"})
            amounts[c["id"]] = amt

    # Variable slabs
    for sl in apply_slabs(consumption, comps):
        lines.append({**sl,"line_type":"CHARGE"})
        amounts[sl["cid"]] = sl["amount"]

    # Taxes
    net = sum(amounts.values())
    tax_total = D(0)
    for c in comps:
        if c["type"] == "TAX":
            base = sum(amounts.get(b, D(0)) for b in c.get("base", []))
            tax  = (base * D(c["rate"])).quantize(D("0.01"), ROUND_HALF_UP)
            lines.append({"cid":c["id"],"name":c["name"],"qty":None,
                          "rate":D(c["rate"])*100,"amount":tax,"line_type":"TAX"})
            tax_total += tax

    return {
        "rate_plan_id":   rate_plan_id,
        "plan_name":      plan["name"],
        "utility":        plan["utility"],
        "uom":            plan["uom"],
        "consumption":    D(consumption),
        "lines":          lines,
        "net_amount":     net,
        "tax_amount":     tax_total,
        "total_amount":   net + tax_total,
    }

# ─────────────────────────────────────────────────────────────────────
# MODULE 3 — BILL GENERATOR
# ─────────────────────────────────────────────────────────────────────
_bill_seq = {}

def generate_bill(connection_id, account_id, rate_plan_id,
                  current_reading, previous_reading,
                  billing_period, bill_date, due_days=20):
    read   = process_meter_read(current_reading, previous_reading)
    rating = rate_bill(rate_plan_id, read["consumption"])
    bd     = date.fromisoformat(bill_date)
    dd     = bd + timedelta(days=due_days)
    seq    = _bill_seq.get(rate_plan_id, 1000) + 1
    _bill_seq[rate_plan_id] = seq
    bill_id = f"BILL{seq:06d}"
    return {
        "bill_id":         bill_id,
        "connection_id":   connection_id,
        "account_id":      account_id,
        "rate_plan_id":    rate_plan_id,
        "billing_period":  billing_period,
        "bill_date":       bill_date,
        "due_date":        str(dd),
        "reading":         read,
        "rating":          rating,
        "net_amount":      rating["net_amount"],
        "tax_amount":      rating["tax_amount"],
        "total_amount":    rating["total_amount"],
        "paid_amount":     D(0),
        "status":          "GENERATED",
    }

# ─────────────────────────────────────────────────────────────────────
# MODULE 4 — PAYMENT ENGINE
# ─────────────────────────────────────────────────────────────────────
CONV_FEES = {"UPI":0.0,"BBPS":0.0,"CARD":0.0,"NET_BANKING":0.0,"CASH":0.0}
_ord_seq = 2000

def create_payment_order(bill, channel, amount_paid=None):
    global _ord_seq
    _ord_seq += 1
    pay_amt  = D(str(amount_paid)) if amount_paid else bill["total_amount"]
    conv_fee = (pay_amt * D(str(CONV_FEES.get(channel, 0)))).quantize(D("0.01"), ROUND_HALF_UP)
    return {
        "order_id":       f"ORD{_ord_seq:06d}",
        "bill_id":        bill["bill_id"],
        "account_id":     bill["account_id"],
        "channel":        channel,
        "pay_amount":     pay_amt,
        "convenience_fee":conv_fee,
        "total_charged":  pay_amt + conv_fee,
        "balance_after":  (bill["total_amount"] - pay_amt).quantize(D("0.01"), ROUND_HALF_UP),
        "status":         "INITIATED",
        "gateway_ref":    None,
    }

def post_payment(order, gateway_ref, success=True):
    o = dict(order)
    o["gateway_ref"] = gateway_ref
    if success:
        o["status"]      = "SUCCESS"
        o["bill_status"] = "PAID" if o["balance_after"] == 0 else "PARTIALLY_PAID"
    else:
        o["status"]      = "FAILED"
        o["bill_status"] = "UNPAID"
    return o

# ─────────────────────────────────────────────────────────────────────
# MODULE 5 — RECONCILIATION ENGINE
# ─────────────────────────────────────────────────────────────────────
def reconcile(settlement_id, gateway_txns, internal_orders, gateway_fee_pct=0.002):
    by_ref   = {o["gateway_ref"]: o for o in internal_orders if o.get("gateway_ref")}
    matched, exceptions, gross = [], [], D(0)
    for txn in gateway_txns:
        ref = txn["gateway_ref"]
        gw_amt = D(str(txn["amount"]))
        order  = by_ref.get(ref)
        if not order:
            exceptions.append({"gateway_ref":ref,"reason":"UNKNOWN_ORDER","gw_amount":gw_amt})
            continue
        diff = abs(order["pay_amount"] - gw_amt)
        if diff <= D("1.00"):
            matched.append({"gateway_ref":ref,"order_id":order["order_id"],
                            "amount":gw_amt,"result":"MATCHED"})
            gross += gw_amt
        else:
            exceptions.append({"gateway_ref":ref,"reason":"AMOUNT_MISMATCH",
                               "gw_amount":gw_amt,"internal_amount":order["pay_amount"]})
    fee = (gross * D(str(gateway_fee_pct))).quantize(D("0.01"), ROUND_HALF_UP)
    return {
        "settlement_id":   settlement_id,
        "gross_amount":    gross,
        "gateway_fee":     fee,
        "net_amount":      gross - fee,
        "matched_count":   len(matched),
        "exception_count": len(exceptions),
        "matched":         matched,
        "exceptions":      exceptions,
        "status":          "RECONCILED" if not exceptions else "EXCEPTION",
    }

# ─────────────────────────────────────────────────────────────────────
# DEMO RUN
# ─────────────────────────────────────────────────────────────────────
SCENARIOS = [
    dict(label="Gas PNG – Domestic (12.4 SCM)",
         connection_id="CONN-PNG-001", account_id="ACCT000001",
         rate_plan_id="RP-GAS-DOM-01",
         current_reading=1060.8, previous_reading=1048.4,
         billing_period="April 2026", bill_date="2026-04-08"),
    dict(label="Gas PNG – Commercial (87.3 SCM)",
         connection_id="CONN-PNG-002", account_id="ACCT000003",
         rate_plan_id="RP-GAS-COM-01",
         current_reading=5234.7, previous_reading=5147.4,
         billing_period="April 2026", bill_date="2026-04-08"),
    dict(label="Electricity – Domestic (245 kWh)",
         connection_id="CONN-ELC-001", account_id="ACCT000002",
         rate_plan_id="RP-ELEC-DOM-01",
         current_reading=8945.0, previous_reading=8700.0,
         billing_period="April 2026", bill_date="2026-04-08"),
    dict(label="Water – Domestic (13.5 KL)",
         connection_id="CONN-WAT-001", account_id="ACCT000005",
         rate_plan_id="RP-WATER-DOM-01",
         current_reading=234.5, previous_reading=221.0,
         billing_period="April 2026", bill_date="2026-04-08"),
    dict(label="CNG – Private Vehicle (4.2 KG)",
         connection_id="CONN-CNG-001", account_id="ACCT000006",
         rate_plan_id="RP-CNG-PRIV-01",
         current_reading=4.2, previous_reading=0.0,
         billing_period="April 2026", bill_date="2026-04-08"),
]

bills, orders = [], []
for i, sc in enumerate(SCENARIOS):
    label = sc.pop("label")
    bill  = generate_bill(**sc)
    bill["label"] = label
    order = create_payment_order(bill, "UPI")
    gw_ref = f"GWTXN{i+1:04d}"
    order  = post_payment(order, gw_ref, success=True)
    bills.append(bill)
    orders.append(order)

gw_txns = [{"gateway_ref": o["gateway_ref"], "amount": str(o["pay_amount"])} for o in orders]
recon   = reconcile("STL-APR-2026-001", gw_txns, orders)

def serial(obj):
    if isinstance(obj, Decimal): return str(obj)
    raise TypeError

with open("/home/claude/billing_results.json","w") as f:
    json.dump({"bills":bills,"orders":orders,"reconciliation":recon}, f, default=serial, indent=2)

print("BFS Enerza Billing Engine — Results\n" + "="*55)
for b in bills:
    r = b["rating"]
    print(f"  {b['label']}")
    print(f"    Consumption : {r['consumption']} {r['uom']}")
    for ln in r["lines"]:
        qty_str = f"{ln['qty']} {r['uom']} × " if ln["qty"] is not None else "         "
        print(f"    {'  '+ln['name']:50s}  {qty_str}₹{ln['amount']}")
    print(f"    {'Net':50s}  ₹{r['net_amount']}")
    print(f"    {'Tax':50s}  ₹{r['tax_amount']}")
    print(f"    {'TOTAL DUE':50s}  ₹{r['total_amount']}")
    print()

print(f"Reconciliation [{recon['settlement_id']}]")
print(f"  Matched: {recon['matched_count']}  Exceptions: {recon['exception_count']}")
print(f"  Gross: ₹{recon['gross_amount']}  Fee: ₹{recon['gateway_fee']}  Net: ₹{recon['net_amount']}")
print(f"  Status: {recon['status']}")
