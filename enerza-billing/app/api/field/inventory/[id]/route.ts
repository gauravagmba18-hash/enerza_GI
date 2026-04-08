import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await prisma.inventoryItem.findUnique({
      where: { itemId: id }
    });
    if (!record) return notFound("inventory item");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { itemId, createdAt, updatedAt, ...updateData } = body;
    // StockQty might come as a string from form, ensure it's a number
    if (updateData.stockQty !== undefined) updateData.stockQty = Number(updateData.stockQty);
    if (updateData.unitCost !== undefined) updateData.unitCost = Number(updateData.unitCost);

    const record = await prisma.inventoryItem.update({
      where: { itemId: id },
      data: updateData
    });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
try {
    const { id } = await params;
    await prisma.inventoryItem.delete({ where: { itemId: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
