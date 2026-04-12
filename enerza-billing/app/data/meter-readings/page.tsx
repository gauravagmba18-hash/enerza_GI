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
  anomaly: {
    isAnomaly: boolean;
    isReverse: boolean;
    isZero: boolean;
    isHigh: boolean;
    isLow: boolean;
    avg3: number;
    avg12: number;
    factor: number | null;
  };
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
  const [data, setData]             = useState<{ cycles: any[]; routes: any[] } | null>(null);
  const [loading, setLoading]       = useState(true);
  const [technicians, setTechs]     = useState<any[]>([]);
  const [assigning, setAssigning]   = useState<Record<string, boolean>>({});
  const [assigned, setAssigned]     = useState<Record<string, string>>({}); // routeId → techName
  const [techSel, setTechSel]       = useState<Record<string, string>>({}); // routeId → techId

  useEffect(() => {
    Promise.all([
      fetch("/api/meter-readings/schedule").then(r => r.json()),
      fetch("/api/field/technicians").then(r => r.json()),
    ]).then(([sched, techs]) => {
      setData(sched.data ?? sched);
      setTechs(Array.isArray(techs.data) ? techs.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const assignRoute = async (route: any) => {
    const techId = techSel[route.routeId];
    if (!techId) return;
    setAssigning(p => ({ ...p, [route.routeId]: true }));
    try {
      // Create a service ticket and work order for this route reading round
      const ticketRes = await fetch("/api/field/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Meter Reading Round — ${route.routeName}`,
          description: `Scheduled meter reading for route ${route.routeName}. Pending: ${route.pendingCount} reads.`,
          status: "OPEN", priority: "MEDIUM", category: "METER_READING",
          accountId: "account_hq_01", // system account
        }),
      });
      const ticketJson = await ticketRes.json();
      const ticketId = ticketJson.data?.ticketId;
      if (ticketId) {
        await fetch("/api/field/work-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId,
            technicianId: techId,
            scheduledDate: new Date().toISOString(),
            notes: `Reading round for ${route.routeName}`,
          }),
        });
      }
      const tech = technicians.find((t: any) => t.technicianId === techId);
      setAssigned(p => ({ ...p, [route.routeId]: tech?.fullName ?? "Technician" }));
    } finally {
      setAssigning(p => ({ ...p, [route.routeId]: false }));
    }
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>Loading schedule…</div>;
  if (!data) return null;

  const { cycles = [], routes = [] } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Cycle cards */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 18, background: "var(--accent)", borderRadius: 2, display: "block" }} />
            Reading Calendar <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginLeft: 4 }}>Active billing cycles</span>
          </h3>
        </div>
        {cycles.length === 0 ? (
          <div className="ds-msg ds-msg-info"><span>ℹ</span><span>No active billing cycles configured.</span></div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {cycles.map((c: any) => (
              <div key={c.cycleId} className="ds-card" style={{ minWidth: 180, flex: 1, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{c.cycleName}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8 }}>Read: {c.readDateRule}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "-1px" }}>{c.accountCount}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>accounts</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route worksheet with technician assignment */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 18, background: "var(--accent)", borderRadius: 2, display: "block" }} />
            Route Worksheet <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginLeft: 4 }}>Assign routes to technicians</span>
          </h3>
        </div>
        {routes.length === 0 ? (
          <div className="ds-msg ds-msg-info"><span>ℹ</span><span>No active routes configured. Add routes in Master Data → Routes.</span></div>
        ) : (
          <div className="ds-card">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Billing Cycle</th>
                  <th>Due</th>
                  <th>Total Reads</th>
                  <th>Read This Month</th>
                  <th>Pending</th>
                  <th>Completion</th>
                  <th>Assign Technician</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r: any) => {
                  const pct = r.connectionCount > 0 ? Math.round((r.readThisMonth / r.connectionCount) * 100) : 0;
                  const barColor = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
                  // isAssigned from API (already assigned this month) OR from local state (just assigned now)
                  const isAssigned = r.isAssigned || !!assigned[r.routeId];
                  const assignedTo = assigned[r.routeId] ?? r.assignedTo;
                  const scheduledDate = r.scheduledDate;
                  const isDue = r.isDue !== false; // default true if field missing
                  const rowOpacity = isDue ? 1 : 0.45;
                  return (
                    <tr key={r.routeId} style={{ opacity: rowOpacity }}>
                      <td style={{ fontWeight: 600 }}>
                        {r.routeName}
                        {!isDue && (
                          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Not due this month</div>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.cycleName || r.cycleGroup || "—"}</td>
                      <td>
                        {isDue
                          ? <span className="ds-badge ds-badge-pos">Due</span>
                          : <span className="ds-badge ds-badge-neu">Upcoming</span>}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.connectionCount}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--success)", fontWeight: 600 }}>{r.readThisMonth}</td>
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
                      <td>
                        {isAssigned ? (
                          <div>
                            <span className="ds-badge ds-badge-pos">✓ {assignedTo}</span>
                            {scheduledDate && (
                              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{scheduledDate}</div>
                            )}
                          </div>
                        ) : !isDue ? (
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <select
                              value={techSel[r.routeId] ?? ""}
                              onChange={e => setTechSel(p => ({ ...p, [r.routeId]: e.target.value }))}
                              style={{ height: 28, padding: "0 8px", border: "1px solid var(--card-border)", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "var(--foreground)", fontSize: 11, fontFamily: "inherit" }}>
                              <option value="">Select…</option>
                              {technicians.map((t: any) => (
                                <option key={t.technicianId} value={t.technicianId}>{t.fullName}</option>
                              ))}
                            </select>
                            <button className="ds-btn ds-btn-primary ds-btn-sm"
                              disabled={!techSel[r.routeId] || assigning[r.routeId]}
                              onClick={() => assignRoute(r)}>
                              {assigning[r.routeId] ? "…" : "Assign"}
                            </button>
                          </div>
                        )}
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
    if (!rs?.value || !entry.meter) return;  // route is optional for manual entry
    const newVal = parseFloat(rs.value);
    if (isNaN(newVal)) return;
    updateRow(entry.connectionId, { saving: true, error: null, saved: false });
    try {
      const res = await fetch("/api/meter-readings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings: [{ connectionId: entry.connectionId, meterId: entry.meter.meterId, routeId: entry.route?.routeId ?? null, readingValue: newVal, readingDate, gpsLat: gps?.lat, gpsLon: gps?.lon }] }),
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

  const pendingRows = entries.filter(e => rowState[e.connectionId]?.value && !rowState[e.connectionId]?.saved && !rowState[e.connectionId]?.saving && e.meter);
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
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "#ffffff", border: "1px solid #d1d8de", borderRadius: 10, padding: "12px 16px", marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,.9) inset, 0 -1px 0 0 rgba(0,0,0,.04) inset, 0 2px 8px rgba(29,45,62,.07), 0 1px 2px rgba(29,45,62,.08)", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: "1 1 240px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#4a6070", letterSpacing: ".03em", textTransform: "uppercase" }}>Search Customer</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8396a8", fontSize: 16, pointerEvents: "none" }}>⌕</span>
            <input
              style={{ height: 36, paddingLeft: 32, paddingRight: searchInput ? 32 : 12, border: "none", borderBottom: "2px solid #d1d8de", background: "transparent", color: "#1d2d3e", fontSize: 13, fontFamily: "inherit", width: "100%", outline: "none", transition: "border-color .15s" }}
              placeholder="Type name to filter…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onFocus={e => e.currentTarget.style.borderBottomColor = "#0070f2"}
              onBlur={e => e.currentTarget.style.borderBottomColor = "#d1d8de"}
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")}
                style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8396a8", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>

        {/* Reading Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#4a6070", letterSpacing: ".03em", textTransform: "uppercase" }}>Reading Date</label>
          <input type="date"
            style={{ height: 36, padding: "0 12px", border: "none", borderBottom: "2px solid #d1d8de", background: "transparent", color: "#1d2d3e", fontSize: 13, fontFamily: "inherit", width: 150, outline: "none" }}
            value={readingDate}
            onChange={e => setReadingDate(e.target.value)}
            onFocus={e => e.currentTarget.style.borderBottomColor = "#0070f2"}
            onBlur={e => e.currentTarget.style.borderBottomColor = "#d1d8de"}
          />
        </div>

        {/* GPS */}
        <button
          onClick={getGps}
          disabled={gpsLoading}
          style={{ height: 32, padding: "0 12px", border: "1px solid #d1d8de", borderRadius: 6, background: "#ffffff", color: "#1d2d3e", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, boxShadow: "0 1px 0 rgba(255,255,255,.8) inset, 0 1px 3px rgba(29,45,62,.08), 0 1px 1px rgba(29,45,62,.06)", flexShrink: 0 }}>
          {gps
            ? <><span style={{ color: "#256f3a" }}>●</span> {gps.lat.toFixed(3)}, {gps.lon.toFixed(3)}</>
            : gpsLoading ? "Locating…" : "📍 GPS Stamp"}
        </button>

        {pendingRows.length > 0 && (
          <button
            onClick={() => Promise.all(pendingRows.map(e => saveRow(e)))}
            style={{ height: 32, padding: "0 16px", border: "1px solid #0058c0", borderRadius: 6, background: "#0070f2", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, boxShadow: "0 1px 0 rgba(255,255,255,.2) inset, 0 2px 5px rgba(0,112,242,.35)", flexShrink: 0 }}>
            ✓ Save All ({pendingRows.length})
          </button>
        )}

        <span style={{ fontSize: 11, color: "#8396a8", marginLeft: "auto", alignSelf: "flex-end", paddingBottom: 6 }}>
          {loading ? "Loading…" : `${total} connections`}
        </span>
      </div>

      {/* ── Flag legend ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: "#4a6070" }}>Flag legend:</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: "#fce8e8", border: "1px solid #f0b0b0", color: "#aa0808" }}>REVERSAL</span>
          <span style={{ color: "#4a6070" }}>new &lt; previous</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: "#fef3e6", border: "1px solid #f5c98a", color: "#df6e0c" }}>LOW</span>
          <span style={{ color: "#4a6070" }}>&lt;30% of 3M avg</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: "#fce8e8", border: "1px solid #f0b0b0", color: "#aa0808" }}>HIGH</span>
          <span style={{ color: "#4a6070" }}>&gt;300% of 3M avg</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: "#e8f2ff", border: "1px solid #99c4f8", color: "#0070f2" }}>ZERO</span>
          <span style={{ color: "#4a6070" }}>no consumption</span>
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#8396a8", background: "#ffffff", border: "1px solid #d1d8de", borderRadius: 10 }}>Loading connections…</div>
      ) : entries.length === 0 ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 6, background: "#e8f2ff", border: "1px solid #99c4f8", borderLeft: "3px solid #0070f2", color: "#1d2d3e", fontSize: 13 }}><span>ℹ</span><span>No electricity connections found{search ? ` matching "${search}"` : ""}.</span></div>
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
                        disabled={rs.saving || !entry.meter}
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
                      {!entry.meter ? (
                        <span style={{ fontSize: 10, color: "var(--warning)", fontWeight: 600 }}>No meter<br/>assigned</span>
                      ) : (
                        <button className={`ds-btn ds-btn-sm ${rs.saved ? "ds-btn-pos" : hasInput ? (vr?.reversal || vr?.high ? "ds-btn-neg" : "ds-btn-primary") : ""}`}
                          disabled={!hasInput || rs.saving || rs.saved}
                          onClick={() => saveRow(entry)}>
                          {rs.saving ? "…" : rs.saved ? "✓ Saved" : "Save"}
                        </button>
                      )}
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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ height: 26, padding: "0 12px", border: "1px solid #d1d8de", borderRadius: 6, background: "#ffffff", color: "#1d2d3e", fontSize: 11, fontFamily: "inherit", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .45 : 1 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 12, color: "#4a6070", padding: "0 8px" }}>Page {page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ height: 26, padding: "0 12px", border: "1px solid #d1d8de", borderRadius: 6, background: "#ffffff", color: "#1d2d3e", fontSize: 11, fontFamily: "inherit", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? .45 : 1 }}>
            Next →
          </button>
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

  if (loading) return <div style={{ textAlign: "center", padding: 48, color: "#8396a8", background: "#ffffff", border: "1px solid #d1d8de", borderRadius: 10 }}>Loading validation queue…</div>;

  return (
    <div>
      {/* AI insight banner */}
      {entries.length > 0 && (
        <div style={{ background: "linear-gradient(135deg,#eef3ff 0%,#f3f7ff 100%)", border: "1px solid #99c4f8", borderTop: "1px solid rgba(255,255,255,.9)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20, boxShadow: "0 1px 0 0 rgba(255,255,255,.9) inset, 0 2px 8px rgba(29,45,62,.07)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#0070f2", background: "rgba(0,112,242,.1)", border: "1px solid #99c4f8", borderRadius: 6, padding: "1px 8px", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>Anomaly Detection</span>
          <span style={{ fontSize: 12, color: "#4a6070", lineHeight: 1.6 }}>
            <strong style={{ color: "#1d2d3e" }}>{entries.length} readings</strong> pending validation.
            {suspectCount > 0 && <> <strong style={{ color: "#aa0808" }}>{suspectCount} suspect</strong> readings (σ &gt; 3) — possible tamper or meter fault. Review estimation options before approving.</>}
          </span>
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 6, background: "#e6f4ea", border: "1px solid #a3d4ad", borderLeft: "3px solid #256f3a", color: "#1d2d3e", fontSize: 13 }}><span>✓</span><span>All readings validated. No pending exceptions.</span></div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1d2d3e", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "block", width: 3, height: 18, background: "#0070f2", borderRadius: 2 }} />
              Validation Queue
              <span style={{ fontSize: 11, fontWeight: 400, color: "#8396a8" }}>{entries.length} readings · {suspectCount} suspect</span>
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#8396a8", fontSize: 14, pointerEvents: "none" }}>⌕</span>
                <input
                  style={{ height: 30, paddingLeft: 26, paddingRight: 12, width: 200, border: "none", borderBottom: "1px solid #d1d8de", background: "transparent", color: "#1d2d3e", fontSize: 12, fontFamily: "inherit", outline: "none" }}
                  placeholder="Filter by name…" value={filter} onChange={e => setFilter(e.target.value)} />
              </div>
              <button
                onClick={load}
                style={{ height: 26, padding: "0 12px", border: "1px solid #d1d8de", borderRadius: 6, background: "#ffffff", color: "#1d2d3e", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
                ↺ Refresh
              </button>
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
   STEP 4 — APPROVE  (with anomaly detection + raise service ticket)
   ═══════════════════════════════════════════════════════════════════════════ */
function ApproveStep() {
  const [entries, setEntries]           = useState<ApproveEntry[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [approving, setApproving]       = useState(false);
  const [lastApproved, setLastApproved] = useState<ApproveEntry[]>([]);
  const [generatingBills, setGeneratingBills] = useState(false);
  const [billResults, setBillResults]   = useState<BillResult | null>(null);
  const [filter, setFilter]             = useState("");
  const [ticketing, setTicketing]       = useState<Record<string, boolean>>({});
  const [ticketed, setTicketed]         = useState<Record<string, string>>({}); // readingId → ticketId

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/meter-readings/approve");
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

  // Approve selected (or all) readings
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
      const approved = entries.filter(e => ids.includes(e.readingId));
      setLastApproved(prev => [...prev, ...approved]);
      setBillResults(null);
      setEntries(prev => prev.filter(e => !ids.includes(e.readingId)));
      setSelected(new Set());
    } finally { setApproving(false); }
  };

  // Raise a service ticket for a suspicious reading and move it to EXCEPTION
  const raiseTicket = async (entry: ApproveEntry) => {
    if (!entry.accountId) return;
    setTicketing(p => ({ ...p, [entry.readingId]: true }));
    const a = entry.anomaly;
    const reason = a.isReverse ? "REVERSE" : a.isHigh ? "HIGH_CONSUMPTION" : a.isLow ? "LOW_CONSUMPTION" : "ANOMALY";
    const factor = a.factor !== null ? ` (${a.factor}× avg)` : "";
    const description = `Meter: ${entry.meter?.serialNo ?? "unknown"}. Consumption: ${entry.consumption.toFixed(2)} kWh${factor}. 3M avg: ${a.avg3} kWh.`;
    try {
      const res  = await fetch("/api/meter-readings/raise-ticket", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ readingId: entry.readingId, accountId: entry.accountId, reason, description }),
      });
      const json = await res.json();
      const tid  = json.data?.ticketId ?? "created";
      setTicketed(p => ({ ...p, [entry.readingId]: tid }));
      setEntries(prev => prev.filter(e => e.readingId !== entry.readingId));
    } finally { setTicketing(p => ({ ...p, [entry.readingId]: false })); }
  };

  // Generate bills using the billing engine for all approved readings
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

  const anomalyCount = entries.filter(e => e.anomaly?.isAnomaly).length;
  const visible = filter ? entries.filter(e => e.customer.fullName.toLowerCase().includes(filter.toLowerCase())) : entries;

  if (loading) return <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>Loading approval queue…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Anomaly summary banner ───────────────────────────────────────── */}
      {anomalyCount > 0 && (
        <div className="ds-ai-banner">
          <span className="ds-ai-chip">Tamper Detection</span>
          <span className="ds-ai-text">
            Billing engine flagged <strong>{anomalyCount} reading{anomalyCount > 1 ? "s" : ""}</strong> with anomalies —
            reverse consumption, high consumption (&gt;3× avg), or low consumption (&lt;30% avg).
            Review each flag and either <strong>approve</strong> (genuine) or <strong>raise a service ticket</strong> for field investigation.
          </span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="ds-msg ds-msg-ok"><span>✓</span><span>No readings awaiting approval. All validated readings have been released to the billing engine.</span></div>
      ) : (
        <>
          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 3, height: 18, background: "var(--accent)", borderRadius: 2, display: "block" }} />
              {total} readings awaiting approval
              {anomalyCount > 0 && <span className="ds-badge ds-badge-warn">{anomalyCount} anomalies</span>}
            </h3>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 14, pointerEvents: "none" }}>⌕</span>
              <input className="ds-form-input" style={{ paddingLeft: 26, width: 180, height: 30, fontSize: 12 }}
                placeholder="Filter by name…" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="ds-btn ds-btn-sm" onClick={toggleAll}>
                {selected.size === entries.length ? "Deselect All" : "Select All"}
              </button>
              <button className="ds-btn ds-btn-pos" disabled={approving} onClick={() => approve("ACTUAL")}>
                ✓ Approve{selected.size > 0 ? ` (${selected.size})` : " All"} — ACTUAL
              </button>
              <button className="ds-btn ds-btn-sm" disabled={approving} onClick={() => approve("ESTIMATED")}>~ ESTIMATED</button>
              <button className="ds-btn ds-btn-sm" disabled={approving} onClick={() => approve("SUBSTITUTE")}>↔ SUBSTITUTE</button>
            </div>
          </div>

          {/* ── Readings table with anomaly column ──────────────────────── */}
          <div className="ds-card">
            <table className="ds-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.size === entries.length && entries.length > 0}
                      onChange={toggleAll} style={{ cursor: "pointer", accentColor: "var(--accent)" }} />
                  </th>
                  <th>Customer</th>
                  <th>Meter</th>
                  <th>Reading Date</th>
                  <th>Reading</th>
                  <th>Consumption</th>
                  <th>Anomaly Check</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No readings match "{filter}"</td></tr>
                )}
                {visible.map(e => {
                  const a  = e.anomaly ?? {};
                  const rowBg = selected.has(e.readingId) ? "rgba(6,182,212,0.08)"
                    : a.isReverse ? "rgba(239,68,68,0.07)"
                    : a.isHigh    ? "rgba(245,158,11,0.07)"
                    : undefined;
                  return (
                    <tr key={e.readingId} onClick={() => toggleSelect(e.readingId)}
                      style={{ cursor: "pointer", background: rowBg }}>
                      <td onClick={ev => ev.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(e.readingId)}
                          onChange={() => toggleSelect(e.readingId)}
                          style={{ cursor: "pointer", accentColor: "var(--accent)" }} />
                      </td>
                      <td style={{ fontWeight: 600 }}>{e.customer.fullName}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{e.meter?.serialNo ?? "—"}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{fmtDate(e.readingDate)}</td>
                      <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{e.readingValue.toFixed(2)} kWh</td>
                      <td style={{ fontFamily: "monospace", fontWeight: 700,
                        color: a.isReverse ? "var(--danger)" : a.isHigh ? "var(--warning)" : "var(--success)" }}>
                        {e.consumption >= 0 ? "+" : ""}{e.consumption.toFixed(2)} kWh
                      </td>
                      {/* Anomaly column */}
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {a.isReverse && <span className="ds-badge ds-badge-neg">⚠ REVERSE</span>}
                          {a.isHigh    && <span className="ds-badge ds-badge-warn">↑ HIGH {a.factor}×</span>}
                          {a.isLow     && <span className="ds-badge ds-badge-info">↓ LOW</span>}
                          {a.isZero    && <span className="ds-badge ds-badge-neu">ZERO</span>}
                          {!a.isAnomaly && <span className="ds-badge ds-badge-pos">✓ Normal</span>}
                          {(a.avg3 > 0) && (
                            <span style={{ fontSize: 10, color: "var(--muted)", display: "block", width: "100%", marginTop: 2 }}>
                              3M avg: {a.avg3} kWh
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Action column */}
                      <td style={{ textAlign: "center" }} onClick={ev => ev.stopPropagation()}>
                        {ticketed[e.readingId] ? (
                          <span className="ds-badge ds-badge-warn">⚑ Ticket raised</span>
                        ) : a.isAnomaly ? (
                          <button className="ds-btn ds-btn-neg ds-btn-sm"
                            disabled={ticketing[e.readingId] || !e.accountId}
                            onClick={() => raiseTicket(e)}
                            title="Flag for field investigation — reading moved to EXCEPTION">
                            {ticketing[e.readingId] ? "…" : "⚑ Raise Ticket"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ds-msg ds-msg-info">
            <span>ℹ</span>
            <span>
              <strong>Approve</strong> normal readings. For anomalies (reverse, high, low), either approve if genuine or click <strong>Raise Ticket</strong> to send to field for inspection. Only approved readings proceed to bill generation.
            </span>
          </div>
        </>
      )}

      {/* ── Generate Bills CTA — appears after any batch approval ─────── */}
      {lastApproved.length > 0 && (
        <div className="ds-card">
          <div className="ds-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>Generate Bills via Billing Engine</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                  {lastApproved.length} reading{lastApproved.length > 1 ? "s" : ""} approved — ready to bill
                </div>
              </div>
            </div>
            {!billResults && <span className="ds-badge ds-badge-info">PENDING</span>}
          </div>
          <div style={{ padding: 16 }}>
            {!billResults && (
              <div style={{ marginBottom: 16, maxHeight: 220, overflowY: "auto" }}>
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Customer</th><th>Reading Date</th><th>Consumption</th><th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastApproved.map(e => (
                      <tr key={e.readingId}>
                        <td style={{ fontWeight: 600 }}>{e.customer.fullName}</td>
                        <td>{fmtDate(e.readingDate)}</td>
                        <td style={{ fontFamily: "monospace", color: "var(--success)", fontWeight: 600 }}>+{e.consumption.toFixed(2)} kWh</td>
                        <td><span className={`ds-badge ${e.readingType === "ACTUAL" ? "ds-badge-pos" : e.readingType === "ESTIMATED" ? "ds-badge-warn" : "ds-badge-neu"}`}>{e.readingType}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Result panel */}
            {billResults ? (
              <div>
                {billResults.generated > 0 && (
                  <div className="ds-msg ds-msg-ok" style={{ marginBottom: 12 }}>
                    <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                    <span>
                      <strong>{billResults.generated} bill{billResults.generated > 1 ? "s" : ""} generated</strong>
                      {" "}— total:{" "}
                      <strong style={{ color: "var(--success)" }}>
                        ₹{billResults.bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                      . View in{" "}
                      <a href="/data/bills" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        Master Data → Bills
                      </a>.
                    </span>
                  </div>
                )}
                {billResults.failed > 0 && (
                  <div className="ds-msg ds-msg-error" style={{ marginBottom: 12 }}>
                    <span style={{ color: "var(--danger)" }}>✕</span>
                    <span>{billResults.failed} failed: {billResults.errors.map(e => e.error).join("; ")}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="ds-btn ds-btn-sm"
                    onClick={() => { setLastApproved([]); setBillResults(null); }}>
                    Clear
                  </button>
                  <a href="/data/bills" className="ds-btn ds-btn-sm" style={{ textDecoration: "none", color: "var(--accent)" }}>
                    View Bills →
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button className="ds-btn ds-btn-primary ds-btn-lg"
                  disabled={generatingBills}
                  onClick={generateBills}
                  style={{ minWidth: 220 }}>
                  {generatingBills ? "Generating bills…" : `⚡ Generate ${lastApproved.length} Bill${lastApproved.length > 1 ? "s" : ""}`}
                </button>
                <button className="ds-btn ds-btn-sm"
                  disabled={generatingBills}
                  onClick={() => { setLastApproved([]); setBillResults(null); }}>
                  Discard
                </button>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Page header — matches app-wide DataTable style ─────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-1px" }}>
            Meter Reading Cycle
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Electricity · Schedule → Capture → Validate → Approve → Generate Bills
            </span>
          </div>
        </div>
        <span className="ds-badge ds-badge-pos">ACTIVE</span>
      </div>

      {/* ── Step bar ────────────────────────────────────────────────────────── */}
      <div className="ds-step-bar">
        {steps.map(s => (
          <button
            key={s.key}
            className={`ds-step${step === s.key ? " active" : ""}`}
            onClick={() => setStep(s.key)}
          >
            <span className="ds-step-num">{s.num}</span>
            <span style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{s.label}</span>
              <span style={{ display: "block", fontSize: 10, fontWeight: 400, color: step === s.key ? "var(--accent)" : "var(--muted)", marginTop: 1 }}>
                {s.desc}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      {step === "schedule" && <ScheduleStep />}
      {step === "capture"  && <CaptureStep />}
      {step === "validate" && <ValidateStep />}
      {step === "approve"  && <ApproveStep />}
    </div>
  );
}
