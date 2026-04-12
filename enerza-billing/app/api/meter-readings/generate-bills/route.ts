import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";
import { generateBill, getPlanId } from "@/lib/billing-engine";

// ─── POST — generate and persist bills for a batch of approved readings ───────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readingIds } = body as { readingIds: string[] };

    if (!Array.isArray(readingIds) || readingIds.length === 0) {
      return badRequest("readingIds array is required and must not be empty");
    }

    // Fetch min billing config once (non-fatal if unavailable)
    let minBillAmount: number | undefined;
    try {
      const config = await (prisma.utilityConfig as any).findFirst();
      if (config?.minBillingMode === "FIXED" && config.minBillingValue > 0) {
        minBillAmount = config.minBillingValue;
      }
    } catch { /* proceed without min billing */ }

    const results: any[] = [];
    const errors:  any[] = [];

    for (const readingId of readingIds) {
      try {
        // Fetch reading with connection → segment + account
        const reading = await (prisma.meterReading as any).findUnique({
          where: { readingId },
          include: {
            connection: {
              include: {
                segment: { select: { segmentName: true } },
                account:  { select: { accountId: true, cycleId: true } },
              },
            },
          },
        });

        if (!reading) {
          errors.push({ readingId, error: "Reading not found" });
          continue;
        }

        const connection = reading.connection;
        const account    = connection?.account;

        if (!account) {
          errors.push({ readingId, error: "Account not found for connection" });
          continue;
        }

        // Determine rate plan — fall back to domestic electricity if segment unknown
        const segmentName = (connection?.segment?.segmentName ?? "DOMESTIC").toUpperCase();
        const planId = getPlanId("ELECTRICITY", segmentName) ?? "RP-ELEC-DOM-01";

        // Derive readings (consumption = currReading − prevReading)
        const currReading = reading.readingValue  ?? 0;
        const prevReading = currReading - (reading.consumption ?? 0);

        const billDate = new Date(reading.readingDate);
        const dueDate  = new Date(billDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const period   = billDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

        // Run billing engine (in-memory; no DB write inside generateBill)
        const bill = generateBill({
          accountId:    account.accountId,
          connectionId: reading.connectionId,
          cycleId:      account.cycleId ?? "BC-MONTHLY-1",
          planId,
          period,
          billDate:     billDate.toISOString().slice(0, 10),
          prevReading,
          currReading,
          uom:          "kWh",
          minBillAmount,
        });

        // Apply minimum billing top-up if configured
        let { netAmount, taxAmount, totalAmount } = bill.rating;
        if (minBillAmount !== undefined && totalAmount < minBillAmount) {
          const diff  = parseFloat((minBillAmount - totalAmount).toFixed(2));
          netAmount   = parseFloat((netAmount   + diff).toFixed(2));
          totalAmount = parseFloat((totalAmount + diff).toFixed(2));
        }

        // Persist Bill header — BillLines skipped because ChargeComponent FKs
        // may not be seeded; amounts are captured at the header level.
        const created = await (prisma.bill as any).create({
          data: {
            billDate,
            dueDate,
            netAmount,
            taxAmount,
            totalAmount,
            status:       "PENDING",
            accountId:    account.accountId,
            connectionId: reading.connectionId,
            cycleId:      account.cycleId ?? "BC-MONTHLY-1",
          },
        });

        results.push({
          billId:       created.billId,
          accountId:    account.accountId,
          connectionId: reading.connectionId,
          netAmount,
          taxAmount,
          totalAmount,
          period,
          planId,
        });
      } catch (rowErr: any) {
        errors.push({ readingId, error: rowErr?.message ?? "Bill generation failed" });
      }
    }

    return ok({
      generated: results.length,
      failed:    errors.length,
      bills:     results,
      errors,
    });
  } catch (err) {
    return serverError(err);
  }
}
