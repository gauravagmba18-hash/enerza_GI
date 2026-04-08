import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await (prisma.dunningLevel as any).findUnique({ where: { levelId: id } });
    if (!record) return notFound("dunningLevel");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await (prisma.dunningLevel as any).update({ where: { levelId: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.dunningLevel as any).delete({ where: { levelId: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
