import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, badRequest } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // We expect a robust payload representing the 6 steps
    const { customer, premise, service, technical, meter } = body;

    if (!customer || !premise || !service || !meter) {
      return badRequest("Missing required onboarding sections (customer, premise, service, meter)");
    }

    const effectiveDate = new Date();

    // Execute atomic transaction for robust onboarding
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Customer
      const newCustomer = await tx.customer.create({
        data: {
          fullName: customer.fullName,
          customerType: customer.customerType || "INDIVIDUAL",
          kycStatus: "VERIFIED",
          panRef: customer.panRef || null,
          aadhaarRef: customer.aadhaarRef || null,
          mobile: customer.mobile,
          email: customer.email || null,
          segmentId: service.segmentId, 
        }
      });

      // 2. Create Premise
      const newPremise = await tx.premise.create({
        data: {
          addressLine1: premise.addressLine1,
          addressLine2: premise.addressLine2 || null,
          buildingType: premise.buildingType || "RESIDENTIAL",
          areaId: premise.areaId,
        }
      });

      // 3. Create Account directly linking Customer and Premise
      const newAccount = await tx.account.create({
        data: {
          customerId: newCustomer.customerId,
          premiseId: newPremise.premiseId,
          cycleId: service.cycleId,
          billDeliveryMode: service.billDeliveryMode || "PAPERLESS",
          effectiveFrom: effectiveDate,
        }
      });

      // 4. Create Service Connection
      const newConnection = await tx.serviceConnection.create({
        data: {
          utilityType: service.utilityType,
          startDate: effectiveDate,
          accountId: newAccount.accountId,
          segmentId: service.segmentId,
        }
      });

      // 5. Technical Details (Conditional on Utility)
      if (service.utilityType === "ELECTRICITY") {
        await tx.elecConnDetail.create({
          data: {
            connectionId: newConnection.connectionId,
            loadKw: technical?.loadKw || 0,
            supplyVoltage: technical?.supplyVoltage || "230V",
            phaseType: technical?.phaseType || "SINGLE",
            tariffCategory: technical?.tariffCategory || null,
            contractDemandKva: technical?.contractDemandKva || null,
            dtId: technical?.dtId || null,
            isNetMetered: technical?.isNetMetered || false,
            solarCapacityKw: technical?.solarCapacityKw || null,
          }
        });
      } else if (service.utilityType === "GAS_PNG" || service.utilityType === "GAS_CNG") {
        await tx.gasConnDetail.create({
          data: {
            connectionId: newConnection.connectionId,
            serviceType: technical?.serviceType || "DOMESTIC",
            pressureBandId: technical?.pressureBandId || "cl_pb_01",
            regulatorSerial: technical?.regulatorSerial || null,
          }
        });
      } else if (service.utilityType === "WATER") {
        await tx.waterConnDetail.create({
          data: {
            connectionId: newConnection.connectionId,
            pipeSizeMm: technical?.pipeSizeMm || 15,
            supplyZoneId: technical?.supplyZoneId || null,
            meterType: technical?.meterType || "MECHANICAL",
          }
        });
      }

      // 6. Meter Commissioning
      const newMeter = await tx.meter.create({
         data: {
           serialNo: meter.serialNo,
           meterType: meter.meterType || "SMART",
           make: meter.make || null,
           model: meter.model || null,
           uom: service.utilityType === "ELECTRICITY" ? "kWh" : service.utilityType === "WATER" ? "kL" : "SCM",
           utilityType: service.utilityType,
         }
      });

      const newInstall = await tx.meterInstallation.create({
        data: {
          meterId: newMeter.meterId,
          connectionId: newConnection.connectionId,
          installDate: effectiveDate,
          reason: "NEW_CONNECTION",
        }
      });

      // 7. Initial Reading (start at 0)
      await tx.meterReading.create({
        data: {
           meterId: newMeter.meterId,
           connectionId: newConnection.connectionId,
           routeId: "cm7y89shx002c08mt45s845z6", // default safe fallback if no route provided
           readingDate: effectiveDate,
           readingValue: 0,
           consumption: 0,
           readingType: "COMMISSIONING",
           status: "VERIFIED"
        }
      });

      return {
        customerId: newCustomer.customerId,
        fullName: newCustomer.fullName,
        premiseId: newPremise.premiseId,
        accountId: newAccount.accountId,
        connectionId: newConnection.connectionId,
        meterId: newMeter.meterId,
        meterSerial: newMeter.serialNo,
        utilityType: service.utilityType,
      };
    }, {
      timeout: 10000 // allow ample time for atomic ops
    });

    // Create ServiceRequest for the new connection lifecycle (outside transaction for safety)
    let requestId: string | null = null;
    try {
      const sr = await (prisma.serviceRequest as any).create({
        data: {
          customerId: result.customerId,
          accountId: result.accountId,
          type: "NEW_CONNECTION",
          status: "ACTIVE",
          currentStep: 5,
          description: `New ${result.utilityType} connection for ${result.fullName}`,
          priority: "MEDIUM",
        },
      });
      requestId = sr.requestId;

      const stages = [
        { stepName: "Application Details", notes: `KYC submitted for ${result.fullName}. Customer ID: ${result.customerId}` },
        { stepName: "Document Verification", notes: "Documents auto-verified via digital onboarding portal" },
        { stepName: "Field Work", notes: `Meter ${result.meterSerial} commissioned at premises. Connection ID: ${result.connectionId}` },
        { stepName: "Billing Setup", notes: `Rate plan configured. Account ${result.accountId} created with opening read at 0` },
        { stepName: "Activation", notes: `CAN ${result.accountId} activated. ${result.utilityType} service is live` },
      ];

      await Promise.all(
        stages.map((s, i) =>
          (prisma.workflowLog as any).create({
            data: {
              requestId: sr.requestId,
              stepName: s.stepName,
              status: "COMPLETED",
              notes: s.notes,
              performedBy: "SYSTEM",
            },
          })
        )
      );
    } catch (srErr) {
      // Non-fatal: log but don't fail the onboarding response
      console.error("ServiceRequest creation failed (non-fatal):", srErr);
    }

    return ok({ ...result, requestId }, 201);
  } catch (err: any) {
    console.error("Onboarding transaction failed:", err);
    // If it's a unique constraint violation (e.g. meter serial), handle gracefully
    if (err.code === "P2002") {
       return badRequest(`Unique constraint failed on the fields: ${err.meta?.target}`);
    }
    return serverError(err.message || "Atomic transaction failed");
  }
}
