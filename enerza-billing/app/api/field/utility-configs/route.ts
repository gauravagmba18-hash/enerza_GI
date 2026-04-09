import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(_: NextRequest) {
  try {
    const data = await prisma.utilityConfig.findFirst();
    if (!data) {
        const defaultDoc = await prisma.utilityConfig.create({
            data: { utilityName: "Default Utility", prorationMode: "IMMEDIATE", minBillingMode: "FIXED", minBillingValue: 500 }
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
            where: { configId: existing.configId },
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
