"use client";
import { useEffect, useState } from "react";
import { Wrench, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import Link from "next/link";

export default function CrmWorkOrders() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const load = () => {
    setLoading(true);
    fetch("/api/field/work-orders")
      .then(r => r.json())
      .then(d => {
        setWorkOrders(Array.isArray(d.data) ? d.data : []);
        setLoading(false);
      })
      .catch(() => { setWorkOrders([]); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const statuses = ["ALL", "PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];
  const filtered = filter === "ALL" ? workOrders : workOrders.filter(w => w.status === filter);

  const counts = {
    pending: workOrders.filter(w => w.status === "PENDING").length,
    assigned: workOrders.filter(w => w.status === "ASSIGNED").length,
    completed: workOrders.filter(w => w.status === "COMPLETED").length,
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Work Order Dispatch</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>CRM-linked field work management</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={load} style={{ background: "var(--bg-lighter)", border: "1px solid var(--card-border)", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "var(--foreground)" }}>
            Refresh
          </button>
          <Link href="/field">
            <button style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              + New Work Order
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Pending", value: counts.pending, icon: Clock, color: "#f59e0b" },
          { label: "Assigned", value: counts.assigned, icon: User, color: "#3b82f6" },
          { label: "Completed Today", value: counts.completed, icon: CheckCircle, color: "#10b981" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ padding: 10, borderRadius: 10, background: `${color}18` }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filter === s ? "var(--accent)" : "var(--card-border)"}`,
            background: filter === s ? "var(--accent-glow)" : "var(--bg-lighter)",
            color: filter === s ? "var(--accent)" : "var(--muted)"
          }}>{s}</button>
        ))}
      </div>

      {/* Work Orders Table */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              {["Work Order ID", "Type", "Priority", "Technician", "Scheduled", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontStyle: "italic" }}>Loading work orders...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No work orders found.</td></tr>
            ) : filtered.map((wo: any) => (
              <tr key={wo.workOrderId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{wo.workOrderId.slice(-8).toUpperCase()}</td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>{wo.type || "SERVICE_RESTORATION"}</td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: wo.priority === "HIGH" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: wo.priority === "HIGH" ? "#ef4444" : "#f59e0b" }}>
                    {wo.priority || "MEDIUM"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>{wo.technician?.fullName || "Unassigned"}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--muted)" }}>
                  {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "14px 16px" }}><CRMStatusPill status={wo.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
