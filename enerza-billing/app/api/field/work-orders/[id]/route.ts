import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const wo = await (prisma.workOrder as any).findUnique({
      where: { workOrderId: id },
      include: {
        ticket: { include: { account: { include: { customer: true } } } },
        technician: true,
        spares: { include: { item: true } },
      },
    });
    if (!wo) return notFound("work order");
    return ok(wo);
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, inspectionNotes, resolutionNotes } = body;

    const data: any = {};
    if (inspectionNotes !== undefined) data.inspectionNotes = inspectionNotes;
    if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;

    if (status) {
      data.status = status;
      if (status === "IN_PROGRESS") {
        const existing = await (prisma.workOrder as any).findUnique({ where: { workOrderId: id } });
        if (!existing?.startedAt) data.startedAt = new Date();
      }
      if (status === "COMPLETED") {
        data.completedAt = new Date();
        // Close the linked ticket
        const existing = await (prisma.workOrder as any).findUnique({ where: { workOrderId: id } });
        if (existing?.ticketId) {
          await (prisma.serviceTicket as any).update({
            where: { ticketId: existing.ticketId },
            data: { status: "CLOSED", closedAt: new Date() },
          });
        }
      }
    }

    const updated = await (prisma.workOrder as any).update({
      where: { workOrderId: id },
      data,
      include: {
        ticket: { include: { account: { include: { customer: true } } } },
        technician: true,
        spares: { include: { item: true } },
      },
    });
    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
}
