import React from 'react';
import { Droplets, Activity, Waves, Gauge, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function WaterHubPage() {
  const stats = [
    { label: "Water Connections", val: "12,180", color: "#3b82f6", icon: Waves },
    { label: "Daily Supply (kL)", val: "450k", color: "#60a5fa", icon: Droplets },
    { label: "Aggregate NRW Loss", val: "14.2%", color: "#f59e0b", icon: AlertCircle },
    { label: "Billing Efficiency", val: "94.8%", color: "#10b981", icon: TrendingUp },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#3b82f6,#2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 12 }}>
            <Droplets size={32} style={{ color: "#3b82f6" }} />
            Water Utility Hub
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>
            Municipal water distribution, NRW (Non-Revenue Water) tracking & zone telemetry.
          </p>
        </div>
        <Link href="/water-ops/nrw" style={{ textDecoration: "none" }}>
            <button className="glass" style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                Analyze Leakages <Activity size={18} />
            </button>
        </Link>
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

      {/* Zone Performance & Meters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 32 }}>
        <div className="glass" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Top Supply Zones Efficiency</h3>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>LATEST CYCLE</span>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                {[
                   { name: "Sector 14 - North", supply: "45k kL", loss: "8%", color: "#10b981", active: true },
                   { name: "Indira Nagar - Zone B", supply: "32k kL", loss: "18%", color: "#f59e0b", active: true },
                   { name: "South City Terminal", supply: "28k kL", loss: "4%", color: "#10b981", active: true },
                   { name: "Industrial Estate", supply: "95k kL", loss: "24%", color: "#ef4444", active: false },
                ].map((zone) => (
                   <div key={zone.name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                         <Gauge size={20} style={{ color: "var(--muted)" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--foreground)" }}>{zone.name}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: zone.color }}>{zone.loss} LOSS</div>
                         </div>
                         <div style={{ height: 6, width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ width: `${100 - parseInt(zone.loss)}%`, height: "100%", background: zone.color }} />
                         </div>
                      </div>
                   </div>
                ))}
            </div>
        </div>

        <div className="glass" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Water Quality Metrics (TDS/pH)</h3>
            </div>
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
               {[
                  { param: "Terminal TDS", val: "185 ppm", status: "SAFE", color: "#10b981" },
                  { param: "pH Level", val: "7.2", status: "STABLE", color: "#10b981" },
                  { param: "Chlorine", val: "0.2 mg/L", status: "SAFE", color: "#10b981" },
               ].map((q) => (
                  <div key={q.param} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--card-border)" }}>
                     <div>
                        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{q.param}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)", marginTop: 2 }}>{q.val}</div>
                     </div>
                     <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", background: `${q.color}15`, color: q.color, borderRadius: 6, letterSpacing: 0.5 }}>{q.status}</span>
                  </div>
               ))}
               <div style={{ marginTop: "auto", padding: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 12, display: "flex", gap: 12, alignItems: "center" }}>
                    <AlertCircle size={20} style={{ color: "#ef4444" }} />
                    <p style={{ fontSize: 13, color: "var(--foreground)" }}>Sample alert: 1 zone reporting slightly high turbidity after morning flush.</p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
