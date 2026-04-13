"use client";
import { useState, useEffect } from "react";

const fmt = (n: number) =>
  "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DISPUTE_TYPES = [
  "TARIFF_ERROR", "PAYMENT_NOT_REFLECTED", "METER_READ_DISPUTED",
  "ESTIMATED_BILL", "DUPLICATE_BILL", "OTHER",
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  OPEN:               { bg: "#3b82f622", color: "#3b82f6" },
  INVESTIGATION:      { bg: "#f59e0b22", color: "#f59e0b" },
  FIELD_CHECK:        { bg: "#818cf822", color: "#818cf8" },
  AWAITING_DECISION:  { bg: "#f59e0b22", color: "#f59e0b" },
  RESOLVED:           { bg: "#10b98122", color: "#10b981" },
  PENDING:            { bg: "#3b82f622", color: "#3b82f6" },
  APPLIED:            { bg: "#10b98122", color: "#10b981" },
};

function Pill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: "var(--card-border)", color: "var(--muted)" };
  return <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{status}</span>;
}

export default function DisputesCredits() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ accountId: "", disputeType: "TARIFF_ERROR", disputedAmount: "", financialHold: false, assignedTo: "" });
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  const loadDisputes = () =>
    fetch("/api/disputes?limit=50").then((r) => r.json()).then((d) => setDisputes(d.data?.data ?? d.data ?? []));

  const loadCNs = () =>
    fetch("/api/credit-notes?limit=50").then((r) => r.json()).then((d) => setCreditNotes(d.data?.data ?? d.data ?? []));

  useEffect(() => { loadDisputes(); loadCNs(); }, []);

  const submitDispute = async () => {
    if (!form.accountId || !form.disputedAmount) return;
    setSaving(true);
    await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, disputedAmount: parseFloat(form.disputedAmount) }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ accountId: "", disputeType: "TARIFF_ERROR", disputedAmount: "", financialHold: false, assignedTo: "" });
    loadDisputes();
  };

  const resolve = async (dispute: any) => {
    setResolving(dispute.disputeId);
    await fetch(`/api/disputes/${dispute.disputeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", resolvedOn: new Date().toISOString(), resolution: "Resolved via Finance Hub" }),
    });
    // Auto-create credit note
    await fetch("/api/credit-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: dispute.accountId,
        disputeId: dispute.disputeId,
        reason: `Dispute ${dispute.disputeId} resolved — ${dispute.disputeType}`,
        amount: dispute.disputedAmount,
        status: "PENDING",
      }),
    });
    setResolving(null);
    loadDisputes();
    loadCNs();
  };

  const applyCN = async (cnId: string, billId: string) => {
    setApplying(cnId);
    await fetch(`/api/credit-notes/${cnId}?action=apply`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billId: billId || null }),
    });
    setApplying(null);
    loadCNs();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Disputes */}
      <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Disputes — {disputes.length}</span>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            + New Dispute
          </button>
        </div>

        {showForm && (
          <div style={{ padding: 18, borderBottom: "1px solid var(--card-border)", background: "rgba(239,68,68,0.05)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Account ID</label>
              <input value={form.accountId} onChange={(e) => setForm((p) => ({ ...p, accountId: e.target.value }))} placeholder="CAN-001"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12, width: 140 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Type</label>
              <select value={form.disputeType} onChange={(e) => setForm((p) => ({ ...p, disputeType: e.target.value }))}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12 }}>
                {DISPUTE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Disputed Amount (₹)</label>
              <input type="number" value={form.disputedAmount} onChange={(e) => setForm((p) => ({ ...p, disputedAmount: e.target.value }))} placeholder="1000"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12, width: 120 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Assigned To</label>
              <input value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))} placeholder="agent@enerza.in"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12, width: 160 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" id="fhold" checked={form.financialHold} onChange={(e) => setForm((p) => ({ ...p, financialHold: e.target.checked }))} />
              <label htmlFor="fhold" style={{ fontSize: 12, color: "var(--foreground)" }}>Financial Hold</label>
            </div>
            <button onClick={submitDispute} disabled={saving}
              style={{ padding: "7px 18px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {saving ? "Saving…" : "Submit"}
            </button>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Dispute ID", "Account", "Type", "Amount", "F-Hold", "Assigned To", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disputes.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No disputes.</td></tr>
              )}
              {disputes.map((d: any, i: number) => (
                <tr key={d.disputeId ?? i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{d.disputeId}</td>
                  <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{d.account?.customer?.fullName ?? d.accountId}</td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{d.disputeType}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#f59e0b" }}>{fmt(d.disputedAmount ?? 0)}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {d.financialHold ? <span style={{ color: "#ef4444", fontWeight: 700 }}>YES</span> : <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{d.assignedTo ?? "—"}</td>
                  <td style={{ padding: "8px 12px" }}><Pill status={d.status} /></td>
                  <td style={{ padding: "8px 12px" }}>
                    {d.status !== "RESOLVED" && (
                      <button onClick={() => resolve(d)} disabled={resolving === d.disputeId}
                        style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid #10b98144", background: "transparent", color: "#10b981", fontSize: 11, cursor: "pointer" }}>
                        {resolving === d.disputeId ? "…" : "Resolve"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Notes */}
      <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", fontWeight: 600, fontSize: 14 }}>
          Credit Notes — {creditNotes.length}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["CN ID", "Account", "Reason", "Amount", "Issued", "Applied To Bill", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creditNotes.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No credit notes.</td></tr>
              )}
              {creditNotes.map((cn: any, i: number) => (
                <tr key={cn.cnId ?? i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{cn.cnId}</td>
                  <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{cn.account?.customer?.fullName ?? cn.accountId}</td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cn.reason}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#06b6d4" }}>{fmt(cn.amount ?? 0)}</td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{cn.issuedOn ? new Date(cn.issuedOn).toLocaleDateString("en-IN") : "—"}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{cn.appliedToBillId ?? "—"}</td>
                  <td style={{ padding: "8px 12px" }}><Pill status={cn.status} /></td>
                  <td style={{ padding: "8px 12px" }}>
                    {cn.status === "PENDING" && (
                      <button onClick={() => applyCN(cn.cnId, cn.billId ?? "")} disabled={applying === cn.cnId}
                        style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid #06b6d444", background: "transparent", color: "#06b6d4", fontSize: 11, cursor: "pointer" }}>
                        {applying === cn.cnId ? "…" : "Apply"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
