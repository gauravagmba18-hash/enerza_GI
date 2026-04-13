"use client";
import React, { useEffect, useState } from "react";
import { X, Play, CheckCircle, Trash2, Plus } from "lucide-react";
import type { WorkOrderDetail } from "./types";

interface Props {
  woId: string | null;
  onClose: () => void;
}

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  PENDING:     { bg: "#fef9c3", text: "#854d0e" },
  ASSIGNED:    { bg: "#dbeafe", text: "#1d4ed8" },
  IN_PROGRESS: { bg: "#d1fae5", text: "#065f46" },
  COMPLETED:   { bg: "#f3f4f6", text: "#6b7280" },
};

export function WorkOrderDetailModal({ woId, onClose }: Props) {
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [spareItemId, setSpareItemId] = useState("");
  const [spareQty, setSpareQty] = useState("");
  const [inventoryItems, setInventoryItems] = useState<{ itemId: string; itemName: string; unitCost: number }[]>([]);
  const [spareError, setSpareError] = useState("");

  const fetchWo = () => {
    if (!woId) return;
    setLoading(true);
    fetch(`/api/field/work-orders/${woId}`)
      .then((r) => r.json())
      .then((d) => {
        const w = d.data;
        setWo(w);
        setInspectionNotes(w.inspectionNotes ?? "");
        setResolutionNotes(w.resolutionNotes ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWo();
    fetch("/api/field/inventory")
      .then((r) => r.json())
      .then((d) => setInventoryItems(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, [woId]);

  if (!woId) return null;

  async function updateStatus(status: string) {
    setSaving(true);
    await fetch(`/api/field/work-orders/${woId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    fetchWo();
  }

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/field/work-orders/${woId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionNotes, resolutionNotes }),
    });
    setSaving(false);
  }

  async function addSpare() {
    if (!spareItemId || !spareQty) { setSpareError("Select item and enter quantity"); return; }
    setSpareError("");
    await fetch(`/api/field/work-orders/${woId}/spares`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: spareItemId, quantity: parseFloat(spareQty) }),
    });
    setSpareItemId(""); setSpareQty("");
    fetchWo();
  }

  async function removeSpare(usageId: string) {
    await fetch(`/api/field/work-orders/${woId}/spares?usageId=${usageId}`, { method: "DELETE" });
    fetchWo();
  }

  const pill = STATUS_PILL[wo?.status ?? "PENDING"] ?? { bg: "#f3f4f6", text: "#6b7280" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass" style={{ width: 560, maxHeight: "92vh", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Work Order Detail</h2>
              {wo && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: pill.bg, color: pill.text }}>{wo.status.replace("_", " ")}</span>}
            </div>
            {wo && <p style={{ fontSize: 12, color: "var(--muted)" }}>{wo.workOrderId} · {wo.technician?.fullName ?? "—"}</p>}
            {wo?.ticket && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{wo.ticket.subject}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
        ) : wo ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

            {/* Time tracking */}
            <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--card-bg)", borderRadius: 8, border: "1px solid var(--card-border)" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Time Tracking</p>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {wo.startedAt ? (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Started: {new Date(wo.startedAt).toLocaleString()}</span>
                ) : (
                  <button onClick={() => updateStatus("IN_PROGRESS")} disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
                    <Play size={12} /> Start Work
                  </button>
                )}
                {wo.completedAt ? (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Completed: {new Date(wo.completedAt).toLocaleString()}</span>
                ) : wo.startedAt ? (
                  <button onClick={() => updateStatus("COMPLETED")} disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
                    <CheckCircle size={12} /> Mark Complete
                  </button>
                ) : null}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Inspection Notes</label>
              <textarea rows={2} value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 13, resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Resolution Notes</label>
              <textarea rows={2} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              <button onClick={saveNotes} disabled={saving}
                style={{ marginTop: 8, padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save Notes"}
              </button>
            </div>

            {/* Spares */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Spares Used</p>
              {wo.spares.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                      {["Item", "Qty", "Unit Cost", ""].map((h) => (
                        <th key={h} style={{ padding: "4px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wo.spares.map((s) => (
                      <tr key={s.usageId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td style={{ padding: "6px 8px", color: "var(--foreground)" }}>{s.item.itemName}</td>
                        <td style={{ padding: "6px 8px", color: "var(--foreground)" }}>{s.quantity}</td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)" }}>₹{s.item.unitCost.toFixed(2)}</td>
                        <td style={{ padding: "6px 8px" }}>
                          <button onClick={() => removeSpare(s.usageId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>No spares added yet.</p>
              )}

              {/* Add spare row */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select value={spareItemId} onChange={(e) => setSpareItemId(e.target.value)}
                  style={{ flex: 2, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 12 }}>
                  <option value="">Select item…</option>
                  {inventoryItems.map((i) => <option key={i.itemId} value={i.itemId}>{i.itemName}</option>)}
                </select>
                <input type="number" value={spareQty} onChange={(e) => setSpareQty(e.target.value)} placeholder="Qty"
                  style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 12 }} />
                <button onClick={addSpare}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", fontSize: 12, fontWeight: 600, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
                  <Plus size={12} /> Add
                </button>
              </div>
              {spareError && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{spareError}</p>}
            </div>
          </div>
        ) : null}

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--card-border)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid var(--card-border)", color: "var(--foreground)" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
