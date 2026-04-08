import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(_: NextRequest) {
  try {
    const data = await prisma.serviceTicket.findMany({
      include: {
        account: {
          include: {
            customer: true,
            premise: true
          }
        },
        workOrders: {
          include: {
            technician: true,
            spares: {
              include: { item: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return ok(data);
  } catch (err) {
    return serverError(err);
  }
}



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.serviceTicket.create({
      data: body
    });
    return ok(record, 201);
  } catch (err) {
    return serverError(err);
  }
}
