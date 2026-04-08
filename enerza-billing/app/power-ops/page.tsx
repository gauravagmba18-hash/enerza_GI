import React from 'react';
import { Activity, Zap, Server, AlertTriangle } from 'lucide-react';

export default function PowerOpsPage() {
  const cards = [
    { title: "Sub-Stations", icon: Server, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", val: "14" },
    { title: "Feeders (11kV)", icon: Activity, color: "#6366f1", bg: "rgba(99,102,241,0.1)", val: "84" },
    { title: "Active DTs", icon: Zap, color: "#eab308", bg: "rgba(234,179,8,0.1)", val: "1,240" },
    { title: "Avg AT&C Loss", icon: AlertTriangle, color: "#f43f5e", bg: "rgba(244,63,94,0.1)", val: "12.4%" }
  ];

  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#eab308,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 10 }}>
          <Zap size={28} style={{ color: "#eab308" }} />
          Power Operations
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
          DISCOM distribution dashboard, grid hierarchy & energy accounting.
        </p>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        <div className="glass" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid var(--card-border)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>Feeder Energy Accounting</h3>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", background: "rgba(244,63,94,0.1)", color: "#f43f5e", borderRadius: 4 }}>Highest Losses</span>
          </div>
          <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { name: "FDR-North-11", input: "450 MWh", billed: "380 MWh", loss: "15.5%" },
              { name: "FDR-Ind-Zone3", input: "1,200 MWh", billed: "1,050 MWh", loss: "12.5%" },
              { name: "FDR-South-02", input: "320 MWh", billed: "290 MWh", loss: "9.3%" }
            ].map((fdr) => (
              <div key={fdr.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
                 <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "var(--foreground)" }}>{fdr.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Input: {fdr.input} &middot; Billed: {fdr.billed}</div>
                 </div>
                 <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "#f43f5e", fontSize: 14 }}>{fdr.loss}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>AT&C Loss</div>
                 </div>
              </div>
            ))}
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <button style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", color: "var(--foreground)", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  View Full Audit Report
                </button>
            </div>
          </div>
        </div>

        <div className="glass" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid var(--card-border)", padding: "16px 20px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>Recent Outages / Anomalies</h3>
          </div>
          <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 250 }}>
             <AlertTriangle size={48} style={{ color: "var(--card-border)", marginBottom: 16 }} />
             <div style={{ fontWeight: 500, color: "var(--foreground)" }}>No active anomalies detected.</div>
             <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Smart meter diagnostic reports are normal.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
