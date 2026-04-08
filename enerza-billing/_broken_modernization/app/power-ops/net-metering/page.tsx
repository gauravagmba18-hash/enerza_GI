import React from 'react';
import { Sun, Battery, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function NetMeteringPage() {
  const cards = [
    { title: "Total Prosumers", icon: Sun, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", val: "482" },
    { title: "Total Solar Capacity", icon: Battery, color: "#10b981", bg: "rgba(16,185,129,0.1)", val: "14.2 MW" },
    { title: "Energy Exported (MTD)", icon: ArrowUpRight, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", val: "840 MWh" },
    { title: "Active Rollover Credits", icon: CheckCircle2, color: "#6366f1", bg: "rgba(99,102,241,0.1)", val: "12,450 kWh" }
  ];

  const tableData = [
    { acc: "ACC00921", name: "GreenTech Industries", cap: "150 kW", exp: "12,400 kWh", cred: "4,200 kWh", status: "Active" },
    { acc: "ACC00411", name: "Sunil Sharma", cap: "5 kW", exp: "450 kWh", cred: "80 kWh", status: "Active" },
    { acc: "ACC01822", name: "Prestige Heights Apts", cap: "45 kW", exp: "3,800 kWh", cred: "0 kWh", status: "Net Billed" },
    { acc: "ACC00284", name: "Modern Retail Park", cap: "80 kW", exp: "6,200 kWh", cred: "1,500 kWh", status: "Active" },
  ];

  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#f59e0b,#fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 10 }}>
            <Sun size={28} style={{ color: "#f59e0b" }} />
            Net Metering (Solar)
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
            Prosumer management, energy export tracking, and credit ledgers.
          </p>
        </div>
        <button style={{ padding: "10px 16px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(245,158,11,0.2)" }}>
          Register New Prosumer
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((met) => (
          <div key={met.title} className="glass " style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: met.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <met.icon size={22} style={{ color: met.color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", lineHeight: 1 }}>
                {met.val}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{met.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", background: "rgba(255,255,255,0.02)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>Prosumer Ledger Overview</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", color: "var(--muted)" }}>
                <th style={{ padding: "12px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--card-border)" }}>Account ID</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--card-border)" }}>Customer Name</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--card-border)" }}>Solar Capacity</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--card-border)" }}>Export (Month)</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--card-border)" }}>Rollover Credit Balance</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--card-border)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i} style={{ borderBottom: i === tableData.length - 1 ? "none" : "1px solid var(--card-border)", color: "var(--foreground)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 500 }}>{row.acc}</td>
                  <td style={{ padding: "16px 20px" }}>{row.name}</td>
                  <td style={{ padding: "16px 20px" }}>{row.cap}</td>
                  <td style={{ padding: "16px 20px", color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                    <ArrowUpRight size={14} /> {row.exp}
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: 600, color: "#6366f1" }}>{row.cred}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "4px 8px", background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
