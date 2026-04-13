import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

// Component IDs per utility type — energy line + tax line
const UTILITY_COMPONENTS: Record<string, { energy: string; energyName: string; tax: string; taxName: string }> = {
  ELECTRICITY: { energy: "CC-ED-E2", energyName: "Energy Charge",       tax: "CC-ED-DUTY", taxName: "Electricity Duty" },
  GAS:         { energy: "CC-GD-V1", energyName: "Gas Variable Charge",  tax: "CC-GD-GST",  taxName: "GST @ 5%" },
  WATER:       { energy: "CC-WD-W1", energyName: "Water Charge",         tax: "CC-WD-TAX",  taxName: "Water Tax" },
  DEFAULT:     { energy: "CC-ED-E2", energyName: "Energy Charge",        tax: "CC-ED-DUTY", taxName: "Tax / Duty" },
};

// POST /api/bills/backfill-lines
// Creates synthetic BillLines for bills that have none.
// Call repeatedly with ?batch=1000 until done=true.
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batch = Math.min(parseInt(searchParams.get("batch") ?? "500"), 2000);

    // Find bills with no BillLines
    const bills = await (prisma.bill as any).findMany({
      where: { billLines: { none: {} } },
      take: batch,
      select: {
        billId:       true,
        netAmount:    true,
        taxAmount:    true,
        connectionId: true,
        connection:   { select: { utilityType: true } },
      },
    });

    if (bills.length === 0) {
      const remaining = await (prisma.bill as any).count({ where: { billLines: { none: {} } } });
      return ok({ processed: 0, done: true, remaining });
    }

    let created = 0;
    let failed  = 0;

    for (const bill of bills) {
      const utilityType = (bill.connection?.utilityType ?? "ELECTRICITY").toUpperCase();
      const comps = UTILITY_COMPONENTS[utilityType] ?? UTILITY_COMPONENTS.DEFAULT;

      const lines = [];

      // Energy / variable line (net amount)
      if (bill.netAmount > 0) {
        lines.push({
          billId:      bill.billId,
          componentId: comps.energy,
          description: comps.energyName,
          quantity:    1,
          rate:        bill.netAmount,
          amount:      bill.netAmount,
          lineType:    "CHARGE",
        });
      }

      // Tax line
      if (bill.taxAmount > 0) {
        lines.push({
          billId:      bill.billId,
          componentId: comps.tax,
          description: comps.taxName,
          quantity:    1,
          rate:        bill.taxAmount,
          amount:      bill.taxAmount,
          lineType:    "TAX",
        });
      }

      try {
        await (prisma.billLine as any).createMany({ data: lines, skipDuplicates: true });
        created += lines.length;
      } catch {
        failed++;
      }
    }

    const remaining = await (prisma.bill as any).count({ where: { billLines: { none: {} } } });

    return ok({ processed: bills.length, linesCreated: created, failed, remaining, done: remaining === 0 });
  } catch (err) {
    return serverError(err);
  }
}

// GET — progress check
export async function GET() {
  try {
    const [total, withLines, withoutLines] = await Promise.all([
      (prisma.bill as any).count(),
      (prisma.bill as any).count({ where: { billLines: { some: {} } } }),
      (prisma.bill as any).count({ where: { billLines: { none: {} } } }),
    ]);
    const lineCount = await (prisma.billLine as any).count();
    return ok({ totalBills: total, billsWithLines: withLines, billsWithoutLines: withoutLines, totalLines: lineCount });
  } catch (err) {
    return serverError(err);
  }
}
