import React from 'react';
import { Flame, Gauge, LayoutDashboard, Share2, Activity, Timer } from 'lucide-react';

export default function GasHubPage() {
  const stats = [
    { label: "Active PNG Connections", val: "8,420", color: "#06b6d4", icon: LayoutDashboard },
    { label: "Avg Pressure (Bar)", val: "2.4", color: "#22d3ee", icon: Gauge },
    { label: "LNG Blend Ratio", val: "18.5%", color: "#f59e0b", icon: Share2 },
    { label: "Unbilled Vol (30d)", val: "125k SCM", color: "#fb7185", icon: Activity },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#06b6d4,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 12 }}>
          <Flame size={32} style={{ color: "#06b6d4" }} />
          Gas Utility Hub
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>
          City Gas Distribution (CGD) monitoring, APM quotas & network telemetry.
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Operations & Sourcing */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 32 }}>
        <div className="glass" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Gas Sourcing Mix (SCM)</h3>
                <Timer size={18} style={{ color: "var(--muted)" }} />
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                   { type: "APM (Domestic)", vol: "850,000", price: "$6.50", pct: 65, color: "#10b981" },
                   { type: "Non-APM (R-LNG)", vol: "320,000", price: "$14.20", pct: 25, color: "#f59e0b" },
                   { type: "Spot Market", vol: "135,000", price: "$22.00", pct: 10, color: "#ef4444" },
                ].map((mix) => (
                   <div key={mix.type} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                         <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{mix.type}</div>
                         <div style={{ fontSize: 12, color: "var(--muted)" }}>{mix.vol} SCM @ <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{mix.price}</span></div>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                         <div style={{ width: `${mix.pct}%`, height: "100%", background: mix.color, borderRadius: 10 }} />
                      </div>
                   </div>
                ))}
            </div>
        </div>

        <div className="glass" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Pressure Terminal Health</h3>
            </div>
            <div style={{ padding: 0 }}>
               <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--card-border)" }}>
                       <th style={{ textAlign: "left", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Terminal ID</th>
                       <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Pressure (Bar)</th>
                       <th style={{ textAlign: "right", padding: "12px 24px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                       { id: "TRM-L01-CP", val: "4.2", state: "STABLE", color: "#10b981" },
                       { id: "TRM-L02-NR", val: "3.8", state: "STABLE", color: "#10b981" },
                       { id: "TRM-L03-SW", val: "1.9", state: "LOW_PRESSURE", color: "#ef4444" },
                       { id: "TRM-L04-ED", val: "2.4", state: "STABLE", color: "#10b981" },
                    ].map((row) => (
                       <tr key={row.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{row.id}</td>
                          <td style={{ padding: "16px 24px", textAlign: "right", fontWeight: 700, color: row.color }}>{row.val}</td>
                          <td style={{ padding: "16px 24px", textAlign: "right" }}>
                             <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: `${row.color}15`, color: row.color, borderRadius: 4 }}>{row.state}</span>
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
