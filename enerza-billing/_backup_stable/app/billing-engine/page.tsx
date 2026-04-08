"use client";
import { useState, useCallback } from "react";
import {
  RatingResult, GeneratedBill, PaymentOrder, ReconResult,
  RATE_PLANS, PLAN_MAP,
} from "@/lib/billing-engine";

// ── Types ─────────────────────────────────────────────────────
type Tab = "bills" | "payment" | "recon" | "pipeline";
type PipeStep = "idle" | "read" | "rate" | "bill" | "pay" | "recon";
type UtilKey = "GAS_PNG" | "ELECTRICITY" | "WATER" | "CNG";

const UTIL_LABELS: Record<string, string> = {
  GAS_PNG: "Gas PNG", ELECTRICITY: "Electricity", WATER: "Water", CNG: "CNG",
};
const UTIL_COLORS: Record<string, string> = {
  GAS_PNG: "#00c896", ELECTRICITY: "#ffbc1f", WATER: "#2f9bf5", CNG: "#ff6b35",
};
const UTIL_SEGMENTS: Record<string, string[]> = {
  GAS_PNG:     ["DOMESTIC", "COMMERCIAL", "INDUSTRIAL"],
  ELECTRICITY: ["DOMESTIC", "COMMERCIAL"],
  WATER:       ["DOMESTIC"],
  CNG:         ["PRIVATE", "COMMERCIAL"],
};
const DEFAULT_READINGS: Record<string, { prev: number; curr: number; uom: string }> = {
  GAS_PNG:     { prev: 1048.4, curr: 1060.8, uom: "SCM" },
  ELECTRICITY: { prev: 8700,   curr: 8945,   uom: "kWh" },
  WATER:       { prev: 221.0,  curr: 234.5,  uom: "KL" },
  CNG:         { prev: 0,      curr: 4.2,    uom: "KG" },
};
const PIPE_STEPS: { key: PipeStep; label: string; emoji: string }[] = [
  { key: "read",  label: "Meter Read", emoji: "📊" },
  { key: "rate",  label: "Rating",     emoji: "📐" },
  { key: "bill",  label: "Bill Gen",   emoji: "📄" },
  { key: "pay",   label: "Payment",    emoji: "💳" },
  { key: "recon", label: "Recon",      emoji: "✅" },
];

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const r2 = (v: number) => Math.round(v * 100) / 100;

// ── Log helper ────────────────────────────────────────────────
interface LogLine { ts: string; msg: string; kind: "ok" | "info" | "warn" }

function nowTs() { return new Date().toTimeString().slice(0, 8); }

