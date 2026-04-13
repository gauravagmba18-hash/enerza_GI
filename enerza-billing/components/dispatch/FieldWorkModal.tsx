"use client";
import React, { useEffect, useState, useRef } from "react";
import { X, CheckCircle2, XCircle, MinusCircle, Camera, Trash2 } from "lucide-react";

type ChecklistItem = { seq: number; label: string; status: "PENDING" | "PASS" | "FAIL" | "NA"; notes: string };
type Photo = { label: string; dataUrl: string; uploadedAt: string };

interface Props {
  woId: string | null;
  onClose: () => void;
  onApproved?: () => void;
}

const STATUS_ICON = {
  PASS: <CheckCircle2 size={14} color="#22c55e" />,
  FAIL: <XCircle size={14} color="#ef4444" />,
  NA:   <MinusCircle size={14} color="#9ca3af" />,
  PENDING: null,
};

export function FieldWorkModal({ woId, onClose, onApproved }: Props) {
  const [wo, setWo] = useState<any>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!woId) return;
    setError("");
    fetch(`/api/field/work-orders/${woId}`)
      .then(r => r.json())
      .then(d => {
        const w = d.data ?? d;
        setWo(w);
        try { setChecklist(JSON.parse(w.checklist ?? "[]")); } catch { setChecklist([]); }
        try { setPhotos(JSON.parse(w.photos ?? "[]")); } catch { setPhotos([]); }
      });
  }, [woId]);

  if (!woId || !wo) return null;

  const allMarked = checklist.length > 0 && checklist.every(i => i.status !== "PENDING");
  const canApprove = allMarked && wo.approvalStatus !== "APPROVED";

  async function save(patch: object) {
    setSaving(true);
    try {
      await fetch(`/api/field/work-orders/${woId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).then(r => r.json()).then(d => setWo(d.data ?? d));
    } catch { setError("Save failed"); }
    finally { setSaving(false); }
  }

  function setItemStatus(seq: number, status: ChecklistItem["status"]) {
    const next = checklist.map(i => i.seq === seq ? { ...i, status } : i);
    setChecklist(next);
    save({ checklist: next });
  }

  function setItemNotes(seq: number, notes: string) {
    const next = checklist.map(i => i.seq === seq ? { ...i, notes } : i);
    setChecklist(next);
    // debounce: save on blur instead
  }

  function saveNotes(seq: number) {
    save({ checklist: checklist.map(i => i.seq === seq ? { ...i, notes: checklist.find(x => x.seq === seq)!.notes } : i) });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const next = [...photos, { label: file.name, dataUrl: reader.result as string, uploadedAt: new Date().toISOString() }];
      setPhotos(next);
      await save({ photos: next });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function removePhoto(idx: number) {
    const next = photos.filter((_, i) => i !== idx);
    setPhotos(next);
    await save({ photos: next });
  }

  async function handleApprove() {
    setSaving(true); setError("");
    const res = await fetch(`/api/field/work-orders/${woId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Approval failed"); setSaving(false); return; }
    setWo(d.data ?? d);
    setSaving(false);
    onApproved?.();
  }

  async function handleStart() { await save({ status: "IN_PROGRESS" }); }

  const approved = wo.approvalStatus === "APPROVED";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 620, maxHeight: "92vh", borderRadius: 14, background: "var(--card-bg)", border: "1px solid var(--card-border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Field Work — {wo.workOrderId.slice(0,12)}</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>
              Technician: {wo.technician?.fullName ?? "—"} · Status: <b>{wo.status}</b>
              {approved && <span style={{ color: "#22c55e", marginLeft: 8, fontWeight: 700 }}>✓ APPROVED</span>}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Time tracking */}
          {wo.status === "ASSIGNED" && (
            <button onClick={handleStart} disabled={saving} style={{ marginBottom: 16, padding: "8px 18px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer" }}>
              Start Field Work
            </button>
          )}

          {/* Checklist */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Field Inspection Checklist
            </div>
            {checklist.map(item => (
              <div key={item.seq} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${item.status === "PASS" ? "#22c55e40" : item.status === "FAIL" ? "#ef444440" : "var(--card-border)"}`, background: item.status === "PASS" ? "#22c55e08" : item.status === "FAIL" ? "#ef444408" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: item.status !== "PENDING" ? 6 : 0 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, minWidth: 18 }}>{item.seq}.</span>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--foreground)" }}>{item.label}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["PASS", "FAIL", "NA"] as const).map(s => (
                      <button key={s} onClick={() => setItemStatus(item.seq, s)} disabled={approved}
                        style={{ padding: "3px 9px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: approved ? "not-allowed" : "pointer", border: "none",
                          background: item.status === s ? (s === "PASS" ? "#22c55e" : s === "FAIL" ? "#ef4444" : "#9ca3af") : "var(--card-border)",
                          color: item.status === s ? "#fff" : "var(--muted)" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {item.status !== "PENDING" && (
                  <input value={item.notes} onChange={e => setItemNotes(item.seq, e.target.value)} onBlur={() => saveNotes(item.seq)}
                    placeholder="Notes (optional)" disabled={approved}
                    style={{ width: "100%", marginTop: 2, padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", boxSizing: "border-box" }} />
                )}
              </div>
            ))}
          </div>

          {/* Photos */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Site Photographs
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", width: 90, height: 70, borderRadius: 8, overflow: "hidden", border: "1px solid var(--card-border)" }}>
                  <img src={p.dataUrl} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {!approved && (
                    <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", border: "none", borderRadius: 4, cursor: "pointer", padding: "2px 3px", display: "flex" }}>
                      <Trash2 size={10} color="#fff" />
                    </button>
                  )}
                </div>
              ))}
              {!approved && (
                <button onClick={() => fileRef.current?.click()} style={{ width: 90, height: 70, borderRadius: 8, border: "2px dashed var(--card-border)", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--muted)" }}>
                  <Camera size={18} />
                  <span style={{ fontSize: 10 }}>Add Photo</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--card-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "7px 16px", fontSize: 13, borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid var(--card-border)", color: "var(--foreground)" }}>
            Close
          </button>
          {!approved && canApprove && (
            <button onClick={handleApprove} disabled={saving} style={{ padding: "7px 20px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Approve Field Work"}
            </button>
          )}
          {!approved && !canApprove && checklist.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>Mark all checklist items to enable approval</span>
          )}
        </div>
      </div>
    </div>
  );
}
