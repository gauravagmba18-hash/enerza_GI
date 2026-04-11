import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Cycles with account count
    const cycleRows = await (prisma.billCycle as any).findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { accounts: true } } },
      orderBy: { cycleName: "asc" },
    });

    const cycles = cycleRows.map((c: any) => ({
      cycleId:      c.cycleId,
      cycleName:    c.cycleName,
      readDateRule: c.readDateRule,
      accountCount: c._count?.accounts ?? 0,
    }));

    // Routes with stats
    const routeRows = await (prisma.route as any).findMany({
      where: { status: "ACTIVE" },
      orderBy: { routeName: "asc" },
    });

    const routes = await Promise.all(
      routeRows.map(async (route: any) => {
        const [connectionCount, readThisMonth, pendingCount] = await Promise.all([
          (prisma.meterReading as any).count({
            where: { routeId: route.routeId },
          }),
          (prisma.meterReading as any).count({
            where: {
              routeId:     route.routeId,
              readingDate: { gte: firstOfMonth },
            },
          }),
          (prisma.meterReading as any).count({
            where: {
              routeId: route.routeId,
              status:  "PENDING",
            },
          }),
        ]);

        return {
          routeId:         route.routeId,
          routeName:       route.routeName,
          cycleGroup:      route.cycleGroup ?? null,
          connectionCount,
          readThisMonth,
          pendingCount,
        };
      })
    );

    return ok({ cycles, routes });
  } catch (err) {
    return serverError(err);
  }
}
