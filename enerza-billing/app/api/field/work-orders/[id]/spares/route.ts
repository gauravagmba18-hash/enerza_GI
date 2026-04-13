import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, badRequest, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { itemId, quantity } = await req.json();
    if (!itemId || !quantity) return badRequest("itemId and quantity are required");
    const spare = await (prisma.workOrderSpare as any).create({
      data: { workOrderId: id, itemId, quantity: Number(quantity) },
      include: { item: true },
    });
    return ok(spare, 201);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, _ctx: Ctx) {
  try {
    const { searchParams } = new URL(req.url);
    const usageId = searchParams.get("usageId");
    if (!usageId) return badRequest("usageId query param required");
    await (prisma.workOrderSpare as any).delete({ where: { usageId } });
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
