import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await prisma.technician.findUnique({
      where: { technicianId: id },
      include: {
        workOrders: {
          include: {
            ticket: true
          }
        }
      }
    });
    if (!record) return notFound("technician");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { technicianId, createdAt, updatedAt, ...updateData } = body;
    const record = await prisma.technician.update({
      where: { technicianId: id },
      data: updateData
    });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.technician.delete({ where: { technicianId: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
