"use client";
import { useState } from "react";
import { 
  Link as LinkIcon
} from "lucide-react";

const OUTAGES = [
  { id: "OUT-0081", area: "Adajan, Surat", detail: "F-12 · Cable fault", type: "Forced", start: "2026-04-06 07:30", restore: "2026-04-06 12:00", consumers: 840, complaints: 4, status: "Active", severity: "urgent" },
  { id: "OUT-0079", area: "Navrangpura, Ahmedabad", detail: "F-07 · Maintenance", type: "Planned", start: "2026-04-06 06:00", restore: "2026-04-06 14:00", consumers: 320, complaints: 2, status: "Active", severity: "urgent" },
  { id: "OUT-0072", area: "Satellite Rd, Ahmedabad", detail: "F-03 · Tree fall on LT line", type: "Forced", start: "2026-04-05 15:00", restore: "2026-04-05 18:30", consumers: 210, complaints: 7, status: "Restored", severity: "active" },
];

const CLUSTERED_COMPLAINTS = [
  { id: "CMP-20235", customer: "R. Parekh, Adajan", time: "07:42", status: "Clustered to OUT-0081" },
  { id: "CMP-20236", customer: "M. Iyer, Adajan", time: "07:55", status: "Clustered to OUT-0081" },
  { id: "CMP-20237", customer: "Surat Textiles Ltd", time: "08:05", status: "Clustered to OUT-0081" },
  { id: "CMP-20239", customer: "A. Kapoor, Adajan", time: "08:18", status: "Clustered to OUT-0081" },
];

export default function OutageLinkage() {
  const [selectedOutage, setSelectedOutage] = useState("OUT-0081");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>⚡ Outage Event Register</h1>
          <span style={{ fontSize: 13, color: "#64748B" }}>BR-047, BR-048 — Cluster complaints to known outages. Avoid duplicate dispatch.</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Outage ID</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Feeder/Area</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Start</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Est Restore</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Consumers</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Complaints</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {OUTAGES.map((outage) => (
              <tr key={outage.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "#1e40af" }}>{outage.id}</td>
                <td style={{ padding: "12px 16px" }}>
                   <div style={{ fontSize: 13, fontWeight: 600 }}>{outage.area}</div>
                   <div style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{outage.detail}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                   <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: outage.type === "Forced" ? "#fef2f2" : "#fefce8", color: outage.type === "Forced" ? "#991b1b" : "#854d0e" }}>{outage.type.toUpperCase()}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 11, fontFamily: "monospace" }}>{outage.start}</td>
                <td style={{ padding: "12px 16px", fontSize: 11, fontFamily: "monospace" }}>{outage.restore}</td>
                <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "#ef4444" }}>{outage.consumers}</td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                   <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", border: "1px solid #fecaca", padding: "2px 6px", borderRadius: 4 }}>{outage.complaints} linked</span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                   <span style={{ 
                     fontSize: 10, 
                     fontWeight: 700, 
                     padding: "4px 8px", 
                     borderRadius: 12, 
                     background: outage.severity === "active" ? "#f0fdf4" : "#fef2f2",
                     color: outage.severity === "active" ? "#166534" : "#991b1b"
                   }}>
                     {outage.status.toUpperCase()}
                   </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button style={{ padding: "4px 10px", borderRadius: 4, background: "#fff", border: "1px solid #cbd5e1", fontSize: 11, cursor: "pointer" }}>View</button>
                    <button style={{ padding: "4px 10px", borderRadius: 4, background: "#fff", border: "1px solid #cbd5e1", fontSize: 11, cursor: "pointer" }}>Notify</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Complaint Clustering Section */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <LinkIcon size={18} color="#1e40af" /> Complaint Clustering — Outage {selectedOutage}
          </h3>
        </div>

        <div style={{ padding: "12px 16px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ <b>4 complaints</b> raised for "No Supply" in {OUTAGES.find(o => o.id === selectedOutage)?.area} have been auto-clustered. 
          No duplicate field dispatch recommended — restoration ETA: 12:00.
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Complaint</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Customer</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Raised At</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {CLUSTERED_COMPLAINTS.map((comp) => (
              <tr key={comp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace" }}>{comp.id}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{comp.customer}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace" }}>{comp.time}</td>
                <td style={{ padding: "12px 16px" }}>
                   <span style={{ fontSize: 11, color: "#854d0e", background: "#fefce8", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>{comp.status}</span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                   <button style={{ padding: "4px 10px", borderRadius: 4, background: "#fff", border: "1px solid #cbd5e1", fontSize: 11, cursor: "pointer" }}>Auto-Respond</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
