"use client";
import { useState, useEffect } from "react";
import {
  Users, Plus, Search, Phone, Mail, Shield, Wrench, Award,
  Calendar, RefreshCw, X, ChevronDown, AlertTriangle, CheckCircle
} from "lucide-react";

const SPECIALIZATIONS = ["ELECTRICITY", "GAS", "WATER", "METERING", "SOLAR", "HV_SWITCHING", "SCADA"];
const CLEARANCE_OPTIONS = ["HV_WORK_PERMIT", "GAS_SAFE", "CONFINED_SPACE", "WATER_HYGIENE", "FIRST_AID", "WORKING_AT_HEIGHT", "ASBESTOS_AWARENESS"];
const DESIGNATIONS = ["Apprentice Technician", "Junior Technician", "Field Technician", "Senior Technician", "Lead Technician", "Field Supervisor", "Area Manager"];
const CLEARANCE_LEVELS = ["LV", "HV", "EHV"];

const CLEARANCE_COLOR: Record<string, string> = {
  LV: "#10b981",
  HV: "#f59e0b",
  EHV: "#ef4444",
};

type Technician = {
  technicianId: string;
  fullName: string;
  mobile: string;
  email?: string;
  employeeId?: string;
  designation?: string;
  yearsOfExperience?: number;
  specializations?: string;
  certifications?: string;
  clearances?: string;
  clearanceLevel?: string;
  dateOfJoining?: string;
  safetyTrainingExpiry?: string;
  emergencyContact?: string;
  status: string;
  pincodeScope?: string;
  _count?: { workOrders: number };
};

const emptyForm = (): Partial<Technician> => ({
  fullName: "", mobile: "", email: "", employeeId: "",
  designation: "Field Technician", yearsOfExperience: 0,
  specializations: "[]", certifications: "[]", clearances: "[]",
  clearanceLevel: "LV", pincodeScope: "", emergencyContact: "", status: "ACTIVE",
});

