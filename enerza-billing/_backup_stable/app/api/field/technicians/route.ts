import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(_: NextRequest) {
  try {
    const data = await prisma.technician.findMany({
      orderBy: { fullName: "asc" }
    });
    return ok(data);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.technician.create({
      data: body
    });
    return ok(record, 201);
  } catch (err) {
    return serverError(err);
  }
}


