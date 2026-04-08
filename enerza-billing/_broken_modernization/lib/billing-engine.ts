// ============================================================
// Enerza Billing Engine — TypeScript port of BFS_Enerza_Billing_Engine.py
// Modules: MeterRead → Rating → BillGen → Payment → Reconciliation
// ============================================================

import { PowerStrategy } from "./billing/strategies/PowerStrategy";
import { GasStrategy } from "./billing/strategies/GasStrategy";
import { WaterStrategy } from "./billing/strategies/WaterStrategy";

export type UtilityType = "GAS_PNG" | "GAS_CNG" | "ELECTRICITY" | "WATER" | "CNG";
export type SegmentType = "DOMESTIC" | "COMMERCIAL" | "INDUSTRIAL" | "PRIVATE" | "FLEET";

export interface RatePlanDef {
  planId: string;
  planName: string;
  utility: string;
  segment: string;
  uom: string;
  components: ComponentDef[];
}

export interface ComponentDef {
  id: string;
  name: string;
  type: "FIXED" | "VARIABLE" | "TAX" | "DEMAND_PENALTY" | "PF_PENALTY" | "PF_INCENTIVE" | "TOD_SURCHARGE" | "APM_QUOTA" | "LNG_SURCHARGE" | "NET_METER_CREDIT";
  rate: number;
  slabFrom?: number | null;
  slabTo?: number | null;
  basedOn?: string[]; // component IDs whose amounts this tax applies to
}

export interface RateParams {
  consumption: number;
  maximumDemandKva?: number;
  contractDemandKva?: number;
  kvah?: number;
  exportedKwh?: number;
  isClosingBill?: boolean;
  daysInPeriod?: number; // e.g. 10 for a 10-day final bill
  minBillOverride?: number;
}

export interface MeterReadResult {
  prevReading: number;
  currReading: number;
  consumption: number;
  uom: string;
  anomaly: boolean;
  anomalyReason?: string;
}

export interface BillLineItem {
  componentId: string;
  name: string;
  type: "CHARGE" | "TAX" | "INCENTIVE" | "CREDIT";
  qty: number | null;
  uom: string | null;
  rate: number;
  amount: number;
}

