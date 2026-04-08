"use client";
import { useEffect, useState } from "react";
import { 
  Droplets, AlertTriangle, TrendingDown,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Search, Calendar, Filter
} from "lucide-react";

interface NRWMetric {
  zoneId: string;
  zoneName: string;
  supplyVolume: number;
  consumptionVolume: number;
  lossValue: number;
  lossPercentage: number;
  period: string;
}

export default function NRWDashboard() {
  const [metrics, setMetrics] = useState<NRWMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/water-ops/nrw");
      const json = await res.json();
      setMetrics(json.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMetrics(); }, []);

  const getStatusColor = (pct: number) => {
    if (pct < 5) return "#10b981"; // Green
    if (pct < 15) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  const totalSupply = metrics.reduce((a, b) => a + b.supplyVolume, 0);
  const totalConsumption = metrics.reduce((a, b) => a + b.consumptionVolume, 0);
  const avgLoss = totalSupply > 0 ? ((totalSupply - totalConsumption) / totalSupply) * 100 : 0;

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" }}>
            Non-Revenue Water (NRW) Hub
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>
            Real-time leakage detection & supply-chain efficiency monitoring
          </p>
        </div>
        <button onClick={fetchMetrics} className="glass" style={{ padding: "12px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "var(--foreground)", fontWeight: 600 }}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Sync Data
        </button>
      </div>

      {/* Top Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20, marginBottom: 32 }}>
        {[
          { label: "Total Supply (30d)", value: `${totalSupply.toLocaleString()} SCM`, icon: Droplets, color: "#3b82f6" },
          { label: "Total Consumption", value: `${totalConsumption.toLocaleString()} SCM`, icon: ArrowDownRight, color: "#10b981" },
          { label: "Aggregate NRW Loss", value: `${avgLoss.toFixed(1)}%`, icon: AlertTriangle, color: getStatusColor(avgLoss) },
          { label: "Active Supply Zones", value: metrics.length.toString(), icon: TrendingDown, color: "#a78bfa" },
        ].map((c) => (
          <div key={c.label} className="glass" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${c.color}33` }}>
              <c.icon size={28} style={{ color: c.color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)" }}>{c.value}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Supply Zone Efficiency</h2>
          <div style={{ display: "flex", gap: 12 }}>
             <div className="glass" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, fontSize: 13 }}>
                <Calendar size={14} /> Last 30 Days
             </div>
             <div className="glass" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, fontSize: 13 }}>
                <Filter size={14} /> All Zones
             </div>
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--card-border)" }}>
                <th style={{ textAlign: "left", padding: "16px 32px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Zone Name</th>
                <th style={{ textAlign: "right", padding: "16px 32px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Bulk Supply</th>
                <th style={{ textAlign: "right", padding: "16px 32px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Consumption</th>
                <th style={{ textAlign: "right", padding: "16px 32px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Loss (SCM)</th>
                <th style={{ textAlign: "right", padding: "16px 32px", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 100, color: "var(--muted)" }}>Analyzing network data...</td></tr>
              ) : metrics.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 100, color: "var(--muted)" }}>No water consumption data logged for this period.</td></tr>
              ) : metrics.map((m) => (
                <tr key={m.zoneId} style={{ borderBottom: "1px solid var(--card-border)", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "18px 32px", fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{m.zoneName}</td>
                  <td style={{ padding: "18px 32px", textAlign: "right", fontSize: 14, color: "var(--foreground)" }}>{m.supplyVolume.toLocaleString()}</td>
                  <td style={{ padding: "18px 32px", textAlign: "right", fontSize: 14, color: "var(--foreground)" }}>{m.consumptionVolume.toLocaleString()}</td>
                  <td style={{ padding: "18px 32px", textAlign: "right", fontSize: 14, color: m.lossPercentage > 15 ? "var(--danger)" : "var(--foreground)" }}>
                    {m.lossValue.toLocaleString()}
                  </td>
                  <td style={{ padding: "18px 32px", textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: getStatusColor(m.lossPercentage) }}>
                        {(100 - m.lossPercentage).toFixed(1)}%
                      </div>
                      <div style={{ width: 100, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: getStatusColor(m.lossPercentage), width: `${100 - m.lossPercentage}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
