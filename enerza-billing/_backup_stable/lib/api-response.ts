import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created(data: unknown) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function notFound(entity = "Record") {
  return NextResponse.json(
    { success: false, error: `${entity} not found` },
    { status: 404 }
  );
}

export function serverError(err: unknown) {
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}
