import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(_: NextRequest) {
  try {
    const data = await prisma.utilityConfig.findFirst();
    if (!data) {
        // Create default if missing
        const defaultDoc = await prisma.utilityConfig.create({
            data: { minBillAmount: 500, prorateFixed: true, moveOutBilling: "IMMEDIATE" }
        });
        return ok(defaultDoc);
    }
    return ok(data);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await prisma.utilityConfig.findFirst();
    
    let record;
    if (existing) {
        record = await prisma.utilityConfig.update({
            where: { id: existing.id },
            data: body
        });
    } else {
        record = await prisma.utilityConfig.create({
            data: body
        });
    }
    return ok(record);
  } catch (err) {
    return serverError(err);
  }
}
