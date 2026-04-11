import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

interface ReadingInput {
  connectionId: string;
  meterId:      string;
  routeId:      string;
  readingValue: number;
  readingDate:  string;
  readingType?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { readings }: { readings: ReadingInput[] } = await req.json();
    if (!Array.isArray(readings) || readings.length === 0) {
      return ok({ saved: 0, records: [], errors: [] });
    }

    const results: any[] = [];
    const errors:  any[] = [];

    for (const r of readings) {
      try {
        // Fetch previous reading to compute consumption
        const prev = await (prisma.meterReading as any).findFirst({
          where:   { connectionId: r.connectionId },
          orderBy: { readingDate: "desc" },
          select:  { readingValue: true },
        });

        const consumption = prev ? r.readingValue - prev.readingValue : r.readingValue;

        const record = await (prisma.meterReading as any).create({
          data: {
            connectionId: r.connectionId,
            meterId:      r.meterId,
            routeId:      r.routeId,
            readingValue: r.readingValue,
            consumption,
            readingDate:  new Date(r.readingDate),
            readingType:  r.readingType ?? "ACTUAL",
            status:       consumption < 0 ? "EXCEPTION" : "PENDING",
          },
        });

        results.push(record);
      } catch (rowErr: any) {
        errors.push({ connectionId: r.connectionId, error: rowErr?.message ?? "Save failed" });
      }
    }

    return ok({ saved: results.length, records: results, errors });
  } catch (err) {
    return serverError(err);
  }
}
