"use client";
import { useState } from "react";
import { Check, ChevronRight, ChevronLeft, User, MapPin, Zap, Settings, Gauge, Flame, Droplets } from "lucide-react";
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

  const [form, setForm] = useState({
    customer: { fullName: "", mobile: "", email: "", customerType: "INDIVIDUAL", segmentId: "cl_dom_01" },
    premise:  { addressLine1: "", areaId: "area_hq_01", buildingType: "RESIDENTIAL" },
    service:  { utilityType: "ELECTRICITY", cycleId: "monthly_01", segmentId: "cl_dom_01" },
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
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Onboarding failed");
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
                      <option value="area_hq_01">Central City Zone 1</option>
                      <option value="area_hq_02">North Industrial Hub</option>
                      <option value="area_hq_03">South Suburbs</option>
                    </select>
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* Step 3 — Service */}
          {step === 3 && (
            <>
              <StepHeader title="Service Selection" subtitle="Choose the utility type for this connection" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 8 }}>
                {[
                  { type: "ELECTRICITY", label: "Electricity", Icon: Zap,      color: "#eab308" },
                  { type: "GAS_PNG",     label: "PNG Gas",     Icon: Flame,    color: "#06b6d4" },
                  { type: "WATER",       label: "Water",       Icon: Droplets, color: "#3b82f6" },
                ].map(({ type, label, Icon, color }) => {
                  const active = form.service.utilityType === type;
                  return (
                    <button key={type} onClick={() => set("service", "utilityType", type)}
                      style={{
                        padding: "28px 16px", borderRadius: 12, cursor: "pointer",
                        border: `2px solid ${active ? color : "var(--card-border)"}`,
                        background: active ? `${color}11` : "rgba(255,255,255,0.02)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                        transition: "all 0.15s",
                      }}>
                      <Icon size={32} color={active ? color : "var(--muted)"} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: active ? color : "var(--muted)" }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step 4 — Technical */}
          {step === 4 && (
            <>
              <StepHeader title={`Technical Specs — ${form.service.utilityType}`} subtitle="Connection load and configuration parameters" />
              {form.service.utilityType === "ELECTRICITY" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Field label="Connected Load (kW)">
                    <input style={INPUT} type="number" value={form.technical.loadKw} onChange={e => set("technical", "loadKw", +e.target.value)} />
                  </Field>
                  <Field label="Contract Demand (kVA)">
                    <input style={INPUT} type="number" value={form.technical.contractDemandKva} onChange={e => set("technical", "contractDemandKva", +e.target.value)} />
                  </Field>
                  <Field label="Supply Voltage">
                    <select style={SELECT} value={form.technical.supplyVoltage} onChange={e => set("technical", "supplyVoltage", e.target.value)}>
                      <option>230V</option><option>415V</option><option>11kV</option><option>33kV</option>
                    </select>
                  </Field>
                  <Field label="Phase Type">
                    <select style={SELECT} value={form.technical.phaseType} onChange={e => set("technical", "phaseType", e.target.value)}>
                      <option value="SINGLE">Single Phase</option>
                      <option value="THREE">Three Phase</option>
                    </select>
                  </Field>
                  <Field label="Service Type">
                    <select style={SELECT} value={form.technical.serviceType} onChange={e => set("technical", "serviceType", e.target.value)}>
                      <option value="DOMESTIC">Domestic</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="INDUSTRIAL">Industrial</option>
                    </select>
                  </Field>
                  <Field label="Net Metered (Solar)">
                    <select style={SELECT} value={form.technical.isNetMetered ? "YES" : "NO"} onChange={e => set("technical", "isNetMetered", e.target.value === "YES")}>
                      <option value="NO">No</option>
                      <option value="YES">Yes — Prosumer</option>
                    </select>
                  </Field>
                </div>
              )}
              {form.service.utilityType === "GAS_PNG" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Field label="Pressure Band">
                    <select style={SELECT} value={form.technical.pressureBandId} onChange={e => set("technical", "pressureBandId", e.target.value)}>
                      <option value="cl_pb_01">Low Pressure (LP)</option>
                      <option value="cl_pb_02">Medium Pressure (MP)</option>
                      <option value="cl_pb_03">High Pressure (HP)</option>
                    </select>
                  </Field>
                  <Field label="Pipe Size (mm)">
                    <input style={INPUT} type="number" value={form.technical.pipeSizeMm} onChange={e => set("technical", "pipeSizeMm", +e.target.value)} />
                  </Field>
                </div>
              )}
              {form.service.utilityType === "WATER" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Field label="Pipe Size (mm)">
                    <input style={INPUT} type="number" value={form.technical.pipeSizeMm} onChange={e => set("technical", "pipeSizeMm", +e.target.value)} />
                  </Field>
                  <Field label="Service Type">
                    <select style={SELECT} value={form.technical.serviceType} onChange={e => set("technical", "serviceType", e.target.value)}>
                      <option value="DOMESTIC">Domestic</option>
                      <option value="COMMERCIAL">Commercial</option>
                    </select>
                  </Field>
                </div>
              )}
            </>
          )}

          {/* Step 5 — Meter */}
          {step === 5 && (
            <>
              <StepHeader title="Meter Commissioning" subtitle="Register the physical meter for this connection" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Field label="Meter Serial Number">
                  <input style={INPUT} value={form.meter.serialNo} placeholder="e.g. SRL-9382103"
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
              <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 8,
                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                fontSize: 12, color: "#3b82f6", lineHeight: 1.6 }}>
                A Meter Reading record will be initialized at 0 kWh / SCM to establish the commissioning baseline for future billing cycles.
              </div>
            </>
          )}

          {/* Step 6 — Success */}
          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(16,185,129,0.12)",
                border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Check size={36} color="#10b981" strokeWidth={3} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", marginBottom: 8 }}>Connection Active!</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, maxWidth: 380, lineHeight: 1.6, marginBottom: 28 }}>
                Customer, Premise, Account, Technical configuration, and initial Meter Baseline have been successfully provisioned.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => router.push("/")}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--card-border)",
                    background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Go to Dashboard
                </button>
                <button onClick={() => { setStep(1); setForm(f => ({ ...f, meter: { ...f.meter, serialNo: "" } })); }}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none",
                    background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Onboard Another
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
                disabled={submitting || !form.meter.serialNo}
                style={{
                  padding: "8px 22px", borderRadius: 8, border: "none",
                  background: !form.meter.serialNo ? "var(--muted)" : "#10b981",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: !form.meter.serialNo ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {submitting ? "Processing…" : <><Check size={15} /> Complete Activation</>}
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
