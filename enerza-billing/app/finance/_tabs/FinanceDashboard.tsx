"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/finance/summary").then((r) => r.json()),
      fetch("/api/finance/journal-preview?history=1").then((r) => r.json()),
    ]).then(([s, h]) => {
      setSummary(s.data ?? s);
      setHistory(h.data?.history ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: "var(--muted)", padding: 32 }}>Loading…</div>;

  const { totalBilled = 0, totalCollected = 0, periodKey, segments = [], lineTypes = [], matrix = {}, byLineType = {} } = summary ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Total Billed (Period)", value: fmt(totalBilled), color: "#3b82f6" },
          { label: "Total Collected", value: fmt(totalCollected), color: "#10b981" },
          { label: "Period", value: periodKey ?? "—", color: "#818cf8" },
        ].map((c) => (
          <div key={c.label} className="glass" style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--card-border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue matrix */}
      <div className="glass" style={{ padding: 20, borderRadius: 12, border: "1px solid var(--card-border)" }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "var(--foreground)" }}>Revenue Breakdown — Line Type × Segment</div>
        {lineTypes.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>No billing data for current period.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>Line Type</th>
                  {segments.map((seg: string) => (
                    <th key={seg} style={{ padding: "8px 12px", textAlign: "right", color: "var(--muted)", fontWeight: 600 }}>{seg}</th>
                  ))}
                  <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--foreground)", fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineTypes.map((lt: string, i: number) => (
                  <tr key={lt} style={{ borderBottom: "1px solid var(--card-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 500, color: "var(--foreground)" }}>{lt}</td>
                    {segments.map((seg: string) => (
                      <td key={seg} style={{ padding: "8px 12px", textAlign: "right", color: "var(--muted)" }}>
                        {matrix[lt]?.[seg] ? fmt(matrix[lt][seg]) : "—"}
                      </td>
                    ))}
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#3b82f6" }}>
                      {fmt(byLineType[lt] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ERP posting history */}
      <div className="glass" style={{ padding: 20, borderRadius: 12, border: "1px solid var(--card-border)" }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "var(--foreground)" }}>ERP Posting History (last 12)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              {["Period", "ERP Ref", "Total DR", "Total CR", "Status", "Posted On"].map((h) => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 16, color: "var(--muted)", textAlign: "center" }}>No postings yet.</td></tr>
            )}
            {history.map((row: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "7px 10px", color: "var(--foreground)" }}>{row.period}</td>
                <td style={{ padding: "7px 10px", fontFamily: "monospace", color: "#818cf8" }}>{row.erpRef}</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: "#3b82f6" }}>{fmt(row.totalDr ?? 0)}</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: "#10b981" }}>{fmt(row.totalCr ?? 0)}</td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{ background: "#10b98122", color: "#10b981", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{row.status}</span>
                </td>
                <td style={{ padding: "7px 10px", color: "var(--muted)" }}>{row.postedOn ? new Date(row.postedOn).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick links */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "FI-CA Dashboard →", href: "/fica", color: "#ef4444" },
          { label: "Disputes →", href: "/data/disputes", color: "#f59e0b" },
          { label: "Credit Notes →", href: "/data/credit-notes", color: "#818cf8" },
          { label: "Dunning Levels →", href: "/data/dunning-levels", color: "#3b82f6" },
        ].map((l) => (
          <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
            <span style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${l.color}44`, color: l.color, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {l.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
