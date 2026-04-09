"use client";
import React, { useState } from 'react';
import { ShieldAlert, CreditCard, CalendarDays, TrendingUp, Download, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function FicaDashboard() {
  const [runningDunning, setRunningDunning] = useState(false);
  const [dunningResult, setDunningResult] = useState<string | null>(null);

  const triggerDunningRun = async () => {
    setRunningDunning(true);
    setDunningResult(null);
    try {
      const res = await fetch("/api/dunning-notices");
      const data = await res.json();
      const notices = Array.isArray(data.data) ? data.data : [];
      const open = notices.filter((n: any) => n.status === "ISSUED").length;
      setDunningResult(`Dunning check complete. ${open} active notice${open !== 1 ? "s" : ""} found.`);
    } catch {
      setDunningResult("Dunning check failed. Please try again.");
    } finally {
      setRunningDunning(false);
    }
  };

  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#ef4444,#f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: 10 }}>
            <CreditCard size={28} style={{ color: "#ef4444" }} />
            FI-CA Operations
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
            Financial Contract Accounting & Collections Management
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button
            onClick={triggerDunningRun}
            disabled={runningDunning}
            style={{ padding: "10px 16px", background: runningDunning ? "var(--card-border)" : "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: runningDunning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: runningDunning ? "none" : "0 4px 12px rgba(239,68,68,0.2)", transition: "all 0.2s" }}
          >
            {runningDunning ? "Processing..." : (<><ShieldAlert size={16} /> Run Dunning Check</>)}
          </button>
          {dunningResult && (
            <div style={{ fontSize: 12, color: dunningResult.includes("failed") ? "#ef4444" : "#10b981", padding: "4px 10px", background: dunningResult.includes("failed") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", borderRadius: 6, border: `1px solid ${dunningResult.includes("failed") ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}>
              {dunningResult}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#f43f5e", marginBottom: 12 }}>
            <div style={{ padding: 8, background: "rgba(244,63,94,0.1)", borderRadius: 8 }}><ShieldAlert size={20} /></div>
            <h3 style={{ fontWeight: 600, fontSize: 16 }}>Dunning Watchlist</h3>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: "var(--foreground)", marginTop: 8 }}>142</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Accounts with overdue notices</p>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--card-border)" }}>
              <Link href="/data/dunning-notices" style={{ color: "#f43f5e", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>View Ledger →</Link>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#10b981", marginBottom: 12 }}>
            <div style={{ padding: 8, background: "rgba(16,185,129,0.1)", borderRadius: 8 }}><CreditCard size={20} /></div>
            <h3 style={{ fontWeight: 600, fontSize: 16 }}>Security Deposits</h3>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: "var(--foreground)", marginTop: 8 }}>$1.4M</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Total collateral held across 8,400 accounts</p>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--card-border)" }}>
              <Link href="/data/security-deposits" style={{ color: "#10b981", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Manage Deposits →</Link>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#3b82f6", marginBottom: 12 }}>
            <div style={{ padding: 8, background: "rgba(59,130,246,0.1)", borderRadius: 8 }}><CalendarDays size={20} /></div>
            <h3 style={{ fontWeight: 600, fontSize: 16 }}>Budget Billing</h3>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: "var(--foreground)", marginTop: 8 }}>3,105</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Active levelized payment plans</p>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--card-border)" }}>
              <Link href="/data/budget-billing-plans" style={{ color: "#3b82f6", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>View Plans →</Link>
          </div>
        </div>
      </div>

      <div className="glass" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--card-border)", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>Critical Dunning Escalations (Level 3+)</h3>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: "rgba(244,63,94,0.1)", color: "#f43f5e", borderRadius: 12 }}>Requires Action</span>
        </div>
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, border: "1px solid var(--card-border)", background: "rgba(255,255,255,0.02)", transition: "all 0.2s" }}>
                       <div>
                           <p style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>Account #10928{i}4</p>
                           <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Notice ID: notice_fxe{i}29z &middot; Issued: 2 Days Ago</p>
                       </div>
                       <div style={{ textAlign: "right" }}>
                           <p style={{ fontSize: 14, fontWeight: 600, color: "#f43f5e" }}>Disconnection Pending</p>
                           <button style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6", background: "none", border: "none", marginTop: 6, cursor: "pointer" }}>Review Account</button>
                       </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
