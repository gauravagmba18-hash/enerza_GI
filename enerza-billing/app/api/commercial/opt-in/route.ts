import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";

const VALID_PROGRAMS = ["PREPAID", "BUDGET_BILLING", "TOU_TARIFF", "NET_METERING", "SMART_METER"];

// BR-009: Opt-in / opt-out for programs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const where = accountId ? { accountId } : {};
    const optIns = await prisma.serviceOptIn.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok({ data: optIns, total: optIns.length });
  } catch (e) {
    return serverError(String(e));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accountId, programType, action, notes } = await req.json();

    if (!accountId) return badRequest("accountId is required");
    if (!programType || !VALID_PROGRAMS.includes(programType)) {
      return badRequest(`programType must be one of: ${VALID_PROGRAMS.join(", ")}`);
    }
    if (!action || !["OPT_IN", "OPT_OUT"].includes(action)) {
      return badRequest("action must be OPT_IN or OPT_OUT");
    }

    const account = await prisma.account.findUnique({ where: { accountId } });
    if (!account) return notFound("account");

    // Check existing enrollment
    const existing = await (prisma as any).serviceOptIn.findFirst({
      where: { accountId, programType },
      orderBy: { createdAt: "desc" },
    });

    if (action === "OPT_IN") {
      if (existing?.status === "ACTIVE") {
        return badRequest(`Account is already enrolled in ${programType}`);
      }
      const record = await (prisma as any).serviceOptIn.create({
        data: { accountId, programType, status: "ACTIVE", notes },
      });
      return ok({ message: `Successfully opted in to ${programType}`, record });
    } else {
      // OPT_OUT
      if (!existing || existing.status !== "ACTIVE") {
        return badRequest(`Account is not enrolled in ${programType}`);
      }
      const record = await (prisma as any).serviceOptIn.update({
        where: { optInId: existing.optInId },
        data: { status: "OPTED_OUT", optOutDate: new Date(), notes: notes || existing.notes },
      });
      return ok({ message: `Successfully opted out of ${programType}`, record });
    }
  } catch (e) {
    return serverError(String(e));
  }
}
