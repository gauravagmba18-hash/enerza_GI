"use client";
import { useState } from "react";

const fmt = (n: number) =>
  "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  CLEARED:    { bg: "#10b98122", color: "#10b981" },
  OVERDUE:    { bg: "#ef444422", color: "#ef4444" },
  OPEN:       { bg: "#3b82f622", color: "#3b82f6" },
  PENDING:    { bg: "#3b82f622", color: "#3b82f6" },
  ISSUED:     { bg: "#f59e0b22", color: "#f59e0b" },
  APPLIED:    { bg: "#10b98122", color: "#10b981" },
  INVOICE:    { bg: "#3b82f622", color: "#3b82f6" },
  PAYMENT:    { bg: "#10b98122", color: "#10b981" },
  DUNNING_FEE:{ bg: "#ef444422", color: "#ef4444" },
  DEPOSIT:    { bg: "#818cf822", color: "#818cf8" },
  CREDIT_NOTE:{ bg: "#06b6d422", color: "#06b6d4" },
};

function Pill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: "var(--card-border)", color: "var(--muted)" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

export default function FicaRegister() {
  const [accountId, setAccountId] = useState("");
  const [query, setQuery] = useState("");
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const search = async (p = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/fica/ledger?accountId=${encodeURIComponent(query.trim())}&page=${p}&limit=50`);
    const json = await res.json();
    setLedger(json.data ?? json);
    setPage(p);
    setAccountId(query.trim());
    setLoading(false);
  };

  const balance = ledger?.balance ?? 0;
  const items: any[] = ledger?.items ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Search */}
      <div className="glass" style={{ padding: 20, borderRadius: 12, border: "1px solid var(--card-border)" }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Account Subledger Lookup</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(1)}
            placeholder="Enter Account ID (e.g. CAN-001)"
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--card-border)",
              background: "var(--sidebar)", color: "var(--foreground)", fontSize: 13,
            }}
          />
          <button
            onClick={() => search(1)}
            disabled={loading}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none", background: "#3b82f6",
              color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13,
            }}
          >
            {loading ? "…" : "Search"}
          </button>
        </div>
      </div>

      {/* Balance summary */}
      {ledger && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Account", value: accountId, color: "var(--foreground)" },
            { label: "Total Debit", value: fmt(ledger.totalDebit ?? 0), color: "#ef4444" },
            { label: "Total Credit", value: fmt(ledger.totalCredit ?? 0), color: "#10b981" },
            { label: "Net Balance", value: fmt(balance), color: balance > 0 ? "#ef4444" : "#10b981" },
          ].map((c) => (
            <div key={c.label} className="glass" style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid var(--card-border)" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontWeight: 700, color: c.color, fontSize: 15 }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ledger table */}
      {ledger && (
        <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", fontWeight: 600, fontSize: 13 }}>
            Open Items — {ledger.total ?? 0} entries
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Doc Type", "Doc No", "Posting Date", "Due Date", "Debit", "Credit", "Status"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h.includes("Debit") || h.includes("Credit") ? "right" : "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No items found for this account.</td></tr>
                )}
                {items.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--card-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "8px 12px" }}><Pill status={row.docType} /></td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{row.docNo}</td>
                    <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{row.postingDate ? new Date(row.postingDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: row.debit > 0 ? "#ef4444" : "var(--muted)" }}>{row.debit > 0 ? fmt(row.debit) : "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: row.credit > 0 ? "#10b981" : "var(--muted)" }}>{row.credit > 0 ? fmt(row.credit) : "—"}</td>
                    <td style={{ padding: "8px 12px" }}><Pill status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {ledger.total > 50 && (
            <div style={{ display: "flex", gap: 10, padding: "12px 18px", borderTop: "1px solid var(--card-border)", alignItems: "center", fontSize: 12 }}>
              <button disabled={page === 1} onClick={() => search(page - 1)}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--card-border)", background: "transparent", color: "var(--foreground)", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                ← Prev
              </button>
              <span style={{ color: "var(--muted)" }}>Page {page} · {ledger.total} items</span>
              <button disabled={page * 50 >= ledger.total} onClick={() => search(page + 1)}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--card-border)", background: "transparent", color: "var(--foreground)", cursor: page * 50 >= ledger.total ? "not-allowed" : "pointer" }}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
