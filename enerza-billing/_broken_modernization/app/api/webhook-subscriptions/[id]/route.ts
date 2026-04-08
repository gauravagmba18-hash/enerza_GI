import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await (prisma.webhookSubscription as any).findUnique({ where: { webhookId: id } });
    if (!record) return notFound("webhookSubscription");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await (prisma.webhookSubscription as any).update({ where: { webhookId: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.webhookSubscription as any).delete({ where: { webhookId: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
