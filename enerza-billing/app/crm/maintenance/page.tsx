"use client";
import { useState } from "react";
import { 
  PlusCircle, 
  AlertCircle 
} from "lucide-react";

const ASSETS = [
  { id: "AST-DT-0421", name: "DT-421 Navrangpura 100kVA", type: "Distribution Transformer", lastMaint: "2025-11-15", nextDue: "2026-05-15", failures: 0, health: "Good", status: "active" },
  { id: "AST-DT-0318", name: "DT-318 Adajan 63kVA", type: "Distribution Transformer", lastMaint: "2025-08-10", nextDue: "2026-02-10", failures: 2, health: "Overdue", status: "urgent" },
  { id: "AST-CB-0811", name: "CB-0811 Feeder F-07 33kV", type: "Circuit Breaker", lastMaint: "2026-01-20", nextDue: "2026-07-20", failures: 0, health: "Good", status: "active" },
  { id: "AST-FDR-F12", name: "Feeder F-12 11kV Surat", type: "Feeder", lastMaint: "2025-09-05", nextDue: "2026-03-05", failures: 3, health: "Overdue", status: "urgent" },
];

export default function AssetMaintenance() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>🏗️ Asset Maintenance Register</h1>
          <span style={{ fontSize: 13, color: "#64748B" }}>BR-045, BR-046 — Preventive & Corrective Maintenance History</span>
        </div>
        <button style={{ 
          background: "#0F172A", 
          color: "#fff", 
          border: "none", 
          padding: "8px 16px", 
          borderRadius: 6, 
          fontSize: 12, 
          fontWeight: 700, 
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          cursor: "pointer"
        }}>
          <PlusCircle size={14} /> + Maintenance WO
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Asset ID</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Name</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Last Maint</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Next Due</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>YTD Failures</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Health</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map((asset) => (
              <tr key={asset.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: "#1e40af" }}>{asset.id}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600 }}>{asset.name}</td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>
                  <span style={{ fontSize: 10, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569", fontWeight: 700 }}>{asset.type.toUpperCase()}</span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace" }}>{asset.lastMaint}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: asset.status === "urgent" ? "#ef4444" : "inherit", fontWeight: asset.status === "urgent" ? 700 : 400 }}>{asset.nextDue}</td>
                <td style={{ padding: "14px 16px", textAlign: "center", fontSize: 13, fontWeight: 700, color: asset.failures > 0 ? "#ef4444" : "#107e3e" }}>{asset.failures}</td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                   <span style={{ 
                     fontSize: 10, 
                     fontWeight: 700, 
                     padding: "4px 8px", 
                     borderRadius: 12, 
                     background: asset.status === "active" ? "#f0fdf4" : "#fef2f2",
                     color: asset.status === "active" ? "#166534" : "#991b1b"
                   }}>
                     {asset.health.toUpperCase()}
                   </span>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button style={{ padding: "4px 10px", borderRadius: 4, background: "#fff", border: "1px solid #cbd5e1", fontSize: 11, cursor: "pointer" }}>Inspect</button>
                    <button style={{ padding: "4px 10px", borderRadius: 4, background: "#fff", border: "1px solid #cbd5e1", fontSize: 11, cursor: "pointer" }}>+WO</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
