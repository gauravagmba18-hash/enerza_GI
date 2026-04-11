"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Step = "schedule" | "capture" | "validate" | "approve";

interface ConnectionEntry {
  connectionId: string;
  accountId: string;
  customer: { fullName: string; mobile?: string } | null;
  meter: { meterId: string; serialNo: string; meterType: string } | null;
  route: { routeId: string; routeName: string } | null;
  lastReading: { readingId: string; readingDate: string; readingValue: number; consumption: number } | null;
  avgConsumptions: { m1: number; m3: number; m6: number; m12: number };
  readingCount: number;
}

interface ValidationEntry {
  readingId: string;
  readingDate: string;
  readingValue: number;
  consumption: number;
  readingType: string;
  status: string;
  connectionId: string;
  customer: { fullName: string };
  meter: { serialNo: string; meterType: string } | null;
  analysis: {
    mean: number; stdDev: number; sigma: number; isSuspect: boolean;
    rollingAvg3: number; degDayEstimate: number; daysSinceLastRead: number;
    peerAvg: number; historicalCount: number; prevReadingValue: number;
  };
}

interface ApproveEntry {
  readingId: string;
  readingDate: string;
  readingValue: number;
  consumption: number;
  readingType: string;
  connectionId: string;
  accountId: string | null;
  customer: { fullName: string };
  meter: { serialNo: string; meterType: string } | null;
}

interface BillResult {
  generated: number;
  failed: number;
  bills: { billId: string; accountId: string; connectionId: string; totalAmount: number; period: string; planId: string }[];
  errors: { readingId: string; error: string }[];
}

