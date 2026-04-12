import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch PENDING and EXCEPTION readings for ELECTRICITY connections
    const readings = await (prisma.meterReading as any).findMany({
      where: {
        status: { in: ["PENDING", "EXCEPTION"] },
        connection: { utilityType: "ELECTRICITY" },
      },
      include: {
        connection: {
          include: {
            account: {
              include: {
                customer: { select: { fullName: true, customerId: true } },
              },
            },
          },
        },
        meter: { select: { serialNo: true, meterType: true } },
      },
      orderBy: { readingDate: "desc" },
      take: 200,
    });

    const enriched = await Promise.all(
      readings.map(async (r: any) => {
        const connectionId = r.connectionId;
        const segmentId = r.connection?.segmentId ?? null;

        // Last 12 historical readings (excluding current, non-EXCEPTION)
        const historical = await (prisma.meterReading as any).findMany({
          where: {
            connectionId,
            readingId: { not: r.readingId },
            status:    { not: "EXCEPTION" },
          },
          orderBy: { readingDate: "desc" },
          take: 12,
          select: {
            readingId:    true,
            readingDate:  true,
            readingValue: true,
            consumption:  true,
          },
        });

        const consumptions: number[] = historical.map((h: any) => h.consumption ?? 0);
        const histMean   = mean(consumptions);
        const histStdDev = stdDev(consumptions, histMean);
        const sigma =
          histStdDev > 0
            ? Math.abs((r.consumption ?? 0) - histMean) / histStdDev
            : 0;

        // Rolling avg of last 3 valid readings
        const last3 = consumptions.slice(0, 3);
        const rollingAvg3 = last3.length ? mean(last3) : histMean;

        // Days since last read
        const prevRead = historical[0] ?? null;
        const daysSinceLastRead = prevRead
          ? Math.floor(
              (new Date(r.readingDate).getTime() -
                new Date(prevRead.readingDate).getTime()) /
                86_400_000
            )
          : 30;

        // Degree-day estimate: (mean/30) * daysSinceLastRead
        const degDayEstimate =
          histMean > 0 ? (histMean / 30) * Math.max(daysSinceLastRead, 1) : 0;

        // Peer benchmark: avg consumption in same segment, last 90 days
        let peerAvg = 0;
        if (segmentId) {
          const peerResult = await (prisma.meterReading as any).aggregate({
            where: {
              connection: { segmentId },
              readingDate: { gte: ninetyDaysAgo },
              status: { not: "EXCEPTION" },
              readingId: { not: r.readingId },
            },
            _avg: { consumption: true },
          });
          peerAvg = peerResult._avg?.consumption ?? 0;
        }

        return {
          readingId:    r.readingId,
          readingDate:  r.readingDate,
          readingValue: r.readingValue,
          consumption:  r.consumption,
          readingType:  r.readingType,
          status:       r.status,
          connectionId: r.connectionId,
          accountId:    r.connection?.accountId ?? null,
          customer:     { fullName: r.connection?.account?.customer?.fullName ?? "Unknown", customerId: r.connection?.account?.customer?.customerId ?? null },
          meter:        r.meter
            ? { serialNo: r.meter.serialNo, meterType: r.meter.meterType }
            : null,
          segmentId,
          analysis: {
            mean:            histMean,
            stdDev:          histStdDev,
            sigma,
            isSuspect:       sigma > 3,
            rollingAvg3,
            degDayEstimate,
            daysSinceLastRead,
            peerAvg,
            historicalCount: historical.length,
            prevReadingValue: prevRead?.readingValue ?? r.readingValue,
          },
        };
      })
    );

    return ok(enriched);
  } catch (err) {
    return serverError(err);
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readingId, action, readingType, estimatedValue } = body;

    if (!readingId || !action) {
      return badRequest("readingId and action are required");
    }

    const existing = await (prisma.meterReading as any).findUnique({
      where: { readingId },
    });
    if (!existing) {
      return badRequest("Reading not found");
    }

    let updateData: Record<string, unknown> = {};

    if (action === "VALIDATE") {
      updateData = {
        status:      "VALIDATED",
        readingType: readingType ?? "ACTUAL",
      };
    } else if (action === "ESTIMATE") {
      if (estimatedValue == null) {
        return badRequest("estimatedValue is required for ESTIMATE action");
      }
      // Fetch previous reading to compute consumption
      const prev = await (prisma.meterReading as any).findFirst({
        where: {
          connectionId: existing.connectionId,
          readingId:    { not: readingId },
          status:       { not: "EXCEPTION" },
        },
        orderBy: { readingDate: "desc" },
        select: { readingValue: true },
      });
      const prevVal     = prev?.readingValue ?? 0;
      const consumption = estimatedValue - prevVal;
      updateData = {
        status:       "VALIDATED",
        readingType:  "ESTIMATED",
        readingValue: estimatedValue,
        consumption,
      };
    } else if (action === "CREATE_WO") {
      updateData = { status: "EXCEPTION" };
    } else {
      return badRequest("Invalid action. Use VALIDATE, ESTIMATE, or CREATE_WO");
    }

    const updated = await (prisma.meterReading as any).update({
      where: { readingId },
      data:  updateData,
    });

    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
}
