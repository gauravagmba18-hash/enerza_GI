import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get("page")  ?? "1");
    const limit  = parseInt(searchParams.get("limit") ?? "25");
    const search = searchParams.get("search") ?? "";
    const skip   = (page - 1) * limit;

    const customerFilter = search
      ? { account: { customer: { fullName: { contains: search, mode: "insensitive" as const } } } }
      : {};

    const where = { utilityType: "ELECTRICITY", status: "ACTIVE", ...customerFilter };

    const [connections, total] = await Promise.all([
      (prisma.serviceConnection as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          account: {
            include: {
              customer: { select: { customerId: true, fullName: true, mobile: true } },
              premise: {
                include: {
                  area: {
                    include: {
                      routes: {
                        where: { status: "ACTIVE" },
                        take: 1,
                        select: { routeId: true, routeName: true },
                      },
                    },
                  },
                },
              },
            },
          },
          meterInstalls: {
            where: { removeDate: null },
            include: {
              meter: { select: { meterId: true, serialNo: true, meterType: true, make: true } },
            },
            orderBy: { installDate: "desc" },
            take: 1,
          },
          meterReadings: {
            orderBy: { readingDate: "desc" },
            take: 13,
            select: {
              readingId:    true,
              readingDate:  true,
              readingValue: true,
              consumption:  true,
              readingType:  true,
              status:       true,
            },
          },
        },
      }),
      (prisma.serviceConnection as any).count({ where }),
    ]);

    const enriched = connections.map((conn: any) => {
      const readings: any[] = conn.meterReadings ?? [];
      const lastReading     = readings[0] ?? null;
      const meter           = conn.meterInstalls?.[0]?.meter ?? null;
      const route           = conn.account?.premise?.area?.routes?.[0] ?? null;

      // Historical avg consumption (simple mean over last N readings)
      const avg = (n: number) => {
        const slice = readings.slice(0, n);
        if (!slice.length) return 0;
        return slice.reduce((s: number, r: any) => s + (r.consumption ?? 0), 0) / slice.length;
      };

      return {
        connectionId:   conn.connectionId,
        accountId:      conn.accountId,
        customer:       conn.account?.customer ?? null,
        meter,
        route,
        lastReading,
        avgConsumptions: { m1: avg(1), m3: avg(3), m6: avg(6), m12: avg(12) },
        readingCount:   readings.length,
      };
    });

    return ok({ data: enriched, total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}
