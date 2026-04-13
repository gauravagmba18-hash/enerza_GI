"use client";
import React, { useEffect, useState } from "react";
import { User, X, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { FieldWorkModal } from "@/components/dispatch/FieldWorkModal";

type Technician = { technicianId: string; fullName: string; status: string; mobile: string };

interface Props {
  req: any;
  onAdvanced: () => void;
}

// Mini assign form shown inline for field work step
function AssignForm({ requestId, onAssigned }: { requestId: string; onAssigned: () => void }) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/field/technicians").then(r => r.json()).then(d => setTechnicians(Array.isArray(d.data) ? d.data : []));
  }, []);

  async function submit() {
    if (!selectedId) { setError("Select a technician"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/field/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, technicianId: selectedId, scheduledDate, notes }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Failed"); setSaving(false); return; }
    onAssigned();
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Select Technician</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
        {technicians.map(t => {
          const active = selectedId === t.technicianId;
          return (
            <div key={t.technicianId} onClick={() => setSelectedId(t.technicianId)}
              style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                border: active ? "2px solid var(--accent)" : "1px solid var(--card-border)",
                background: active ? "rgba(59,130,246,0.08)" : "var(--card-bg)" }}>
              <User size={14} style={{ color: active ? "var(--accent)" : "var(--muted)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{t.fullName}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{t.mobile}</div>
              </div>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 9999, background: t.status === "ACTIVE" ? "#d1fae5" : "#f3f4f6", color: t.status === "ACTIVE" ? "#065f46" : "#6b7280", fontWeight: 600 }}>{t.status}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
          style={{ flex: 1, padding: "6px 10px", fontSize: 12, borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
          style={{ flex: 2, padding: "6px 10px", fontSize: 12, borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
      </div>
      {error && <p style={{ fontSize: 11, color: "#ef4444", marginBottom: 6 }}>{error}</p>}
      <button onClick={submit} disabled={saving} style={{ padding: "7px 18px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Dispatching…" : "Assign Technician →"}
      </button>
    </div>
  );
}

export function StageActionPanel({ req, onAdvanced }: Props) {
  const step = req.currentStep ?? 1;
  const [notes, setNotes] = useState("");
  const [meterSerial, setMeterSerial] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldWO, setFieldWO] = useState<any>(null);
  const [woLoaded, setWoLoaded] = useState(false);
  const [trackWoId, setTrackWoId] = useState<string | null>(null);

  // Load work order for this SR if at field work step
  useEffect(() => {
    if (step !== 2) return;
    fetch(`/api/field/work-orders?requestId=${req.requestId}`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d.data) ? d.data : [];
        const wo = list.find((w: any) => w.requestId === req.requestId);
        setFieldWO(wo ?? null);
        setWoLoaded(true);
      })
      .catch(() => setWoLoaded(true));
  }, [step, req.requestId]);

  async function advance(action: string) {
    setSaving(true); setError("");
    const res = await fetch("/api/service-requests/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: req.requestId, action, notes, meterSerial }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Failed"); setSaving(false); return; }
    setSaving(false);
    onAdvanced();
  }

  const inputStyle = { width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", boxSizing: "border-box" as const, marginBottom: 8 };
  const btnStyle = (bg: string) => ({ padding: "7px 20px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "none", background: bg, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 });

  const approved = fieldWO?.approvalStatus === "APPROVED";

  return (
    <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 8, background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Next Action — Stage {step + 1}: {["", "", "Field Work", "Billing Setup", "Activation"][step]}
      </div>

      {step === 1 && (
        <>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Field work notes (optional)" style={{ ...inputStyle, resize: "vertical" }} />
          {error && <p style={{ fontSize: 11, color: "#ef4444", marginBottom: 6 }}>{error}</p>}
          <button onClick={() => advance("verify-docs")} disabled={saving} style={btnStyle("#3b82f6")}>
            {saving ? "Processing…" : "Verify Documents →"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          {!woLoaded ? (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Loading field work status…</div>
          ) : !fieldWO ? (
            <>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                A technician must be assigned and complete an on-site inspection before this step can be advanced.
              </p>
              <AssignForm requestId={req.requestId} onAssigned={() => { setWoLoaded(false); fetch(`/api/field/work-orders?requestId=${req.requestId}`).then(r=>r.json()).then(d=>{ const list=Array.isArray(d.data)?d.data:[]; setFieldWO(list.find((w:any)=>w.requestId===req.requestId)??null); setWoLoaded(true); }); }} />
            </>
          ) : !approved ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Clock size={14} color="#f59e0b" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                  Assigned to {fieldWO.technician?.fullName ?? "technician"}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Status: {fieldWO.status} · Awaiting field work approval
                </div>
              </div>
              <button onClick={() => setTrackWoId(fieldWO.workOrderId)}
                style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "1px solid var(--card-border)", background: "transparent", color: "var(--foreground)", cursor: "pointer" }}>
                Open Field Work →
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <CheckCircle2 size={14} color="#22c55e" />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>
                  Field work approved by {fieldWO.technician?.fullName}
                </span>
                <button onClick={() => setTrackWoId(fieldWO.workOrderId)} style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>View WO</button>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes (optional)" style={{ ...inputStyle, resize: "vertical" }} />
              {error && <p style={{ fontSize: 11, color: "#ef4444", marginBottom: 6 }}>{error}</p>}
              <button onClick={() => advance("field-work")} disabled={saving} style={btnStyle("#22c55e")}>
                {saving ? "Processing…" : "Complete Field Work →"}
              </button>
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Billing setup notes (optional)" style={{ ...inputStyle, resize: "vertical" }} />
          {error && <p style={{ fontSize: 11, color: "#ef4444", marginBottom: 6 }}>{error}</p>}
          <button onClick={() => advance("billing-setup")} disabled={saving} style={btnStyle("#8b5cf6")}>
            {saving ? "Processing…" : "Complete Billing Setup →"}
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <input value={meterSerial} onChange={e => setMeterSerial(e.target.value)} placeholder="Meter serial number" style={inputStyle} />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Activation notes (optional)" style={{ ...inputStyle, resize: "vertical" }} />
          {error && <p style={{ fontSize: 11, color: "#ef4444", marginBottom: 6 }}>{error}</p>}
          <button onClick={() => advance("activate")} disabled={saving} style={btnStyle("#10b981")}>
            {saving ? "Activating…" : "Activate Connection →"}
          </button>
        </>
      )}

      {step >= 5 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={14} color="#10b981" />
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Connection is ACTIVE</span>
        </div>
      )}

      <FieldWorkModal woId={trackWoId} onClose={() => setTrackWoId(null)} onApproved={() => { setTrackWoId(null); setWoLoaded(false); }} />
    </div>
  );
}
