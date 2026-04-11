import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";

// BR-008: Temporary/permanent disconnection
export async function POST(req: NextRequest) {
  try {
    const { accountId, disconnectType, reason, effectiveDate } = await req.json();

    if (!accountId) return badRequest("accountId is required");
    if (!disconnectType || !["TEMPORARY", "PERMANENT"].includes(disconnectType)) {
      return badRequest("disconnectType must be TEMPORARY or PERMANENT");
    }

    const account = await prisma.account.findUnique({
      where: { accountId },
      include: { customer: { select: { fullName: true } } },
    });
    if (!account) return notFound("account");

    if (account.status === "DISCONNECTED" || account.status === "CLOSED") {
      return badRequest(`Account is already ${account.status.toLowerCase()}`);
    }

    // Create the service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        accountId,
        customerId: account.customerId ?? undefined,
        type: disconnectType === "PERMANENT" ? "PERMANENT_DISCONNECTION" : "DISCONNECTION",
        status: "SUBMITTED",
        currentStep: 1,
        description: reason || `${disconnectType} disconnection requested`,
        priority: disconnectType === "PERMANENT" ? "HIGH" : "MEDIUM",
      },
    });

    // Update account status
    const newStatus = disconnectType === "PERMANENT" ? "PENDING_CLOSURE" : "DISCONNECTED";
    await prisma.account.update({
      where: { accountId },
      data: { status: newStatus },
    });

    return ok({
      message: `${disconnectType === "PERMANENT" ? "Permanent" : "Temporary"} disconnection initiated`,
      requestId: serviceRequest.requestId,
      accountId,
      newStatus,
      effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
    });
  } catch (e) {
    return serverError(String(e));
  }
}
