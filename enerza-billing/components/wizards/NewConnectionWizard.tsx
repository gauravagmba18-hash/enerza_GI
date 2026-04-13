"use client";
import { useState, useEffect } from "react";
import { Check, ChevronRight, ChevronLeft, User, MapPin, Zap, Settings, Gauge, Flame, Droplets, FilePlus } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, title: "Applicant KYC",      icon: User },
  { id: 2, title: "Premise",            icon: MapPin },
  { id: 3, title: "Service Selection",  icon: Zap },
  { id: 4, title: "Technical Specs",    icon: Settings },
  { id: 5, title: "Meter Commissioning",icon: Gauge },
];

const INPUT = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: "1px solid var(--card-border)", background: "var(--sidebar)",
  color: "var(--foreground)", fontSize: 13, outline: "none",
} as const;

const SELECT = { ...INPUT } as const;

const LABEL = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--muted)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.4px",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

export function NewConnectionWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ requestId: string | null; customerId: string; premiseId: string } | null>(null);

  // Live lookup data from DB
  const [areas, setAreas] = useState<{ areaId: string; areaName: string; city: string }[]>([]);
  const [segments, setSegments] = useState<{ segmentId: string; segmentName: string; utilityType: string }[]>([]);

  useEffect(() => {
    fetch("/api/cgd-areas?limit=100")
      .then(r => r.json())
      .then(d => {
        const list = d.data?.data ?? d.data ?? [];
        setAreas(list);
        if (list.length > 0) set("premise", "areaId", list[0].areaId);
      })
      .catch(() => {});
    fetch("/api/consumer-segments?limit=100")
      .then(r => r.json())
      .then(d => {
        const list = d.data?.data ?? d.data ?? [];
        setSegments(list);
        // Default to first electricity domestic segment
        const def = list.find((s: any) => s.utilityType === "ELECTRICITY") ?? list[0];
        if (def) {
          set("service", "segmentId", def.segmentId);
          set("customer", "segmentId", def.segmentId);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
    customer: { fullName: "", mobile: "", email: "", customerType: "INDIVIDUAL", segmentId: "" },
    premise:  { addressLine1: "", areaId: "", buildingType: "RESIDENTIAL" },
    service:  { utilityType: "ELECTRICITY", cycleId: "monthly_01", segmentId: "" },
    technical: { loadKw: 5, contractDemandKva: 6, supplyVoltage: "230V", phaseType: "SINGLE",
                 isNetMetered: false, serviceType: "DOMESTIC", pressureBandId: "cl_pb_01",
                 pipeSizeMm: 15, meterType: "SMART" },
    meter: { serialNo: "", meterType: "SMART", make: "LandisGyr" },
  });

  const set = (section: keyof typeof form, field: string, value: any) =>
    setForm(p => ({ ...p, [section]: { ...p[section], [field]: value } }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/new-connection-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to raise service request");
      setResult({ requestId: data.data?.requestId ?? null, customerId: data.data?.customerId ?? "", premiseId: data.data?.premiseId ?? "" });
      setStep(6);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Layout ───────────────────────────────────────────────────────────────────
  return (
    <div className="glass" style={{
      border: "1px solid var(--card-border)", borderRadius: 16,
      overflow: "hidden", display: "flex", minHeight: 540,
    }}>

      {/* ── Step sidebar ───────────────────────────────────────────────────────── */}
      <div style={{
        width: 220, minWidth: 220, padding: "28px 20px",
        borderRight: "1px solid var(--card-border)",
        background: "rgba(255,255,255,0.02)",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>
          Onboarding Steps
        </div>
        {STEPS.map(s => {
          const Icon = s.icon;
          const done   = step > s.id;
          const active = step === s.id;
          const color  = done ? "#10b981" : active ? "#3b82f6" : "var(--muted)";
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
              background: active ? "rgba(59,130,246,0.08)" : "transparent",
              borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#10b98122" : active ? "#3b82f622" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${color}`,
              }}>
                {done
                  ? <Check size={13} color="#10b981" strokeWidth={3} />
                  : <Icon size={13} color={color} />}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color }}>{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* ── Main content ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {error && (
          <div style={{ margin: "16px 28px 0", padding: "10px 16px", borderRadius: 8,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444", fontSize: 13 }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Step content */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

          {/* Step 1 — KYC */}
          {step === 1 && (
            <>
              <StepHeader title="Applicant KYC" subtitle="Basic customer identification and contact details" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Field label="Full Name">
                  <input style={INPUT} value={form.customer.fullName} placeholder="e.g. Ramesh Patel"
                    onChange={e => set("customer", "fullName", e.target.value)} />
                </Field>
                <Field label="Customer Type">
                  <select style={SELECT} value={form.customer.customerType} onChange={e => set("customer", "customerType", e.target.value)}>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="COMMERCIAL">Commercial / Retail</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="GOVERNMENT">Government</option>
                  </select>
                </Field>
                <Field label="Mobile">
                  <input style={INPUT} type="tel" value={form.customer.mobile} placeholder="+91 9800000000"
                    onChange={e => set("customer", "mobile", e.target.value)} />
                </Field>
                <Field label="Email">
                  <input style={INPUT} type="email" value={form.customer.email} placeholder="customer@example.com"
                    onChange={e => set("customer", "email", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* Step 2 — Premise */}
          {step === 2 && (
            <>
              <StepHeader title="Premise Location" subtitle="Physical installation address and area zone" />
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Field label="Address Line 1">
                  <input style={INPUT} value={form.premise.addressLine1} placeholder="Plot No. / Street / Society"
                    onChange={e => set("premise", "addressLine1", e.target.value)} />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Field label="Building Type">
                    <select style={SELECT} value={form.premise.buildingType} onChange={e => set("premise", "buildingType", e.target.value)}>
                      <option value="RESIDENTIAL">Residential</option>
                      <option value="COMMERCIAL_MALL">Commercial / Mall</option>
                      <option value="FACTORY">Factory / Plant</option>
                    </select>
                  </Field>
                  <Field label="Operating Zone (CGD / DISCOM)">
                    <select style={SELECT} value={form.premise.areaId} onChange={e => set("premise", "areaId", e.target.value)}>
                      {areas.length === 0
                        ? <option value="">Loading areas…</option>
                        : areas.map(a => <option key={a.areaId} value={a.areaId}>{a.areaName} — {a.city}</option>)
                      }
                    </select>
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* Step 3 — Service Selection */}
          {step === 3 && (
            <>
              <StepHeader title="Service Selection" subtitle="Choose the utility type and billing parameters" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { type: "ELECTRICITY", icon: Zap,      label: "Electricity", color: "#f59e0b" },
                  { type: "GAS_PNG",     icon: Flame,    label: "Gas (PNG)",   color: "#ef4444" },
                  { type: "WATER",       icon: Droplets, label: "Water",       color: "#3b82f6" },
                ].map(({ type, icon: Icon, label, color }) => {
                  const sel = form.service.utilityType === type;
                  return (
                    <button key={type} onClick={() => {
                      set("service", "utilityType", type);
                      // Auto-pick first matching segment for this utility type
                      const match = segments.find(s => s.utilityType === type || s.utilityType === "ALL");
                      if (match) { set("service", "segmentId", match.segmentId); set("customer", "segmentId", match.segmentId); }
                    }}
                      style={{ padding: "20px 16px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                        border: `2px solid ${sel ? color : "var(--card-border)"}`,
                        background: sel ? `${color}12` : "rgba(255,255,255,0.02)",
                        transition: "all 0.15s" }}>
                      <Icon size={28} color={sel ? color : "var(--muted)"} style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? color : "var(--muted)" }}>{label}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Field label="Billing Cycle">
                  <select style={SELECT} value={form.service.cycleId} onChange={e => set("service", "cycleId", e.target.value)}>
                    <option value="monthly_01">Monthly</option>
                    <option value="bi_monthly_01">Bi-Monthly</option>
                    <option value="quarterly_01">Quarterly</option>
                  </select>
                </Field>
                <Field label="Consumer Segment">
                  <select style={SELECT} value={form.service.segmentId} onChange={e => { set("service", "segmentId", e.target.value); set("customer", "segmentId", e.target.value); }}>
                    {segments.length === 0
                      ? <option value="">Loading segments…</option>
                      : segments
                          .filter(s => s.utilityType === form.service.utilityType || s.utilityType === "ALL")
                          .map(s => <option key={s.segmentId} value={s.segmentId}>{s.segmentName}</option>)
                    }
                  </select>
                </Field>
              </div>
            </>
          )}

          {/* Step 4 — Technical Specs */}
          {step === 4 && (
            <>
              <StepHeader title="Technical Specifications" subtitle={`${form.service.utilityType === "ELECTRICITY" ? "Electrical load and supply parameters" : form.service.utilityType === "WATER" ? "Water connection parameters" : "Gas connection parameters"}`} />
              {form.service.utilityType === "ELECTRICITY" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Field label="Connected Load (kW)">
                    <input style={INPUT} type="number" value={form.technical.loadKw}
                      onChange={e => set("technical", "loadKw", parseFloat(e.target.value))} />
                  </Field>
                  <Field label="Contract Demand (kVA)">
                    <input style={INPUT} type="number" value={form.technical.contractDemandKva}
                      onChange={e => set("technical", "contractDemandKva", parseFloat(e.target.value))} />
                  </Field>
                  <Field label="Supply Voltage">
                    <select style={SELECT} value={form.technical.supplyVoltage} onChange={e => set("technical", "supplyVoltage", e.target.value)}>
                      <option value="230V">230V Single Phase</option>
                      <option value="415V">415V Three Phase</option>
                      <option value="11kV">11kV HT</option>
                      <option value="33kV">33kV HT</option>
                    </select>
                  </Field>
                  <Field label="Phase Type">
                    <select style={SELECT} value={form.technical.phaseType} onChange={e => set("technical", "phaseType", e.target.value)}>
                      <option value="SINGLE">Single Phase</option>
                      <option value="THREE">Three Phase</option>
                    </select>
                  </Field>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.technical.isNetMetered}
                        onChange={e => set("technical", "isNetMetered", e.target.checked)}
                        style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, color: "var(--foreground)" }}>Net Metering / Solar Rooftop</span>
                    </label>
                  </div>
                </div>
              )}
              {(form.service.utilityType === "GAS_PNG" || form.service.utilityType === "GAS_CNG") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Field label="Service Type">
                    <select style={SELECT} value={form.technical.serviceType} onChange={e => set("technical", "serviceType", e.target.value)}>
                      <option value="DOMESTIC">Domestic</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="INDUSTRIAL">Industrial</option>
                    </select>
                  </Field>
                  <Field label="Pressure Band">
                    <select style={SELECT} value={form.technical.pressureBandId} onChange={e => set("technical", "pressureBandId", e.target.value)}>
                      <option value="cl_pb_01">LP – Low Pressure</option>
                      <option value="cl_pb_02">MP – Medium Pressure</option>
                      <option value="cl_pb_03">HP – High Pressure</option>
                    </select>
                  </Field>
                </div>
              )}
              {form.service.utilityType === "WATER" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Field label="Pipe Size (mm)">
                    <select style={SELECT} value={form.technical.pipeSizeMm} onChange={e => set("technical", "pipeSizeMm", parseInt(e.target.value))}>
                      <option value={15}>15mm (½″)</option>
                      <option value={20}>20mm (¾″)</option>
                      <option value={25}>25mm (1″)</option>
                      <option value={40}>40mm (1½″)</option>
                      <option value={50}>50mm (2″)</option>
                    </select>
                  </Field>
                  <Field label="Meter Type">
                    <select style={SELECT} value={form.technical.meterType} onChange={e => set("technical", "meterType", e.target.value)}>
                      <option value="MECHANICAL">Mechanical</option>
                      <option value="SMART">Smart Meter (AMR)</option>
                    </select>
                  </Field>
                </div>
              )}
            </>
          )}

          {/* Step 5 — Meter */}
          {step === 5 && (
            <>
              <StepHeader title="Meter Commissioning" subtitle="Register the physical meter and set the baseline reading" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
                <Field label="Meter Serial Number *">
                  <input style={INPUT} value={form.meter.serialNo} placeholder="e.g. LG-2024-001234"
                    onChange={e => set("meter", "serialNo", e.target.value)} />
                </Field>
                <Field label="Meter Make / Brand">
                  <input style={INPUT} value={form.meter.make} placeholder="e.g. LandisGyr"
                    onChange={e => set("meter", "make", e.target.value)} />
                </Field>
                <Field label="Meter Type">
                  <select style={SELECT} value={form.meter.meterType} onChange={e => set("meter", "meterType", e.target.value)}>
                    <option value="SMART">Smart Meter (AMI)</option>
                    <option value="BASIC">Basic Electromechanical</option>
                    <option value="PREPAID">Prepaid</option>
                  </select>
                </Field>
              </div>
              <div style={{ marginTop: 4, padding: "12px 16px", borderRadius: 8,
                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                fontSize: 12, color: "#3b82f6", lineHeight: 1.6 }}>
                A Meter Reading record will be initialized at 0 kWh / SCM to establish the commissioning baseline for future billing cycles.
              </div>
            </>
          )}

          {/* Step 6 — SR Raised */}
          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(59,130,246,0.12)",
                border: "2px solid #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <FilePlus size={36} color="#3b82f6" strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", marginBottom: 8 }}>Service Request Raised!</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, maxWidth: 420, lineHeight: 1.6, marginBottom: 20 }}>
                Application submitted. The request is now at <strong style={{ color: "var(--foreground)" }}>Stage 1 — Application Details</strong>.
                It will proceed through Document Verification → Field Work → Billing Setup → Activation.
              </p>
              {result && (
                <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: 10, padding: "14px 24px", marginBottom: 24, textAlign: "left", minWidth: 320 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Request Summary</div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 12 }}>
                    {result.requestId && <><span style={{ color: "var(--muted)" }}>Service Request ID</span><span style={{ color: "#3b82f6", fontWeight: 700, fontFamily: "monospace" }}>{result.requestId.slice(0, 20)}…</span></>}
                    {result.customerId && <><span style={{ color: "var(--muted)" }}>Customer ID</span><span style={{ color: "var(--foreground)", fontWeight: 600, fontFamily: "monospace" }}>{result.customerId.slice(0, 20)}…</span></>}
                    <span style={{ color: "var(--muted)" }}>Status</span><span style={{ color: "#eab308", fontWeight: 700 }}>SUBMITTED — Awaiting Verification</span>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={() => router.push("/crm/lifecycle")}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none",
                    background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Track in Lifecycle →
                </button>
                <button onClick={() => router.push("/")}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--card-border)",
                    background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Go to Dashboard
                </button>
                <button onClick={() => { setStep(1); setResult(null); setForm(f => ({ ...f, customer: { fullName: "", mobile: "", email: "", customerType: "INDIVIDUAL", segmentId: f.service.segmentId }, meter: { ...f.meter, serialNo: "" } })); }}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--card-border)",
                    background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  New Request
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer nav ─────────────────────────────────────────────────────────── */}
        {step < 6 && (
          <div style={{ borderTop: "1px solid var(--card-border)", padding: "14px 28px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "rgba(255,255,255,0.01)" }}>
            <button onClick={() => setStep(s => Math.max(s - 1, 1))}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "1px solid var(--card-border)",
                background: "transparent", color: step === 1 ? "transparent" : "var(--muted)",
                fontSize: 13, fontWeight: 600, cursor: step === 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 6, pointerEvents: step === 1 ? "none" : "auto",
              }}>
              <ChevronLeft size={15} /> Back
            </button>

            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
              Step {step} of {STEPS.length}
            </span>

            {step < STEPS.length ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !form.customer.fullName}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none",
                  background: step === 1 && !form.customer.fullName ? "var(--muted)" : "#3b82f6",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: step === 1 && !form.customer.fullName ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  padding: "8px 22px", borderRadius: 8, border: "none",
                  background: "#3b82f6",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: submitting ? "wait" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {submitting ? "Raising Request…" : <><FilePlus size={15} /> Raise Service Request</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--card-border)" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{title}</h2>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>{subtitle}</p>
    </div>
  );
}
