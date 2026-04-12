import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

// ─── GET — fetch VALIDATED readings with anomaly analysis for approval queue ──

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip  = (page - 1) * limit;

    const [readings, total] = await Promise.all([
      (prisma.meterReading as any).findMany({
        where: { status: "VALIDATED" },
        skip,
        take: limit,
        orderBy: { readingDate: "desc" },
        include: {
          connection: {
            include: {
              account: {
                include: {
                  customer: { select: { fullName: true } },
                },
              },
              // fetch last 12 prior readings for the connection to compute avg
              meterReadings: {
                where: { status: { in: ["VALIDATED", "APPROVED"] } },
                orderBy: { readingDate: "desc" },
                take: 12,
                select: { readingId: true, consumption: true, readingValue: true, readingDate: true },
              },
            },
          },
          meter: { select: { serialNo: true, meterType: true } },
        },
      }),
      (prisma.meterReading as any).count({ where: { status: "VALIDATED" } }),
    ]);

    const data = readings.map((r: any) => {
      const history: any[] = r.connection?.meterReadings ?? [];
      // exclude the reading itself from history
      const prior = history.filter((h: any) => h.readingId !== r.readingId);
      const consumptions = prior.map((h: any) => h.consumption ?? 0).filter((c: number) => c > 0);

      const avg3  = consumptions.slice(0, 3).length  ? consumptions.slice(0, 3).reduce((a: number, b: number) => a + b, 0)  / consumptions.slice(0, 3).length  : 0;
      const avg12 = consumptions.length ? consumptions.reduce((a: number, b: number) => a + b, 0) / consumptions.length : 0;

      const consumption = r.consumption ?? 0;
      const refAvg = avg3 || avg12;

      // Anomaly flags
      const isReverse  = consumption < 0;
      const isZero     = consumption === 0;
      const isHigh     = refAvg > 0 && consumption > refAvg * 3;
      const isLow      = refAvg > 0 && consumption >= 0 && consumption < refAvg * 0.3;
      const isAnomaly  = isReverse || isHigh || isLow || isZero;

      return {
        readingId:    r.readingId,
        readingDate:  r.readingDate,
        readingValue: r.readingValue,
        consumption,
        readingType:  r.readingType,
        status:       r.status,
        connectionId: r.connectionId,
        accountId:    r.connection?.accountId ?? null,
        customer:     { fullName: r.connection?.account?.customer?.fullName ?? "Unknown" },
        meter:        r.meter ? { serialNo: r.meter.serialNo, meterType: r.meter.meterType } : null,
        anomaly: {
          isAnomaly,
          isReverse,
          isZero,
          isHigh,
          isLow,
          avg3:  parseFloat(avg3.toFixed(2)),
          avg12: parseFloat(avg12.toFixed(2)),
          // how many σ above average (simple version)
          factor: refAvg > 0 ? parseFloat((consumption / refAvg).toFixed(2)) : null,
        },
      };
    });

    return ok({ data, total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}

// ─── POST — batch approve readings ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readings }: { readings: { readingId: string; readingType: string }[] } = body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return badRequest("readings array is required and must not be empty");
    }

    const results: any[] = [];
    const errors:  any[] = [];

    for (const r of readings) {
      try {
        const updated = await (prisma.meterReading as any).update({
          where: { readingId: r.readingId },
          data: { status: "APPROVED", readingType: r.readingType ?? "ACTUAL" },
        });
        results.push(updated);
      } catch (rowErr: any) {
        errors.push({ readingId: r.readingId, error: rowErr?.message ?? "Update failed" });
      }
    }

    return ok({ approved: results.length, records: results, errors });
  } catch (err) {
    return serverError(err);
  }
}
