export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import {
  Users, MapPin, Phone, Mail, CreditCard, AlertCircle,
  ChevronLeft, Zap, Activity, Gauge, ReceiptText, Landmark,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// ── helpers ────────────────────────────────────────────────────────────────────
const inr = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const UTILITY_COLOR: Record<string, string> = {
  ELECTRICITY: "#f59e0b",
  GAS_PNG:     "#10b981",
  WATER:       "#3b82f6",
  CNG:         "#8b5cf6",
};

// ── page ───────────────────────────────────────────────────────────────────────
export default async function Customer360Profile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { customerId: id },
    include: {
      segment: true,
      accounts: {
        orderBy: { effectiveFrom: "asc" },
        include: {
          premise: true,
          // all payment orders for this account
          paymentOrders: { take: 10, orderBy: { initiatedAt: "desc" } },
          // service connections with meter info and readings
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
          // recent bills across this account
          bills: { take: 12, orderBy: { billDate: "desc" } },
          // complaints / service tickets
          serviceTickets: {
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { workOrders: true },
          },
        },
      },
    },
  });

  if (!customer) return notFound();

  // ── derived aggregates ────────────────────────────────────────────────────
  const allBills    = customer.accounts.flatMap((a) => a.bills);
  const allOrders   = customer.accounts.flatMap((a) => a.paymentOrders);
  const allTickets  = customer.accounts.flatMap((a) => a.serviceTickets);
  const outstanding = allBills
    .filter((b) => b.status !== "PAID")
    .reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const lastPaid = allOrders.find((o) => o.status === "SUCCESS")?.amount ?? 0;

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Breadcrumb bar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/crm/customers" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: "50%",
          border: "1px solid var(--card-border)", color: "var(--muted)", textDecoration: "none",
        }}>
          <ChevronLeft size={18} />
        </Link>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          <Link href="/crm/customers" style={{ color: "var(--muted)", textDecoration: "none" }}>
            Customer Master
          </Link>
          {" / "}
          <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{customer.fullName}</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link href={`/data/bills?accountId=${customer.accounts[0]?.accountId ?? ""}`}
            style={{
              background: "transparent", border: "1px solid var(--card-border)",
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
            <ReceiptText size={13} /> All Bills
          </Link>
          <Link href={`/data/meter-readings`} style={{
            background: "transparent", border: "1px solid var(--card-border)",
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <Gauge size={13} /> Readings
          </Link>
        </div>
      </div>

      {/* ── Profile header ──────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-lighter)", border: "1px solid var(--card-border)",
        borderRadius: 16, padding: 24, display: "flex", gap: 24, alignItems: "flex-start",
      }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, color: "#fff", flexShrink: 0,
        }}>
          {customer.fullName.charAt(0)}
        </div>

        {/* Core info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{customer.fullName}</h2>
            <CRMStatusPill status={customer.status} />
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700,
              background: "rgba(37,99,235,0.1)", color: "#2563eb",
            }}>
              {customer.customerType}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px 20px" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={12} />
              <strong style={{ color: "var(--foreground)", fontFamily: "monospace" }}>{customer.customerId}</strong>
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Phone size={12} /> {customer.mobile || "—"}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Mail size={12} /> {customer.email || "—"}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={12} /> {customer.segment?.segmentName ?? "—"} · KYC: {customer.kycStatus}
            </span>
          </div>
        </div>

        {/* Financial summary */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Outstanding
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: outstanding > 0 ? "#ef4444" : "#22c55e" }}>
            ₹{inr(outstanding)}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            Last payment: ₹{inr(lastPaid)}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {customer.accounts.length} account{customer.accounts.length !== 1 ? "s" : ""} ·{" "}
            {customer.accounts.reduce((s, a) => s + a.serviceConnections.length, 0)} connection{customer.accounts.reduce((s, a) => s + a.serviceConnections.length, 0) !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* ── Accounts + Connections + Meter Readings ─────────────────────────── */}
      <Section icon={<Zap size={16} color="var(--accent)" />} title="Accounts · Connections · Meter Readings">
        {customer.accounts.map((account) => (
          <div key={account.accountId} style={{
            border: "1px solid var(--card-border)", borderRadius: 10, overflow: "hidden", marginBottom: 16,
          }}>
            {/* Account header row */}
            <div style={{
              background: "var(--bg-lighter)", padding: "10px 16px",
              display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
            }}>
              <KV label="CAN" value={account.accountId} mono />
              <KV label="Cycle" value={account.cycleId} />
              <KV label="Delivery" value={account.billDeliveryMode} />
              <KV label="Since" value={fmtDate(account.effectiveFrom)} />
              <CRMStatusPill status={account.status} />
              <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={12} />
                {account.premise.addressLine1}{account.premise.addressLine2 ? `, ${account.premise.addressLine2}` : ""} · {account.premise.areaId}
              </div>
            </div>

            {/* Connections */}
            {account.serviceConnections.length === 0 && (
              <div style={{ padding: "16px", fontSize: 13, color: "var(--muted)" }}>No service connections.</div>
            )}
            {account.serviceConnections.map((conn) => {
              const meter   = conn.meterInstalls[0]?.meter;
              const uom     = meter?.uom ?? "";
              const color   = UTILITY_COLOR[conn.utilityType] ?? "var(--accent)";
              return (
                <div key={conn.connectionId} style={{ borderTop: "1px solid var(--card-border)" }}>
                  {/* Connection row */}
                  <div style={{ padding: "10px 16px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: `${color}22`, color,
                    }}>
                      {conn.utilityType.replace("_", " ")}
                    </span>
                    <KV label="Connection ID" value={conn.connectionId} mono />
                    {meter && <KV label="Meter" value={`${meter.serialNo} (${meter.meterType})`} />}
                    {meter && <KV label="UOM" value={uom} />}
                    {conn.elecConnDetail && (
                      <KV label="Load" value={`${conn.elecConnDetail.loadKw} kW · ${conn.elecConnDetail.phaseType}`} />
                    )}
                    {conn.gasConnDetail && (
                      <KV label="Service" value={`${conn.gasConnDetail.serviceType} · ${conn.gasConnDetail.pressureBandId}`} />
                    )}
                    <CRMStatusPill status={conn.status} />
                  </div>

                  {/* Meter readings sub-table */}
                  {conn.meterReadings.length > 0 && (
                    <div style={{ padding: "0 16px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>
                        Recent Readings
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                            {["Date", "Reading", "Consumption", "Type", "Status"].map((h) => (
                              <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {conn.meterReadings.map((r) => (
                            <tr key={r.readingId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                              <td style={{ padding: "6px 8px" }}>{fmtDate(r.readingDate)}</td>
                              <td style={{ padding: "6px 8px", fontWeight: 600 }}>{r.readingValue} {uom}</td>
                              <td style={{ padding: "6px 8px", color }}>{r.consumption} {uom}</td>
                              <td style={{ padding: "6px 8px", fontSize: 11 }}>{r.readingType}</td>
                              <td style={{ padding: "6px 8px" }}><CRMStatusPill status={r.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {conn.meterReadings.length === 0 && (
                    <div style={{ padding: "6px 16px 12px", fontSize: 12, color: "var(--muted)" }}>
                      No meter readings on record.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </Section>

      {/* ── Bills ───────────────────────────────────────────────────────────── */}
      <Section icon={<CreditCard size={16} color="var(--accent)" />} title={`Bills (${allBills.length} shown)`}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              {["Bill ID", "Account", "Bill Date", "Due Date", "Net", "Tax", "Total", "Status"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allBills.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "20px 12px", textAlign: "center", color: "var(--muted)" }}>No bills found.</td></tr>
            )}
            {allBills
              .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())
              .map((b) => {
                const acct = customer.accounts.find((a) => a.bills.some((x) => x.billId === b.billId));
                return (
                  <tr key={b.billId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{b.billId.slice(-10).toUpperCase()}</td>
                    <td style={{ padding: "8px 12px", fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>{acct?.accountId ?? "—"}</td>
                    <td style={{ padding: "8px 12px" }}>{fmtDate(b.billDate)}</td>
                    <td style={{ padding: "8px 12px" }}>{fmtDate(b.dueDate)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>₹{inr(b.netAmount)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--muted)" }}>₹{inr(b.taxAmount)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>₹{inr(b.totalAmount)}</td>
                    <td style={{ padding: "8px 12px" }}><CRMStatusPill status={b.status} /></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Section>

      {/* ── Payment History ─────────────────────────────────────────────────── */}
      <Section icon={<Landmark size={16} color="var(--accent)" />} title={`Payment History (${allOrders.length} shown)`}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              {["Order ID", "Bill", "Amount", "Channel", "Date", "Status"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allOrders.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "20px 12px", textAlign: "center", color: "var(--muted)" }}>No payment orders.</td></tr>
            )}
            {allOrders.map((o) => (
              <tr key={o.orderId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{o.orderId.slice(-10).toUpperCase()}</td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{o.billId.slice(-10).toUpperCase()}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700 }}>₹{inr(o.amount)}</td>
                <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{o.channelId}</td>
                <td style={{ padding: "8px 12px" }}>{fmtDate(o.initiatedAt)}</td>
                <td style={{ padding: "8px 12px" }}><CRMStatusPill status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Complaints / Service Tickets ────────────────────────────────────── */}
      <Section icon={<AlertCircle size={16} color="#ef4444" />} title={`Complaints & Tickets (${allTickets.length} shown)`}>
        {allTickets.length === 0 && (
          <div style={{ padding: "20px 12px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No service tickets on record.
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {allTickets.map((t) => (
            <div key={t.ticketId} style={{
              padding: 12, background: "var(--bg-lighter)", borderRadius: 8,
              border: "1px solid var(--card-border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>{t.category || "Complaint"}</span>
                <CRMStatusPill status={t.status} />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t.description || "—"}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", display: "flex", gap: 12 }}>
                <span>{fmtDate(t.createdAt)}</span>
                {t.priority && <span>Priority: {t.priority}</span>}
                {t.workOrders.length > 0 && <span>{t.workOrders.length} work order{t.workOrders.length !== 1 ? "s" : ""}</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── small layout helpers ───────────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{
        padding: "14px 16px", borderBottom: "1px solid var(--card-border)",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 14, fontWeight: 700,
      }}>
        {icon} {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div style={{ fontSize: 11 }}>
      <span style={{ color: "var(--muted)" }}>{label}: </span>
      <span style={{ fontWeight: 600, fontFamily: mono ? "monospace" : undefined }}>{value ?? "—"}</span>
    </div>
  );
}
