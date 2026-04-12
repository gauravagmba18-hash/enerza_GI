import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await prisma.customer.findUnique({
      where: { customerId: id },
      include: {
        segment: true,
        accounts: {
          orderBy: { effectiveFrom: "asc" },
          include: {
            premise: true,
            // payment history
            paymentOrders: { take: 10, orderBy: { initiatedAt: "desc" } },
            // service connections with meter and readings
            serviceConnections: {
              include: {
                elecConnDetail:  true,
                gasConnDetail:   true,
                waterConnDetail: true,
                meterInstalls: {
                  take: 1,
                  orderBy: { installDate: "desc" },
                  include: { meter: true },
                },
                meterReadings: { take: 6, orderBy: { readingDate: "desc" } },
              },
            },
            // bills for this account
            bills: { take: 12, orderBy: { billDate: "desc" } },
            // service tickets / complaints
            serviceTickets: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                workOrders: { include: { technician: true } },
              },
            },
          },
        },
      },
    });
    if (!record) return notFound("customer");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await (prisma.customer as any).update({ where: { customerId: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.customer as any).delete({ where: { customerId: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
