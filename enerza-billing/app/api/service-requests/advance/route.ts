import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/api-response";

const STEP_NAMES = ["", "Application Details", "Document Verification", "Field Work", "Billing Setup", "Activation"];

// POST /api/service-requests/advance
// Advances a ServiceRequest through the 5-stage BFS lifecycle.
// body: { requestId, action, notes?, meterSerial? }
// actions: verify-docs | field-work | billing-setup | activate
export async function POST(req: NextRequest) {
  try {
    const { requestId, action, notes, meterSerial } = await req.json();
    if (!requestId || !action) return badRequest("requestId and action are required");

    const sr = await (prisma.serviceRequest as any).findUnique({
      where: { requestId },
      include: { customer: true },
    });
    if (!sr) return badRequest("Service request not found");

    if (action === "verify-docs") {
      if (sr.currentStep !== 1) return badRequest("Can only verify docs at step 1");
      await (prisma.workflowLog as any).create({
        data: {
          requestId,
          stepName: "Document Verification",
          status: "COMPLETED",
          notes: notes || "Application documents verified automatically",
          performedBy: "SYSTEM",
        },
      });
      await (prisma.serviceRequest as any).update({
        where: { requestId },
        data: { currentStep: 2 },
      });
      return ok({ requestId, currentStep: 2, message: "Verification complete — field work can now be dispatched" });
    }

    if (action === "field-work") {
      if (sr.currentStep !== 2) return badRequest("Can only complete field work at step 2");
      // Gate: an approved work order must exist for this SR
      const approvedWO = await (prisma.workOrder as any).findFirst({
        where: { requestId, approvalStatus: "APPROVED" },
      });
      if (!approvedWO) {
        return badRequest("Field work must be completed and approved by an assigned technician before advancing");
      }
      await (prisma.workflowLog as any).create({
        data: {
          requestId,
          stepName: "Field Work",
          status: "COMPLETED",
          notes: notes || `Field work approved. WO: ${approvedWO.workOrderId}`,
          performedBy: approvedWO.technicianId ?? "TECHNICIAN",
        },
      });
      await (prisma.serviceRequest as any).update({
        where: { requestId },
        data: { currentStep: 3 },
      });
      return ok({ requestId, currentStep: 3, message: "Field work recorded — proceed to billing setup" });
    }

    if (action === "billing-setup") {
      if (sr.currentStep !== 3) return badRequest("Can only complete billing setup at step 3");
      await (prisma.workflowLog as any).create({
        data: {
          requestId,
          stepName: "Billing Setup",
          status: "COMPLETED",
          notes: notes || "Billing configuration completed",
          performedBy: "BILLING_TEAM",
        },
      });
      await (prisma.serviceRequest as any).update({
        where: { requestId },
        data: { currentStep: 4 },
      });
      return ok({ requestId, currentStep: 4, message: "Billing setup complete — ready for activation" });
    }

    if (action === "activate") {
      if (sr.currentStep !== 4) return badRequest("Can only activate at step 4");

      // Parse stored application data
      let applicationData: any = {};
      try {
        const desc = JSON.parse(sr.description ?? "{}");
        applicationData = desc.applicationData ?? {};
      } catch { /* ignore */ }

      const { service, technical, meter, premiseId, customerId } = applicationData;
      if (!premiseId || !customerId) return badRequest("Application data missing — cannot provision connection");

      const result = await (prisma as any).$transaction(async (tx: any) => {
        // Account
        const account = await tx.account.create({
          data: {
            customerId,
            premiseId,
            utilityType: service?.utilityType ?? "ELECTRICITY",
            segmentId: service?.segmentId ?? null,
            accountStatus: "ACTIVE",
            balance: 0,
          },
        });
        // Service Connection
        await tx.serviceConnection.create({
          data: {
            accountId: account.accountId,
            premiseId,
            connectionType: service?.connectionType || "LT",
            sanctionedLoad: technical?.sanctionedLoad ?? 0,
            loadUnit: technical?.loadUnit ?? "kW",
            voltage: technical?.voltage ?? "230V",
            phase: technical?.phase ?? "SINGLE",
            status: "ACTIVE",
          },
        });
        // Meter (if serial provided)
        const serial = meterSerial ?? meter?.serialNo;
        let meterId = null;
        if (serial) {
          const newMeter = await tx.meter.create({
            data: {
              serialNo: serial,
              meterType: meter?.meterType ?? "DIGITAL",
              make: meter?.make ?? null,
              model: meter?.model ?? null,
              utilityType: service?.utilityType ?? "ELECTRICITY",
              uom: service?.utilityType === "WATER" ? "kL" : service?.utilityType === "GAS" ? "SCM" : "kWh",
              status: "ACTIVE",
            },
          });
          meterId = newMeter.meterId;
          await tx.meterInstallation.create({
            data: {
              meterId,
              accountId: account.accountId,
              installedAt: new Date(),
              status: "ACTIVE",
            },
          });
          await tx.meterReading.create({
            data: {
              meterId,
              accountId: account.accountId,
              reading: 0,
              readingType: "ACTUAL",
              readingDate: new Date(),
            },
          });
        }
        // KYC
        await tx.customer.update({
          where: { customerId },
          data: { kycStatus: "VERIFIED" },
        });
        return { accountId: account.accountId, meterId };
      });

      await (prisma.workflowLog as any).create({
        data: {
          requestId,
          stepName: "Activation",
          status: "COMPLETED",
          notes: notes || `Connection activated. Account: ${result.accountId}`,
          performedBy: "SYSTEM",
        },
      });
      await (prisma.serviceRequest as any).update({
        where: { requestId },
        data: { currentStep: 5, status: "ACTIVE", accountId: result.accountId },
      });
      return ok({ requestId, currentStep: 5, ...result, message: "Connection activated successfully" });
    }

    return badRequest(`Unknown action: ${action}`);
  } catch (err: any) {
    console.error("advance failed:", err);
    if (err.code === "P2002") return badRequest(`Duplicate: ${err.meta?.target?.join(", ")}`);
    if (err.code === "P2003") return badRequest(`Invalid reference: ${err.meta?.field_name}`);
    return serverError(err.message || "Advance failed");
  }
}
