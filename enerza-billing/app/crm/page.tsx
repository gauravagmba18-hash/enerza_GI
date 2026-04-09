export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
// CRM Dashboard: Real-time service operational view
import { CRMKpiCard } from "@/components/crm/CRMKpiCard";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import { 
  AlertCircle, 
  Wrench, 
  Users, 
  ClipboardCheck, 
  MapPin, 
  Zap,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default async function CrmDashboard() {
  // Fetch real data for KPIs with safety checks
  const openComplaintsCount = await prisma.serviceTicket.count({ where: { status: "OPEN" } });
  const activeWorkOrdersCount = await prisma.workOrder.count({ where: { status: "ASSIGNED" } });
  const pendingRequestsCount = await prisma.serviceRequest.count({ where: { status: "DRAFT" } });

  // Compute SLA breached count: open tickets older than 24h
  const breachedSlaCount = await prisma.serviceTicket.count({
    where: {
      status: "OPEN",
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  
  // Recent complaints - show only top 5 for performance
  const recentComplaints = await prisma.serviceTicket.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { account: { include: { customer: true } } }
  });

  // Limit outages to top 5 active events for local performance
  const activeOutages = await prisma.outage_event.findMany({
    take: 5,
    where: { status: "ACTIVE" },
    include: { feeder: true }
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>CRM Dashboard</h1>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Real-time operations & consumer service overview</p>
      </div>

      {/* KPI Row */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 16 
      }}>
        <CRMKpiCard 
          label="Open Complaints" 
          value={openComplaintsCount} 
          subtext={`${breachedSlaCount} breached SLA`}
          delta={{ value: "2", isUp: true }}
          icon={AlertCircle} 
          color="#ef4444" 
        />
        <CRMKpiCard 
          label="Work Orders Today" 
          value={activeWorkOrdersCount} 
          subtext="8 completed" 
          delta={{ value: "3", isUp: false }}
          icon={Wrench} 
          color="#10b981" 
        />
        <CRMKpiCard 
          label="Pending Move-In/Out" 
          value={pendingRequestsCount} 
          subtext="SLA due today: 2" 
          icon={Users} 
          color="#3b82f6" 
        />
        <CRMKpiCard 
          label="Active Outages" 
          value={activeOutages.length} 
          subtext="Feeder F-12, F-44" 
          icon={Zap} 
          color="#f59e0b" 
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Outages Section */}
        <div style={{ 
          background: "var(--card-bg)", 
          border: "1px solid var(--card-border)", 
          borderRadius: 12, 
          overflow: "hidden" 
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>⚡ Active Outages</h3>
            <CRMStatusPill status="URGENT" />
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {activeOutages.length > 0 ? activeOutages.map(outage => (
              <div key={outage.outage_id} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--card-border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{outage.description || `Outage ID: ${outage.outage_id}`}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{outage.type} · {outage.feeder?.name || "Unknown Feeder"}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", marginTop: 4 }}>
                    Est Restore: {outage.est_restore?.toLocaleString() || "TBD"}
                  </div>
                </div>
                <CRMStatusPill status={outage.status} />
              </div>
            )) : <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 20 }}>No active outages reported.</div>}
          </div>
        </div>

        {/* Complaints Section */}
        <div style={{ 
          background: "var(--card-bg)", 
          border: "1px solid var(--card-border)", 
          borderRadius: 12, 
          overflow: "hidden" 
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recent Complaints</h3>
            <Link href="/crm/complaints" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>View All →</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>ID</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Type</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(ticket => (
                  <tr key={ticket.ticketId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>{ticket.ticketId.slice(0, 8)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>{ticket.category || "General"}</td>
                    <td style={{ padding: "12px 16px" }}><CRMStatusPill status={ticket.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
