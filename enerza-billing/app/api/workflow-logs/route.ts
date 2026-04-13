import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId") ?? "";

    if (!requestId) return badRequest("requestId is required");

    const data = await (prisma.workflowLog as any).findMany({
      where: { requestId },
      orderBy: { createdAt: "asc" },
    });

    return ok({ data, total: data.length });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await (prisma.workflowLog as any).create({ data: body });
    return ok(record, 201);
  } catch (err) {
    return serverError(err);
  }
}
