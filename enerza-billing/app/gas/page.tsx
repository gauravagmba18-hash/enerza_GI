export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Flame, Gauge, LayoutDashboard, Share2, Activity, Timer } from 'lucide-react';

export default async function GasHubPage() {
  const [connCount, stations, bands] = await Promise.all([
    (prisma.gasConnDetail as any).count(),
    prisma.cngStation.findMany({ orderBy: { stationName: "asc" }, take: 8 }),
    (prisma.pressureBand as any).findMany({ orderBy: { bandName: "asc" } }),
  ]);

  const stats = [
    { label: "Active PNG Connections", val: connCount.toLocaleString(), color: "#06b6d4", icon: LayoutDashboard },
    { label: "CNG Stations", val: stations.length.toString(), color: "#22d3ee", icon: Gauge },
    { label: "Pressure Bands", val: bands.length.toString(), color: "#f59e0b", icon: Share2 },
    { label: "Active Stations", val: stations.filter((s: any) => s.status === "ACTIVE").length.toString(), color: "#fb7185", icon: Activity },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#06b6d4,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 12 }}>
          <Flame size={32} style={{ color: "#06b6d4" }} />
          Gas Utility Hub
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>
          City Gas Distribution (CGD) monitoring, CNG stations & pressure band telemetry.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} className="glass" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${s.color}22` }}>
              <s.icon size={28} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)" }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 32 }}>
        {/* CNG Stations */}
        <div className="glass" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>CNG Stations</h3>
            <Timer size={18} style={{ color: "var(--muted)" }} />
          </div>
          <div style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--card-border)" }}>
                  <th style={{ textAlign: "left", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Station</th>
                  <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Dispensers</th>
                  <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stations.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No CNG stations found.</td></tr>
                ) : stations.map((s: any) => (
                  <tr key={s.stationId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>
                      <div>{s.stationName}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.city}</div>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right", fontWeight: 700, color: "#06b6d4" }}>{s.dispenserCount ?? "—"}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: s.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: s.status === "ACTIVE" ? "#10b981" : "#ef4444", borderRadius: 4 }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pressure Bands */}
        <div className="glass" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Pressure Band Configuration</h3>
          </div>
          <div style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--card-border)" }}>
                  <th style={{ textAlign: "left", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Band</th>
                  <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Min (Bar)</th>
                  <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Max (Bar)</th>
                  <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Class</th>
                </tr>
              </thead>
              <tbody>
                {bands.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No pressure bands configured.</td></tr>
                ) : bands.map((b: any) => (
                  <tr key={b.bandId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{b.bandName}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right", fontWeight: 700, color: "#10b981" }}>{b.minPressure}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right", fontWeight: 700, color: "#06b6d4" }}>{b.maxPressure}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: "rgba(6,182,212,0.1)", color: "#06b6d4", borderRadius: 4 }}>{b.usageClass}</span>
                    </td>
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
