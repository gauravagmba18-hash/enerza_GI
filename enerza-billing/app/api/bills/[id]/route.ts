import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await (prisma.bill as any).findUnique({
      where: { billId: id },
      include: {
        billLines: {
          orderBy: { createdAt: "asc" },
          include: { component: true },
        },
        account: {
          include: {
            customer: { include: { segment: true } },
            premise: true,
            cycle: true,
          },
        },
        connection: {
          include: {
            elecConnDetail: true,
            gasConnDetail: true,
            waterConnDetail: true,
          },
        },
        cycle: true,
      },
    });
    if (!record) return notFound("bill");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await (prisma.bill as any).update({ where: { billId: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.bill as any).delete({ where: { billId: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
