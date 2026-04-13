"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RefreshCw, X, Zap, Flame, Droplets, CircuitBoard } from "lucide-react";

const METER_TYPES   = ["SMART", "AMI", "AMR", "BASIC", "PREPAID", "POSTPAID"];
const UTILITY_TYPES = ["ELECTRICITY", "GAS_PNG", "GAS_CNG", "WATER"];
const STATUSES      = ["ACTIVE", "INACTIVE", "FAULTY", "DECOMMISSIONED", "SPARE"];

const UOM: Record<string, string> = {
  ELECTRICITY: "kWh", GAS_PNG: "SCM", GAS_CNG: "SCM", WATER: "kL",
};

const UTILITY_COLOR: Record<string, string> = {
  ELECTRICITY: "#f59e0b", GAS_PNG: "#ef4444", GAS_CNG: "#f97316", WATER: "#3b82f6",
};
const UTILITY_ICON: Record<string, React.ElementType> = {
  ELECTRICITY: Zap, GAS_PNG: Flame, GAS_CNG: Flame, WATER: Droplets,
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:         { bg: "rgba(16,185,129,0.12)",   color: "#10b981" },
  INACTIVE:       { bg: "rgba(107,114,128,0.12)",  color: "var(--muted)" },
  FAULTY:         { bg: "rgba(239,68,68,0.12)",    color: "#ef4444" },
  DECOMMISSIONED: { bg: "rgba(107,114,128,0.12)",  color: "var(--muted)" },
  SPARE:          { bg: "rgba(59,130,246,0.12)",   color: "#3b82f6" },
};

const INPUT: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: "1px solid var(--card-border)", background: "var(--sidebar)",
  color: "var(--foreground)", fontSize: 13, outline: "none",
};

const EMPTY_FORM = { serialNo: "", meterType: "SMART", make: "", model: "", utilityType: "ELECTRICITY", uom: "kWh", calibrationDue: "", status: "ACTIVE" };

