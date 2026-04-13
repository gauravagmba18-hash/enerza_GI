"use client";
import { useState, useEffect } from "react";

const fmt = (n: number) =>
  "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ErpJournal() {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const loadJournal = (p: string) => {
    setLoading(true);
    setPostResult(null);
    fetch(`/api/finance/journal-preview?periodKey=${p}`)
      .then((r) => r.json())
      .then((d) => { setJournal(d.data ?? d); setLoading(false); });
  };

  useEffect(() => {
    loadJournal(defaultPeriod);
    fetch("/api/finance/journal-preview?history=1")
      .then((r) => r.json())
      .then((d) => setHistory(d.data?.history ?? []));
  }, []);

  const post = async () => {
    setPosting(true);
    const res = await fetch(`/api/finance/journal-preview?periodKey=${period}`, { method: "POST" });
    const json = await res.json();
    setPostResult(json.data ?? json);
    setPosting(false);
    // Refresh history
    fetch("/api/finance/journal-preview?history=1")
      .then((r) => r.json())
      .then((d) => setHistory(d.data?.history ?? []));
  };

  const lines: any[] = journal?.journalLines ?? [];
  const totals = journal?.totals ?? { totalDr: 0, totalCr: 0 };
  const balanced = Math.abs((totals.totalDr ?? 0) - (totals.totalCr ?? 0)) < 0.01;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Period selector */}
      <div className="glass" style={{ padding: 20, borderRadius: 12, border: "1px solid var(--card-border)", display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Period (YYYY-MM)</label>
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 13 }} />
        </div>
        <button onClick={() => loadJournal(period)} disabled={loading}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          {loading ? "Loading…" : "Preview Journal"}
        </button>
        {lines.length > 0 && !postResult && (
          <button onClick={post} disabled={posting || !balanced}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: balanced ? "#10b981" : "#6b7280", color: "#fff", fontWeight: 600, fontSize: 13, cursor: balanced ? "pointer" : "not-allowed" }}
            title={balanced ? undefined : "Journal does not balance"}>
            {posting ? "Posting…" : "Post to ERP ↑"}
          </button>
        )}
        {postResult && (
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "#10b98122", color: "#10b981", fontSize: 13, fontWeight: 600 }}>
            ✓ Posted — ERP Ref: {postResult.erpRef}
          </div>
        )}
      </div>

      {/* Balance indicator */}
      {lines.length > 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Total Debit (AR)", value: fmt(totals.totalDr ?? 0), color: "#3b82f6" },
            { label: "Total Credit (Revenue + Tax)", value: fmt(totals.totalCr ?? 0), color: "#10b981" },
            { label: "Balance Check", value: balanced ? "✓ BALANCED" : "✗ UNBALANCED", color: balanced ? "#10b981" : "#ef4444" },
          ].map((c) => (
            <div key={c.label} className="glass" style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: `1px solid ${c.color}33` }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontWeight: 700, color: c.color, fontSize: 16 }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Journal lines */}
      {lines.length > 0 && (
        <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", fontWeight: 600, fontSize: 14 }}>
            Journal Entry Preview — {journal?.period}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["GL Code", "GL Name", "Cost Centre", "Debit", "Credit", "Tax Code", "Reference"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Debit" || h === "Credit" ? "right" : "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--card-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#818cf8" }}>{line.glCode}</td>
                    <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{line.glName}</td>
                    <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{line.costCentre ?? "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: line.debit > 0 ? "#3b82f6" : "var(--muted)", fontWeight: line.debit > 0 ? 600 : 400 }}>
                      {line.debit > 0 ? fmt(line.debit) : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: line.credit > 0 ? "#10b981" : "var(--muted)", fontWeight: line.credit > 0 ? 600 : 400 }}>
                      {line.credit > 0 ? fmt(line.credit) : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{line.taxCode ?? "—"}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{line.reference ?? "—"}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: "rgba(255,255,255,0.04)", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "10px 12px", color: "var(--foreground)" }}>TOTALS</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#3b82f6" }}>{fmt(totals.totalDr ?? 0)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#10b981" }}>{fmt(totals.totalCr ?? 0)}</td>
                  <td colSpan={2} style={{ padding: "10px 12px", textAlign: "right" }}>
                    <span style={{ color: balanced ? "#10b981" : "#ef4444", fontSize: 11 }}>{balanced ? "✓ Balanced" : "✗ Not Balanced"}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lines.length === 0 && !loading && (
        <div className="glass" style={{ padding: 40, borderRadius: 12, border: "1px solid var(--card-border)", textAlign: "center", color: "var(--muted)" }}>
          No billing data for {period}. Select a different period or run the billing engine first.
        </div>
      )}

      {/* Posting history */}
      {history.length > 0 && (
        <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", fontWeight: 600, fontSize: 14 }}>
            Posting History (last {history.length})
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Period", "ERP Ref", "Total DR", "Total CR", "Status", "Posted On"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "7px 12px", color: "var(--foreground)" }}>{row.period}</td>
                  <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#818cf8" }}>{row.erpRef}</td>
                  <td style={{ padding: "7px 12px", color: "#3b82f6" }}>{fmt(row.totalDr ?? 0)}</td>
                  <td style={{ padding: "7px 12px", color: "#10b981" }}>{fmt(row.totalCr ?? 0)}</td>
                  <td style={{ padding: "7px 12px" }}>
                    <span style={{ background: "#10b98122", color: "#10b981", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{row.status}</span>
                  </td>
                  <td style={{ padding: "7px 12px", color: "var(--muted)" }}>{row.postedOn ? new Date(row.postedOn).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
