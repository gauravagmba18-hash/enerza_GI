import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { accountId, customerId, openingReading, moveInDate } = await req.json();

    if (!customerId) {
      return serverError("customerId is required");
    }

    const customer = await prisma.customer.findUnique({ where: { customerId } });
    if (!customer) return notFound("customer");

    let account = null;
    if (accountId) {
      account = await prisma.account.findUnique({
        where: { accountId },
        include: { serviceConnections: { take: 1, orderBy: { createdAt: "desc" } } }
      });
      if (!account) return notFound("account");

      // Reactivate account and reassign to new customer
      await prisma.account.update({
        where: { accountId },
        data: { customerId, status: "ACTIVE" }
      });
    }

    // Log the move-in as a ServiceRequest
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId,
        accountId: accountId ?? undefined,
        type: "MOVE_IN",
        status: "SUBMITTED",
        currentStep: 1,
        description: `Move-in on ${moveInDate ?? new Date().toISOString().slice(0, 10)}. Opening reading: ${openingReading ?? "N/A"}`,
        priority: "MEDIUM",
      }
    });

    return ok({
      message: "Move-in processed successfully",
      serviceRequestId: serviceRequest.requestId,
      customerId,
      accountId: accountId ?? null,
      status: "SUBMITTED",
    });
  } catch (err) {
    return serverError(err);
  }
}
