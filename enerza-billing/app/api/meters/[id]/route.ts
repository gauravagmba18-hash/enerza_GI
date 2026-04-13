import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await (prisma.meter as any).findUnique({ where: { meterId: id } });
    if (!record) return notFound("meter");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    // Sanitize date field
    if (!body.calibrationDue) {
      body.calibrationDue = null;
    } else if (typeof body.calibrationDue === "string") {
      const d = new Date(body.calibrationDue);
      body.calibrationDue = isNaN(d.getTime()) ? null : d.toISOString();
    }
    // Remove read-only fields that must not be sent to update
    delete body.meterId; delete body.createdAt; delete body.updatedAt;
    const record = await (prisma.meter as any).update({ where: { meterId: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.meter as any).delete({ where: { meterId: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
