export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function CrmReports() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [tickets, workOrders] = await Promise.all([
    prisma.serviceTicket.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { ticketId: true, status: true, createdAt: true, closedAt: true, category: true },
    }),
    prisma.workOrder.findMany({
      where: { scheduledDate: { gte: startOfMonth } },
      select: { workOrderId: true, status: true, unattended_reason: true },
    }),
  ]);

  const totalTickets = tickets.length;
  const closedTickets = tickets.filter(t => t.status === "CLOSED");
  const breached = tickets.filter(t =>
    t.status === "OPEN" && (now.getTime() - new Date(t.createdAt).getTime()) > 24 * 60 * 60 * 1000
  );
  const slaCompliance = totalTickets > 0
    ? Math.round(((totalTickets - breached.length) / totalTickets) * 100)
    : 100;

  const avgResMs = closedTickets.filter(t => t.closedAt).reduce((sum, t) => {
    return sum + (new Date(t.closedAt!).getTime() - new Date(t.createdAt).getTime());
  }, 0);
  const avgResH = closedTickets.filter(t => t.closedAt).length > 0
    ? (avgResMs / closedTickets.filter(t => t.closedAt).length / (1000 * 60 * 60)).toFixed(1)
    : "—";

  const totalWOs = workOrders.length;
  const completedWOs = workOrders.filter(w => w.status === "COMPLETED").length;
  const unattendedWOs = workOrders.filter(w => w.unattended_reason).length;
  const rescheduledWOs = workOrders.filter(w => w.status === "RESCHEDULED").length;

  // Complaint categories
  const categoryMap: Record<string, number> = {};
  tickets.forEach(t => {
    const cat = t.category || "General";
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
  });
  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / Math.max(totalTickets, 1)) * 100) }));

  const KPI_STATS = [
    { label: "SLA Compliance", value: `${slaCompliance}%`, sub: "Target > 90%", ok: slaCompliance >= 90 },
    { label: "First-Time Fix Rate", value: totalWOs > 0 ? `${Math.round((completedWOs / totalWOs) * 100)}%` : "—", sub: "Target > 85%", ok: completedWOs / Math.max(totalWOs, 1) >= 0.85 },
    { label: "Avg Complaint Res.", value: avgResH !== "—" ? `${avgResH}h` : "—", sub: "Target < 24h", ok: parseFloat(avgResH) < 24 },
    { label: "WOs MTD", value: totalWOs.toString(), sub: `${completedWOs} completed`, ok: true },
  ];

  const PERF_METRICS = [
    { label: "Total WOs Raised", count: totalWOs, pct: 100, color: "#3b82f6" },
    { label: "Completed", count: completedWOs, pct: totalWOs > 0 ? Math.round((completedWOs / totalWOs) * 100) : 0, color: "#22c55e" },
    { label: "Rescheduled", count: rescheduledWOs, pct: totalWOs > 0 ? Math.round((rescheduledWOs / totalWOs) * 100) : 0, color: "#f59e0b" },
    { label: "Unattended", count: unattendedWOs, pct: totalWOs > 0 ? Math.round((unattendedWOs / totalWOs) * 100) : 0, color: "#ef4444" },
  ];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>CRM &amp; Field Service Analytics</h1>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>BR-049 to BR-052 — Month-to-date operational performance &amp; SLA tracking</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {KPI_STATS.map((kpi) => (
          <div key={kpi.label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: kpi.ok ? "#10b981" : "#ef4444" }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--foreground)" }}>Complaints by Category (MTD)</h3>
          {categories.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>No complaints this month.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {categories.map((cat) => (
                <div key={cat.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--muted)" }}>{cat.label}</span>
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{cat.count} ({cat.pct}%)</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", height: 6, borderRadius: 3 }}>
                    <div style={{ background: "var(--accent)", width: `${cat.pct}%`, height: "100%", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--foreground)" }}>Work Order Performance (MTD)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PERF_METRICS.map((perf) => (
              <div key={perf.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--muted)" }}>{perf.label}</span>
                  <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{perf.count}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", height: 6, borderRadius: 3 }}>
                  <div style={{ background: perf.color, width: `${perf.pct}%`, height: "100%", borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
