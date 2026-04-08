import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { ticketId, technicianId, scheduledDate, notes } = await req.json();

    // 1. Double-check ticket
    const ticket = await prisma.serviceTicket.findUnique({ where: { ticketId } });
    if (!ticket) return serverError("Ticket not found.");

    // 2. Create Work Order
    const wo = await prisma.workOrder.create({
      data: {
        ticketId,
        technicianId,
        scheduledDate: new Date(scheduledDate),
        status: "ASSIGNED",
        inspectionNotes: notes
      }
    });

    // 3. Update Ticket
    await prisma.serviceTicket.update({
      where: { ticketId },
      data: { status: "ASSIGNED" }
    });

    return ok(wo, 201);
  } catch (err) {
    return serverError(err);
  }
}

export async function GET(_: NextRequest) {
    try {
        const data = await prisma.workOrder.findMany({
            include: {
                ticket: {
                  include: {
                    account: {
                      include: {
                        customer: true,
                        premise: true
                      }
                    }
                  }
                },
                technician: true,
                spares: { include: { item: true } }
            }
        });
        return ok(data);
    } catch (err) { return serverError(err); }
}


