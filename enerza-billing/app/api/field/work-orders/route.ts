import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

// Default checklist for NEW_CONNECTION field work
const NEW_CONNECTION_CHECKLIST = [
  { seq: 1, label: "Premises physically visited — address matches application", status: "PENDING", notes: "" },
  { seq: 2, label: "Meter installation point identified and accessible", status: "PENDING", notes: "" },
  { seq: 3, label: "Electrical / utility load assessment completed", status: "PENDING", notes: "" },
  { seq: 4, label: "Safety hazards checked — premises safe for installation", status: "PENDING", notes: "" },
  { seq: 5, label: "Consumer identity verified (ID document sighted)", status: "PENDING", notes: "" },
  { seq: 6, label: "Consumer consent and signature obtained", status: "PENDING", notes: "" },
  { seq: 7, label: "Site photographs captured (exterior + metering point)", status: "PENDING", notes: "" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, requestId, technicianId, scheduledDate, notes } = body;

    if (!ticketId && !requestId) return badRequest("Either ticketId or requestId is required");
    if (!technicianId) return badRequest("technicianId is required");

    // Validate the linked entity
    if (ticketId) {
      const ticket = await (prisma.serviceTicket as any).findUnique({ where: { ticketId } });
      if (!ticket) return badRequest("Ticket not found");
    }
    if (requestId) {
      const sr = await (prisma.serviceRequest as any).findUnique({ where: { requestId } });
      if (!sr) return badRequest("Service request not found");
    }

    const checklist = requestId ? JSON.stringify(NEW_CONNECTION_CHECKLIST) : null;

    const wo = await (prisma.workOrder as any).create({
      data: {
        ticketId: ticketId ?? null,
        requestId: requestId ?? null,
        technicianId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: "ASSIGNED",
        type: requestId ? "NEW_CONNECTION" : "SERVICE_RESTORATION",
        inspectionNotes: notes ?? null,
        approvalStatus: requestId ? "PENDING" : null,
        checklist,
        photos: "[]",
      },
    });

    // Update ticket status if linked
    if (ticketId) {
      await (prisma.serviceTicket as any).update({
        where: { ticketId },
        data: { status: "ASSIGNED" },
      });
    }

    return ok(wo, 201);
  } catch (err) {
    return serverError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    const where: any = requestId ? { requestId } : {};
    const data = await (prisma.workOrder as any).findMany({
      where,
      include: {
        ticket: { include: { account: { include: { customer: true, premise: true } } } },
        request: { include: { customer: true } },
        technician: true,
        spares: { include: { item: true } },
      },
      orderBy: { scheduledDate: "desc" },
    });
    return ok(data);
  } catch (err) {
    return serverError(err);
  }
}
