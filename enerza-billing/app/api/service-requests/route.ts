import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "25");
    const type  = searchParams.get("type") ?? "";
    const status = searchParams.get("status") ?? "";
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.serviceRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.serviceRequest.count({ where }),
    ]);

    return ok({ data, total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.serviceRequest.create({ data: body });
    return ok(record, 201);
  } catch (err) {
    return serverError(err);
  }
}
