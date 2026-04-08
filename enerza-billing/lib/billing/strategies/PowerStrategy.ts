import { BaseBillingStrategy } from "./BaseStrategy";
import { RatePlanDef, RateParams, RatingResult, BillLineItem } from "../../billing-engine";

export class PowerStrategy extends BaseBillingStrategy {
  utility = "ELECTRICITY";

  calculate(plan: RatePlanDef, params: RateParams): RatingResult {
    let consumption = params.consumption;
    let netAmount = 0;
    let taxAmount = 0;
    const amounts: Record<string, number> = {};
    const lines: BillLineItem[] = [];

    // 1. Fixed Charges
    for (const c of plan.components) {
      if (c.type === "FIXED") {
        const proratedRate = this.prorate(c.rate, params);
        amounts[c.id] = proratedRate;
        netAmount += proratedRate;
        lines.push({ componentId: c.id, name: c.name + (params.isClosingBill ? " (Prorated)" : ""), type: "CHARGE", qty: null, uom: null, rate: proratedRate, amount: proratedRate });
      }
    }

    // 2. Variable Energy Slabs (Standard Consumption)
    const slabResults = this.applySlabs(consumption, plan.components);
    for (const comp of plan.components) {
      if (comp.type === "VARIABLE") {
        const sr = slabResults.find((s) => s.id === comp.id);
        const amount = sr?.amount ?? 0;
        amounts[comp.id] = amount;
        if (amount > 0 || consumption > (comp.slabFrom ?? 0)) {
          const slabFrom = comp.slabFrom ?? 0;
          const slabTo = comp.slabTo;
          const slabSize = (slabTo !== null && slabTo !== undefined) ? (slabTo - slabFrom) : Infinity;
          const qty = Math.min(Math.max(0, consumption - slabFrom), slabSize);
          netAmount += amount;
          lines.push({ componentId: comp.id, name: comp.name, type: "CHARGE", qty: this.r2(qty), uom: plan.uom, rate: comp.rate, amount });
        }
      }
    }

    // 3. TOD Surcharge (18:00 - 22:00) 
    // Simulated as 25% of total consumption as Peak for this iteration
    const peakQty = this.r2(consumption * 0.25);
    for (const c of plan.components) {
      if (c.type === "TOD_SURCHARGE") {
        const amount = this.r2(peakQty * c.rate);
        amounts[c.id] = amount;
        netAmount += amount;
        lines.push({ componentId: c.id, name: c.name, type: "CHARGE", qty: peakQty, uom: plan.uom, rate: c.rate, amount });
      }
    }

    // 4. Power Specifics: MD Penalty & Power Factor
    if (params.maximumDemandKva && params.contractDemandKva && params.maximumDemandKva > params.contractDemandKva) {
      const excess = params.maximumDemandKva - params.contractDemandKva;
      for (const c of plan.components) {
        if (c.type === "DEMAND_PENALTY") {
          const amount = this.r2(excess * c.rate);
          amounts[c.id] = amount;
          netAmount += amount;
          lines.push({ componentId: c.id, name: c.name, type: "CHARGE", qty: this.r2(excess), uom: "kVA", rate: c.rate, amount });
        }
      }
    }

    // Power Factor Logic (BRD Grid Compliance)
    const pf = (params.kvah && params.kvah > 0) ? this.r2(params.consumption / params.kvah) : 0.95;
    for (const c of plan.components) {
      if (c.type === "PF_PENALTY" && pf < 0.90) {
        const penaltyAmt = this.r2((0.90 - pf) * 100 * c.rate * netAmount);
        amounts[c.id] = penaltyAmt;
        netAmount += penaltyAmt;
        lines.push({ componentId: c.id, name: `${c.name} (PF: ${pf})`, type: "CHARGE", qty: pf, uom: "PF", rate: c.rate, amount: penaltyAmt });
      }
      if (c.type === "PF_INCENTIVE" && pf > 0.97) {
        const incentiveAmt = this.r2((pf - 0.97) * 100 * -c.rate * netAmount); // Negative amount for incentive
        amounts[c.id] = incentiveAmt;
        netAmount += incentiveAmt;
        lines.push({ componentId: c.id, name: `${c.name} (PF: ${pf})`, type: "INCENTIVE", qty: pf, uom: "PF", rate: c.rate, amount: incentiveAmt });
      }
    }

    // 5. Net Metering Credits (Solar Export)
    const exportQty = params.exportedKwh ?? 0;
    if (exportQty > 0) {
      for (const c of plan.components) {
        if (c.type === "NET_METER_CREDIT") {
          const amount = this.r2(exportQty * c.rate); // Rate should be negative in plan
          amounts[c.id] = amount;
          netAmount += amount;
          lines.push({ componentId: c.id, name: c.name, type: "CREDIT", qty: this.r2(exportQty), uom: plan.uom, rate: c.rate, amount });
        }
      }
    }

    // 6. Taxes
    for (const c of plan.components) {
      if (c.type === "TAX") {
        const base = (c.basedOn ?? []).reduce((sum, id) => sum + (amounts[id] ?? 0), 0);
        const taxAmt = this.r2(base * c.rate);
        amounts[c.id] = taxAmt;
        taxAmount += taxAmt;
        lines.push({ componentId: c.id, name: c.name, type: "TAX", qty: null, uom: null, rate: c.rate, amount: taxAmt });
      }
    }

    const result: RatingResult = {
      planId: plan.planId, planName: plan.planName, utility: this.utility, uom: plan.uom,
      consumption: params.consumption, lines,
      netAmount: this.r2(netAmount), taxAmount: this.r2(taxAmount), totalAmount: this.r2(netAmount + taxAmount)
    };

    return this.applyMinimumBill(result, params);
  }
}
