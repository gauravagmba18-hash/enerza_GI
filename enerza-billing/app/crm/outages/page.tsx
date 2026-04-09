export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";

export default async function OutageLinkage() {
  const outages = await prisma.outage_event.findMany({
    orderBy: { start_at: "desc" },
    take: 20,
    include: {
      feeder: true,
      service_ticket: {
        select: { ticketId: true, status: true },
      },
    },
  });

  const activeCount = outages.filter(o => o.status === "ACTIVE").length;
  const restoredCount = outages.filter(o => o.status === "RESTORED").length;
  const totalAffected = outages.reduce((sum, o) => sum + (o.service_ticket?.length ?? 0), 0);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>⚡ Outage Event Register</h1>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>BR-047, BR-048 — Cluster complaints to known outages. Avoid duplicate dispatch.</span>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Active Outages", val: activeCount, color: "#ef4444" },
          { label: "Restored", val: restoredCount, color: "#10b981" },
          { label: "Linked Complaints", val: totalAffected, color: "#f59e0b" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Outage ID</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Area / Feeder</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Start</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Est Restore</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Complaints</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {outages.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
                  No outage events recorded.
                </td>
              </tr>
            ) : outages.map((outage) => (
              <tr key={outage.outage_id} style={{ borderBottom: "1px solid var(--card-border)", background: outage.status === "ACTIVE" ? "rgba(239,68,68,0.02)" : undefined }}>
                <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>
                  {outage.outage_id.slice(-10).toUpperCase()}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{outage.area}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{outage.feeder?.name ?? "Unknown Feeder"}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: outage.type === "FORCED" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: outage.type === "FORCED" ? "#ef4444" : "#f59e0b" }}>
                    {outage.type}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
                  {new Date(outage.start_at).toLocaleString()}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
                  {outage.est_restore ? new Date(outage.est_restore).toLocaleString() : "TBD"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  {outage.service_ticket.length > 0 ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 6px", borderRadius: 4 }}>
                      {outage.service_ticket.length} linked
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>None</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <CRMStatusPill status={outage.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Complaint Clustering Notice */}
      {outages.some(o => o.status === "ACTIVE" && o.service_ticket.length > 0) && (
        <div style={{ padding: "16px 20px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, fontSize: 13, color: "var(--foreground)" }}>
          ⚠️ <strong>Auto-clustering active:</strong> Complaints linked to active outages are suppressed from field dispatch queue.
          No duplicate dispatch recommended — resolve from outage management.
        </div>
      )}
    </div>
  );
}
