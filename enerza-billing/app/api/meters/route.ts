import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, serverError } from "@/lib/api-response";
import { excelDownloadResponse, parseExcelBuffer } from "@/lib/excel";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("export") === "1") {
      const rows = await (prisma.meter as any).findMany({ orderBy: { createdAt: "desc" } });
      return excelDownloadResponse(rows, "meters");
    }
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "25");
    const search = searchParams.get("search") ?? "";
    const skip  = (page - 1) * limit;
    const where: any = search ? { OR: [{ serialNo: { contains: search } }, { meterType: { contains: search } }, { make: { contains: search } }] } : {};
    const [data, total] = await Promise.all([
      (prisma.meter as any).findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      (prisma.meter as any).count({ where }),
    ]);
    return ok({ data, total, page, limit });
  } catch (err) { return serverError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data") || contentType.includes("application/octet-stream")) {
      const buf = await req.arrayBuffer();
      const rows = parseExcelBuffer(buf);
      const created = await Promise.all(rows.map((r: any) => (prisma.meter as any).create({ data: r })));
      return ok({ imported: created.length });
    }
    const body = await req.json();
    // Sanitize: convert empty-string date fields to null so Prisma doesn't choke
    if (body.calibrationDue === "" || body.calibrationDue === "dd-mm-yyyy") {
      body.calibrationDue = null;
    } else if (body.calibrationDue && typeof body.calibrationDue === "string") {
      // HTML date inputs return YYYY-MM-DD — wrap in a Date so Prisma gets an ISO datetime
      const d = new Date(body.calibrationDue);
      body.calibrationDue = isNaN(d.getTime()) ? null : d.toISOString();
    }
    // Ensure required fields have defaults
    if (!body.status) body.status = "ACTIVE";
    if (!body.uom && body.utilityType) {
      body.uom = body.utilityType === "ELECTRICITY" ? "kWh" : body.utilityType === "WATER" ? "kL" : "SCM";
    }
    const record = await (prisma.meter as any).create({ data: body });
    return ok(record, 201);
  } catch (err) { return serverError(err); }
}
