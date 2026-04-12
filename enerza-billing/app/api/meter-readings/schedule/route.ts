import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse readDateRule string → day number (1–31) or 0 for "Last" */
function parseReadDay(rule: string | null | undefined): number | null {
  if (!rule) return null;
  const n = parseInt(rule.trim());          // "5th of month" → 5
  if (!isNaN(n) && n >= 1 && n <= 31) return n;
  if (rule.toLowerCase().includes("last")) return 0; // last day of month
  return null;
}

/** Resolve the actual calendar day this cycle reads in the given month */
function resolveReadDay(rule: string | null | undefined, forDate: Date): number | null {
  const day = parseReadDay(rule);
  if (day === null) return null;
  if (day === 0) {
    // last day of the month
    return new Date(forDate.getFullYear(), forDate.getMonth() + 1, 0).getDate();
  }
  return day;
}

/** Is the cycle past-due or due today? */
function isCycleDue(readDateRule: string | null | undefined, today: Date): boolean {
  const day = resolveReadDay(readDateRule, today);
  if (day === null) return true; // unknown rule → always show
  return today.getDate() >= day;
}

/** Is the cycle upcoming within the next N days (but not yet due)? */
function isCycleUpcoming(
  readDateRule: string | null | undefined,
  today: Date,
  windowDays = 7
): boolean {
  const day = resolveReadDay(readDateRule, today);
  if (day === null) return false;
  const todayDay = today.getDate();
  return day > todayDay && day <= todayDay + windowDays;
}

/** Days until the read day (negative = already passed) */
function daysUntilReadDay(readDateRule: string | null | undefined, today: Date): number | null {
  const day = resolveReadDay(readDateRule, today);
  if (day === null) return null;
  return day - today.getDate();
}

// ─── GET /api/meter-readings/schedule ────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const now          = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfNext  = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ── 1. Load all active billing cycles ─────────────────────────────────
    const allCycles = await (prisma.billCycle as any).findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { accounts: true } } },
      orderBy: { cycleName: "asc" },
    });

    // ── 2. Load active routes with area info ───────────────────────────────
    const routeRows = await (prisma.route as any).findMany({
      where: { status: "ACTIVE" },
      orderBy: { routeName: "asc" },
      include: { area: { select: { areaName: true, city: true, district: true } } },
    });

    // ── 3. Work orders created this month → assigned route names ──────────
    const assignedWOs = await (prisma.workOrder as any).findMany({
      where: { createdAt: { gte: firstOfMonth, lt: firstOfNext } },
      include: {
        ticket:     { select: { subject: true } },
        technician: { select: { fullName: true } },
      },
    });

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

    // ── 4. Map cycles by id / name ─────────────────────────────────────────
    const cycleById: Record<string, any>   = {};
    const cycleByName: Record<string, any> = {};
    allCycles.forEach((c: any) => {
      cycleById[c.cycleId]     = c;
      cycleByName[c.cycleName] = c;
    });

    // ── 5. Build route list ────────────────────────────────────────────────
    const routes = await Promise.all(
      routeRows.map(async (route: any) => {
        const cycle = route.cycleGroup
          ? (cycleById[route.cycleGroup] ?? cycleByName[route.cycleGroup] ?? null)
          : null;

        const connectionCount = await (prisma.account as any).count({
          where: {
            premise: { areaId: route.areaId },
            ...(cycle ? { cycleId: cycle.cycleId } : {}),
          },
        });

        const readThisMonth = await (prisma.meterReading as any).count({
          where: { routeId: route.routeId, readingDate: { gte: firstOfMonth } },
        });

        const pendingCount = await (prisma.meterReading as any).count({
          where: { routeId: route.routeId, status: "PENDING" },
        });

        const rdr        = cycle?.readDateRule ?? null;
        const isDue      = isCycleDue(rdr, now);
        const isUpcoming = !isDue && isCycleUpcoming(rdr, now, 7);
        const daysUntil  = daysUntilReadDay(rdr, now);
        const isAssigned = assignedRouteNames.has(route.routeName);
        const assignment = routeToWO[route.routeName] ?? null;

        return {
          routeId:         route.routeId,
          routeName:       route.routeName,
          areaName:        route.area?.areaName ?? "—",
          location:        [route.area?.city, route.area?.district].filter(Boolean).join(", ") || "—",
          cycleId:         cycle?.cycleId ?? null,
          cycleGroup:      route.cycleGroup ?? null,
          cycleName:       cycle?.cycleName  ?? route.cycleGroup ?? "—",
          readDateRule:    rdr ?? "—",
          connectionCount,
          readThisMonth,
          pendingCount,
          isDue,
          isUpcoming,
          daysUntil,
          isAssigned,
          assignedTo:    assignment?.techName     ?? null,
          scheduledDate: assignment?.scheduledDate ?? null,
        };
      })
    );

    // ── 6. Enrich cycles with planning status ──────────────────────────────
    const cycles = allCycles.map((c: any) => {
      const cycleRoutes   = routes.filter(r => r.cycleId === c.cycleId);
      const plannedCount  = cycleRoutes.filter(r => r.isAssigned).length;
      const isDue         = isCycleDue(c.readDateRule, now);
      const isUpcoming    = !isDue && isCycleUpcoming(c.readDateRule, now, 7);
      const daysUntil     = daysUntilReadDay(c.readDateRule, now);
      const isActionable  = isDue || isUpcoming;

      return {
        cycleId:      c.cycleId,
        cycleName:    c.cycleName,
        readDateRule: c.readDateRule,
        billDateRule: c.billDateRule ?? "—",
        accountCount: c._count?.accounts ?? 0,
        routeCount:   cycleRoutes.length,
        plannedCount,
        allPlanned:   cycleRoutes.length > 0 && plannedCount === cycleRoutes.length,
        isDue,
        isUpcoming,
        daysUntil,
        isActionable,
      };
    });

    return ok({ cycles, routes });
  } catch (err) {
    return serverError(err);
  }
}
