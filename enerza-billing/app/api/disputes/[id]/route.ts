import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await (prisma.dispute as any).findUnique({
      where: { disputeId: id },
      include: {
        account: { include: { customer: { select: { fullName: true, customerId: true } } } },
        bill: { select: { billId: true, totalAmount: true, dueDate: true, status: true } },
        creditNotes: true,
      },
    });
    if (!record) return notFound("dispute");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await (prisma.dispute as any).update({ where: { disputeId: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.dispute as any).delete({ where: { disputeId: id } });
    return ok({ deleted: id });
  } catch (err) { return serverError(err); }
}
