import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

// ─── GET — fetch VALIDATED readings for approval queue ───────────────────────

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
            },
          },
          meter: { select: { serialNo: true, meterType: true } },
        },
      }),
      (prisma.meterReading as any).count({ where: { status: "VALIDATED" } }),
    ]);

    const data = readings.map((r: any) => ({
      readingId:    r.readingId,
      readingDate:  r.readingDate,
      readingValue: r.readingValue,
      consumption:  r.consumption,
      readingType:  r.readingType,
      status:       r.status,
      connectionId: r.connectionId,
      accountId:    r.connection?.accountId ?? null,
      customer:     { fullName: r.connection?.account?.customer?.fullName ?? "Unknown" },
      meter:        r.meter
        ? { serialNo: r.meter.serialNo, meterType: r.meter.meterType }
        : null,
    }));

    return ok({ data, total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}

// ─── POST — batch approve readings ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readings }: { readings: { readingId: string; readingType: string }[] } =
      body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return badRequest("readings array is required and must not be empty");
    }

    const results: any[] = [];
    const errors:  any[] = [];

    for (const r of readings) {
      try {
        const updated = await (prisma.meterReading as any).update({
          where: { readingId: r.readingId },
          data: {
            status:      "APPROVED",
            readingType: r.readingType ?? "ACTUAL",
          },
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
