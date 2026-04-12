"use client";
import React, { useState, useEffect } from "react";
import {
  ShieldAlert, CreditCard, TrendingUp, TrendingDown,
  Minus, DollarSign, AlertCircle, CheckCircle, Clock,
} from "lucide-react";
import Link from "next/link";

const fmt = (n: number) =>
  n >= 1_000_000
    ? `₹${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `₹${(n / 1_000).toFixed(1)}K`
    : `₹${n.toFixed(0)}`;

const pct = (a: number, b: number) =>
  b === 0 ? null : ((a - b) / b) * 100;

export default function FicaDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningDunning, setRunningDunning] = useState(false);
  const [dunningResult, setDunningResult] = useState<{ issued: number; processed: number } | null>(null);

  useEffect(() => {
    fetch("/api/fica/summary")
      .then((r) => r.json())
      .then((j) => { setData(j.data ?? j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const triggerDunningRun = async () => {
    setRunningDunning(true);
    setDunningResult(null);
    try {
      const res = await fetch("/api/dunning/run", { method: "POST" });
      const j = await res.json();
      setDunningResult(j.data ?? j);
      // Refresh summary
      const r2 = await fetch("/api/fica/summary");
      const j2 = await r2.json();
      setData(j2.data ?? j2);
    } catch {}
    finally { setRunningDunning(false); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--muted)" }}>
        Loading FI-CA data…
      </div>
    );
  }

  const bt     = data?.billingTrend ?? {};
  const trend  = bt.monthlyTrend ?? [];
  const aging  = data?.aging ?? [];
  const payments = data?.payments ?? {};
  const dunningRows = data?.dunningRows ?? [];
  const topOut = data?.topOutstanding ?? [];

  const maxTrend = Math.max(...trend.map((m: any) => m.billed), 1);

  const prevChange = pct(bt.currentMonthBilled ?? 0, bt.prev1MonthBilled ?? 0);

  return (
    <div style={{ padding: 0 }}>
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, background: "linear-gradient(135deg,#ef4444,#f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 10 }}>
            <CreditCard size={26} style={{ color: "#ef4444" }} />
            FI-CA Collections Dashboard
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Financial Contract Accounting — Live Receivables &amp; Collections
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button
            onClick={triggerDunningRun}
            disabled={runningDunning}
            style={{ padding: "10px 18px", background: runningDunning ? "var(--card-border)" : "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: runningDunning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: runningDunning ? "none" : "0 4px 12px rgba(239,68,68,0.2)", transition: "all 0.2s" }}
          >
            {runningDunning ? "Running…" : (<><ShieldAlert size={15} /> Run Dunning Engine</>)}
          </button>
          {dunningResult && (
            <div style={{ fontSize: 12, color: "#10b981", padding: "4px 10px", background: "rgba(16,185,129,0.1)", borderRadius: 6, border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ {dunningResult.issued} new notice{dunningResult.issued !== 1 ? "s" : ""} issued (scanned {dunningResult.processed})
            </div>
          )}
          <Link href="/finance" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none" }}>
            Open Finance Hub →
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Billed (All-Time)", value: fmt(data?.totalBilled ?? 0), sub: `${data?.totalBillCount ?? 0} bills`, color: "#3b82f6" },
          { label: "Total Outstanding", value: fmt(data?.totalPending ?? 0), sub: "Pending + Overdue", color: "#f59e0b" },
          { label: "Collection Rate", value: `${data?.collectionRate ?? 0}%`, sub: "Collected / Billed", color: "#10b981" },
          { label: "Active Dunning", value: String(data?.dunningCount ?? 0), sub: "ISSUED notices", color: "#ef4444" },
          { label: "Security Deposits", value: fmt(data?.deposits?.total ?? 0), sub: `${data?.deposits?.count ?? 0} accounts`, color: "#8b5cf6" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass" style={{ padding: "18px 20px" }}>
            <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{kpi.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: kpi.color, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</p>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Billing Trend + Payments ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Trend chart */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Monthly Billing Trend</h3>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Last 13 months</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Current Month</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>{fmt(bt.currentMonthBilled ?? 0)}</p>
              {prevChange !== null && (
                <p style={{ fontSize: 12, color: prevChange >= 0 ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  {prevChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(prevChange).toFixed(1)}% vs prev month
                </p>
              )}
            </div>
          </div>
          {/* Bar chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100, marginBottom: 8 }}>
            {trend.map((m: any, i: number) => {
              const isCurrentMonth = i === trend.length - 1;
              const h = Math.max(4, (m.billed / maxTrend) * 100);
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div title={`${m.label}: ${fmt(m.billed)}`} style={{ width: "100%", height: `${h}%`, background: isCurrentMonth ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : "rgba(59,130,246,0.35)", borderRadius: "3px 3px 0 0", transition: "height 0.3s", minHeight: 4 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
            <span>{trend[0]?.label}</span>
            <span>{trend[trend.length - 1]?.label}</span>
          </div>
          {/* KPI Comparison Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--card-border)" }}>
            {[
              { label: "vs Prev 1M", value: bt.prev1MonthBilled ?? 0 },
              { label: "vs 3M Avg",  value: bt.prev3MonthAvg   ?? 0 },
              { label: "vs 6M Avg",  value: bt.prev6MonthAvg   ?? 0 },
              { label: "vs 12M Avg", value: bt.prev12MonthAvg  ?? 0 },
            ].map((c) => {
              const diff = pct(bt.currentMonthBilled ?? 0, c.value);
              return (
                <div key={c.label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>{c.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{fmt(c.value)}</p>
                  {diff !== null && (
                    <p style={{ fontSize: 11, color: diff >= 0 ? "#10b981" : "#ef4444" }}>
                      {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payments breakdown */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Payments Breakdown</h3>
          {[
            { label: "Collected", color: "#10b981", bg: "rgba(16,185,129,0.1)", data: payments.collected, icon: <CheckCircle size={16} /> },
            { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  data: payments.pending,   icon: <Clock size={16} /> },
            { label: "Failed",    color: "#ef4444", bg: "rgba(239,68,68,0.1)",   data: payments.failed,    icon: <AlertCircle size={16} /> },
          ].map((row) => (
            <div key={row.label} style={{ padding: "14px 16px", borderRadius: 10, background: row.bg, border: `1px solid ${row.color}22`, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: row.color, marginBottom: 6 }}>
                {row.icon}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{row.label}</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", marginBottom: 2 }}>{fmt(row.data?.amount ?? 0)}</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{row.data?.count ?? 0} transactions</p>
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--card-border)" }}>
            <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>BUDGET BILLING PLANS</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#8b5cf6" }}>{data?.budgetPlanCount ?? 0}</p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Active levelized plans</p>
          </div>
        </div>
      </div>

      {/* ── AR Aging ─────────────────────────────────────────────────────────────── */}
      <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Accounts Receivable Aging</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {aging.map((bucket: any, i: number) => {
            const colors = ["#10b981", "#f59e0b", "#ef4444", "#7c3aed"];
            const c = colors[i] ?? "#3b82f6";
            const totalAging = aging.reduce((s: number, b: any) => s + b.amount, 0);
            const barPct = totalAging > 0 ? (bucket.amount / totalAging) * 100 : 0;
            return (
              <div key={bucket.label} style={{ padding: 16, borderRadius: 10, border: `1px solid ${c}33`, background: `${c}08` }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: c, marginBottom: 8 }}>{bucket.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{fmt(bucket.amount)}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{bucket.count} bill{bucket.count !== 1 ? "s" : ""}</p>
                <div style={{ height: 6, background: "var(--card-border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${barPct}%`, height: "100%", background: c, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{barPct.toFixed(1)}% of total AR</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dunning Escalations + Top Outstanding ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 24 }}>
        {/* Dunning table */}
        <div className="glass" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Active Dunning Notices</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 10 }}>{data?.dunningCount ?? 0} total</span>
              <Link href="/data/dunning-notices" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none" }}>View All →</Link>
            </div>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", background: "rgba(255,255,255,0.02)" }}>
                  {["Customer", "Account", "Level", "Action", "Bill Amt", "Due Date", "Issued"].map((h) => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dunningRows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "24px 14px", textAlign: "center", color: "var(--muted)" }}>No active dunning notices</td></tr>
                )}
                {dunningRows.slice(0, 20).map((n: any) => (
                  <tr key={n.noticeId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "8px 14px" }}>
                      {n.customerId ? (
                        <Link href={`/crm/customers/${n.customerId}`} style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>{n.customerName}</Link>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>{n.customerName}</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{n.accountId?.slice(-8)}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{n.levelName}</span>
                    </td>
                    <td style={{ padding: "8px 14px", color: "var(--muted)" }}>{n.levelAction}</td>
                    <td style={{ padding: "8px 14px", fontFamily: "monospace", fontWeight: 600 }}>₹{(n.billAmount ?? 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "8px 14px", color: n.billDueDate && new Date(n.billDueDate) < new Date() ? "#ef4444" : "var(--muted)" }}>
                      {n.billDueDate ? new Date(n.billDueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                    <td style={{ padding: "8px 14px", color: "var(--muted)" }}>
                      {n.issuedAt ? new Date(n.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top outstanding */}
        <div className="glass" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Top Outstanding Accounts</h3>
            <Link href="/data/bills" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none" }}>View Bills →</Link>
          </div>
          <div style={{ padding: "8px 0", maxHeight: 360, overflowY: "auto" }}>
            {topOut.length === 0 && (
              <p style={{ padding: "24px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No outstanding balances</p>
            )}
            {topOut.slice(0, 12).map((acct: any, i: number) => (
              <div key={acct.accountId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: i < topOut.length - 1 ? "1px solid var(--card-border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {acct.customerId ? (
                      <Link href={`/crm/customers/${acct.customerId}`} style={{ color: "#3b82f6", textDecoration: "none" }}>{acct.customerName}</Link>
                    ) : acct.customerName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{acct.billCount} bill{acct.billCount !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{fmt(acct.outstandingAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Links ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "Dunning Levels",   href: "/data/dunning-levels",   color: "#ef4444" },
          { label: "Dunning Notices",  href: "/data/dunning-notices",  color: "#f43f5e" },
          { label: "Security Deposits",href: "/data/security-deposits",color: "#10b981" },
          { label: "Budget Plans",     href: "/data/budget-billing-plans", color: "#3b82f6" },
          { label: "Payment Orders",   href: "/data/payment-orders",   color: "#8b5cf6" },
          { label: "Finance Hub",      href: "/finance",               color: "#818cf8" },
        ].map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
            <div className="glass" style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${link.color}22`, transition: "all 0.2s", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${link.color}10`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: link.color }}>{link.label} →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
