import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get("page")   ?? "1");
    const limit  = parseInt(searchParams.get("limit")  ?? "25");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const skip   = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { disputeType: { contains: search } },
      { accountId:   { contains: search } },
      { assignedTo:  { contains: search } },
    ];

    const [data, total] = await Promise.all([
      (prisma.dispute as any).findMany({
        where, skip, take: limit,
        orderBy: { raisedOn: "desc" },
        include: {
          account: {
            include: { customer: { select: { fullName: true, customerId: true } } },
          },
        },
      }),
      (prisma.dispute as any).count({ where }),
    ]);

    return ok({ data, total, page, limit });
  } catch (err) { return serverError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await (prisma.dispute as any).create({ data: body });
    return ok(record, 201);
  } catch (err) { return serverError(err); }
}
