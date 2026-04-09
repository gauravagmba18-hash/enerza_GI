export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import ComplaintsFilterBar from "./FilterBar";

interface Props {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}

export default async function ComplaintsRegister({ searchParams }: Props) {
  const { q, status, type } = await searchParams;

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (type && type !== "ALL") where.category = type;
  if (q) {
    where.OR = [
      { ticketId: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  const complaints = await prisma.serviceTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { account: { include: { customer: true } } },
  });

  const now = new Date();
  const openCount = complaints.filter(c => c.status === "OPEN").length;
  const inProgressCount = complaints.filter(c => c.status === "IN_PROGRESS").length;
  // Breach: open tickets older than 24h (default SLA)
  const breachedCount = complaints.filter(c =>
    c.status === "OPEN" && (now.getTime() - new Date(c.createdAt).getTime()) > 24 * 60 * 60 * 1000
  ).length;
  const closedCount = complaints.filter(c => c.status === "CLOSED").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Complaints Register</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>SLA-governed consumer grievance management</p>
        </div>
        <Link href="/field">
          <button style={{ background: "var(--accent)", color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            + Log Complaint
          </button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Total Open</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{openCount}</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "#ef4444", marginBottom: 8 }}>Breached SLA (&gt;24h)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>{breachedCount}</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>In Progress</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{inProgressCount}</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>MTD Closed</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{closedCount}</div>
        </div>
      </div>

      {/* Client-side filter bar — updates URL params, page re-renders server-side */}
      <ComplaintsFilterBar currentQ={q} currentStatus={status} currentType={type} />

      {/* Complaints Table */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Complaint ID</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Customer</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Age</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No complaints found matching the current filter.</td></tr>
            ) : complaints.map((c) => {
              const ageMs = now.getTime() - new Date(c.createdAt).getTime();
              const ageH = Math.floor(ageMs / (1000 * 60 * 60));
              const breached = c.status === "OPEN" && ageH >= 24;
              return (
                <tr key={c.ticketId} style={{ borderBottom: "1px solid var(--card-border)", background: breached ? "rgba(239,68,68,0.03)" : undefined }}>
                  <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{c.ticketId.slice(-8).toUpperCase()}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{c.category || "General"}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{c.account?.customer?.fullName || "Walk-in"}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>CAN: {c.accountId?.slice(-8) || "N/A"}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: breached ? "#ef4444" : "var(--muted)", fontWeight: breached ? 700 : 400 }}>
                    {ageH < 1 ? "< 1h" : `${ageH}h`}{breached ? " ⚠ SLA" : ""}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}><CRMStatusPill status={c.status} /></td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <button style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--card-border)", background: "transparent", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
