import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";
import { excelDownloadResponse, parseExcelBuffer } from "@/lib/excel";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("export") === "1") {
      const rows = await (prisma.route as any).findMany({ orderBy: { createdAt: "desc" } });
      return excelDownloadResponse(rows, "routes");
    }
    const page   = parseInt(searchParams.get("page")  ?? "1");
    const limit  = parseInt(searchParams.get("limit") ?? "25");
    const search = searchParams.get("search") ?? "";
    const skip   = (page - 1) * limit;

    const where: any = search
      ? { OR: [
          { routeName: { contains: search, mode: "insensitive" } },
          { cycleGroup: { contains: search, mode: "insensitive" } },
          { area: { areaName: { contains: search, mode: "insensitive" } } },
          { area: { city: { contains: search, mode: "insensitive" } } },
        ]}
      : {};

    const [routes, total] = await Promise.all([
      (prisma.route as any).findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: {
          area: { select: { areaId: true, areaName: true, city: true, district: true, state: true } },
        },
      }),
      (prisma.route as any).count({ where }),
    ]);

    // Load all billing cycles to resolve cycleGroup → cycle name + readDateRule
    const allCycles = await (prisma.billCycle as any).findMany({
      select: { cycleId: true, cycleName: true, readDateRule: true, billDateRule: true },
    });
    const cycleById: Record<string, any>   = {};
    const cycleByName: Record<string, any> = {};
    allCycles.forEach((c: any) => {
      cycleById[c.cycleId]     = c;
      cycleByName[c.cycleName] = c;
    });

    const data = await Promise.all(routes.map(async (r: any) => {
      // cycleGroup may be a cycleId or cycleName — try both
      const cycle = r.cycleGroup
        ? (cycleById[r.cycleGroup] ?? cycleByName[r.cycleGroup] ?? null)
        : null;

      // Count accounts (connections) in this area for this billing cycle
      const connectionCount = await (prisma.account as any).count({
        where: {
          premise: { areaId: r.areaId },
          ...(cycle ? { cycleId: cycle.cycleId } : {}),
        },
      });

      return {
        routeId:         r.routeId,
        routeName:       r.routeName,
        cycleGroup:      r.cycleGroup ?? "—",
        cycleName:       cycle?.cycleName  ?? r.cycleGroup ?? "—",
        readDateRule:    cycle?.readDateRule ?? "—",
        billDateRule:    cycle?.billDateRule ?? "—",
        areaId:          r.areaId,
        areaName:        r.area?.areaName ?? "—",
        location:        [r.area?.city, r.area?.district].filter(Boolean).join(", ") || "—",
        connectionCount,
        status:          r.status,
        readerId:        r.readerId ?? "—",
      };
    }));

    return ok({ data, total, page, limit });
  } catch (err) { return serverError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data") || contentType.includes("application/octet-stream")) {
      const buf = await req.arrayBuffer();
      const rows = parseExcelBuffer(buf);
      const created = await Promise.all(rows.map((r: any) => (prisma.route as any).create({ data: r })));
      return ok({ imported: created.length });
    }
    const body = await req.json();
    const record = await (prisma.route as any).create({ data: body });
    return ok(record, 201);
  } catch (err) { return serverError(err); }
}
