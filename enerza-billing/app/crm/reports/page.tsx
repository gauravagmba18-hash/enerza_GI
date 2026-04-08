"use client";
import { BarChart3 } from "lucide-react";

const KPI_STATS = [
  { label: "SLA Compliance", value: "91.4%", sub: "Target > 90%", status: "success" },
  { label: "First-Time Fix Rate", value: "84%", sub: "Target > 85%", status: "warning" },
  { label: "Avg Complaint Res.", value: "18.4h", sub: "Target < 24h", status: "success" },
  { label: "Field Utilisation", value: "78%", sub: "12 of 18 active", status: "info" },
];

const COMPLAINT_CATEGORIES = [
  { label: "No Supply", count: 28, pct: 38, color: "#3b82f6" },
  { label: "Billing Dispute", count: 18, pct: 24, color: "#3b82f6" },
  { label: "Voltage Issue", count: 12, pct: 16, color: "#3b82f6" },
  { label: "Faulty Meter", count: 9, pct: 12, color: "#3b82f6" },
  { label: "Payment Issue", count: 5, pct: 7, color: "#3b82f6" },
  { label: "Other", count: 2, pct: 3, color: "#3b82f6" },
];

const PERF_METRICS = [
  { label: "Total WOs Raised", count: 284, pct: 100, color: "#3b82f6" },
  { label: "Completed", count: 238, pct: 84, color: "#22c55e" },
  { label: "First-Time Fix", count: 200, pct: 70, color: "#22c55e" },
  { label: "Rescheduled", count: 31, pct: 11, color: "#f59e0b" },
  { label: "Unattended", count: 15, pct: 5, color: "#ef4444" },
];

export default function CrmReports() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>📊 CRM & Field Service Analytics</h1>
        <span style={{ fontSize: 13, color: "#64748B" }}>BR-049 to BR-052 — Operational Performance & SLA Tracking</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {KPI_STATS.map((kpi) => (
          <div key={kpi.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: kpi.status === "warning" ? "#d97706" : kpi.status === "success" ? "#166534" : "#1e40af" }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Complaints by Category (MTD)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#475569" }}>{cat.label}</span>
                  <span style={{ fontWeight: 600 }}>{cat.count} ({cat.pct}%)</span>
                </div>
                <div style={{ background: "#f1f5f9", height: 6, borderRadius: 3 }}>
                  <div style={{ background: cat.color, width: `${cat.pct}%`, height: "100%", borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Work Order Performance (MTD)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PERF_METRICS.map((perf) => (
              <div key={perf.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#475569" }}>{perf.label}</span>
                  <span style={{ fontWeight: 600 }}>{perf.count}</span>
                </div>
                <div style={{ background: "#f1f5f9", height: 6, borderRadius: 3 }}>
                  <div style={{ background: perf.color, width: `${perf.pct}%`, height: "100%", borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