function MeterModal({ mode, initial, onClose, onSaved }: {
  mode: "add" | "edit"; initial: any; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => {
    setForm((f: any) => {
      const next = { ...f, [k]: v };
      if (k === "utilityType") next.uom = UOM[v] ?? "kWh";
      return next;
    });
  };

  const save = async () => {
    if (!form.serialNo.trim()) { setError("Serial number is required"); return; }
    if (!form.utilityType)     { setError("Utility type is required"); return; }
    setSaving(true); setError(null);
    try {
      const body: any = { ...form };
      // Convert date string to ISO or null
      if (!body.calibrationDue) {
        body.calibrationDue = null;
      } else {
        const d = new Date(body.calibrationDue);
        body.calibrationDue = isNaN(d.getTime()) ? null : d.toISOString();
      }
      // Derive UOM from utility type
      if (!body.uom) body.uom = UOM[body.utilityType] ?? "kWh";

      const url  = mode === "edit" && initial?.meterId ? `/api/meters/${initial.meterId}` : "/api/meters";
      const method = mode === "edit" ? "PUT" : "POST";
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const L = ({ text }: { text: string }) => (
    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 5, display: "block" }}>{text}</label>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass" style={{ width: 520, borderRadius: 14, border: "1px solid var(--card-border)",
        background: "var(--card-bg)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>
            {mode === "add" ? "Register New Meter" : "Edit Meter"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 12 }}>{error}</div>
          )}

          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <L text="Serial No. *" />
              <input style={INPUT} value={form.serialNo} placeholder="e.g. BLKG-ELC-019015"
                onChange={e => set("serialNo", e.target.value)} />
            </div>
            <div>
              <L text="Meter Type *" />
              <select style={INPUT} value={form.meterType} onChange={e => set("meterType", e.target.value)}>
                {METER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <L text="Make / Manufacturer" />
              <input style={INPUT} value={form.make} placeholder="e.g. Dresser, LandisGyr"
                onChange={e => set("make", e.target.value)} />
            </div>
            <div>
              <L text="Model" />
              <input style={INPUT} value={form.model} placeholder="e.g. E350"
                onChange={e => set("model", e.target.value)} />
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <L text="Utility Type *" />
              <select style={INPUT} value={form.utilityType} onChange={e => set("utilityType", e.target.value)}>
                {UTILITY_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <L text="Unit of Measure (auto)" />
              <input style={{ ...INPUT, color: "var(--muted)", cursor: "not-allowed" }} value={UOM[form.utilityType] ?? form.uom} readOnly />
            </div>
          </div>

          {/* Row 4 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <L text="Calibration Due (optional)" />
              <input style={INPUT} type="date" value={form.calibrationDue}
                onChange={e => set("calibrationDue", e.target.value)} />
            </div>
            <div>
              <L text="Status" />
              <select style={INPUT} value={form.status} onChange={e => set("status", e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--card-border)",
          display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--card-border)",
              background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding: "8px 22px", borderRadius: 8, border: "none",
              background: saving ? "var(--muted)" : "#3b82f6",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : mode === "add" ? "Register Meter" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MetersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row: any } | null>(null);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/meters?${params}`);
      const d = await res.json();
      const data: any[] = d.data?.data ?? d.data ?? [];
      setRows(data);
      setTotal(d.data?.total ?? data.length);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (v: string | null) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return v; }
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Meter Master</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Register, manage and track all utility meters in the field.
          </p>
        </div>
        <button onClick={() => setModal({ mode: "add", row: {} })}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
            borderRadius: 9, border: "none", background: "#3b82f6",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={15} /> Register Meter
        </button>
      </div>

      {/* Search + Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search serial no., make, type…"
            style={{ ...INPUT, paddingLeft: 34, borderRadius: 9 }}
          />
        </div>
        <button onClick={load} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--card-border)",
          background: "transparent", color: "var(--muted)", fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5 }}>
          <RefreshCw size={13} /> Refresh
        </button>
        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>
          {total} meters total
        </span>
      </div>

      {/* Table */}
      <div className="glass" style={{ border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
          padding: "10px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--card-border)" }}>
          {["Serial No.", "Type", "Make / Model", "Utility", "UOM", "Calibration Due", "Status"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <CircuitBoard size={36} style={{ color: "var(--muted)", marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>No meters registered</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Register your first meter to get started.</div>
            <button onClick={() => setModal({ mode: "add", row: {} })}
              style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "#3b82f6",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Register Meter
            </button>
          </div>
        ) : (
          rows.map((row, i) => {
            const Icon = UTILITY_ICON[row.utilityType] ?? CircuitBoard;
            const uColor = UTILITY_COLOR[row.utilityType] ?? "var(--muted)";
            const ss = STATUS_STYLE[row.status] ?? STATUS_STYLE.INACTIVE;
            const calDue = row.calibrationDue ? new Date(row.calibrationDue) : null;
            const overdue = calDue && calDue < new Date();
            return (
              <div key={row.meterId} onClick={() => setModal({ mode: "edit", row })}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
                  padding: "11px 20px", borderBottom: "1px solid var(--card-border)",
                  alignItems: "center", cursor: "pointer",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(59,130,246,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}>
                <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                  {row.serialNo}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{row.meterType}</div>
                <div style={{ fontSize: 12, color: "var(--foreground)" }}>
                  {row.make ?? "—"}{row.model ? <span style={{ color: "var(--muted)" }}> / {row.model}</span> : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon size={13} color={uColor} />
                  <span style={{ fontSize: 11, color: uColor, fontWeight: 600 }}>{row.utilityType?.replace("_", " ")}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{row.uom ?? "—"}</div>
                <div style={{ fontSize: 11, color: overdue ? "#ef4444" : "var(--muted)", fontWeight: overdue ? 700 : 400 }}>
                  {fmtDate(row.calibrationDue)}{overdue ? " ⚠" : ""}
                </div>
                <div>
                  <span style={{ padding: "3px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                    background: ss.bg, color: ss.color }}>
                    {row.status}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--card-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--card-border)",
                  background: "transparent", color: page === 1 ? "var(--muted)" : "var(--foreground)",
                  fontSize: 12, cursor: page === 1 ? "default" : "pointer" }}>← Prev</button>
              <span style={{ fontSize: 12, color: "var(--muted)", padding: "5px 8px" }}>
                {page} / {Math.ceil(total / LIMIT)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
                style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--card-border)",
                  background: "transparent", color: page * LIMIT >= total ? "var(--muted)" : "var(--foreground)",
                  fontSize: 12, cursor: page * LIMIT >= total ? "default" : "pointer" }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <MeterModal
          mode={modal.mode}
          initial={modal.mode === "edit" ? {
            ...modal.row,
            calibrationDue: modal.row.calibrationDue
              ? new Date(modal.row.calibrationDue).toISOString().slice(0, 10)
              : "",
          } : {}}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
