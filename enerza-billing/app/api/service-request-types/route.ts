import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, serverError } from "@/lib/api-response";
import { excelDownloadResponse, parseExcelBuffer } from "@/lib/excel";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("export") === "1") {
      const rows = await (prisma.serviceRequestType as any).findMany({ orderBy: { createdAt: "desc" } });
      return excelDownloadResponse(rows, "service-request-types");
    }
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "25");
    const search = searchParams.get("search") ?? "";
    const skip  = (page - 1) * limit;
    const where: any = search ? { OR: [{ category: { contains: search } }, { subcategory: { contains: search } }, { department: { contains: search } }] } : {};
    const [data, total] = await Promise.all([
      (prisma.serviceRequestType as any).findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      (prisma.serviceRequestType as any).count({ where }),
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
      const created = await Promise.all(rows.map((r: any) => (prisma.serviceRequestType as any).create({ data: r })));
      return ok({ imported: created.length });
    }
    const body = await req.json();
    const record = await (prisma.serviceRequestType as any).create({ data: body });
    return ok(record, 201);
  } catch (err) { return serverError(err); }
}
