import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";

// BR-008: Reconnection after temporary disconnection
export async function POST(req: NextRequest) {
  try {
    const { accountId, reconnectDate, openingRead, paymentRef } = await req.json();

    if (!accountId) return badRequest("accountId is required");

    const account = await prisma.account.findUnique({
      where: { accountId },
      include: { customer: { select: { fullName: true } } },
    });
    if (!account) return notFound("account");

    if (account.status !== "DISCONNECTED") {
      return badRequest(`Account is not disconnected (current status: ${account.status})`);
    }

    // Create reconnection service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        accountId,
        customerId: account.customerId ?? undefined,
        type: "RECONNECTION",
        status: "SUBMITTED",
        currentStep: 1,
        description: paymentRef ? `Reconnection after payment ref ${paymentRef}` : "Reconnection requested",
        priority: "HIGH",
      },
    });

    // Restore account to active
    await prisma.account.update({
      where: { accountId },
      data: { status: "ACTIVE" },
    });

    // Log opening read if provided
    if (openingRead !== undefined && openingRead !== "") {
      const conn = await prisma.serviceConnection.findFirst({
        where: { accountId },
        include: { meter: true },
      });
      if (conn?.meterId) {
        await prisma.meterReading.create({
          data: {
            meterId: conn.meterId,
            readingDate: new Date(reconnectDate || new Date()),
            readingValue: parseFloat(openingRead) || 0,
            readingType: "RECONNECTION",
            status: "ACCEPTED",
            notes: `Opening read on reconnection — request ${serviceRequest.requestId}`,
          },
        });
      }
    }

    return ok({
      message: "Reconnection processed successfully. Account is now ACTIVE.",
      requestId: serviceRequest.requestId,
      accountId,
      status: "ACTIVE",
      reconnectDate: reconnectDate || new Date().toISOString().slice(0, 10),
    });
  } catch (e) {
    return serverError(String(e));
  }
}
