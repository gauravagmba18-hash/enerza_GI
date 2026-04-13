import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const wo = await (prisma.workOrder as any).findUnique({
      where: { workOrderId: id },
      include: {
        ticket: { include: { account: { include: { customer: true } } } },
        request: { include: { customer: true } },
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
    const { action, status, inspectionNotes, resolutionNotes, checklist, photos, rejectionReason } = body;

    const existing = await (prisma.workOrder as any).findUnique({ where: { workOrderId: id } });
    if (!existing) return notFound("work order");

    const data: any = {};

    // Approve / reject field work
    if (action === "approve") {
      const items: any[] = JSON.parse(existing.checklist ?? "[]");
      const allDone = items.length > 0 && items.every((i: any) => i.status !== "PENDING");
      if (!allDone) return badRequest("All checklist items must be marked before approving");
      data.approvalStatus = "APPROVED";
      data.approvedAt = new Date();
      data.status = "COMPLETED";
      data.completedAt = new Date();
    } else if (action === "reject") {
      data.approvalStatus = "REJECTED";
      data.rejectionReason = rejectionReason ?? "Rejected by technician";
    } else {
      // Regular status/notes update
      if (inspectionNotes !== undefined) data.inspectionNotes = inspectionNotes;
      if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;
      if (status) {
        data.status = status;
        if (status === "IN_PROGRESS" && !existing.startedAt) data.startedAt = new Date();
        if (status === "COMPLETED") {
          data.completedAt = new Date();
          if (existing.ticketId) {
            await (prisma.serviceTicket as any).update({
              where: { ticketId: existing.ticketId },
              data: { status: "CLOSED", closedAt: new Date() },
            });
          }
        }
      }
    }

    // Checklist update — merge by seq number
    if (checklist) {
      data.checklist = typeof checklist === "string" ? checklist : JSON.stringify(checklist);
    }

    // Photos — replace entire array
    if (photos !== undefined) {
      data.photos = typeof photos === "string" ? photos : JSON.stringify(photos);
    }

    const updated = await (prisma.workOrder as any).update({
      where: { workOrderId: id },
      data,
      include: {
        ticket: { include: { account: { include: { customer: true } } } },
        request: { include: { customer: true } },
        technician: true,
        spares: { include: { item: true } },
      },
    });
    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
}
