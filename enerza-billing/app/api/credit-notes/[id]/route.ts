import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await (prisma.creditNote as any).findUnique({
      where: { cnId: id },
      include: {
        account: { include: { customer: { select: { fullName: true, customerId: true } } } },
        dispute: { select: { disputeId: true, disputeType: true, status: true } },
      },
    });
    if (!record) return notFound("credit-note");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const body = await req.json();

    if (action === "apply") {
      // Mark credit note as applied and link to a bill
      const record = await (prisma.creditNote as any).update({
        where: { cnId: id },
        data: { status: "APPLIED", appliedToBillId: body.billId ?? null },
      });
      return ok(record);
    }

    const record = await (prisma.creditNote as any).update({ where: { cnId: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.creditNote as any).delete({ where: { cnId: id } });
    return ok({ deleted: id });
  } catch (err) { return serverError(err); }
}
