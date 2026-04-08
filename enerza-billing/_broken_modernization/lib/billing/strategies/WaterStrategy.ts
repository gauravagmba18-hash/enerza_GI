import { BaseBillingStrategy } from "./BaseStrategy";
import { RatePlanDef, RateParams, RatingResult, BillLineItem } from "../../billing-engine";

export class WaterStrategy extends BaseBillingStrategy {
  utility = "WATER";

  calculate(plan: RatePlanDef, params: RateParams): RatingResult {
    const consumption = params.consumption;
    const amounts: Record<string, number> = {};
    const lines: BillLineItem[] = [];
    let netAmount = 0;
    let taxAmount = 0;

    // 1. Water Slab Logic
    const slabResults = this.applySlabs(consumption, plan.components);

    for (const c of plan.components) {
      if (c.type === "FIXED") {
        const proratedRate = this.prorate(c.rate, params);
        amounts[c.id] = proratedRate;
        netAmount += proratedRate;
        lines.push({ componentId: c.id, name: c.name + (params.isClosingBill ? " (Prorated)" : ""), type: "CHARGE", qty: null, uom: null, rate: proratedRate, amount: proratedRate });
      }
      
      if (c.type === "VARIABLE") {
        const sr = slabResults.find((s) => s.id === c.id);
        const amount = sr?.amount ?? 0;
        amounts[c.id] = amount;
        if (amount > 0 || consumption > (c.slabFrom ?? 0)) {
           const slabFrom = c.slabFrom ?? 0;
           const slabTo = c.slabTo;
           const slabSize = slabTo !== null && slabTo !== undefined ? (slabTo - slabFrom) : Infinity;
           const qty = Math.min(Math.max(0, consumption - slabFrom), slabSize);
           netAmount += amount;
           lines.push({ componentId: c.id, name: c.name, type: "CHARGE", qty: this.r2(qty), uom: plan.uom, rate: c.rate, amount });
        }
      }
    }

    // 2. Taxes
    for (const c of plan.components) {
      if (c.type !== "TAX") continue;
      const base = (c.basedOn ?? []).reduce((sum, id) => sum + (amounts[id] ?? 0), 0);
      const taxAmt = this.r2(base * c.rate);
      amounts[c.id] = taxAmt;
      taxAmount += taxAmt;
      lines.push({ componentId: c.id, name: c.name, type: "TAX", qty: null, uom: null, rate: c.rate, amount: taxAmt });
    }

    const result: RatingResult = {
      planId: plan.planId, planName: plan.planName, utility: this.utility, uom: plan.uom,
      consumption, lines,
      netAmount: this.r2(netAmount), taxAmount: this.r2(taxAmount), totalAmount: this.r2(netAmount + taxAmount)
    };

    return this.applyMinimumBill(result, params);
  }
}
