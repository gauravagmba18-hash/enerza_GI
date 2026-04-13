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
      const conn = await (prisma.serviceConnection as any).findFirst({
        where: { accountId },
        include: { meterInstalls: { orderBy: { installDate: "desc" }, take: 1 } },
      });
      const latestInstall = conn?.meterInstalls?.[0];
      if (latestInstall?.meterId && conn?.connectionId) {
        await (prisma.meterReading as any).create({
          data: {
            meterId: latestInstall.meterId,
            connectionId: conn.connectionId,
            routeId: "MANUAL",
            readingDate: new Date(reconnectDate || new Date()),
            readingValue: parseFloat(openingRead) || 0,
            consumption: 0,
            readingType: "RECONNECTION",
            status: "ACCEPTED",
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
