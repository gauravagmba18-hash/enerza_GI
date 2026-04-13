"use client";
import React, { useEffect, useState } from "react";
import { X, User } from "lucide-react";
import type { DispatchItem } from "./types";

type Technician = {
  technicianId: string;
  fullName: string;
  status: string;
  mobile: string;
  _count?: { workOrders: number };
};

interface Props {
  item: DispatchItem | null;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignModal({ item, onClose, onAssigned }: Props) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    setSelectedId("");
    setNotes("");
    setError("");
    fetch("/api/field/technicians")
      .then((r) => r.json())
      .then((d) => setTechnicians(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, [item]);

  if (!item) return null;

  async function handleSubmit() {
    if (!selectedId) { setError("Please select a technician"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = item!.type === "SR"
        ? { requestId: item!.id, technicianId: selectedId, scheduledDate, notes }
        : { ticketId: item!.id,  technicianId: selectedId, scheduledDate, notes };
      const res = await fetch("/api/field/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to assign"); setSaving(false); return; }
      onAssigned();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass" style={{ width: 480, maxHeight: "90vh", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 2 }}>Assign Technician</h2>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>{item.subject}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Select Technician</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {technicians.map((tech) => {
              const active = selectedId === tech.technicianId;
              return (
                <div
                  key={tech.technicianId}
                  onClick={() => setSelectedId(tech.technicianId)}
                  style={{
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    border: active ? "2px solid var(--accent)" : "1px solid var(--card-border)",
                    background: active ? "var(--accent)15" : "var(--card-bg)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <User size={16} style={{ color: active ? "var(--accent)" : "var(--muted)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{tech.fullName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{tech.mobile} · {tech.status}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 9999, background: tech.status === "ACTIVE" ? "#d1fae5" : "#f3f4f6", color: tech.status === "ACTIVE" ? "#065f46" : "#6b7280", fontWeight: 600 }}>
                    {tech.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Scheduled Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 13 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional dispatch notes..."
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--card-border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", fontSize: 13, borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid var(--card-border)", color: "var(--foreground)" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", background: "var(--accent)", border: "none", color: "#fff", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Assigning…" : "Confirm Dispatch"}
          </button>
        </div>
      </div>
    </div>
  );
}
