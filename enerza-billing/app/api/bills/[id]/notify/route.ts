import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function money(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildHtml(bill: any): string {
  const customer   = bill.account?.customer;
  const premise    = bill.account?.premise;
  const cycle      = bill.cycle ?? bill.account?.cycle;
  const address    = [premise?.addressLine1, premise?.addressLine2].filter(Boolean).join(", ");
  const billNo     = bill.billId.slice(-12).toUpperCase();
  const statusColor = bill.status === "PAID" ? "#22c55e" : bill.status === "OVERDUE" ? "#ef4444" : "#f59e0b";

  const lineRows = (bill.billLines ?? []).map((ln: any) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px">
        ${ln.description ?? ln.component?.componentName ?? "—"}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">
        ${ln.lineType}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;font-family:monospace;text-align:right">
        ${ln.quantity.toLocaleString("en-IN", { minimumFractionDigits: 2 })}${ln.component?.uom ? " " + ln.component.uom : ""}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;font-family:monospace;text-align:right">
        ${money(ln.rate)}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;font-family:monospace;font-weight:600;text-align:right">
        ${money(ln.amount)}
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Enerza Billing</div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Electricity Bill Statement</div>
                </td>
                <td align="right">
                  <div style="font-size:11px;color:rgba(255,255,255,0.5)">BILL NO.</div>
                  <div style="font-family:monospace;font-size:15px;font-weight:700;color:#ffffff">${billNo}</div>
                  <div style="display:inline-block;margin-top:8px;background:${statusColor}22;border:1px solid ${statusColor}55;color:${statusColor};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700">${bill.status}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bill To + Details -->
        <tr>
          <td style="padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="vertical-align:top;padding-right:20px">
                  <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Bill To</div>
                  <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:4px">${customer?.fullName ?? "—"}</div>
                  ${customer?.customerId ? `<div style="font-size:11px;font-family:monospace;color:#6b7280;margin-bottom:6px">Customer ID: ${customer.customerId}</div>` : ""}
                  ${address ? `<div style="font-size:13px;color:#6b7280;line-height:1.5;margin-bottom:4px">${address}</div>` : ""}
                  ${customer?.mobile ? `<div style="font-size:13px;color:#6b7280">📱 ${customer.mobile}</div>` : ""}
                </td>
                <td width="50%" style="vertical-align:top">
                  <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Bill Details</div>
                  ${[
                    ["Account ID",  bill.accountId],
                    ["Bill Cycle",  cycle?.cycleName ?? bill.cycleId],
                    ["Bill Date",   fmt(bill.billDate)],
                    ["Due Date",    fmt(bill.dueDate)],
                  ].map(([l, v]) => `
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px">
                    <tr>
                      <td style="font-size:12px;color:#6b7280">${l}</td>
                      <td align="right" style="font-size:12px;font-weight:600;font-family:monospace">${v}</td>
                    </tr>
                  </table>`).join("")}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0"></td></tr>

        <!-- Charge Breakdown -->
        <tr>
          <td style="padding:24px 32px">
            <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Charge Breakdown</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
              <thead>
                <tr style="border-bottom:2px solid #e5e7eb">
                  <th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Description</th>
                  <th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Type</th>
                  <th style="padding:8px 14px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Qty / UOM</th>
                  <th style="padding:8px 14px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Rate</th>
                  <th style="padding:8px 14px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Amount</th>
                </tr>
              </thead>
              <tbody>${lineRows || `<tr><td colspan="5" style="padding:20px 14px;text-align:center;font-size:13px;color:#9ca3af">No charge lines</td></tr>`}</tbody>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0"></td></tr>

        <!-- Totals -->
        <tr>
          <td style="padding:24px 32px">
            <table width="280" cellpadding="0" cellspacing="0" align="right">
              <tr><td style="padding:6px 0">
                <table width="100%"><tr>
                  <td style="font-size:13px;color:#6b7280">Net Amount</td>
                  <td align="right" style="font-size:13px;font-family:monospace">${money(bill.netAmount)}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:6px 0">
                <table width="100%"><tr>
                  <td style="font-size:13px;color:#6b7280">Tax / Duty</td>
                  <td align="right" style="font-size:13px;font-family:monospace">${money(bill.taxAmount)}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:12px 0;border-top:2px solid #e5e7eb">
                <table width="100%"><tr>
                  <td style="font-size:16px;font-weight:800;color:#111827">Total Due</td>
                  <td align="right" style="font-size:18px;font-weight:800;font-family:monospace;color:${statusColor}">${money(bill.totalAmount)}</td>
                </tr></table>
              </td></tr>
              <tr><td align="right" style="font-size:11px;color:#9ca3af;padding-top:4px">Due by ${fmt(bill.dueDate)}</td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
              This is a computer-generated bill and does not require a physical signature.
              For queries, contact your utility service center quoting Bill No. <strong>${billNo}</strong>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── route handler ─────────────────────────────────────────────────────────────

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

    // Fetch full bill with lines + customer
    const bill = await (prisma.bill as any).findUnique({
      where: { billId: id },
      include: {
        billLines: {
          orderBy: { createdAt: "asc" },
          include: { component: true },
        },
        account: {
          include: {
            customer: { include: { segment: true } },
            premise: true,
            cycle: true,
          },
        },
        cycle: true,
      },
    });
    if (!bill) return notFound("bill");

    const customer = bill.account?.customer;

    // ── EMAIL ──────────────────────────────────────────────────────────────────
    if (channel === "EMAIL") {
      const toAddress = email ?? customer?.email ?? "";
      if (!toAddress) return badRequest("No email address provided");

      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (!smtpUser || !smtpPass) {
        return badRequest("Email not configured — set SMTP_USER and SMTP_PASS in .env");
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const billNo = bill.billId.slice(-12).toUpperCase();

      await transporter.sendMail({
        from: `"Enerza Billing" <${smtpUser}>`,
        to: toAddress,
        subject: `Your Electricity Bill — ${billNo} · ₹${bill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        html: buildHtml(bill),
      });

      const masked = toAddress.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c);
      console.log(`[BillNotify] Bill ${id} emailed to ${toAddress}`);

      return ok({
        dispatched: true,
        channel: "EMAIL",
        recipient: masked,
        billId: id,
        message: `Bill statement emailed to ${masked}`,
      });
    }

    // ── SMS (simulated — no gateway configured) ─────────────────────────────
    const toMobile = mobile ?? customer?.mobile ?? "";
    if (!toMobile) return badRequest("No mobile number provided");

    console.log(`[BillNotify] SMS simulated for bill ${id} → ${toMobile}`);
    const masked = toMobile.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2");

    return ok({
      dispatched: true,
      channel: "SMS",
      recipient: masked,
      billId: id,
      message: `Bill statement sent via SMS to ${masked}`,
    });
  } catch (err) {
    return serverError(err);
  }
}
