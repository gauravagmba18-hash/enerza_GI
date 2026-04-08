import { RatePlanDef, RateParams, RatingResult, BillLineItem } from "../../billing-engine";

export interface BillingStrategy {
  utility: string;
  calculate(plan: RatePlanDef, params: RateParams): RatingResult;
}

export abstract class BaseBillingStrategy implements BillingStrategy {
  abstract utility: string;

  protected r2(v: number) {
    return Math.round(v * 100) / 100;
  }

  protected applySlabs(consumption: number, components: any[]): { id: string; amount: number }[] {
    let rem = consumption;
    const results: { id: string; amount: number }[] = [];

    for (const c of components) {
      if (c.type !== "VARIABLE") continue;
      const slabSize = c.slabTo !== null && c.slabTo !== undefined
        ? (c.slabTo - (c.slabFrom ?? 0))
        : Infinity;
      const qty = Math.min(rem, slabSize);
      const qtyUse = Math.max(0, qty);
      results.push({ id: c.id, amount: this.r2(qtyUse * c.rate) });
      rem = Math.max(0, rem - qtyUse);
      if (rem <= 0) break;
    }
    return results;
  }

  protected getProrateFactor(params: RateParams): number {
    if (!params.isClosingBill || !params.daysInPeriod) return 1.0;
    return params.daysInPeriod / 30; // standard month
  }

  protected prorate(amount: number, params: RateParams): number {
    return this.r2(amount * this.getProrateFactor(params));
  }

  protected applyMinimumBill(result: RatingResult, params: RateParams): RatingResult {
    if (params.minBillOverride && result.totalAmount < params.minBillOverride) {
      const diff = this.r2(params.minBillOverride - result.totalAmount);
      result.lines.push({
        componentId: "MIN_ADJUST",
        name: "Minimum Billing Adjustment",
        type: "CHARGE",
        qty: null,
        uom: null,
        rate: diff,
        amount: diff
      });
      result.netAmount = this.r2(result.netAmount + diff);
      result.totalAmount = params.minBillOverride;
    }
    return result;
  }

  abstract calculate(plan: RatePlanDef, params: RateParams): RatingResult;
}
