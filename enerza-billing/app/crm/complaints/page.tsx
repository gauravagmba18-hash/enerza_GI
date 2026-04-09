export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import { 
  AlertCircle, 
  MessageSquare, 
  Clock, 
  Search, 
  Filter,
  BarChart2,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default async function ComplaintsRegister() {
  const complaints = await prisma.serviceTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      account: {
        include: { customer: true }
      }
    }
  });

  const openCount = complaints.filter(c => c.status === "OPEN").length;
  const inProgressCount = complaints.filter(c => c.status === "IN_PROGRESS").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Complaints Register</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>SLA-governed consumer grievance management</p>
        </div>
        <button style={{ 
          background: "var(--accent)", 
          color: "#fff", 
          padding: "8px 16px", 
          borderRadius: 8, 
          border: "none", 
          fontWeight: 600, 
          fontSize: 13, 
          cursor: "pointer" 
        }}>
          + Log Complaint
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Total Open</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{openCount}</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "#ef4444", marginBottom: 8 }}>Breached SLA</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>3</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Avg Resolution Time</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>18.4h</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>MTD Closed</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>142</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ 
        background: "var(--card-bg)", 
        border: "1px solid var(--card-border)", 
        borderRadius: 12, 
        padding: 12,
        display: "flex",
        gap: 12,
        alignItems: "center"
      }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input 
            placeholder="Search by complaint ID, customer, CAN..." 
            style={{ 
              width: "100%", 
              background: "var(--bg-lighter)", 
              border: "1px solid var(--card-border)", 
              borderRadius: 8, 
              padding: "8px 12px 8px 36px", 
              fontSize: 13, 
              color: "var(--foreground)" 
            }} 
          />
        </div>
        <select style={{ background: "var(--bg-lighter)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
          <option>All Types</option>
          <option>Billing</option>
          <option>Technical</option>
        </select>
      </div>

      {/* Complaints Table */}
      <div style={{ 
        background: "var(--card-bg)", 
        border: "1px solid var(--card-border)", 
        borderRadius: 12, 
        overflow: "hidden" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Complaint ID</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Customer</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>SLA Progress</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(complaints || []).map((c) => (
              <tr key={c.ticketId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{c.ticketId.slice(-8).toUpperCase()}</td>
                <td style={{ padding: "14px 16px", fontSize: 13 }}>{c.category || "General"}</td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{c.account?.customer?.fullName || "Walk-in"}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>CAN: {c.accountId || "N/A"}</div>
                </td>
                <td style={{ padding: "14px 16px", minWidth: 150 }}>
                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
                      <span style={{ color: "var(--muted)" }}>2h since logged</span>
                      <span style={{ fontWeight: 600, color: "#10b981" }}>4h Left</span>
                   </div>
                   <div style={{ height: 6, background: "rgba(16,185,129,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "33%", background: "#10b981" }} />
                   </div>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}><CRMStatusPill status={c.status} /></td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <button style={{ 
                    padding: "6px 12px", 
                    borderRadius: 6, 
                    border: "1px solid var(--card-border)", 
                    background: "transparent", 
                    fontSize: 11, 
                    fontWeight: 600,
                    cursor: "pointer"
                  }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
