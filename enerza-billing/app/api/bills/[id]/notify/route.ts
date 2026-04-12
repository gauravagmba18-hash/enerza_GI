import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { channel, mobile, email } = body as {
      channel: "SMS" | "EMAIL";
      mobile?: string;
      email?: string;
    };

    if (!channel || !["SMS", "EMAIL"].includes(channel)) {
      return badRequest("channel must be SMS or EMAIL");
    }

    // Verify bill exists
    const bill = await (prisma.bill as any).findUnique({
      where: { billId: id },
      include: {
        account: { include: { customer: true } },
      },
    });
    if (!bill) return notFound("bill");

    const customer = bill.account?.customer;
    const recipient = channel === "SMS"
      ? (mobile ?? customer?.mobile ?? "")
      : (email ?? customer?.email ?? "");

    if (!recipient) {
      return badRequest(`No ${channel === "SMS" ? "mobile number" : "email address"} provided`);
    }

    // In a real integration this would call an SMS gateway or email provider.
    // For now we log and return a success response so the UI can confirm dispatch.
    console.log(
      `[BillNotify] Bill ${id} dispatched via ${channel} to ${recipient} ` +
      `(customer: ${customer?.fullName ?? "Unknown"}, amount: ₹${bill.totalAmount})`
    );

    const maskedRecipient = channel === "SMS"
      ? recipient.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2")
      : recipient.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c);

    return ok({
      dispatched: true,
      channel,
      recipient: maskedRecipient,
      billId: id,
      message: channel === "SMS"
        ? `Bill statement sent via SMS to ${maskedRecipient}`
        : `Bill statement emailed to ${maskedRecipient}`,
    });
  } catch (err) {
    return serverError(err);
  }
}