// ─────────────────────────────────────────────────────────────
export default function BillingEnginePage() {
  const [utility, setUtility] = useState<UtilKey>("GAS_PNG");
  const [segment, setSegment] = useState("DOMESTIC");
  const [prevReading, setPrevReading] = useState(1048.4);
  const [currReading, setCurrReading] = useState(1060.8);
  const [period, setPeriod] = useState("April 2026");
  const [billDate, setBillDate] = useState("2026-04-08");

  const [bills, setBills] = useState<GeneratedBill[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [recon, setRecon] = useState<ReconResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("bills");
  const [pipeStep, setPipeStep] = useState<PipeStep>("idle");
  const [pipeDetail, setPipeDetail] = useState("Click Generate Bill to start the billing pipeline");
  const [logs, setLogs] = useState<LogLine[]>([
    { ts: "00:00:00", msg: "BFS Enerza Billing Engine v2.0 ready", kind: "ok" },
    { ts: "00:00:00", msg: "Rate plans loaded: 6 (Gas×3, Elec×1, Water×1, CNG×1)", kind: "info" },
    { ts: "00:00:00", msg: "Payment channels: UPI, BBPS, Card, Net Banking, Cash", kind: "info" },
    { ts: "00:00:00", msg: "─── Enter readings and click Generate Bill ───", kind: "info" },
  ]);
  const [expandedBills, setExpandedBills] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const addLog = useCallback((msg: string, kind: LogLine["kind"] = "info") => {
    setLogs((prev) => [...prev, { ts: nowTs(), msg, kind }]);
  }, []);

  // ── Utility change ─────────────────────────────────────────
  const handleUtilityChange = (u: UtilKey) => {
    setUtility(u);
    const segs = UTIL_SEGMENTS[u];
    setSegment(segs[0]);
    const d = DEFAULT_READINGS[u];
    setPrevReading(d.prev);
    setCurrReading(d.curr);
  };

  const consumption = r2(Math.max(0, currReading - prevReading));
  const uom = DEFAULT_READINGS[utility]?.uom ?? "SCM";
  const planId = PLAN_MAP[utility]?.[segment] ?? null;

  // ── Generate Bill ──────────────────────────────────────────
  const handleGenerate = async () => {
    if (!planId) { addLog("No rate plan for this utility/segment", "warn"); return; }
    if (consumption <= 0) { addLog("Consumption is 0 — check meter readings", "warn"); return; }

    setLoading(true);
    setPipeStep("read");
    setPipeDetail(`Reading: ${prevReading} → ${currReading} = ${consumption.toFixed(3)} ${uom} consumption`);
    addLog(`Meter read processed: ${consumption.toFixed(3)} ${uom}`);

    setTimeout(async () => {
      setPipeStep("rate");
      addLog(`Applying rate plan: ${planId}`);

      try {
        const res = await fetch("/api/billing/engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate", utility, segment, planId,
            prevReading, currReading, period, billDate, uom,
            accountId: "ACCT000001", connectionId: "CONN000001", cycleId: "BC-MONTHLY-1",
          }),
        });
        const data = await res.json();
        const bill: GeneratedBill = data.bill;

        setPipeStep("bill");
        setPipeDetail(`Bill ${bill.billId} generated | Due: ${bill.dueDate} | Total: ${fmt(bill.rating.totalAmount)}`);
        addLog(`Rating: Net=${fmt(bill.rating.netAmount)}  Tax=${fmt(bill.rating.taxAmount)}  Total=${fmt(bill.rating.totalAmount)}`, "ok");
        addLog(`Bill generated: ${bill.billId} for ${period}`, "ok");

        setBills((prev) => [bill, ...prev]);
      } catch (e) {
        addLog(`Error: ${String(e)}`, "warn");
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  // ── Payment ────────────────────────────────────────────────
  const handlePay = async (billIdx: number, channel: string) => {
    const bill = bills[billIdx];
    if (!bill || bill.status === "PAID") return;

    try {
      const res = await fetch("/api/billing/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", bill, channel }),
      });
      const data = await res.json();
      const order: PaymentOrder = data.order;

      setBills((prev) => prev.map((b, i) => i === billIdx ? { ...b, status: "PAID" as const } : b));
      setOrders((prev) => [order, ...prev]);
      setPipeStep("pay");
      setPipeDetail(`Payment SUCCESS | ${channel} | ${order.gatewayRef} | ${fmt(order.amount)}`);
      addLog(`Payment received: ${bill.billId} via ${channel} | Ref: ${order.gatewayRef} | ${fmt(order.amount)}`, "ok");

      // Auto-reconcile
      const allOrders = [order, ...orders];
      setTimeout(async () => {
        const rRes = await fetch("/api/billing/engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reconcile", orders: allOrders }),
        });
        const rData = await rRes.json();
        const rec: ReconResult = rData.reconciliation;
        setRecon(rec);
        setPipeStep("recon");
        setPipeDetail(`Settlement ${rec.settlementId} | ${rec.matchedCount} matched | Net ${fmt(rec.netAmount)}`);
        addLog(`Reconciliation: ${rec.matchedCount} matched, Net = ${fmt(rec.netAmount)}`, "ok");
      }, 400);
    } catch (e) {
      addLog(`Payment error: ${String(e)}`, "warn");
    }
  };

  const toggleBill = (i: number) => {
    setExpandedBills((prev) => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
  };

  const accentColor = UTIL_COLORS[utility] ?? "#06b6d4";
  const totalNet   = r2(bills.reduce((s, b) => s + b.rating.netAmount, 0));
  const totalTax   = r2(bills.reduce((s, b) => s + b.rating.taxAmount, 0));
  const totalDue   = r2(bills.reduce((s, b) => s + b.rating.totalAmount, 0));

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header strip ───────────────────────────────── */}
      <div style={{ background: "#0d1117", padding: "14px 28px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: -0.3, fontFamily: "Syne, sans-serif" }}>
          BFS <span style={{ color: "#00c896" }}>Enerza</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>|</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "monospace" }}>
          Billing Engine
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["GAS_PNG", "ELECTRICITY", "WATER", "CNG"] as UtilKey[]).map((u) => (
            <button key={u} onClick={() => handleUtilityChange(u)} style={{
              padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${UTIL_COLORS[u]}66`,
              background: utility === u ? `${UTIL_COLORS[u]}25` : "transparent",
              color: UTIL_COLORS[u], transition: "all 0.15s",
              boxShadow: utility === u ? `0 0 0 1px ${UTIL_COLORS[u]}` : "none",
              fontFamily: "monospace",
            }}>
              {UTIL_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── LEFT: Calculator + Log ───────────────────── */}
        <div>
          {/* Calculator panel */}
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "Syne, sans-serif" }}>Rate Calculator</div>
            </div>
            <div style={{ padding: 16 }}>
              {/* Utility Type */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: "monospace" }}>Utility Type</label>
                <select value={utility} onChange={(e) => handleUtilityChange(e.target.value as UtilKey)}
                  style={{ width: "100%", border: "1px solid var(--card-border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "var(--background)", color: "var(--foreground)", outline: "none" }}>
                  {(["GAS_PNG", "ELECTRICITY", "WATER", "CNG"] as UtilKey[]).map((u) => (
                    <option key={u} value={u}>{UTIL_LABELS[u]}</option>
                  ))}
                </select>
              </div>

              {/* Consumer Segment */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: "monospace" }}>Consumer Segment</label>
                <select value={segment} onChange={(e) => setSegment(e.target.value)}
                  style={{ width: "100%", border: "1px solid var(--card-border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "var(--background)", color: "var(--foreground)", outline: "none" }}>
                  {UTIL_SEGMENTS[utility]?.map((s) => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              {/* Readings */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[["Previous Reading", prevReading, (v: number) => setPrevReading(v)], ["Current Reading", currReading, (v: number) => setCurrReading(v)]].map(([label, val, setter]) => (
                  <div key={label as string}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: "monospace" }}>{label as string}</label>
                    <input type="number" step="0.1" value={val as number}
                      onChange={(e) => (setter as (v: number) => void)(parseFloat(e.target.value) || 0)}
                      style={{ width: "100%", border: "1px solid var(--card-border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "var(--background)", color: "var(--foreground)", outline: "none" }} />
                  </div>
                ))}
              </div>

              {/* Consumption preview */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: "monospace" }}>Consumption Preview</label>
                <input readOnly value={`${consumption.toFixed(3)} ${uom}`}
                  style={{ width: "100%", border: "1px solid var(--card-border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "var(--background)", color: accentColor, outline: "none", fontFamily: "monospace", fontWeight: 600 }} />
              </div>

              {/* Period & Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: "monospace" }}>Billing Period</label>
                  <input value={period} onChange={(e) => setPeriod(e.target.value)}
                    style={{ width: "100%", border: "1px solid var(--card-border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "var(--background)", color: "var(--foreground)", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: "monospace" }}>Bill Date</label>
                  <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)}
                    style={{ width: "100%", border: "1px solid var(--card-border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "var(--background)", color: "var(--foreground)", outline: "none" }} />
                </div>
              </div>

              {/* Rate Plan badge */}
              {planId && (
                <div style={{ marginBottom: 12, padding: "8px 10px", background: `${accentColor}12`, borderRadius: 6, border: `1px solid ${accentColor}30`, fontSize: 11, fontFamily: "monospace", color: accentColor }}>
                  📐 Rate Plan: {planId} — {RATE_PLANS[planId]?.planName}
                </div>
              )}

              {/* Generate button */}
              <button onClick={handleGenerate} disabled={loading || !planId || consumption <= 0}
                style={{ width: "100%", padding: 12, background: loading ? "#333" : "#0d1117", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.3, transition: "all 0.15s", fontFamily: "Syne, sans-serif", opacity: loading ? 0.7 : 1 }}>
                {loading ? "⏳ Generating…" : "▶  Generate Bill"}
              </button>
            </div>
          </div>

          {/* Engine Log */}
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden", marginTop: 14 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "Syne, sans-serif" }}>Engine Log</div>
            </div>
            <div style={{ background: "#0d1117", padding: "12px 14px", fontFamily: "monospace", fontSize: 11.5, lineHeight: 1.7, maxHeight: 220, overflowY: "auto" }}>
              {logs.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#4a5568" }}>{l.ts}</span>
                  <span style={{ color: l.kind === "ok" ? "#00c896" : l.kind === "warn" ? "#ffbc1f" : "#7dd3fc" }}>
                    {l.kind === "ok" ? "✓" : l.kind === "warn" ? "⚠" : "ℹ"}
                  </span>
                  <span style={{ color: "#e2e8f0" }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Tabs ──────────────────────────────── */}
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "2px solid var(--card-border)", background: "var(--background)" }}>
            {(["bills", "payment", "recon", "pipeline"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: "12px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", borderBottom: activeTab === t ? `2px solid ${accentColor}` : "2px solid transparent", marginBottom: -2, color: activeTab === t ? "var(--foreground)" : "var(--muted)", transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "Syne, sans-serif" }}>
                {t === "bills" ? "Bills" : t === "payment" ? "Payment Flow" : t === "recon" ? "Reconciliation" : "Engine Pipeline"}
              </button>
            ))}
          </div>

          <div style={{ padding: 18 }}>

            {/* ── BILLS TAB ────────────────────────────── */}
            {activeTab === "bills" && (
              <div>
                {/* Totals strip */}
                {bills.length > 0 && (
                  <div style={{ background: "#0d1117", borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
                    {[["Bills Generated", String(bills.length), "var(--foreground)"], ["Total Net", fmt(totalNet), "#fff"], ["Total Tax", fmt(totalTax), "#fff"], ["Total Due", fmt(totalDue), accentColor]].map(([l, v, c]) => (
                      <div key={l as string}>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "monospace" }}>{l}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 500, color: c as string }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bill cards */}
                {bills.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, fontFamily: "Syne, sans-serif" }}>No bills generated yet</div>
                    <div>Use the calculator to generate your first bill</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {bills.map((bill, i) => {
                      const c = UTIL_COLORS[bill.rating.utility] ?? accentColor;
                      const expanded = expandedBills.has(i);
                      return (
                        <div key={i} style={{ border: `1px solid var(--card-border)`, borderTop: `3px solid ${c}`, borderRadius: 10, overflow: "hidden" }}>
                          {/* Card header */}
                          <div onClick={() => toggleBill(i)} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "var(--background)" }}>
                            <div style={{ padding: "2px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 10, fontWeight: 600, background: `${c}20`, color: c }}>
                              {UTIL_LABELS[bill.rating.utility] ?? bill.rating.utility}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "Syne, sans-serif" }}>
                                {bill.rating.utility === "GAS_PNG" ? "Domestic PNG" : bill.rating.utility === "ELECTRICITY" ? "Domestic Electricity" : bill.rating.utility === "WATER" ? "Domestic Water" : "CNG Vehicle"} — {bill.period}
                              </div>
                              <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>
                                {bill.billId} · Due {bill.dueDate}
                              </div>
                            </div>
                            {bill.status === "PAID" && (
                              <div style={{ fontSize: 11, fontFamily: "monospace", background: "rgba(13,184,113,0.12)", color: "#007040", border: "1px solid rgba(13,184,113,0.3)", borderRadius: 20, padding: "2px 10px" }}>✓ PAID</div>
                            )}
                            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 500 }}>{fmt(bill.rating.totalAmount)}</div>
                            <div style={{ fontSize: 14, color: "var(--muted)", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>▼</div>
                          </div>

                          {/* Card body */}
                          {expanded && (
                            <div style={{ padding: "14px 16px", borderTop: "1px solid var(--card-border)" }}>
                              {/* Readings */}
                              <div style={{ display: "flex", gap: 16, marginBottom: 14, padding: "10px 14px", background: "var(--background)", borderRadius: 6, fontFamily: "monospace", fontSize: 12 }}>
                                {[["Previous", bill.prevReading + " " + bill.uom], ["Current", bill.currReading + " " + bill.uom], ["Consumption", bill.consumption.toFixed(3) + " " + bill.uom], ["Rate Plan", bill.planId]].map(([l, v]) => (
                                  <div key={l as string}>
                                    <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--muted)", letterSpacing: 0.5 }}>{l}</div>
                                    <div style={{ fontSize: 14, fontWeight: 500, color: l === "Consumption" ? c : "var(--foreground)" }}>{v}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Line items table */}
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 10 }}>
                                <thead>
                                  <tr>
                                    {["Charge Description", "Amount (₹)", "Rate"].map((h) => (
                                      <th key={h} style={{ textAlign: h !== "Charge Description" ? "right" : "left", padding: "5px 8px", borderBottom: "1px solid var(--card-border)", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", fontWeight: 500 }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {bill.rating.lines.map((line, li) => (
                                    <tr key={li} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", opacity: line.type === "TAX" ? 0.75 : 1 }}>
                                      <td style={{ padding: "6px 8px", fontStyle: line.type === "TAX" ? "italic" : "normal" }}>{line.name}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace" }}>{line.amount === 0 ? "—" : fmt(line.amount)}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>
                                        {line.type === "TAX" ? `${(line.rate * 100).toFixed(0)}%` : line.qty !== null ? `${fmt(line.rate)}/${line.uom}` : fmt(line.rate)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* Totals */}
                              <div style={{ borderTop: "2px solid var(--card-border)", paddingTop: 10 }}>
                                {[["Net Amount", fmt(bill.rating.netAmount)], ["Tax Amount", fmt(bill.rating.taxAmount)]].map(([l, v]) => (
                                  <div key={l as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
                                    <span style={{ color: "var(--muted)" }}>{l}</span>
                                    <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{v}</span>
                                  </div>
                                ))}
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, padding: "6px 0 2px", borderTop: "1px solid var(--card-border)", marginTop: 4, fontFamily: "Syne, sans-serif" }}>
                                  <span>Total Due</span>
                                  <span style={{ fontFamily: "monospace", color: "var(--foreground)" }}>{fmt(bill.rating.totalAmount)}</span>
                                </div>
                              </div>

                              {/* Pay buttons */}
                              {bill.status !== "PAID" ? (
                                <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--card-border)" }}>
                                  {[["UPI", "#00c896", "#007050"], ["CARD", "#2f9bf5", "#1050a0"], ["CASH", "#6b7685", "#3a4a5a"]].map(([ch, bg, color]) => (
                                    <button key={ch as string} onClick={() => handlePay(i, ch as string)}
                                      style={{ flex: 1, padding: 8, borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${bg}55`, background: `${bg}18`, color, transition: "all 0.15s", fontFamily: "Syne, sans-serif" }}>
                                      {ch}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontFamily: "monospace", fontWeight: 500, background: "rgba(13,184,113,0.12)", color: "#007040", border: "1px solid rgba(13,184,113,0.3)" }}>
                                  ✓ PAID
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PAYMENT FLOW TAB ─────────────────────── */}
            {activeTab === "payment" && (
              <div>
                {orders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, fontFamily: "Syne, sans-serif" }}>No payments yet</div>
                    <div>Generate a bill and click a payment button</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, fontFamily: "Syne, sans-serif" }}>Payment Orders ({orders.length})</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>{["Order ID", "Bill ID", "Channel", "Gateway Ref", "Amount", "Status"].map((h) => (
                          <th key={h} style={{ background: "var(--background)", padding: "8px 12px", textAlign: "left", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted)", borderBottom: "1px solid var(--card-border)", fontWeight: 500 }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {orders.map((o, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                            <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{o.orderId}</td>
                            <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{o.billId}</td>
                            <td style={{ padding: "9px 12px" }}>{o.channel}</td>
                            <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{o.gatewayRef}</td>
                            <td style={{ padding: "9px 12px", fontFamily: "monospace" }}>{fmt(o.amount)}</td>
                            <td style={{ padding: "9px 12px" }}><span style={{ color: "#0db871", fontWeight: 500 }}>{o.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── RECONCILIATION TAB ───────────────────── */}
            {activeTab === "recon" && (
              <div>
                {!recon ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, fontFamily: "Syne, sans-serif" }}>No settlements yet</div>
                    <div>Make payments to trigger reconciliation</div>
                  </div>
                ) : (
                  <div>
                    {/* Summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
                      {[["Settlement ID", recon.settlementId, "#noacc"], ["Matched", String(recon.matchedCount), "#0db871"], ["Gross Amount", fmt(recon.grossAmount), "#fff"], ["Net (after fee)", fmt(recon.netAmount), "#0db871"]].map(([l, v, c]) => (
                        <div key={l as string} style={{ background: "var(--background)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 4 }}>{l}</div>
                          <div style={{ fontFamily: "monospace", fontSize: v!.toString().length > 10 ? 12 : 20, fontWeight: 500, color: c === "#noacc" ? "var(--foreground)" : c as string }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, fontFamily: "Syne, sans-serif" }}>Transaction Matches</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>{["Gateway Ref", "Order ID", "Amount", "Result"].map((h) => (
                          <th key={h} style={{ background: "var(--background)", padding: "8px 12px", textAlign: "left", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted)", borderBottom: "1px solid var(--card-border)", fontWeight: 500 }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {recon.matchedOrders.map((o, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                            <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{o.gatewayRef}</td>
                            <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{o.orderId}</td>
                            <td style={{ padding: "9px 12px", fontFamily: "monospace" }}>{fmt(o.amount)}</td>
                            <td style={{ padding: "9px 12px" }}><span style={{ color: "#0db871", fontWeight: 500 }}>MATCHED</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── PIPELINE TAB ─────────────────────────── */}
            {activeTab === "pipeline" && (
              <div>
                {/* Pipeline visual */}
                <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
                  {PIPE_STEPS.map((step, i) => {
                    const stepOrder = ["read","rate","bill","pay","recon"];
                    const stepIdx = stepOrder.indexOf(step.key);
                    const curIdx  = stepOrder.indexOf(pipeStep);
                    const isDone  = pipeStep !== "idle" && stepIdx < curIdx;
                    const isActive = step.key === pipeStep;
                    return (
                      <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
                        <div style={{
                          padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                          border: `1px solid ${isDone ? "rgba(13,184,113,0.35)" : isActive ? "#0d1117" : "var(--card-border)"}`,
                          background: isDone ? "rgba(13,184,113,0.1)" : isActive ? "#0d1117" : "var(--background)",
                          color: isDone ? "#007040" : isActive ? "#fff" : "var(--muted)",
                          fontFamily: "Syne, sans-serif", transition: "all 0.3s",
                        }}>
                          {step.emoji} {step.label}
                        </div>
                        {i < PIPE_STEPS.length - 1 && <span style={{ padding: "0 4px", color: "var(--muted)", fontSize: 14 }}>→</span>}
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: "var(--background)", border: "1px solid var(--card-border)", borderRadius: 8, padding: 14, fontSize: 12, color: "var(--muted)", fontFamily: "monospace", marginBottom: 18 }}>
                  {pipeDetail}
                </div>

                {/* Rate Plan Reference */}
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, fontFamily: "Syne, sans-serif" }}>Rate Plan Reference</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>{["Utility", "Plan", "Segment", "Fixed", "Variable", "Tax"].map((h) => (
                      <th key={h} style={{ background: "var(--background)", padding: "8px 12px", textAlign: "left", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted)", borderBottom: "1px solid var(--card-border)", fontWeight: 500 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {[
                      ["GAS_PNG",     "RP-GAS-DOM-01",   "Domestic",    "₹120",    "₹30/₹35/₹42 SCM",      "GST 5%"],
                      ["GAS_PNG",     "RP-GAS-COM-01",   "Commercial",  "₹350",    "₹38/SCM flat",          "GST 5%"],
                      ["ELECTRICITY", "RP-ELEC-DOM-01",  "Domestic",    "₹45 rent","₹3.50/₹5.00/₹7.50 kWh","Duty 15% + GST 18%"],
                      ["WATER",       "RP-WATER-DOM-01", "Domestic",    "₹80",     "₹8/₹14 KL",             "Water Tax 5%"],
                      ["CNG",         "RP-CNG-PRIV-01",  "Private",     "—",       "₹80/KG",                "GST 5%"],
                    ].map(([u, plan, seg, fixed, variable, tax], ri) => (
                      <tr key={ri} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: UTIL_COLORS[u] ?? "#888", marginRight: 6 }} />
                          {UTIL_LABELS[u] ?? u}
                        </td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{plan}</td>
                        <td style={{ padding: "8px 12px" }}>{seg}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{fixed}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{variable}</td>
                        <td style={{ padding: "8px 12px" }}>{tax}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
