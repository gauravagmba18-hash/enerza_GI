export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Droplets, Activity, Waves, Gauge, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function WaterHubPage() {
  const [connCount, zones, bulkReads] = await Promise.all([
    (prisma.waterConnDetail as any).count(),
    prisma.supplyZone.findMany({ orderBy: { name: "asc" } }),
    (prisma.bulkMeterRead as any).findMany({
      orderBy: { readingDate: "desc" },
      take: 50,
    }),
  ]);

  const activeZones = zones.filter((z: any) => z.status === "ACTIVE").length;

  const stats = [
    { label: "Water Connections", val: connCount.toLocaleString(), color: "#3b82f6", icon: Waves },
    { label: "Supply Zones", val: zones.length.toString(), color: "#60a5fa", icon: Droplets },
    { label: "Active Zones", val: activeZones.toString(), color: "#10b981", icon: TrendingUp },
    { label: "Bulk Reads (Recent)", val: bulkReads.length.toString(), color: "#f59e0b", icon: AlertCircle },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#3b82f6,#2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 12 }}>
            <Droplets size={32} style={{ color: "#3b82f6" }} />
            Water Utility Hub
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>
            Municipal water distribution, supply zones &amp; NRW tracking.
          </p>
        </div>
        <Link href="/water-ops/nrw" style={{ textDecoration: "none" }}>
          <button className="glass" style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            Analyze Leakages <Activity size={18} />
          </button>
        </Link>
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
        {/* Supply Zones */}
        <div className="glass" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Supply Zones</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>LIVE</span>
          </div>
          <div style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--card-border)" }}>
                  <th style={{ textAlign: "left", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Zone</th>
                  <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Utility</th>
                  <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No supply zones found.</td></tr>
                ) : zones.map((zone: any) => (
                  <tr key={zone.supplyZoneId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{zone.name}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right", fontSize: 12, color: "var(--muted)" }}>{zone.utilityType}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: zone.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: zone.status === "ACTIVE" ? "#10b981" : "#ef4444", borderRadius: 4 }}>{zone.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Meter Reads Summary */}
        <div className="glass" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Recent Bulk Meter Reads</h3>
          </div>
          <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            {bulkReads.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>No bulk reads recorded yet.</div>
            ) : bulkReads.slice(0, 5).map((r: any) => (
              <div key={r.readId ?? r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--card-border)" }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(r.readingDate ?? r.createdAt).toLocaleDateString()}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginTop: 2 }}>
                    {(r.readingValue ?? r.bulkReading ?? "—")} {r.uom ?? "KL"}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "rgba(59,130,246,0.1)", color: "#3b82f6", borderRadius: 4 }}>
                  {r.status ?? "RECORDED"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
