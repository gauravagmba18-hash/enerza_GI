import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

// POST — raise a service ticket for a suspicious meter reading
// Body: { readingId, accountId, reason, description }

export async function POST(req: NextRequest) {
  try {
    const { readingId, accountId, reason, description } = await req.json();

    if (!readingId || !accountId) {
      return badRequest("readingId and accountId are required");
    }

    // Move reading back to PENDING so it won't be billed until resolved
    await (prisma.meterReading as any).update({
      where: { readingId },
      data: { status: "EXCEPTION" },
    });

    // Create service ticket
    const subject = `Meter Reading Anomaly — ${reason}`;
    const ticket = await prisma.serviceTicket.create({
      data: {
        subject,
        description: description ?? `Reading ID ${readingId} flagged as anomalous: ${reason}`,
        status:   "OPEN",
        priority: reason === "REVERSE" ? "HIGH" : "MEDIUM",
        category: "METER_ANOMALY",
        accountId,
      },
    });

    return ok({ ticketId: ticket.ticketId, readingId, status: "EXCEPTION" }, 201);
  } catch (err) {
    return serverError(err);
  }
}
