import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest, notFound } from "@/lib/api-response";

const STAGE_META: Record<string, { step: number; stepName: string; defaultNotes: string }> = {
  "verify-docs":    { step: 2, stepName: "Document Verification", defaultNotes: "Documents verified by section engineer" },
  "field-work":     { step: 3, stepName: "Field Work",            defaultNotes: "Site inspection completed, meter slot confirmed" },
  "billing-setup":  { step: 4, stepName: "Billing Setup",         defaultNotes: "Rate plan configured, security deposit collected" },
};

// POST /api/service-requests/advance
// Body: { requestId, action, notes?, meterSerial? }
// action: "verify-docs" | "field-work" | "billing-setup" | "activate"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, action, notes, meterSerial } = body;

    if (!requestId || !action) return badRequest("requestId and action are required");

    const sr = await (prisma.serviceRequest as any).findUnique({ where: { requestId } });
    if (!sr) return notFound("Service request not found");
    if (sr.status === "ACTIVE") return badRequest("Service request is already activated");

    // ── Standard stage advance ────────────────────────────────────────────────
    if (STAGE_META[action]) {
      const meta = STAGE_META[action];
      await Promise.all([
        (prisma.serviceRequest as any).update({
          where: { requestId },
          data: { currentStep: meta.step },
        }),
        (prisma.workflowLog as any).create({
          data: {
            requestId,
            stepName: meta.stepName,
            status: "COMPLETED",
            notes: notes || meta.defaultNotes,
            performedBy: "SYSTEM",
          },
        }),
      ]);
      return ok({ requestId, currentStep: meta.step, stepName: meta.stepName });
    }

    // ── Activation — provision Account / Connection / Meter ───────────────────
    if (action === "activate") {
      // Parse stored application data from the SR description
      let appData: any = {};
      try {
        appData = sr.description ? JSON.parse(sr.description).applicationData ?? {} : {};
      } catch {
        // fallback to empty — won't break provisioning with defaults
      }

      const { service = {}, technical = {}, meter: meterData = {}, premiseId, customerId } = appData;
      const effectiveMeterSerial = meterSerial || meterData.serialNo;

      if (!effectiveMeterSerial) return badRequest("Meter serial number is required for activation");
      if (!customerId)           return badRequest("Application data missing customerId — re-raise the SR");
      if (!premiseId)            return badRequest("Application data missing premiseId — re-raise the SR");

      const effectiveDate = new Date();

      const result = await prisma.$transaction(async (tx: any) => {
        // Update customer KYC to verified
        await tx.customer.update({
          where: { customerId },
          data: { kycStatus: "VERIFIED" },
        });

        // Account
        const account = await tx.account.create({
          data: {
            customerId,
            premiseId,
            cycleId: service.cycleId || "monthly_01",
            billDeliveryMode: service.billDeliveryMode || "PAPERLESS",
            effectiveFrom: effectiveDate,
          },
        });

        // Service Connection
        const connection = await tx.serviceConnection.create({
          data: {
            utilityType: service.utilityType || "ELECTRICITY",
            startDate: effectiveDate,
            accountId: account.accountId,
            segmentId: service.segmentId || "cl_dom_01",
          },
        });

        // Technical details
        const ut = service.utilityType || "ELECTRICITY";
        if (ut === "ELECTRICITY") {
          await tx.elecConnDetail.create({
            data: {
              connectionId: connection.connectionId,
              loadKw: technical.loadKw ?? 0,
              supplyVoltage: technical.supplyVoltage || "230V",
              phaseType: technical.phaseType || "SINGLE",
              tariffCategory: technical.tariffCategory || null,
              contractDemandKva: technical.contractDemandKva || null,
              dtId: technical.dtId || null,
              isNetMetered: technical.isNetMetered || false,
              solarCapacityKw: technical.solarCapacityKw || null,
            },
          });
        } else if (ut === "GAS_PNG" || ut === "GAS_CNG") {
          await tx.gasConnDetail.create({
            data: {
              connectionId: connection.connectionId,
              serviceType: technical.serviceType || "DOMESTIC",
              pressureBandId: technical.pressureBandId || "cl_pb_01",
              regulatorSerial: technical.regulatorSerial || null,
            },
          });
        } else if (ut === "WATER") {
          await tx.waterConnDetail.create({
            data: {
              connectionId: connection.connectionId,
              pipeSizeMm: technical.pipeSizeMm || 15,
              supplyZoneId: technical.supplyZoneId || null,
              meterType: technical.meterType || "MECHANICAL",
            },
          });
        }

        // Meter
        const meterUom = ut === "ELECTRICITY" ? "kWh" : ut === "WATER" ? "kL" : "SCM";
        const newMeter = await tx.meter.create({
          data: {
            serialNo: effectiveMeterSerial,
            meterType: meterData.meterType || "SMART",
            make: meterData.make || null,
            model: meterData.model || null,
            uom: meterUom,
            utilityType: ut,
          },
        });

        // Meter Installation
        await tx.meterInstallation.create({
          data: {
            meterId: newMeter.meterId,
            connectionId: connection.connectionId,
            installDate: effectiveDate,
            reason: "NEW_CONNECTION",
          },
        });

        // Baseline reading
        await tx.meterReading.create({
          data: {
            meterId: newMeter.meterId,
            connectionId: connection.connectionId,
            routeId: "cm7y89shx002c08mt45s845z6",
            readingDate: effectiveDate,
            readingValue: 0,
            consumption: 0,
            readingType: "COMMISSIONING",
            status: "VERIFIED",
          },
        });

        return { accountId: account.accountId, connectionId: connection.connectionId, meterId: newMeter.meterId };
      });

      // Update SR to activated
      await (prisma.serviceRequest as any).update({
        where: { requestId },
        data: {
          accountId: result.accountId,
          status: "ACTIVE",
          currentStep: 5,
        },
      });

      // Final workflow log
      await (prisma.workflowLog as any).create({
        data: {
          requestId,
          stepName: "Activation",
          status: "COMPLETED",
          notes: notes || `Connection activated. Account: ${result.accountId}. Meter: ${effectiveMeterSerial}`,
          performedBy: "SYSTEM",
        },
      });

      return ok({ requestId, status: "ACTIVE", currentStep: 5, ...result });
    }

    return badRequest(`Unknown action: ${action}`);
  } catch (err: any) {
    console.error("SR advance failed:", err);
    if (err.code === "P2002") return badRequest(`Duplicate: ${err.meta?.target}`);
    return serverError(err.message || "Failed to advance service request");
  }
}
