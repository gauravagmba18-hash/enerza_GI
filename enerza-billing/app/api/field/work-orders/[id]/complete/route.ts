import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, notFound } from "@/lib/api-response";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Find Work Order
    const wo = await prisma.workOrder.findUnique({
      where: { workOrderId: id },
      include: { ticket: true }
    });

    if (!wo) return notFound("work-order");

    // 2. Perform Atomic Update
    const updatedWo = await prisma.workOrder.update({
      where: { workOrderId: id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        ticket: {
            update: {
                status: "RESOLVED"
            }
        }
      }
    });

    return ok({ 
      message: "Industrial service visit completed successfully.",
      workOrderId: updatedWo.workOrderId,
      status: updatedWo.status
    });

  } catch (err) {
    return serverError(err);
  }
}
