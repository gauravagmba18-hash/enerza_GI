export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import { ZapOff, AlertCircle, Users, Clock } from "lucide-react";

export default async function OutageLinkage() {
  const outages = await prisma.outage_event.findMany({
    include: {
      feeder: true,
      service_ticket: true
    },
    orderBy: { start_at: "desc" }
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Outage Linkage</h1>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Correlating network events with consumer complaints</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {outages.map(outage => (
          <div key={outage.outage_id} style={{ 
            background: "var(--card-bg)", 
            border: "1px solid var(--card-border)", 
            borderRadius: 12, 
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <ZapOff size={22} color="#ef4444" />
                </div>
                <div>
                   <div style={{ fontSize: 15, fontWeight: 700 }}>{outage.feeder?.name || "Unknown Feeder"}</div>
                   <div style={{ fontSize: 12, color: "var(--muted)" }}>{outage.type} · Area: {outage.area}</div>
                </div>
              </div>
              <CRMStatusPill status={outage.status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "var(--bg-lighter)", padding: 12, borderRadius: 8 }}>
                 <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Consumers Affected</div>
                 <div style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={16} /> —
                 </div>
              </div>
              <div style={{ background: "var(--bg-lighter)", padding: 12, borderRadius: 8 }}>
                 <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Linked Complaints</div>
                 <div style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, color: "var(--accent)" }}>
                    <AlertCircle size={16} /> {outage.service_ticket.length}
                 </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
               <Clock size={14} /> Start: {outage.start_at.toLocaleString()}
            </div>

            <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 16, display: "flex", gap: 12 }}>
               <button style={{ flex: 1, padding: "8px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Analyze Linkage</button>
               <button style={{ flex: 1, padding: "8px", borderRadius: 8, background: "transparent", border: "1px solid var(--card-border)", fontSize: 12, cursor: "pointer" }}>Update ETRA</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
