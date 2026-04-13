import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

// POST /api/new-connection-request
// Stage 1 of the BFS CRM FSM new-connection lifecycle.
// Creates Customer (kycStatus PENDING) + Premise, then raises a ServiceRequest
// with currentStep=1, status=SUBMITTED. No Account/Connection/Meter yet — those
// are provisioned at Stage 5 (Activation) via /api/service-requests/advance.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, premise, service, technical, meter } = body;

    if (!customer?.fullName || !customer?.mobile) {
      return badRequest("Customer full name and mobile are required");
    }
    if (!premise?.addressLine1) {
      return badRequest("Premise address is required");
    }
    if (!service?.utilityType) {
      return badRequest("Utility type is required");
    }

    // Create Customer and Premise (no Account/Connection yet)
    const { customerId, fullName, premiseId } = await prisma.$transaction(async (tx: any) => {
      const c = await tx.customer.create({
        data: {
          fullName: customer.fullName,
          customerType: customer.customerType || "INDIVIDUAL",
          kycStatus: "PENDING",
          mobile: customer.mobile,
          email: customer.email || null,
          segmentId: service.segmentId || "cl_dom_01",
          panRef: customer.panRef || null,
          aadhaarRef: customer.aadhaarRef || null,
        },
      });
      const p = await tx.premise.create({
        data: {
          addressLine1: premise.addressLine1,
          addressLine2: premise.addressLine2 || null,
          buildingType: premise.buildingType || "RESIDENTIAL",
          areaId: premise.areaId || "area_hq_01",
        },
      });
      return { customerId: c.customerId, fullName: c.fullName, premiseId: p.premiseId };
    });

    // Store all form data in SR so later stages can provision from it
    const applicationData = { service, technical, meter: meter ?? {}, premiseId, customerId };

    const sr = await (prisma.serviceRequest as any).create({
      data: {
        customerId,
        type: "NEW_CONNECTION",
        status: "SUBMITTED",
        currentStep: 1,
        description: JSON.stringify({
          summary: `New ${service.utilityType} connection for ${fullName}`,
          applicationData,
        }),
        priority: "MEDIUM",
      },
    });

    await (prisma.workflowLog as any).create({
      data: {
        requestId: sr.requestId,
        stepName: "Application Details",
        status: "COMPLETED",
        notes: `Application submitted by ${fullName}. Utility: ${service.utilityType}. Address: ${premise.addressLine1}`,
        performedBy: "APPLICANT",
      },
    });

    return ok({ requestId: sr.requestId, customerId, premiseId }, 201);
  } catch (err: any) {
    console.error("new-connection-request failed:", err);
    if (err.code === "P2002") {
      return badRequest(`Duplicate field: ${err.meta?.target}`);
    }
    return serverError(err.message || "Failed to raise service request");
  }
}
