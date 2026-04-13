"use client";
import { useState, useEffect } from "react";

const fmt = (n: number) =>
  "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calcInterest(principal: number, rate: number, depositDate: string) {
  const days = (Date.now() - new Date(depositDate).getTime()) / 86400000;
  return principal * (rate / 100) * (days / 365);
}

export default function SecurityDeposits() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ accountId: "", amount: "", depositType: "STANDARD", interestRate: "7.25" });
  const [saving, setSaving] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/security-deposits?limit=100")
      .then((r) => r.json())
      .then((d) => { setDeposits(d.data?.data ?? d.data ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const totalPrincipal = deposits.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalInterest = deposits.reduce((s, d) => s + calcInterest(d.amount ?? 0, d.interestRate ?? 7.25, d.paymentDate ?? d.createdAt), 0);

  const submit = async () => {
    if (!form.accountId || !form.amount) return;
    setSaving(true);
    await fetch("/api/security-deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: form.accountId,
        amount: parseFloat(form.amount),
        depositType: form.depositType,
        interestRate: parseFloat(form.interestRate),
        paymentDate: new Date().toISOString(),
        status: "PAID",
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ accountId: "", amount: "", depositType: "STANDARD", interestRate: "7.25" });
    load();
  };

  const refund = async (id: string) => {
    setRefunding(id);
    await fetch(`/api/security-deposits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REFUNDED" }),
    });
    setRefunding(null);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "Total Principal", value: fmt(totalPrincipal), color: "#818cf8" },
          { label: "Accrued Interest (7.25% p.a.)", value: fmt(totalInterest), color: "#f59e0b" },
          { label: "Total Value", value: fmt(totalPrincipal + totalInterest), color: "#10b981" },
        ].map((c) => (
          <div key={c.label} className="glass" style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid var(--card-border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>{c.label}</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Security Deposit Register — {deposits.length}</span>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#818cf8", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            + New Deposit
          </button>
        </div>

        {/* New deposit form */}
        {showForm && (
          <div style={{ padding: 18, borderBottom: "1px solid var(--card-border)", background: "rgba(129,140,248,0.05)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[
              { label: "Account ID", key: "accountId", type: "text", placeholder: "CAN-001" },
              { label: "Amount (₹)", key: "amount", type: "number", placeholder: "5000" },
              { label: "Interest Rate %", key: "interestRate", type: "number", placeholder: "7.25" },
            ].map((f) => (
              <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12, width: 140 }} />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Type</label>
              <select value={form.depositType} onChange={(e) => setForm((p) => ({ ...p, depositType: e.target.value }))}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12 }}>
                <option>STANDARD</option>
                <option>HT_ENHANCED</option>
              </select>
            </div>
            <button onClick={submit} disabled={saving}
              style={{ padding: "7px 18px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Deposit ID", "Account", "Type", "Principal", "Deposit Date", "Rate", "Accrued Interest", "Current Value", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "" || h.includes("Principal") || h.includes("Interest") || h.includes("Value") ? "right" : "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No deposits found.</td></tr>
                )}
                {deposits.map((d: any, i: number) => {
                  const interest = calcInterest(d.amount ?? 0, d.interestRate ?? 7.25, d.depositDate ?? d.createdAt);
                  return (
                    <tr key={d.depositId ?? i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{d.depositId}</td>
                      <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{d.accountId}</td>
                      <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{d.depositType ?? "STANDARD"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#818cf8", fontWeight: 600 }}>{fmt(d.amount ?? 0)}</td>
                      <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{d.paymentDate ? new Date(d.paymentDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{d.interestRate ?? 7.25}%</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#f59e0b" }}>{fmt(interest)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#10b981" }}>{fmt((d.amount ?? 0) + interest)}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: d.status === "PAID" ? "#10b98122" : d.status === "REFUNDED" ? "#ef444422" : "#f59e0b22", color: d.status === "PAID" ? "#10b981" : d.status === "REFUNDED" ? "#ef4444" : "#f59e0b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        {d.status !== "REFUNDED" && (
                          <button onClick={() => refund(d.depositId)} disabled={refunding === d.depositId}
                            style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid #ef444444", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
                            {refunding === d.depositId ? "…" : "Refund"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
