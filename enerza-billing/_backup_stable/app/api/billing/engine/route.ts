import { NextRequest, NextResponse } from "next/server";
import { generateBill, createPaymentOrder, reconcile, getPlanId, rateBill } from "@/lib/billing-engine";
import { z } from "zod";

const GenerateSchema = z.object({
  action: z.enum(["generate", "rate", "pay", "reconcile"]),
  // For generate/rate
  utility: z.string().optional(),
  segment: z.string().optional(),
  planId: z.string().optional(),
  prevReading: z.number().optional(),
  currReading: z.number().optional(),
  period: z.string().optional(),
  billDate: z.string().optional(),
  uom: z.string().optional(),
  accountId: z.string().optional(),
  connectionId: z.string().optional(),
  cycleId: z.string().optional(),
  // For pay
  bill: z.any().optional(),
  channel: z.string().optional(),
  gatewayRef: z.string().optional(),
  // For reconcile
  orders: z.array(z.any()).optional(),
  gwFeePercent: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // ── Action: rate (preview only, no DB write)
    if (data.action === "rate") {
      const planId = data.planId ?? (data.utility && data.segment ? getPlanId(data.utility, data.segment) : null);
      if (!planId) return NextResponse.json({ error: "Cannot determine rate plan for utility/segment" }, { status: 400 });
      const consumption = Math.max(0, (data.currReading ?? 0) - (data.prevReading ?? 0));
      const rating = rateBill(planId, consumption);
      return NextResponse.json({ ok: true, rating });
    }

    // ── Action: generate (full bill)
    if (data.action === "generate") {
      const planId = data.planId ?? (data.utility && data.segment ? getPlanId(data.utility, data.segment) : null);
      if (!planId) return NextResponse.json({ error: "Cannot determine rate plan" }, { status: 400 });
      if (data.prevReading === undefined || data.currReading === undefined) {
        return NextResponse.json({ error: "prevReading and currReading are required" }, { status: 400 });
      }

      const bill = generateBill({
        accountId:    data.accountId    ?? "ACCT-STANDALONE",
        connectionId: data.connectionId ?? "CONN-STANDALONE",
        cycleId:      data.cycleId      ?? "BC-MONTHLY-1",
        planId,
        period:   data.period   ?? new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        billDate: data.billDate ?? new Date().toISOString().slice(0, 10),
        prevReading: data.prevReading,
        currReading: data.currReading,
        uom: data.uom ?? "SCM",
      });

      return NextResponse.json({ ok: true, bill });
    }

    // ── Action: pay
    if (data.action === "pay") {
      if (!data.bill || !data.channel) {
        return NextResponse.json({ error: "bill and channel are required" }, { status: 400 });
      }
      const order = createPaymentOrder({ bill: data.bill, channel: data.channel, gatewayRef: data.gatewayRef });
      return NextResponse.json({ ok: true, order });
    }

    // ── Action: reconcile
    if (data.action === "reconcile") {
      if (!data.orders?.length) {
        return NextResponse.json({ error: "orders array is required" }, { status: 400 });
      }
      const result = reconcile({ orders: data.orders, gwFeePercent: data.gwFeePercent });
      return NextResponse.json({ ok: true, reconciliation: result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[billing/engine] error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

// GET — return available rate plans and plan map
export async function GET() {
  const { RATE_PLANS, PLAN_MAP } = await import("@/lib/billing-engine");
  return NextResponse.json({
    ratePlans: Object.values(RATE_PLANS).map((p) => ({
      planId: p.planId, planName: p.planName, utility: p.utility,
      segment: p.segment, uom: p.uom,
      componentCount: p.components.length,
    })),
    planMap: PLAN_MAP,
  });
}
