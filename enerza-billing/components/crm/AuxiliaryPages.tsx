import {
  Package, 
  Wrench, 
  ZapOff, 
  FilePieChart, 
  Search, 
  Download, 
  AlertTriangle 
} from "lucide-react";

// Shared Layout Component for Auxiliary Pages
function CRMSubLayout({ title, subtitle, icon: Icon, children }: any) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Icon size={28} color="var(--accent)" />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// 1. Inventory & Spares
export function InventoryPage() {
  return (
    <CRMSubLayout title="Spares & Inventory" subtitle="Stock management for meters, seals, and field kits" icon={Package}>
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
        <div style={{ padding: "0 0 16px", borderBottom: "1px solid var(--card-border)", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
           <input placeholder="Search materials..." style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--bg-lighter)", width: 300 }} />
           <button style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700 }}>+ Add Stock</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
           <thead>
             <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
               <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "var(--muted)" }}>Material Name</th>
               <th style={{ padding: 12, textAlign: "center", fontSize: 11, color: "var(--muted)" }}>Stock level</th>
               <th style={{ padding: 12, textAlign: "center", fontSize: 11, color: "var(--muted)" }}>Min level</th>
               <th style={{ padding: 12, textAlign: "right", fontSize: 11, color: "var(--muted)" }}>Status</th>
             </tr>
           </thead>
           <tbody>
             <tr>
               <td style={{ padding: 12, fontSize: 13, fontWeight: 600 }}>Static Single Phase Meter (Secure)</td>
               <td style={{ padding: 12, textAlign: "center", fontSize: 13 }}>284 units</td>
               <td style={{ padding: 12, textAlign: "center", fontSize: 13 }}>50</td>
               <td style={{ padding: 12, textAlign: "right" }}><span style={{ color: "#10b981", fontWeight: 700 }}>Optimal</span></td>
             </tr>
             <tr style={{ borderTop: "1px solid var(--card-border)" }}>
               <td style={{ padding: 12, fontSize: 13, fontWeight: 600 }}>Lead Terminal Seals (Strip)</td>
               <td style={{ padding: 12, textAlign: "center", fontSize: 13, color: "#ef4444", fontWeight: 700 }}>12 units</td>
               <td style={{ padding: 12, textAlign: "center", fontSize: 13 }}>200</td>
               <td style={{ padding: 12, textAlign: "right" }}><span style={{ color: "#ef4444", fontWeight: 700 }}>Critically Low</span></td>
             </tr>
           </tbody>
        </table>
      </div>
    </CRMSubLayout>
  );
}

// 2. Asset Maintenance
export function MaintenancePage() {
  return (
    <CRMSubLayout title="Asset Maintenance" subtitle="Preventive and corrective maintenance schedules for substations and transformers" icon={Wrench}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
         {[
           { name: "S-04 Substation Oil Change", priority: "High", date: "2026-04-10" },
           { name: "Feeder F-09 Inspection", priority: "Medium", date: "2026-04-12" },
           { name: "DT-42 Thermal Check", priority: "High", date: "2026-04-06" }
         ].map((m, i) => (
           <div key={i} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: m.priority === "High" ? "#ef4444" : "#f59e0b" }}>{m.priority} Priority</span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{m.date}</span>
             </div>
             <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
             <button style={{ marginTop: 12, width: "100%", padding: "6px", borderRadius: 8, background: "var(--bg-lighter)", border: "1px solid var(--card-border)", fontSize: 12, cursor: "pointer" }}>Open WO</button>
           </div>
         ))}
      </div>
    </CRMSubLayout>
  );
}

// 3. Reports & Analytics
export function ReportsPage() {
  return (
    <CRMSubLayout title="Reports & Analytics" subtitle="Operational and customer service reporting hub" icon={FilePieChart}>
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { id: "R-001", name: "Daily Complaint Resolution Status", format: "Excel" },
            { id: "R-002", name: "Monthly SLA Breach Analysis", format: "PDF" },
            { id: "R-003", name: "New Connection Cycle Time Report", format: "Excel" },
            { id: "R-004", name: "Technician Productivity Metrics", format: "Excel" },
            { id: "R-005", name: "Material Utilization Summary", format: "PDF" }
          ].map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
              <div style={{ background: "rgba(37,99,235,0.1)", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <Download size={20} color="#3b82f6" />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 14, fontWeight: 700 }}>{r.name}</div>
                 <div style={{ fontSize: 11, color: "var(--muted)" }}>ID: {r.id} · {r.format} Format</div>
              </div>
              <button style={{ background: "transparent", border: "1px solid var(--card-border)", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Generate</button>
            </div>
          ))}
       </div>
    </CRMSubLayout>
  );
}
