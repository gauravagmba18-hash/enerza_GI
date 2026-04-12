import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

// ─── Helper: parse readDateRule to a day-of-month number ─────────────────────
// Rules are stored as strings like "5", "15", "Last", "1", etc.
function parseReadDay(rule: string | null | undefined): number | null {
  if (!rule) return null;
  const n = parseInt(rule.trim());
  if (!isNaN(n) && n >= 1 && n <= 31) return n;
  if (rule.toLowerCase().includes("last")) return 0; // 0 = last day of month
  return null;
}

// Is this billing cycle due for reading in the current month?
// A route is "due" if: today >= readDay AND no work order exists for it this month yet.
function isCycleDue(readDateRule: string | null | undefined, today: Date): boolean {
  const day = parseReadDay(readDateRule);
  if (day === null) return true; // unknown rule → always show
  const todayDay = today.getDate();
  if (day === 0) return todayDay >= 25;   // "Last" → due from the 25th onwards
  return todayDay >= day;                  // due if today is on or after the read day
}

export async function GET(_req: NextRequest) {
  try {
    const now           = new Date();
    const firstOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfNext   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ── 1. Load all active billing cycles ─────────────────────────────────
    const allCycles = await (prisma.billCycle as any).findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { accounts: true } } },
      orderBy: { cycleName: "asc" },
    });

    const cycles = allCycles.map((c: any) => ({
      cycleId:      c.cycleId,
      cycleName:    c.cycleName,
      readDateRule: c.readDateRule,
      billDateRule: c.billDateRule ?? "—",
      accountCount: c._count?.accounts ?? 0,
      isDue:        isCycleDue(c.readDateRule, now),
    }));

    // Map cycleId + cycleName → cycle for route enrichment
    const cycleById: Record<string, any>   = {};
    const cycleByName: Record<string, any> = {};
    allCycles.forEach((c: any) => {
      cycleById[c.cycleId]     = c;
      cycleByName[c.cycleName] = c;
    });

    // ── 2. Load active routes with area info ───────────────────────────────
    const routeRows = await (prisma.route as any).findMany({
      where: { status: "ACTIVE" },
      orderBy: { routeName: "asc" },
      include: {
        area: { select: { areaName: true, city: true, district: true } },
      },
    });

    // ── 3. Find already-assigned routes this month via work orders ─────────
    // A work order for a meter-reading round has category "METER_READING" in ticket subject
    const assignedWOs = await (prisma.workOrder as any).findMany({
      where: { createdAt: { gte: firstOfMonth, lt: firstOfNext } },
      include: {
        ticket: { select: { subject: true } },
        technician: { select: { fullName: true } },
      },
    });

    // Extract route names from work order subjects: "Meter Reading Round — <routeName>"
    const assignedRouteNames = new Set<string>();
    const routeToWO: Record<string, { techName: string; scheduledDate: string }> = {};
    assignedWOs.forEach((wo: any) => {
      const subject: string = wo.ticket?.subject ?? "";
      const match = subject.match(/Meter Reading Round — (.+)$/);
      if (match) {
        const rName = match[1];
        assignedRouteNames.add(rName);
        routeToWO[rName] = {
          techName:      wo.technician?.fullName ?? "Technician",
          scheduledDate: wo.scheduledDate?.toISOString().slice(0, 10) ?? "—",
        };
      }
    });

    // ── 4. Build route list with due-flag, connection count, assignment status ──
    const routes = await Promise.all(
      routeRows.map(async (route: any) => {
        const cycle = route.cycleGroup
          ? (cycleById[route.cycleGroup] ?? cycleByName[route.cycleGroup] ?? null)
          : null;

        // Connections = accounts in this area on this cycle
        const connectionCount = await (prisma.account as any).count({
          where: {
            premise: { areaId: route.areaId },
            ...(cycle ? { cycleId: cycle.cycleId } : {}),
          },
        });

        // Readings already captured this month for this route
        const readThisMonth = await (prisma.meterReading as any).count({
          where: { routeId: route.routeId, readingDate: { gte: firstOfMonth } },
        });

        const pendingCount = await (prisma.meterReading as any).count({
          where: { routeId: route.routeId, status: "PENDING" },
        });

        const isDue      = isCycleDue(cycle?.readDateRule, now);
        const isAssigned = assignedRouteNames.has(route.routeName);
        const assignment = routeToWO[route.routeName] ?? null;

        return {
          routeId:         route.routeId,
          routeName:       route.routeName,
          areaName:        route.area?.areaName ?? "—",
          location:        [route.area?.city, route.area?.district].filter(Boolean).join(", ") || "—",
          cycleGroup:      route.cycleGroup ?? null,
          cycleName:       cycle?.cycleName  ?? route.cycleGroup ?? "—",
          readDateRule:    cycle?.readDateRule ?? "—",
          connectionCount,
          readThisMonth,
          pendingCount,
          isDue,
          isAssigned,
          assignedTo:      assignment?.techName      ?? null,
          scheduledDate:   assignment?.scheduledDate  ?? null,
        };
      })
    );

    return ok({ cycles, routes });
  } catch (err) {
    return serverError(err);
  }
}