export interface RatingResult {
  planId: string;
  planName: string;
  utility: string;
  uom: string;
  consumption: number;
  lines: BillLineItem[];
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface GeneratedBill {
  billId: string;
  accountId: string;
  connectionId: string;
  cycleId: string;
  planId: string;
  period: string;
  billDate: string;
  dueDate: string;
  prevReading: number;
  currReading: number;
  consumption: number;
  uom: string;
  rating: RatingResult;
  status: "PENDING" | "PAID" | "PARTIALLY_PAID" | "OVERDUE";
}

export interface PaymentOrder {
  orderId: string;
  billId: string;
  accountId: string;
  channel: string;
  amount: number;
  convenienceFee: number;
  gatewayRef: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
}

export interface ReconResult {
  settlementId: string;
  settlementDate: string;
  matchedOrders: PaymentOrder[];
  grossAmount: number;
  gatewayFee: number;
  netAmount: number;
  matchedCount: number;
  exceptionCount: number;
}

// ============================================================
// BUILT-IN RATE PLANS (mirrors Python engine + MDM HTML seed)
// Components are self-contained for stateless rating
// ============================================================
export const RATE_PLANS: Record<string, RatePlanDef> = {
  "RP-GAS-DOM-01": {
    planId: "RP-GAS-DOM-01", planName: "Domestic PNG Slab 2024",
    utility: "GAS_PNG", segment: "DOMESTIC", uom: "SCM",
    components: [
      { id: "CC-GD-FIX", name: "Fixed Monthly Charge",          type: "FIXED",    rate: 120.00 },
      { id: "CC-GD-APM", name: "APM Quota (Subsidized)",        type: "APM_QUOTA",rate: 30.00,  slabFrom: 0,  slabTo: 5 },
      { id: "CC-GD-V1",  name: "Standard Variable (Above APM)", type: "VARIABLE", rate: 52.00,  slabFrom: 5,  slabTo: 15 },
      { id: "CC-GD-LNG", name: "LNG Blend Surcharge (>15 SCM)", type: "LNG_SURCHARGE", rate: 12.00 },
      { id: "CC-GD-GST", name: "GST @ 5%",                     type: "TAX",      rate: 0.05,  basedOn: ["CC-GD-FIX","CC-GD-APM","CC-GD-V1","CC-GD-LNG"] },
    ],
  },
  "RP-GAS-COM-01": {
    planId: "RP-GAS-COM-01", planName: "Commercial PNG Flat 2024",
    utility: "GAS_PNG", segment: "COMMERCIAL", uom: "SCM",
    components: [
      { id: "CC-GC-FIX", name: "Fixed Monthly Charge", type: "FIXED",    rate: 350.00 },
      { id: "CC-GC-VAR", name: "Variable Charge",       type: "VARIABLE", rate: 38.00, slabFrom: 0, slabTo: null },
      { id: "CC-GC-GST", name: "GST @ 5%",              type: "TAX",      rate: 0.05,  basedOn: ["CC-GC-FIX","CC-GC-VAR"] },
    ],
  },
  "RP-GAS-IND-01": {
    planId: "RP-GAS-IND-01", planName: "Industrial Gas 2024",
    utility: "GAS_PNG", segment: "INDUSTRIAL", uom: "SCM",
    components: [
      { id: "CC-GI-FIX", name: "Fixed Monthly Charge", type: "FIXED",    rate: 800.00 },
      { id: "CC-GI-VAR", name: "Variable Charge",       type: "VARIABLE", rate: 45.00, slabFrom: 0, slabTo: null },
      { id: "CC-GI-GST", name: "GST @ 5%",              type: "TAX",      rate: 0.05,  basedOn: ["CC-GI-FIX","CC-GI-VAR"] },
    ],
  },
  "RP-ELEC-DOM-01": {
    planId: "RP-ELEC-DOM-01", planName: "Domestic Electricity 2024",
    utility: "ELECTRICITY", segment: "DOMESTIC", uom: "kWh",
    components: [
      { id: "CC-ED-RENT", name: "Meter Rent",                      type: "FIXED",    rate: 45.00 },
      { id: "CC-ED-E1",   name: "Energy – Slab 1 (0–100 kWh)",    type: "VARIABLE", rate: 3.50,  slabFrom: 0,   slabTo: 100 },
      { id: "CC-ED-E2",   name: "Energy – Slab 2 (101–300 kWh)",  type: "VARIABLE", rate: 5.00,  slabFrom: 100, slabTo: 300 },
      { id: "CC-ED-E3",   name: "Energy – Slab 3 (>300 kWh)",     type: "VARIABLE", rate: 7.50,  slabFrom: 300, slabTo: null },
      { id: "CC-ED-DUTY", name: "Electricity Duty @ 15%",           type: "TAX",      rate: 0.15,  basedOn: ["CC-ED-E1","CC-ED-E2","CC-ED-E3"] },
      { id: "CC-ED-GST",  name: "GST @ 18% (Meter Rent)",           type: "TAX",      rate: 0.18,  basedOn: ["CC-ED-RENT"] },
    ],
  },
  "RP-POW-IND-01": {
    planId: "RP-POW-IND-01", planName: "Industrial Power 2024",
    utility: "ELECTRICITY", segment: "INDUSTRIAL", uom: "kWh",
    components: [
      { id: "CC-P1-FIX", name: "Fixed Monthly Charge",       type: "FIXED",    rate: 180.00 },
      { id: "CC-P1-V1",  name: "Energy (0–100 kWh)",         type: "VARIABLE", rate: 4.50,  slabFrom: 0,   slabTo: 100 },
      { id: "CC-P1-V2",  name: "Energy (100–300 kWh)",       type: "VARIABLE", rate: 6.20,  slabFrom: 100, slabTo: 300 },
      { id: "CC-P1-TOD", name: "TOD Peak Surcharge (18-22h)",type: "TOD_SURCHARGE", rate: 1.20 },
      { id: "CC-P1-PFP", name: "PF Penalty (Low PF)",        type: "PF_PENALTY",   rate: 0.02 },
      { id: "CC-P1-PFI", name: "PF Incentive (High PF)",     type: "PF_INCENTIVE", rate: 0.01 },
      { id: "CC-P1-SOL", name: "Solar Export Credit",       type: "NET_METER_CREDIT", rate: -3.50 },
      { id: "CC-P1-TAX", name: "State Electricity Duty",     type: "TAX",      rate: 0.09,  basedOn: ["CC-P1-V1", "CC-P1-V2", "CC-P1-TOD"] },
    ],
  },
  "RP-WATER-DOM-01": {
    planId: "RP-WATER-DOM-01", planName: "Domestic Water 2024",
    utility: "WATER", segment: "DOMESTIC", uom: "KL",
    components: [
      { id: "CC-WD-FIX", name: "Fixed Water Charge",         type: "FIXED",    rate: 80.00 },
      { id: "CC-WD-W1",  name: "Water – Slab 1 (0–10 KL)",  type: "VARIABLE", rate: 8.00,  slabFrom: 0,  slabTo: 10 },
      { id: "CC-WD-W2",  name: "Water – Slab 2 (>10 KL)",   type: "VARIABLE", rate: 14.00, slabFrom: 10, slabTo: null },
      { id: "CC-WD-TAX", name: "Water Tax @ 5%",             type: "TAX",      rate: 0.05,  basedOn: ["CC-WD-FIX","CC-WD-W1","CC-WD-W2"] },
    ],
  },
  "RP-CNG-PRIV-01": {
    planId: "RP-CNG-PRIV-01", planName: "CNG Private Vehicle 2024",
    utility: "CNG", segment: "PRIVATE", uom: "KG",
    components: [
      { id: "CC-CP-CNG", name: "CNG Fuel Charge", type: "VARIABLE", rate: 80.00, slabFrom: 0, slabTo: null },
      { id: "CC-CP-GST", name: "GST @ 5%",        type: "TAX",      rate: 0.05,  basedOn: ["CC-CP-CNG"] },
    ],
  },
};

// Lookup: utility → segment → planId
export const PLAN_MAP: Record<string, Record<string, string>> = {
  GAS_PNG:     { DOMESTIC: "RP-GAS-DOM-01", COMMERCIAL: "RP-GAS-COM-01", INDUSTRIAL: "RP-GAS-IND-01" },
  ELECTRICITY: { DOMESTIC: "RP-ELEC-DOM-01", COMMERCIAL: "RP-ELEC-DOM-01" },
  WATER:       { DOMESTIC: "RP-WATER-DOM-01" },
  CNG:         { PRIVATE: "RP-CNG-PRIV-01", COMMERCIAL: "RP-CNG-PRIV-01" },
};

// ============================================================
// HELPERS
// ============================================================
const r2 = (v: number) => Math.round(v * 100) / 100;

let billSeq = 1000;
let orderSeq = 1000;

function nextBillId(): string {
  billSeq++;
  return `BILL${String(billSeq).padStart(6, "0")}`;
}
function nextOrderId(): string {
  orderSeq++;
  return `ORD${String(orderSeq).padStart(6, "0")}`;
}

// ============================================================
// MODULE 1: Process Meter Read
// ============================================================
export function processMeterRead(
  prevReading: number,
  currReading: number,
  uom: string,
  normalDaily = 0.3, // expected daily consumption SCM (for anomaly check)
  daysInPeriod = 30
): MeterReadResult {
  const consumption = Math.max(0, currReading - prevReading);
  const expected = normalDaily * daysInPeriod * 2; // 2× threshold
  const anomaly = consumption > expected;

  return {
    prevReading,
    currReading,
    consumption: r2(consumption),
    uom,
    anomaly,
    anomalyReason: anomaly
      ? `Consumption ${consumption.toFixed(3)} ${uom} exceeds 2× expected (${expected.toFixed(3)} ${uom})`
      : undefined,
  };
}

// ============================================================
// MODULE 2: Apply Slabs (Variable components only)
// ============================================================
function applySlabs(consumption: number, components: ComponentDef[]): { id: string; amount: number }[] {
  let rem = consumption;
  const results: { id: string; amount: number }[] = [];

  for (const c of components) {
    if (c.type !== "VARIABLE") continue;
    const slabSize = c.slabTo !== null && c.slabTo !== undefined
      ? (c.slabTo - (c.slabFrom ?? 0))
      : Infinity;
    const qty = Math.min(rem, slabSize);
    const qtyUse = Math.max(0, qty);
    results.push({ id: c.id, amount: r2(qtyUse * c.rate) });
    rem = Math.max(0, rem - qtyUse);
    if (rem <= 0) break;
  }

  return results;
}

// ============================================================
// MODULE 3: Rate a Bill (Segregated Strategy Pattern)
// ============================================================
export function rateBill(planId: string, params: RateParams | number): RatingResult {
  const plan = RATE_PLANS[planId];
  if (!plan) throw new Error(`Rate plan not found: ${planId}`);

  const rateParams: RateParams = typeof params === "number" ? { consumption: params } : params;

  // Select Strategy based on Utility
  let strategy;
  switch (plan.utility) {
    case "ELECTRICITY":
      strategy = new PowerStrategy();
      break;
    case "GAS_PNG":
    case "GAS_CNG":
      strategy = new GasStrategy();
      break;
    case "WATER":
      strategy = new WaterStrategy();
      break;
    default:
      strategy = new WaterStrategy(); // Fallback to basic volumetric
  }

  return strategy.calculate(plan, rateParams);
}

// ============================================================
// MODULE 4: Generate Bill
// ============================================================
export function generateBill(params: {
  accountId: string;
  connectionId: string;
  cycleId: string;
  planId: string;
  period: string;
  billDate: string;
  prevReading: number;
  currReading: number;
  uom: string;
  isClosingBill?: boolean;
  minBillAmount?: number;
}): GeneratedBill {
  const { accountId, connectionId, cycleId, planId, period, billDate, prevReading, currReading, uom } = params;
  const meterRead = processMeterRead(prevReading, currReading, uom);
  const rating = rateBill(planId, { 
    consumption: meterRead.consumption,
    isClosingBill: params.isClosingBill,
    minBillOverride: params.minBillAmount
  });

  const billDateObj = new Date(billDate);
  const dueDateObj = new Date(billDateObj);
  dueDateObj.setDate(dueDateObj.getDate() + 20);

  return {
    billId: nextBillId(),
    accountId, connectionId, cycleId, planId, period,
    billDate,
    dueDate: dueDateObj.toISOString().slice(0, 10),
    prevReading: meterRead.prevReading,
    currReading: meterRead.currReading,
    consumption: meterRead.consumption,
    uom,
    rating,
    status: "PENDING",
  };
}

// ============================================================
// MODULE 5: Create Payment Order
// ============================================================
export function createPaymentOrder(params: {
  bill: GeneratedBill;
  channel: string;
  amountPaid?: number;
  gatewayRef?: string;
}): PaymentOrder {
  const { bill, channel, amountPaid, gatewayRef } = params;
  const amount = amountPaid ?? bill.rating.totalAmount;
  const convFee = r2(amount * 0.002); // 0.2% convenience fee (BBPS standard)

  return {
    orderId: nextOrderId(),
    billId: bill.billId,
    accountId: bill.accountId,
    channel,
    amount,
    convenienceFee: convFee,
    gatewayRef: gatewayRef ?? `GW${Date.now().toString().slice(-8)}`,
    status: "SUCCESS",
  };
}

// ============================================================
// MODULE 6: Reconciliation
// ============================================================
export function reconcile(params: {
  orders: PaymentOrder[];
  gwFeePercent?: number; // gateway fee, default 0.2%
}): ReconResult {
  const { orders, gwFeePercent = 0.002 } = params;
  const gross = r2(orders.reduce((s, o) => s + o.amount, 0));
  const fee = r2(gross * gwFeePercent);
  const net = r2(gross - fee);
  const settlementId = `STL-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;

  return {
    settlementId,
    settlementDate: new Date().toISOString().slice(0, 10),
    matchedOrders: orders.filter((o) => o.status === "SUCCESS"),
    grossAmount: gross,
    gatewayFee: fee,
    netAmount: net,
    matchedCount: orders.filter((o) => o.status === "SUCCESS").length,
    exceptionCount: orders.filter((o) => o.status !== "SUCCESS").length,
  };
}

// ============================================================
// UTILITY: Get plan for utility+segment
// ============================================================
export function getPlanId(utility: string, segment: string): string | null {
  return PLAN_MAP[utility]?.[segment] ?? null;
}
