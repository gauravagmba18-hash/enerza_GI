"use client";
import { useState, useEffect } from "react";
import { PlusCircle, AlertCircle } from "lucide-react";

const STEPS = [
  { id: 1, label: "Application" },
  { id: 2, label: "Verification" },
  { id: 3, label: "Field Work" },
  { id: 4, label: "Billing Setup" },
  { id: 5, label: "Activation" },
];

export default function ServiceLifecycle() {
  const [activeStep, setActiveStep] = useState(1);
  const [lifecycleType, setLifecycleType] = useState("New Connection");
  const [kpis, setKpis] = useState({ newConn: 0, moveIn: 0, moveOut: 0, transfer: 0 });
  const [form, setForm] = useState({ customerName: "", mobile: "", address: "", connectionType: "New Connection", sanctionedLoad: "5", customerId: "", accountId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/service-requests?limit=1000")
      .then(r => r.json())
      .then(d => {
        const all: any[] = Array.isArray(d.data?.data) ? d.data.data : Array.isArray(d.data) ? d.data : [];
        setKpis({
          newConn: all.filter(r => r.type === "NEW_CONNECTION" && r.status === "DRAFT").length,
          moveIn: all.filter(r => r.type === "MOVE_IN" && r.status === "SUBMITTED").length,
          moveOut: all.filter(r => r.type === "MOVE_OUT").length,
          transfer: all.filter(r => r.type === "TRANSFER").length,
        });
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    try {
      let endpoint = "/api/onboarding";
      let body: any = {};
      if (lifecycleType === "Move-In") {
        endpoint = "/api/commercial/move-in";
        body = { customerId: form.customerId, accountId: form.accountId || undefined, moveInDate: new Date().toISOString().slice(0, 10) };
      } else if (lifecycleType === "Move-Out") {
        endpoint = "/api/commercial/move-out";
        body = { accountId: form.accountId, moveOutDate: new Date().toISOString().slice(0, 10), finalReading: 0 };
      } else if (lifecycleType === "Customer Transfer") {
        endpoint = "/api/commercial/transfer";
        body = { fromCustomerId: form.customerId, toCustomerId: form.accountId, accountId: form.accountId, effectiveDate: new Date().toISOString().slice(0, 10) };
      } else {
        // New Connection
        body = {
          fullName: form.customerName, mobile: form.mobile,
          addressLine1: form.address, segmentId: "seg_domestic",
          areaId: "area_hq_01", cycleId: "monthly_01",
          utilityType: "ELECTRICITY", connectionType: form.connectionType,
        };
      }
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setSubmitResult({ ok: true, msg: data.message ?? "Request submitted successfully." });
        setActiveStep(prev => Math.min(5, prev + 1));
      } else {
        setSubmitResult({ ok: false, msg: data.error ?? "Submission failed. Please check all fields." });
      }
    } catch {
      setSubmitResult({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" }}>
      <div style={{ padding: "12px 24px", background: "var(--card-bg)", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Service Management</h1>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Move-in · Move-out · Transfer · BR-005 to BR-009</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--card-border)", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <PlusCircle size={14} /> Service Request
          </button>
          <button style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <AlertCircle size={14} /> + Complaint
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* KPI Top Row — Live from DB */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            { label: "New Connection", val: kpis.newConn, color: "#3b82f6" },
            { label: "Move-In", val: kpis.moveIn, color: "#22c55e" },
            { label: "Move-Out", val: kpis.moveOut, color: "#eab308" },
            { label: "Customer Transfer", val: kpis.transfer, color: "#a855f7" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderTop: `4px solid ${color}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Pending</div>
            </div>
          ))}
        </div>

        {submitResult && (
          <div style={{ padding: "12px 16px", background: submitResult.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${submitResult.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 8, fontSize: 13, color: submitResult.ok ? "#10b981" : "#ef4444", fontWeight: 600 }}>
            {submitResult.msg}
          </div>
        )}

        {/* Main Workflow Card */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Service Management Workflow</h2>
            <select value={lifecycleType} onChange={(e) => { setLifecycleType(e.target.value); setActiveStep(1); setSubmitResult(null); }}
              style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid var(--card-border)", fontSize: 12, fontWeight: 500, background: "var(--bg-lighter)", color: "var(--foreground)" }}>
              <option>New Connection</option>
              <option>Move-In</option>
              <option>Move-Out</option>
              <option>Customer Transfer</option>
            </select>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Stepper */}
            <div style={{ display: "flex", marginBottom: 40, position: "relative" }}>
              <div style={{ position: "absolute", top: 18, left: "10%", right: "10%", height: 2, background: "var(--card-border)", zIndex: 0 }} />
              {STEPS.map((step) => (
                <div key={step.id} style={{ flex: 1, textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: step.id === activeStep ? "var(--accent)" : step.id < activeStep ? "#22c55e" : "var(--card-bg)", border: "2px solid", borderColor: step.id === activeStep ? "var(--accent)" : step.id < activeStep ? "#22c55e" : "var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, margin: "0 auto 8px", color: step.id <= activeStep ? "#fff" : "var(--muted)" }}>
                    {step.id < activeStep ? "✓" : step.id}
                  </div>
                  <div style={{ fontSize: 11, color: step.id === activeStep ? "var(--foreground)" : "var(--muted)", fontWeight: step.id === activeStep ? 700 : 500 }}>{step.label}</div>
                </div>
              ))}
            </div>

            {/* Form Content */}
            {activeStep === 1 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "var(--foreground)" }}>Application Details — {lifecycleType}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
                  {lifecycleType === "Move-In" || lifecycleType === "Move-Out" || lifecycleType === "Customer Transfer" ? (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Customer ID *</label>
                        <input style={{ padding: "9px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} placeholder="e.g. cust_..." />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Account ID *</label>
                        <input style={{ padding: "9px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} placeholder="e.g. acct_..." />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Customer Name *</label>
                        <input style={{ padding: "9px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Full name" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Mobile *</label>
                        <input style={{ padding: "9px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+91 ..." />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Premise Address *</label>
                        <input style={{ padding: "9px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, City" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {activeStep > 1 && activeStep < 5 && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                Step {activeStep} — {STEPS[activeStep - 1].label} in progress...
              </div>
            )}
            {activeStep === 5 && submitResult?.ok && (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>{lifecycleType} Completed</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{submitResult.msg}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, gap: 12 }}>
              {activeStep > 1 && (
                <button onClick={() => setActiveStep(prev => Math.max(1, prev - 1))} style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--card-border)", padding: "10px 24px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  ← Back
                </button>
              )}
              <button
                onClick={activeStep === 4 ? handleSubmit : () => setActiveStep(prev => Math.min(5, prev + 1))}
                disabled={submitting}
                style={{ background: submitting ? "var(--card-border)" : "var(--accent)", color: "#fff", border: "none", padding: "10px 32px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: submitting ? "wait" : "pointer" }}
              >
                {submitting ? "Submitting..." : activeStep === 4 ? "Submit Request" : activeStep === 5 ? "Done" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
