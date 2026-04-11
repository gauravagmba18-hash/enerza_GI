import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { fromCustomerId, toCustomerId, accountId, effectiveDate } = await req.json();

    if (!accountId || !toCustomerId) {
      return serverError("accountId and toCustomerId are required");
    }

    const account = await prisma.account.findUnique({ where: { accountId } });
    if (!account) return notFound("account");

    const toCustomer = await prisma.customer.findUnique({ where: { customerId: toCustomerId } });
    if (!toCustomer) return notFound("new customer");

    // Log transfer request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId: fromCustomerId ?? account.customerId,
        accountId,
        type: "TRANSFER",
        status: "SUBMITTED",
        currentStep: 1,
        description: `Account transfer to customer ${toCustomerId}. Effective: ${effectiveDate ?? new Date().toISOString().slice(0, 10)}`,
        priority: "MEDIUM",
      }
    });

    // Reassign account to new customer
    await prisma.account.update({
      where: { accountId },
      data: { customerId: toCustomerId }
    });

    return ok({
      message: "Account transfer processed successfully",
      serviceRequestId: serviceRequest.requestId,
      accountId,
      fromCustomerId: fromCustomerId ?? account.customerId,
      toCustomerId,
      effectiveDate: effectiveDate ?? new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    return serverError(err);
  }
}
