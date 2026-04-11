export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Activity, Zap, Server, AlertTriangle } from 'lucide-react';

export default async function PowerOpsPage() {
  const [subStationCount, feederCount, dtCount, feeders, activeOutages] = await Promise.all([
    prisma.subStation.count(),
    prisma.feeder.count(),
    prisma.distributionTransformer.count({ where: { status: "ACTIVE" } }),
    prisma.feeder.findMany({
      orderBy: { name: "asc" },
      take: 8,
      include: {
        subStation: true,
        _count: { select: { transformers: true } },
      },
    }),
    prisma.outage_event.count({ where: { status: "ACTIVE" } }),
  ]);

  const cards = [
    { title: "Sub-Stations", icon: Server, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", val: subStationCount.toString() },
    { title: "Feeders (11kV)", icon: Activity, color: "#6366f1", bg: "rgba(99,102,241,0.1)", val: feederCount.toString() },
    { title: "Active DTs", icon: Zap, color: "#eab308", bg: "rgba(234,179,8,0.1)", val: dtCount.toLocaleString() },
    { title: "Active Outages", icon: AlertTriangle, color: "#f43f5e", bg: "rgba(244,63,94,0.1)", val: activeOutages.toString() },
  ];

  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#eab308,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 10 }}>
          <Zap size={28} style={{ color: "#eab308" }} />
          Power Operations
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
          DISCOM distribution dashboard, grid hierarchy &amp; energy accounting.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((met) => (
          <div key={met.title} className="glass" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: met.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <met.icon size={22} style={{ color: met.color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", lineHeight: 1 }}>{met.val}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{met.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        <div className="glass" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid var(--card-border)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>Feeder Registry</h3>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", background: "rgba(244,63,94,0.1)", color: "#f43f5e", borderRadius: 4 }}>Live</span>
          </div>
          <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            {feeders.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>No feeders configured.</div>
            ) : feeders.map((fdr) => (
              <div key={fdr.feederId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "var(--foreground)" }}>{fdr.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    Sub-station: {fdr.subStation?.name ?? "—"} &middot; {fdr._count.transformers} DTs
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", background: fdr.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: fdr.status === "ACTIVE" ? "#10b981" : "#ef4444", borderRadius: 4 }}>{fdr.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid var(--card-border)", padding: "16px 20px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>Active Outages / Anomalies</h3>
          </div>
          <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 250 }}>
            {activeOutages === 0 ? (
              <>
                <AlertTriangle size={48} style={{ color: "var(--card-border)", marginBottom: 16 }} />
                <div style={{ fontWeight: 500, color: "var(--foreground)" }}>No active outages detected.</div>
                <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Grid operations normal.</div>
              </>
            ) : (
              <>
                <AlertTriangle size={48} style={{ color: "#f43f5e", marginBottom: 16 }} />
                <div style={{ fontWeight: 700, color: "#f43f5e", fontSize: 20 }}>{activeOutages} Active Outage{activeOutages !== 1 ? "s" : ""}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Review in CRM → Outage Register</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
