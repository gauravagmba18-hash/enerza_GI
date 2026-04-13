import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BillActions } from "./BillActions";

type Ctx = { params: Promise<{ id: string }> };

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function money(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_COLOR: Record<string, string> = {
  PAID:    "#22c55e",
  PENDING: "#f59e0b",
  OVERDUE: "#ef4444",
  CANCELLED: "#6b7280",
};

export default async function BillDetailPage({ params }: Ctx) {
  const { id } = await params;

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
      connection: {
        include: {
          elecConnDetail: true,
          gasConnDetail:  true,
          waterConnDetail: true,
        },
      },
      cycle: true,
    },
  });

  if (!bill) notFound();

  const customer = bill.account?.customer;
  const premise  = bill.account?.premise;
  const cycle    = bill.cycle ?? bill.account?.cycle;
  const statusColor = STATUS_COLOR[bill.status] ?? "#6b7280";

  const utilityType = bill.connection?.utilityType ?? "ELECTRICITY";
  const utilityLabel =
    utilityType === "ELECTRICITY" ? "⚡ Electricity"
    : utilityType === "GAS"       ? "🔥 Gas"
    : utilityType === "WATER"     ? "💧 Water"
    : utilityType;

  const address = [premise?.addressLine1, premise?.addressLine2].filter(Boolean).join(", ");

  return (
    <>
      {/* Print stylesheet injected inline — hides nav/sidebar in print mode */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .bill-card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>

        {/* Back nav */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <Link href="/data/bills" style={{
            color: "var(--muted)", fontSize: 13, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            ← Back to Bills
          </Link>
        </div>

        {/* Action buttons */}
        <div style={{ marginBottom: 24 }}>
          <BillActions
            billId={bill.billId}
            defaultMobile={customer?.mobile ?? ""}
            defaultEmail={customer?.email ?? ""}
            totalAmount={bill.totalAmount}
          />
        </div>

        {/* ── Bill Document ── */}
        <div className="bill-card" style={{
          background: "var(--card-bg)", border: "1px solid var(--card-border)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}>

          {/* Header strip */}
          <div style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            padding: "28px 32px",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
                Enerza Billing
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                {utilityLabel} · {customer?.segment?.segmentName ?? "—"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>BILL NO.</div>
              <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                {bill.billId.slice(-12).toUpperCase()}
              </div>
              <div style={{
                display: "inline-block", marginTop: 8,
                background: statusColor + "22",
                border: `1px solid ${statusColor}55`,
                color: statusColor,
                padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              }}>
                {bill.status}
              </div>
            </div>
          </div>

          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Customer + Bill meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Bill To */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Bill To
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
                  {customer?.fullName ?? "—"}
                </div>
                {customer?.customerId && (
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", marginBottom: 6 }}>
                    Customer ID: {customer.customerId}
                  </div>
                )}
                {address && (
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 4 }}>
                    {address}
                  </div>
                )}
                {customer?.mobile && (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>📱 {customer.mobile}</div>
                )}
                {customer?.email && (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>✉ {customer.email}</div>
                )}
              </div>

              {/* Bill details */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Bill Details
                </div>
                {[
                  ["Account ID",    bill.accountId],
                  ["Connection ID", bill.connectionId],
                  ["Bill Cycle",    cycle?.cycleName ?? bill.cycleId],
                  ["Bill Date",     fmt(bill.billDate)],
                  ["Due Date",      fmt(bill.dueDate)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator */}
            <hr style={{ border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />

            {/* Charge breakdown */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                Charge Breakdown
              </div>
              {bill.billLines.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No charge lines found for this bill.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--card-border)" }}>
                      {["Description", "Type", "Qty / UOM", "Rate", "Amount"].map((h, i) => (
                        <th key={h} style={{
                          padding: "8px 12px", textAlign: i >= 3 ? "right" : "left",
                          fontSize: 11, fontWeight: 700, color: "var(--muted)",
                          textTransform: "uppercase", letterSpacing: 0.5,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bill.billLines.map((line: any) => (
                      <tr key={line.lineId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td style={{ padding: "12px 12px", fontSize: 13 }}>
                          {line.description ?? line.component?.componentName ?? "—"}
                        </td>
                        <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--muted)" }}>
                          {line.lineType}
                        </td>
                        <td style={{ padding: "12px 12px", fontSize: 13, fontFamily: "monospace" }}>
                          {line.quantity.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          {line.component?.uom ? ` ${line.component.uom}` : ""}
                        </td>
                        <td style={{ padding: "12px 12px", fontSize: 13, fontFamily: "monospace", textAlign: "right" }}>
                          {money(line.rate)}
                        </td>
                        <td style={{ padding: "12px 12px", fontSize: 13, fontFamily: "monospace", fontWeight: 600, textAlign: "right" }}>
                          {money(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Separator */}
            <hr style={{ border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 280 }}>
                {[
                  { label: "Net Amount",  value: bill.netAmount,   bold: false },
                  { label: "Tax / Duty",  value: bill.taxAmount,   bold: false },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
                    <span style={{ fontSize: 13, fontFamily: "monospace" }}>{money(value)}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "12px 0", borderTop: "2px solid var(--card-border)", marginTop: 4,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)" }}>Total Due</span>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: statusColor }}>
                    {money(bill.totalAmount)}
                  </span>
                </div>
                {bill.dueDate && (
                  <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right", marginTop: 4 }}>
                    Due by {fmt(bill.dueDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Footer note */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)",
              borderRadius: 8, padding: "12px 16px",
              fontSize: 11, color: "var(--muted)", lineHeight: 1.6,
            }}>
              This is a computer-generated bill and does not require a physical signature.
              For queries, contact your utility service center with Bill No. {bill.billId.slice(-12).toUpperCase()}.
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