interface RowState { value: string; saving: boolean; saved: boolean; error: string | null; }

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}
function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}
function sigmaClass(s: number) {
  if (s >= 3) return "ds-badge ds-badge-neg";
  if (s >= 2) return "ds-badge ds-badge-warn";
  if (s >= 1) return "ds-badge ds-badge-info";
  return "ds-badge ds-badge-pos";
}
function sigmaLabel(s: number) {
  if (s >= 3) return `${s.toFixed(1)}σ SUSPECT`;
  if (s >= 2) return `${s.toFixed(1)}σ Caution`;
  if (s >= 1) return `${s.toFixed(1)}σ Watch`;
  return `${s.toFixed(1)}σ Normal`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1 — SCHEDULE
   ═══════════════════════════════════════════════════════════════════════════ */
function ScheduleStep() {
  const [data, setData] = useState<{ cycles: any[]; routes: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meter-readings/schedule")
      .then(r => r.json())
      .then(j => { setData(j.data ?? j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--ds-text-muted)" }}>Loading schedule…</div>;
  if (!data) return null;

  const { cycles = [], routes = [] } = data;

  return (
    <div>
      {/* Cycle cards */}
      <div className="ds-section">
        <div className="ds-section-header">
          <h3 className="ds-section-title">Reading Calendar <span className="ds-section-sub">Active billing cycles</span></h3>
        </div>
        {cycles.length === 0 ? (
          <div className="ds-msg ds-msg-info"><span>ℹ</span><span>No active billing cycles configured. Add cycles in Master Data → Tariff &amp; Billing → Bill Cycles.</span></div>
        ) : (
          <div className="ds-tile-grid">
            {cycles.map((c: any, i: number) => (
              <div className="ds-tile" key={c.cycleId} style={{ animationDelay: `${i * 55}ms` }}>
                <div className="ds-tile-accent" />
                <div className="ds-tile-head">
                  <div className="ds-tile-title">{c.cycleName}</div>
                  <div className="ds-tile-sub">Read: {c.readDateRule}</div>
                </div>
                <div className="ds-tile-body">
                  <div className="ds-kpi brand">{c.accountCount}</div>
                  <span className="ds-delta ds-delta-neu">accounts</span>
                </div>
                <div className="ds-tile-foot">
                  <span>Bill: {c.billDateRule || "—"}</span><span>ACTIVE</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route worksheet */}
      <div className="ds-section">
        <div className="ds-section-header">
          <h3 className="ds-section-title">Route Worksheet <span className="ds-section-sub">Reading progress by route</span></h3>
        </div>
        {routes.length === 0 ? (
          <div className="ds-msg ds-msg-info"><span>ℹ</span><span>No active routes configured. Add routes in Master Data → Metering &amp; Network → Routes.</span></div>
        ) : (
          <div className="ds-card">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Cycle Group</th>
                  <th>Total Reads</th>
                  <th>Read This Month</th>
                  <th>Pending</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r: any) => {
                  const pct = r.connectionCount > 0 ? Math.round((r.readThisMonth / r.connectionCount) * 100) : 0;
                  const barColor = pct >= 80 ? "var(--ds-positive)" : pct >= 50 ? "var(--ds-critical)" : "var(--ds-negative)";
                  return (
                    <tr key={r.routeId}>
                      <td style={{ fontWeight: 600 }}>{r.routeName}</td>
                      <td className="ds-table-mono">{r.cycleGroup || "—"}</td>
                      <td className="ds-table-mono">{r.connectionCount}</td>
                      <td className="ds-table-mono" style={{ color: "var(--ds-positive)", fontWeight: 600 }}>{r.readThisMonth}</td>
                      <td>
                        {r.pendingCount > 0
                          ? <span className="ds-badge ds-badge-warn">{r.pendingCount}</span>
                          : <span className="ds-badge ds-badge-pos">0</span>}
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="ds-progress-track" style={{ flex: 1 }}>
                            <div className="ds-progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: barColor, minWidth: 32 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2 — CAPTURE
   ═══════════════════════════════════════════════════════════════════════════ */
function CaptureStep() {
  const [entries, setEntries] = useState<ConnectionEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 20;

  // Debounced search — triggers 400 ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(LIMIT), search });
      const res = await fetch(`/api/meter-readings/entry-data?${q}`);
      const json = await res.json();
      const data: ConnectionEntry[] = json.data?.data ?? [];
      setEntries(data);
      setTotal(json.data?.total ?? 0);
      setRowState(prev => {
        const next = { ...prev };
        data.forEach(e => { if (!next[e.connectionId]) next[e.connectionId] = { value: "", saving: false, saved: false, error: null }; });
        return next;
      });
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const updateRow = (id: string, patch: Partial<RowState>) =>
    setRowState(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const saveRow = async (entry: ConnectionEntry) => {
    const rs = rowState[entry.connectionId];
    if (!rs?.value || !entry.meter || !entry.route) return;
    const newVal = parseFloat(rs.value);
    if (isNaN(newVal)) return;
    updateRow(entry.connectionId, { saving: true, error: null, saved: false });
    try {
      const res = await fetch("/api/meter-readings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings: [{ connectionId: entry.connectionId, meterId: entry.meter.meterId, routeId: entry.route.routeId, readingValue: newVal, readingDate, gpsLat: gps?.lat, gpsLon: gps?.lon }] }),
      });
      const json = await res.json();
      if (json.data?.errors?.length) {
        updateRow(entry.connectionId, { saving: false, error: json.data.errors[0].error });
      } else {
        const consumption = entry.lastReading ? newVal - entry.lastReading.readingValue : newVal;
        updateRow(entry.connectionId, { saving: false, saved: true, value: "" });
        setEntries(prev => prev.map(e => e.connectionId !== entry.connectionId ? e : {
          ...e,
          lastReading: { readingId: json.data?.records?.[0]?.readingId ?? "", readingDate, readingValue: newVal, consumption, readingType: "ACTUAL", status: "PENDING" } as any,
          readingCount: e.readingCount + 1,
        }));
      }
    } catch (err: any) { updateRow(entry.connectionId, { saving: false, error: err.message }); }
  };

  const getGps = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGpsLoading(false); },
      () => setGpsLoading(false)
    );
  };

  const pendingRows = entries.filter(e => rowState[e.connectionId]?.value && !rowState[e.connectionId]?.saved && !rowState[e.connectionId]?.saving && e.meter && e.route);
  const totalPages = Math.ceil(total / LIMIT);

  const getValidation = (entry: ConnectionEntry, value: string) => {
    const v = parseFloat(value);
    if (!value || isNaN(v) || !entry.lastReading) return null;
    const consumption = v - entry.lastReading.readingValue;
    const ref = entry.avgConsumptions.m3 || entry.avgConsumptions.m12 || 0;
    return {
      reversal: consumption < 0,
      zero: consumption === 0,
      low: ref > 0 && consumption >= 0 && consumption < ref * 0.3,
      high: ref > 0 && consumption > ref * 3,
      consumption,
    };
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ background: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius)", padding: "var(--sp-4)", marginBottom: "var(--sp-4)", boxShadow: "var(--ds-bevel-card)", display: "flex", alignItems: "flex-end", gap: "var(--sp-4)", flexWrap: "wrap" }}>
        {/* Search — search-as-you-type */}
        <div className="ds-form-field" style={{ flex: "1 1 240px" }}>
          <label className="ds-form-label">Search Customer</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--ds-text-muted)", fontSize: 15, pointerEvents: "none" }}>⌕</span>
            <input className="ds-form-input" style={{ paddingLeft: 28 }} placeholder="Type name to filter…"
              value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            {searchInput && (
              <button onClick={() => setSearchInput("")}
                style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ds-text-muted)", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>

        <div className="ds-form-field">
          <label className="ds-form-label">Reading Date</label>
          <input type="date" className="ds-form-input" value={readingDate}
            onChange={e => setReadingDate(e.target.value)} style={{ width: 148 }} />
        </div>

        <button className="ds-btn ds-btn-sm" onClick={getGps} disabled={gpsLoading}
          style={{ alignSelf: "flex-end" }}>
          {gps
            ? <><span style={{ color: "var(--ds-positive)" }}>●</span> {gps.lat.toFixed(3)}, {gps.lon.toFixed(3)}</>
            : gpsLoading ? "Locating…" : "📍 GPS Stamp"}
        </button>

        {pendingRows.length > 0 && (
          <button className="ds-btn ds-btn-primary" style={{ alignSelf: "flex-end" }}
            onClick={() => Promise.all(pendingRows.map(e => saveRow(e)))}>
            Save All ({pendingRows.length})
          </button>
        )}

        <span style={{ fontSize: 11, color: "var(--ds-text-muted)", alignSelf: "flex-end", marginLeft: "auto" }}>
          {loading ? "Loading…" : `${total} connections`}
        </span>
      </div>

      {/* Validation legend */}
      <div style={{ display: "flex", gap: "var(--sp-4)", marginBottom: "var(--sp-3)", fontSize: 11, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 11, color: "var(--ds-text-2)" }}>Flag legend:</span>
        <span><span className="ds-badge ds-badge-neg" style={{ marginRight: 4 }}>REVERSAL</span>new &lt; previous</span>
        <span><span className="ds-badge ds-badge-warn" style={{ marginRight: 4 }}>LOW</span>&lt;30% of 3M avg</span>
        <span><span className="ds-badge ds-badge-neg" style={{ marginRight: 4 }}>HIGH</span>&gt;300% of 3M avg</span>
        <span><span className="ds-badge ds-badge-info" style={{ marginRight: 4 }}>ZERO</span>no consumption</span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--ds-text-muted)" }}>Loading connections…</div>
      ) : entries.length === 0 ? (
        <div className="ds-msg ds-msg-info"><span>ℹ</span><span>No electricity connections found{search ? ` matching "${search}"` : ""}.</span></div>
      ) : (
        <div className="ds-card">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Meter Serial</th>
                <th>Previous Reading</th>
                <th>Avg kWh (1M·3M·6M·12M)</th>
                <th>New Reading</th>
                <th>Consumption</th>
                <th>Flags</th>
                <th style={{ textAlign: "center" }}>Save</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const rs = rowState[entry.connectionId] ?? { value: "", saving: false, saved: false, error: null };
                const vr = getValidation(entry, rs.value);
                const hasInput = rs.value !== "" && !isNaN(parseFloat(rs.value));
                const days = entry.lastReading ? daysSince(entry.lastReading.readingDate) : null;
                const rowBg = rs.saved ? "var(--ds-positive-bg)" : vr?.reversal || vr?.high ? "var(--ds-negative-bg)" : vr?.low || vr?.zero ? "var(--ds-critical-bg)" : undefined;

                return (
                  <tr key={entry.connectionId} style={{ background: rowBg }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{entry.customer?.fullName ?? "—"}</div>
                      <div style={{ fontSize: 10, color: "var(--ds-text-muted)", fontFamily: "monospace" }}>{entry.accountId.slice(-8)}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--ds-brand)" }}>{entry.meter?.serialNo ?? <em style={{ opacity: .5 }}>No meter</em>}</div>
                      <div style={{ fontSize: 10, color: "var(--ds-text-muted)" }}>{entry.meter?.meterType}</div>
                    </td>
                    <td>
                      {entry.lastReading ? (
                        <>
                          <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{entry.lastReading.readingValue.toFixed(2)} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ds-text-muted)" }}>kWh</span></div>
                          <div style={{ fontSize: 10, color: days && days > 35 ? "var(--ds-negative)" : "var(--ds-text-muted)" }}>{fmtDate(entry.lastReading.readingDate)} · {days}d ago</div>
                        </>
                      ) : <em style={{ fontSize: 11, color: "var(--ds-text-muted)" }}>First read</em>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 10 }}>
                        {[{ l: "1M", v: entry.avgConsumptions.m1 }, { l: "3M", v: entry.avgConsumptions.m3 }, { l: "6M", v: entry.avgConsumptions.m6 }, { l: "12M", v: entry.avgConsumptions.m12 }].map(({ l, v }) => (
                          v > 0 ? (
                            <div key={l} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 9, color: "var(--ds-text-muted)" }}>{l}</div>
                              <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "monospace" }}>{v.toFixed(0)}</div>
                            </div>
                          ) : null
                        ))}
                        {entry.readingCount === 0 && <em style={{ fontSize: 11, color: "var(--ds-text-muted)" }}>No history</em>}
                      </div>
                    </td>
                    <td>
                      <input type="number" step="0.01" className="ds-form-input mono"
                        placeholder={entry.lastReading ? `> ${entry.lastReading.readingValue.toFixed(2)}` : "Enter"}
                        value={rs.value}
                        onChange={e => updateRow(entry.connectionId, { value: e.target.value, saved: false, error: null })}
                        onKeyDown={e => { if (e.key === "Enter") saveRow(entry); }}
                        disabled={rs.saving || !entry.meter || !entry.route}
                        style={{
                          width: 130, borderBottom: `1px solid ${vr?.reversal || vr?.high ? "var(--ds-negative)" : vr?.low || vr?.zero ? "var(--ds-critical)" : rs.saved ? "var(--ds-positive)" : "var(--ds-text-muted)"}`,
                          fontFamily: "monospace"
                        }} />
                      {rs.error && <div style={{ fontSize: 10, color: "var(--ds-negative)", marginTop: 2 }}>{rs.error}</div>}
                    </td>
                    <td>
                      {vr && (
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: vr.reversal ? "var(--ds-negative)" : vr.consumption === 0 ? "var(--ds-critical)" : "var(--ds-positive)" }}>
                          {vr.consumption >= 0 ? "+" : ""}{vr.consumption.toFixed(2)} kWh
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: 120 }}>
                      {rs.saved ? <span className="ds-badge ds-badge-pos">✓ Saved</span> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {vr?.reversal && <span className="ds-badge ds-badge-neg">REVERSAL</span>}
                          {vr?.high     && <span className="ds-badge ds-badge-neg">HIGH</span>}
                          {vr?.low      && <span className="ds-badge ds-badge-warn">LOW</span>}
                          {vr?.zero     && <span className="ds-badge ds-badge-info">ZERO</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button className={`ds-btn ds-btn-sm ${rs.saved ? "ds-btn-pos" : hasInput ? (vr?.reversal || vr?.high ? "ds-btn-neg" : "ds-btn-primary") : ""}`}
                        disabled={!hasInput || rs.saving || rs.saved || !entry.meter || !entry.route}
                        onClick={() => saveRow(entry)}>
                        {rs.saving ? "…" : rs.saved ? "✓" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-2)", marginTop: "var(--sp-4)" }}>
          <button className="ds-btn ds-btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: "var(--ds-text-2)", display: "flex", alignItems: "center" }}>Page {page} / {totalPages}</span>
          <button className="ds-btn ds-btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 3 — VALIDATE
   ═══════════════════════════════════════════════════════════════════════════ */
function ValidateStep() {
  const [entries, setEntries] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meter-readings/validate-queue");
      const json = await res.json();
      setEntries(Array.isArray(json.data) ? json.data : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (readingId: string, action: string, estimatedValue?: number, readingType?: string) => {
    setActing(p => ({ ...p, [readingId]: true }));
    try {
      await fetch("/api/meter-readings/validate-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId, action, estimatedValue, readingType: readingType ?? "ACTUAL" }),
      });
      setEntries(prev => prev.filter(e => e.readingId !== readingId));
    } finally { setActing(p => ({ ...p, [readingId]: false })); }
  };

  const suspectCount = entries.filter(e => e.analysis.isSuspect).length;
  const visible = filter ? entries.filter(e => e.customer.fullName.toLowerCase().includes(filter.toLowerCase())) : entries;

  if (loading) return <div style={{ textAlign: "center", padding: 48, color: "var(--ds-text-muted)" }}>Loading validation queue…</div>;

  return (
    <div>
      {/* AI insight banner */}
      {entries.length > 0 && (
        <div className="ds-ai-banner">
          <span className="ds-ai-chip">Anomaly Detection</span>
          <span className="ds-ai-text">
            <strong>{entries.length} readings</strong> pending validation.
            {suspectCount > 0 && <> <strong style={{ color: "var(--ds-negative)" }}>{suspectCount} suspect</strong> readings (σ &gt; 3) — possible tamper or meter fault. Review estimation options before approving.</>}
          </span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="ds-msg ds-msg-ok"><span>✓</span><span>All readings validated. No pending exceptions.</span></div>
      ) : (
        <>
          <div className="ds-section-header" style={{ marginBottom: "var(--sp-3)" }}>
            <h3 className="ds-section-title">Validation Queue <span className="ds-section-sub">{entries.length} readings · {suspectCount} suspect</span></h3>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--ds-text-muted)", fontSize: 14, pointerEvents: "none" }}>⌕</span>
                <input className="ds-form-input" style={{ paddingLeft: 26, width: 200, height: 30, fontSize: 12 }}
                  placeholder="Filter by name…" value={filter} onChange={e => setFilter(e.target.value)} />
              </div>
              <button className="ds-btn ds-btn-sm" onClick={load}>↺ Refresh</button>
            </div>
          </div>

          <div className="ds-card">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Customer / Meter</th>
                  <th>Reading</th>
                  <th>Consumption</th>
                  <th>σ Score</th>
                  <th>Estimation Methods</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--ds-text-muted)" }}>No readings match "{filter}"</td></tr>
                )}
                {visible.map(e => {
                  const a = e.analysis;
                  const prevVal = a.prevReadingValue ?? 0;
                  const isActing = acting[e.readingId];
                  return (
                    <tr key={e.readingId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.customer.fullName}</div>
                        <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--ds-text-muted)" }}>{e.meter?.serialNo} · {e.meter?.meterType}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{e.readingValue.toFixed(2)} kWh</div>
                        <div style={{ fontSize: 10, color: "var(--ds-text-muted)" }}>{fmtDate(e.readingDate)} · {a.daysSinceLastRead}d</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, color: e.consumption < 0 ? "var(--ds-negative)" : "var(--ds-text)" }}>
                          {e.consumption >= 0 ? "+" : ""}{e.consumption.toFixed(2)} kWh
                        </div>
                        <div style={{ fontSize: 10, color: "var(--ds-text-muted)" }}>avg: {a.mean.toFixed(1)}</div>
                      </td>
                      <td><span className={sigmaClass(a.sigma)}>{sigmaLabel(a.sigma)}</span></td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ fontSize: 11, display: "flex", gap: 12 }}>
                            <span title="Last 3 reads average"><strong>Rolling:</strong> <span style={{ fontFamily: "monospace" }}>{(prevVal + a.rollingAvg3).toFixed(2)}</span></span>
                            <span title="Days-adjusted average"><strong>Deg-Day:</strong> <span style={{ fontFamily: "monospace" }}>{(prevVal + a.degDayEstimate).toFixed(2)}</span></span>
                            <span title="Same segment peers"><strong>Peer:</strong> <span style={{ fontFamily: "monospace" }}>{a.peerAvg > 0 ? (prevVal + a.peerAvg).toFixed(2) : "—"}</span></span>
                          </div>
                          <div style={{ fontSize: 10, color: "var(--ds-text-muted)" }}>{a.historicalCount} historical reads · stdDev {a.stdDev.toFixed(1)}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          <button className="ds-btn ds-btn-pos ds-btn-sm" disabled={isActing}
                            onClick={() => act(e.readingId, "VALIDATE", undefined, "ACTUAL")}
                            title="Approve as actual reading">✓ Actual</button>
                          <button className="ds-btn ds-btn-sm" disabled={isActing || a.rollingAvg3 <= 0}
                            onClick={() => act(e.readingId, "ESTIMATE", prevVal + a.rollingAvg3)}
                            title="Replace with rolling average estimate">~ Rolling</button>
                          <button className="ds-btn ds-btn-sm" disabled={isActing || a.degDayEstimate <= 0}
                            onClick={() => act(e.readingId, "ESTIMATE", prevVal + a.degDayEstimate)}
                            title="Replace with degree-day estimate">~ Deg-Day</button>
                          {a.peerAvg > 0 && (
                            <button className="ds-btn ds-btn-sm" disabled={isActing}
                              onClick={() => act(e.readingId, "ESTIMATE", prevVal + a.peerAvg)}
                              title="Replace with peer benchmark">~ Peer</button>
                          )}
                          <button className="ds-btn ds-btn-neg ds-btn-sm" disabled={isActing}
                            onClick={() => act(e.readingId, "CREATE_WO")}
                            title="Flag for work order investigation">⚑ WO</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 4 — APPROVE
   ═══════════════════════════════════════════════════════════════════════════ */
function ApproveStep() {
  const [entries, setEntries] = useState<ApproveEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [lastApproved, setLastApproved] = useState<ApproveEntry[]>([]);
  const [generatingBills, setGeneratingBills] = useState(false);
  const [billResults, setBillResults] = useState<BillResult | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meter-readings/approve");
      const json = await res.json();
      const data = json.data?.data ?? json.data ?? [];
      setEntries(Array.isArray(data) ? data : []);
      setTotal(json.data?.total ?? data.length);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === entries.length ? new Set() : new Set(entries.map(e => e.readingId)));

  const approve = async (type: "ACTUAL" | "ESTIMATED" | "SUBSTITUTE") => {
    const ids = selected.size > 0 ? [...selected] : entries.map(e => e.readingId);
    if (ids.length === 0) return;
    setApproving(true);
    try {
      await fetch("/api/meter-readings/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings: ids.map(id => ({ readingId: id, readingType: type })) }),
      });
      // Capture entries being approved so Generate Bills CTA can reference them
      const approved = entries.filter(e => ids.includes(e.readingId));
      setLastApproved(prev => [...prev, ...approved]);
      setBillResults(null);
      setEntries(prev => prev.filter(e => !ids.includes(e.readingId)));
      setSelected(new Set());
    } finally { setApproving(false); }
  };

  const generateBills = async () => {
    if (lastApproved.length === 0) return;
    setGeneratingBills(true);
    try {
      const res  = await fetch("/api/meter-readings/generate-bills", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ readingIds: lastApproved.map(e => e.readingId) }),
      });
      const json = await res.json();
      setBillResults(json.data ?? json);
    } finally { setGeneratingBills(false); }
  };

  const visibleApprove = filter ? entries.filter(e => e.customer.fullName.toLowerCase().includes(filter.toLowerCase())) : entries;

  if (loading) return <div style={{ textAlign: "center", padding: 48, color: "var(--ds-text-muted)" }}>Loading approval queue…</div>;

  return (
    <div>
      {entries.length === 0 ? (
        <div className="ds-msg ds-msg-ok"><span>✓</span><span>No readings awaiting approval. All validated readings have been released to the billing engine.</span></div>
      ) : (
        <>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
            <h3 className="ds-section-title">{total} readings awaiting approval</h3>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--ds-text-muted)", fontSize: 14, pointerEvents: "none" }}>⌕</span>
              <input className="ds-form-input" style={{ paddingLeft: 26, width: 180, height: 30, fontSize: 12 }}
                placeholder="Filter by name…" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "var(--sp-2)" }}>
              <button className="ds-btn ds-btn-sm" onClick={() => toggleAll()}>
                {selected.size === entries.length ? "Deselect All" : "Select All"}
              </button>
              <button className="ds-btn ds-btn-pos" disabled={approving}
                onClick={() => approve("ACTUAL")}>
                ✓ Approve{selected.size > 0 ? ` (${selected.size})` : " All"} — ACTUAL
              </button>
              <button className="ds-btn ds-btn-sm" disabled={approving}
                onClick={() => approve("ESTIMATED")}>
                ~ Approve as ESTIMATED
              </button>
              <button className="ds-btn ds-btn-sm" disabled={approving}
                onClick={() => approve("SUBSTITUTE")}>
                ↔ Approve as SUBSTITUTE
              </button>
            </div>
          </div>

          <div className="ds-card">
            <table className="ds-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.size === entries.length && entries.length > 0}
                      onChange={toggleAll} style={{ cursor: "pointer" }} />
                  </th>
                  <th>Customer</th>
                  <th>Meter</th>
                  <th>Reading Date</th>
                  <th>Reading Value</th>
                  <th>Consumption</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {visibleApprove.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--ds-text-muted)" }}>No readings match "{filter}"</td></tr>
                )}
                {visibleApprove.map(e => (
                  <tr key={e.readingId} onClick={() => toggleSelect(e.readingId)}
                    style={{ background: selected.has(e.readingId) ? "var(--ds-brand-light)" : undefined }}>
                    <td>
                      <input type="checkbox" checked={selected.has(e.readingId)}
                        onChange={() => toggleSelect(e.readingId)} onClick={ev => ev.stopPropagation()} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.customer.fullName}</td>
                    <td className="ds-table-mono">{e.meter?.serialNo ?? "—"}</td>
                    <td>{fmtDate(e.readingDate)}</td>
                    <td className="ds-table-mono" style={{ fontWeight: 700 }}>{e.readingValue.toFixed(2)} kWh</td>
                    <td className="ds-table-mono" style={{ color: e.consumption < 0 ? "var(--ds-negative)" : "var(--ds-positive)", fontWeight: 600 }}>
                      {e.consumption >= 0 ? "+" : ""}{e.consumption.toFixed(2)}
                    </td>
                    <td>
                      <span className={`ds-badge ${e.readingType === "ACTUAL" ? "ds-badge-pos" : e.readingType === "ESTIMATED" ? "ds-badge-warn" : "ds-badge-neu"}`}>
                        {e.readingType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ds-msg ds-msg-info" style={{ marginTop: "var(--sp-4)" }}>
            <span>ℹ</span>
            <span>Approved readings are tagged with their type (Actual / Estimated / Substitute) and <strong>released to the billing engine</strong> for bill generation in the next billing run.</span>
          </div>
        </>
      )}

      {/* ── Generate Bills CTA — appears after any batch approval ─────────── */}
      {lastApproved.length > 0 && (
        <div className="ds-card" style={{ marginTop: "var(--sp-5)", boxShadow: "var(--ds-bevel-card)" }}>
          <div className="ds-card-header" style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ds-text-1)" }}>Generate Bills</div>
              <div style={{ fontSize: 12, color: "var(--ds-text-muted)" }}>
                {lastApproved.length} reading{lastApproved.length > 1 ? "s" : ""} approved and ready for billing
              </div>
            </div>
          </div>

          <div style={{ padding: "var(--sp-4)" }}>
            {/* Preview of what will be billed */}
            {!billResults && (
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <div className="ds-table-wrapper" style={{ maxHeight: 220, overflowY: "auto" }}>
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Reading Date</th>
                        <th>Consumption</th>
                        <th>Reading Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastApproved.map(e => (
                        <tr key={e.readingId}>
                          <td style={{ fontWeight: 600 }}>{e.customer.fullName}</td>
                          <td>{fmtDate(e.readingDate)}</td>
                          <td className="ds-table-mono" style={{ color: "var(--ds-positive)", fontWeight: 600 }}>
                            +{e.consumption.toFixed(2)} kWh
                          </td>
                          <td>
                            <span className={`ds-badge ${e.readingType === "ACTUAL" ? "ds-badge-pos" : e.readingType === "ESTIMATED" ? "ds-badge-warn" : "ds-badge-neu"}`}>
                              {e.readingType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Result panel */}
            {billResults ? (
              <div>
                {billResults.generated > 0 && (
                  <div className="ds-msg ds-msg-ok" style={{ marginBottom: "var(--sp-3)" }}>
                    <span>✓</span>
                    <span>
                      <strong>{billResults.generated} bill{billResults.generated > 1 ? "s" : ""} generated</strong>
                      {" "}— total:{" "}
                      <strong>
                        ₹{billResults.bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                      . View in{" "}
                      <a href="/data/bills" style={{ color: "var(--ds-brand)", textDecoration: "underline" }}>
                        Master Data → Bills
                      </a>.
                    </span>
                  </div>
                )}
                {billResults.failed > 0 && (
                  <div className="ds-msg ds-msg-neg" style={{ marginBottom: "var(--sp-3)" }}>
                    <span>✕</span>
                    <span>
                      {billResults.failed} reading{billResults.failed > 1 ? "s" : ""} failed:{" "}
                      {billResults.errors.map(e => e.error).join("; ")}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button className="ds-btn ds-btn-sm"
                    onClick={() => { setLastApproved([]); setBillResults(null); }}>
                    Clear
                  </button>
                  <a href="/data/bills" className="ds-btn ds-btn-sm">
                    View Bills →
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                <button
                  className="ds-btn ds-btn-primary"
                  disabled={generatingBills}
                  onClick={generateBills}
                  style={{ minWidth: 200 }}
                >
                  {generatingBills
                    ? "Generating bills…"
                    : `⚡ Generate ${lastApproved.length} Bill${lastApproved.length > 1 ? "s" : ""}`}
                </button>
                <button className="ds-btn ds-btn-sm"
                  disabled={generatingBills}
                  onClick={() => { setLastApproved([]); setBillResults(null); }}>
                  Discard
                </button>
                <span style={{ fontSize: 12, color: "var(--ds-text-muted)" }}>
                  Bills will be created in PENDING status and released to collections.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE — 4-Step Meter Reading Cycle
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MeterReadingCyclePage() {
  const [step, setStep] = useState<Step>("capture");

  const steps: { key: Step; num: number; label: string; desc: string }[] = [
    { key: "schedule", num: 1, label: "Schedule",  desc: "MRO by cycle / route" },
    { key: "capture",  num: 2, label: "Capture",   desc: "Enter / import reads" },
    { key: "validate", num: 3, label: "Validate",  desc: "σ-check & estimation" },
    { key: "approve",  num: 4, label: "Approve",   desc: "Freeze & release" },
  ];

  return (
    <div className="ds-page">
      {/* Page header */}
      <div className="ds-section-header" style={{ marginBottom: "var(--sp-4)" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ds-text)", letterSpacing: "-.3px" }}>
            Meter Reading Cycle
          </h1>
          <p style={{ fontSize: 12, color: "var(--ds-text-muted)", marginTop: 2 }}>
            Electricity · Schedule → Capture → Validate → Approve
          </p>
        </div>
        <span className="ds-badge ds-badge-pos">ACTIVE</span>
      </div>

      {/* Step bar */}
      <div className="ds-step-bar">
        {steps.map(s => (
          <button
            key={s.key}
            className={`ds-step${step === s.key ? " active" : ""}`}
            onClick={() => setStep(s.key)}
          >
            <span className="ds-step-num">{s.num}</span>
            <span>
              {s.label}
              <span style={{ display: "block", fontSize: 10, fontWeight: 400, color: step === s.key ? "var(--ds-brand-dark)" : "var(--ds-text-muted)" }}>
                {s.desc}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {step === "schedule" && <ScheduleStep />}
      {step === "capture"  && <CaptureStep />}
      {step === "validate" && <ValidateStep />}
      {step === "approve"  && <ApproveStep />}
    </div>
  );
}