export default function TechnicianMasterPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterSpec, setFilterSpec] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Technician | null>(null);
  const [form, setForm] = useState<Partial<Technician>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedClearances, setSelectedClearances] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    fetch("/api/field/technicians")
      .then(r => r.json())
      .then(d => { setTechnicians(Array.isArray(d.data) ? d.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setSelectedSpecs([]);
    setSelectedClearances([]);
    setSaveMsg(null);
    setShowModal(true);
  };

  const openEdit = (t: Technician) => {
    setEditTarget(t);
    setForm({ ...t });
    setSelectedSpecs(parseJson(t.specializations));
    setSelectedClearances(parseJson(t.clearances));
    setSaveMsg(null);
    setShowModal(true);
  };

  const parseJson = (s?: string): string[] => {
    try { return JSON.parse(s ?? "[]"); } catch { return []; }
  };

  const toggleSpec = (s: string) =>
    setSelectedSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleClearance = (c: string) =>
    setSelectedClearances(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    const payload = {
      ...form,
      specializations: JSON.stringify(selectedSpecs),
      clearances: JSON.stringify(selectedClearances),
    };
    try {
      const url = editTarget
        ? `/api/field/technicians/${editTarget.technicianId}`
        : "/api/field/technicians";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setSaveMsg({ ok: true, text: editTarget ? "Technician updated." : "Technician added." });
        load();
        setTimeout(() => setShowModal(false), 800);
      } else {
        const d = await res.json();
        setSaveMsg({ ok: false, text: d.error ?? "Save failed." });
      }
    } catch {
      setSaveMsg({ ok: false, text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  const filtered = technicians.filter(t => {
    const matchSearch = !search ||
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.mobile.includes(search) ||
      (t.employeeId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === "ALL" || t.clearanceLevel === filterLevel;
    const matchSpec = filterSpec === "ALL" || parseJson(t.specializations).includes(filterSpec);
    return matchSearch && matchLevel && matchSpec;
  });

  // KPIs
  const expiredSafety = technicians.filter(t => t.safetyTrainingExpiry && new Date(t.safetyTrainingExpiry) < new Date()).length;
  const hvCount = technicians.filter(t => t.clearanceLevel === "HV" || t.clearanceLevel === "EHV").length;

  const f = (k: keyof Technician, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Technician Master Data</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Utility field workforce — skills, clearances &amp; certifications registry</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--card-border)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--foreground)" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={14} /> Add Technician
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Technicians", val: technicians.length, color: "var(--foreground)" },
          { label: "Active", val: technicians.filter(t => t.status === "ACTIVE").length, color: "#10b981" },
          { label: "HV / EHV Cleared", val: hvCount, color: "#f59e0b" },
          { label: "Safety Training Expired", val: expiredSafety, color: expiredSafety > 0 ? "#ef4444" : "#10b981" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, mobile or employee ID..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid var(--card-border)", borderRadius: 8, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} />
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid var(--card-border)", borderRadius: 8, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }}>
          <option value="ALL">All Clearance Levels</option>
          {CLEARANCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid var(--card-border)", borderRadius: 8, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }}>
          <option value="ALL">All Specializations</option>
          {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Technician Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Loading technicians...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
          {technicians.length === 0 ? "No technicians found. Add the first one using the button above." : "No results matching your filter."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
          {filtered.map(t => {
            const specs = parseJson(t.specializations);
            const clears = parseJson(t.clearances);
            const safetyExpired = t.safetyTrainingExpiry && new Date(t.safetyTrainingExpiry) < new Date();
            const lvColor = CLEARANCE_COLOR[t.clearanceLevel ?? "LV"] ?? "#10b981";
            return (
              <div key={t.technicianId} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 14, overflow: "hidden" }}>
                {/* Card Header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={20} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>{t.fullName}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{t.designation ?? "Field Technician"} · {t.employeeId ?? t.technicianId.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: `${lvColor}18`, color: lvColor, border: `1px solid ${lvColor}30` }}>
                      {t.clearanceLevel ?? "LV"}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: t.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: t.status === "ACTIVE" ? "#10b981" : "#ef4444" }}>
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Contact */}
                  <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--muted)" }}>
                      <Phone size={11} /> {t.mobile}
                    </span>
                    {t.email && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--muted)" }}>
                        <Mail size={11} /> {t.email}
                      </span>
                    )}
                  </div>

                  {/* Experience & Scope */}
                  <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--muted)" }}>
                      <Award size={11} /> {t.yearsOfExperience ?? 0} yrs experience
                    </span>
                    {t.pincodeScope && (
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Zone: {t.pincodeScope}</span>
                    )}
                  </div>

                  {/* Specializations */}
                  {specs.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {specs.map(s => (
                        <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>
                          {s.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Clearances */}
                  {clears.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {clears.map(c => (
                        <span key={c} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                          <Shield size={9} style={{ display: "inline", marginRight: 3 }} />
                          {c.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Safety Warning */}
                  {safetyExpired && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                      <AlertTriangle size={12} /> Safety training expired — renewal required
                    </div>
                  )}

                  {/* Safety Expiry */}
                  {t.safetyTrainingExpiry && !safetyExpired && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                      <CheckCircle size={11} color="#10b981" /> Safety training valid until {new Date(t.safetyTrainingExpiry).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--card-border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => openEdit(t)} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid var(--card-border)", background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--accent)" }}>
                    Edit Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>{editTarget ? "Edit Technician" : "Add Technician"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Utility field workforce master data</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {saveMsg && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: saveMsg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${saveMsg.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, fontSize: 13, color: saveMsg.ok ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                  {saveMsg.text}
                </div>
              )}

              {/* Basic Info */}
              <SectionHeader label="Basic Information" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormField label="Full Name *" value={form.fullName ?? ""} onChange={v => f("fullName", v)} />
                <FormField label="Mobile *" value={form.mobile ?? ""} onChange={v => f("mobile", v)} placeholder="+91 ..." />
                <FormField label="Email" value={form.email ?? ""} onChange={v => f("email", v)} placeholder="tech@example.com" />
                <FormField label="Employee ID" value={form.employeeId ?? ""} onChange={v => f("employeeId", v)} placeholder="EMP-001" />
              </div>

              {/* Role & Experience */}
              <SectionHeader label="Role & Experience" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <FormSelect label="Designation" value={form.designation ?? ""} onChange={v => f("designation", v)} options={DESIGNATIONS} />
                <FormField label="Years of Experience" value={String(form.yearsOfExperience ?? 0)} onChange={v => f("yearsOfExperience", parseInt(v) || 0)} type="number" />
                <FormSelect label="Status" value={form.status ?? "ACTIVE"} onChange={v => f("status", v)} options={["ACTIVE", "ON_LEAVE", "SUSPENDED", "INACTIVE"]} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormField label="Date of Joining" value={form.dateOfJoining ? form.dateOfJoining.slice(0, 10) : ""} onChange={v => f("dateOfJoining", v)} type="date" />
                <FormField label="Pincode Scope (service area)" value={form.pincodeScope ?? ""} onChange={v => f("pincodeScope", v)} placeholder="380015, 380054" />
              </div>

              {/* Clearances */}
              <SectionHeader label="Electrical Clearance Level" />
              <div style={{ display: "flex", gap: 12 }}>
                {CLEARANCE_LEVELS.map(lvl => (
                  <button key={lvl} onClick={() => f("clearanceLevel", lvl)}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${form.clearanceLevel === lvl ? CLEARANCE_COLOR[lvl] : "var(--card-border)"}`, background: form.clearanceLevel === lvl ? `${CLEARANCE_COLOR[lvl]}15` : "transparent", color: form.clearanceLevel === lvl ? CLEARANCE_COLOR[lvl] : "var(--muted)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {lvl}
                    <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>
                      {lvl === "LV" ? "Low Voltage (<1kV)" : lvl === "HV" ? "High Voltage (1–66kV)" : "Extra High Voltage (>66kV)"}
                    </div>
                  </button>
                ))}
              </div>

              {/* Specializations */}
              <SectionHeader label="Specializations" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SPECIALIZATIONS.map(s => (
                  <button key={s} onClick={() => toggleSpec(s)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${selectedSpecs.includes(s) ? "#06b6d4" : "var(--card-border)"}`, background: selectedSpecs.includes(s) ? "rgba(6,182,212,0.1)" : "transparent", color: selectedSpecs.includes(s) ? "#06b6d4" : "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {/* Safety Clearances */}
              <SectionHeader label="Safety Clearances" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CLEARANCE_OPTIONS.map(c => (
                  <button key={c} onClick={() => toggleClearance(c)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${selectedClearances.includes(c) ? "#f59e0b" : "var(--card-border)"}`, background: selectedClearances.includes(c) ? "rgba(245,158,11,0.1)" : "transparent", color: selectedClearances.includes(c) ? "#f59e0b" : "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <Shield size={10} style={{ display: "inline", marginRight: 4 }} />
                    {c.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {/* Safety Training & Emergency */}
              <SectionHeader label="Safety & Emergency" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormField label="Safety Training Expiry" value={form.safetyTrainingExpiry ? form.safetyTrainingExpiry.slice(0, 10) : ""} onChange={v => f("safetyTrainingExpiry", v)} type="date" />
                <FormField label="Emergency Contact" value={form.emergencyContact ?? ""} onChange={v => f("emergencyContact", v)} placeholder="+91 ..." />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--card-border)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--card-border)", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: saving ? "var(--card-border)" : "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
                {saving ? "Saving..." : editTarget ? "Update Technician" : "Add Technician"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable form components ──────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", borderBottom: "1px solid var(--card-border)", paddingBottom: 8 }}>
      {label}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ padding: "9px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: "9px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }}>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
}
