"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const FinanceDashboard  = dynamic(() => import("./_tabs/FinanceDashboard"),  { ssr: false });
const FicaRegister      = dynamic(() => import("./_tabs/FicaRegister"),      { ssr: false });
const DunningPtp        = dynamic(() => import("./_tabs/DunningPtp"),        { ssr: false });
const SecurityDeposits  = dynamic(() => import("./_tabs/SecurityDeposits"),  { ssr: false });
const DisputesCredits   = dynamic(() => import("./_tabs/DisputesCredits"),   { ssr: false });
const ErpJournal        = dynamic(() => import("./_tabs/ErpJournal"),        { ssr: false });

const TABS = [
  { id: "dashboard",  label: "Finance Dashboard",  color: "#3b82f6" },
  { id: "fica",       label: "FI-CA Register",     color: "#818cf8" },
  { id: "dunning",    label: "Dunning & PTP",       color: "#ef4444" },
  { id: "deposits",   label: "Security Deposits",  color: "#f59e0b" },
  { id: "disputes",   label: "Disputes & Credits", color: "#06b6d4" },
  { id: "erp",        label: "ERP Revenue Post",   color: "#10b981" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function FinancePage() {
  const [active, setActive] = useState<TabId>("dashboard");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Finance Hub</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
          Payments · Receivables · Deposits · Collections · ERP Journal
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--card-border)", marginBottom: 28, overflowX: "auto", paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: "9px 18px",
              border: "none",
              borderBottom: active === t.id ? `2px solid ${t.color}` : "2px solid transparent",
              background: "transparent",
              color: active === t.id ? t.color : "var(--muted)",
              fontWeight: active === t.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === "dashboard" && <FinanceDashboard />}
        {active === "fica"      && <FicaRegister />}
        {active === "dunning"   && <DunningPtp />}
        {active === "deposits"  && <SecurityDeposits />}
        {active === "disputes"  && <DisputesCredits />}
        {active === "erp"       && <ErpJournal />}
      </div>
    </div>
  );
}
