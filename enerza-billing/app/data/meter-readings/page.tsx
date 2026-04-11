"use client";
import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Zap, Search, Save, RefreshCw,
  TrendingDown, TrendingUp, Minus, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LastReading {
  readingId:    string;
  readingDate:  string;
  readingValue: number;
  consumption:  number;
  readingType:  string;
  status:       string;
}

interface AvgConsumptions { m1: number; m3: number; m6: number; m12: number; }

interface ConnectionEntry {
  connectionId:    string;
  accountId:       string;
  customer:        { customerId: string; fullName: string; mobile: string } | null;
  meter:           { meterId: string; serialNo: string; meterType: string; make: string | null } | null;
  route:           { routeId: string; routeName: string } | null;
  lastReading:     LastReading | null;
  avgConsumptions: AvgConsumptions;
  readingCount:    number;
}

interface RowState {
  value:    string;          // user input (raw string)
  saving:   boolean;
  saved:    boolean;
  error:    string | null;
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface ValidationResult {
  reversal:        boolean;
  zero:            boolean;
  lowConsumption:  boolean;
  highConsumption: boolean;
  consumption:     number;
}

function validate(newVal: number, last: LastReading | null, avgs: AvgConsumptions): ValidationResult {
  if (!last) {
    return { reversal: false, zero: false, lowConsumption: false, highConsumption: false, consumption: newVal };
  }
  const consumption = newVal - last.readingValue;
  const ref = avgs.m3 > 0 ? avgs.m3 : avgs.m12 > 0 ? avgs.m12 : 0;
  return {
    reversal:        consumption < 0,
    zero:            consumption === 0,
    lowConsumption:  ref > 0 && consumption >= 0 && consumption < ref * 0.3,
    highConsumption: ref > 0 && consumption > ref * 3.0,
    consumption,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtNum(n: number): string {
  return n.toFixed(2);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ValidationBadges({ v }: { v: ValidationResult }) {
  const badges = [
    v.reversal        && { label: "REVERSAL",     color: "#ef4444", title: "New reading is lower than previous" },
    v.zero            && { label: "ZERO",          color: "#f59e0b", title: "No consumption recorded" },
    v.lowConsumption  && { label: "LOW",           color: "#f97316", title: "Consumption is below 30% of 3-month average" },
    v.highConsumption && { label: "HIGH",          color: "#ef4444", title: "Consumption exceeds 300% of 3-month average" },
  ].filter(Boolean) as { label: string; color: string; title: string }[];

  if (!badges.length) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {badges.map((b) => (
        <span
          key={b.label}
          title={b.title}
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: `${b.color}22`,
            color: b.color,
            border: `1px solid ${b.color}55`,
            cursor: "help",
          }}
        >
          ⚠ {b.label}
        </span>
      ))}
    </div>
  );
}

function AvgBar({ avgs, consumption }: { avgs: AvgConsumptions; consumption: number }) {
  const items = [
    { label: "1M", val: avgs.m1 },
    { label: "3M", val: avgs.m3 },
    { label: "6M", val: avgs.m6 },
    { label: "12M", val: avgs.m12 },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {items.map(({ label, val }) => {
        if (val === 0) return null;
        const ratio = val > 0 ? consumption / val : 0;
        const color = ratio < 0 ? "#ef4444" : ratio < 0.3 ? "#f97316" : ratio > 3 ? "#ef4444" : "#10b981";
        return (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color }}>{fmtNum(val)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MeterReadingEntryPage() {
  const [entries, setEntries]       = useState<ConnectionEntry[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading]       = useState(false);
  const [rowState, setRowState]     = useState<Record<string, RowState>>({});
  const [readingDate, setReadingDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const LIMIT = 25;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(LIMIT), search });
      const res = await fetch(`/api/meter-readings/entry-data?${q}`);
      const json = await res.json();
      const data: ConnectionEntry[] = json.data?.data ?? [];
      setEntries(data);
      setTotal(json.data?.total ?? 0);
      // Initialise row state for new entries
      setRowState((prev) => {
        const next = { ...prev };
        data.forEach((e) => {
          if (!next[e.connectionId]) {
            next[e.connectionId] = { value: "", saving: false, saved: false, error: null };
          }
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const updateRow = (id: string, patch: Partial<RowState>) =>
    setRowState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

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
        body: JSON.stringify({
          readings: [{
            connectionId: entry.connectionId,
            meterId:      entry.meter.meterId,
            routeId:      entry.route.routeId,
            readingValue: newVal,
            readingDate,
          }],
        }),
      });
      const json = await res.json();
      if (json.data?.errors?.length) {
        updateRow(entry.connectionId, { saving: false, error: json.data.errors[0].error });
      } else {
        updateRow(entry.connectionId, { saving: false, saved: true, value: "" });
        // Update local lastReading
        const consumption = entry.lastReading ? newVal - entry.lastReading.readingValue : newVal;
        setEntries((prev) =>
          prev.map((e) =>
            e.connectionId === entry.connectionId
              ? {
                  ...e,
                  lastReading: {
                    readingId:    json.data?.records?.[0]?.readingId ?? "",
                    readingDate,
                    readingValue: newVal,
                    consumption,
                    readingType: "ACTUAL",
                    status:       "PENDING",
                  },
                  readingCount: e.readingCount + 1,
                }
              : e
          )
        );
      }
    } catch (err: any) {
      updateRow(entry.connectionId, { saving: false, error: err.message });
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  // Build pending reads for batch save
  const pendingRows = entries.filter((e) => {
    const rs = rowState[e.connectionId];
    return rs?.value && !rs.saved && !rs.saving && e.meter && e.route;
  });

  const saveAll = async () => {
    await Promise.all(pendingRows.map((e) => saveRow(e)));
  };

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg,#eab308,#f97316)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--foreground)" }}>
              Meter Reading Entry
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Electricity connections · Tamper-proof validation
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {/* Reading date picker */}
            <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              Reading Date
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                style={{
                  border: "1px solid var(--card-border)",
                  background: "var(--card)",
                  color: "var(--foreground)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </label>
            {pendingRows.length > 0 && (
              <button
                onClick={saveAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <Save size={14} />
                Save All ({pendingRows.length})
              </button>
            )}
            <button
              onClick={fetchEntries}
              title="Refresh"
              style={{
                padding: "8px",
                borderRadius: 8,
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                color: "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Search + summary bar */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search
            size={14}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
          />
          <input
            type="text"
            placeholder="Search customer name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            style={{
              width: "100%",
              paddingLeft: 32,
              padding: "8px 10px 8px 32px",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              background: "var(--sidebar)",
              color: "var(--foreground)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--card)",
              color: "var(--muted)",
              border: "1px solid var(--card-border)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          {total} connection{total !== 1 ? "s" : ""} · Page {page}/{totalPages || 1}
        </span>
      </div>

      {/* Validation legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 11,
          color: "var(--muted)",
          marginBottom: 12,
          padding: "8px 4px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "#ef4444", fontWeight: 600 }}>⚠ REVERSAL</span>
        <span style={{ color: "var(--muted)" }}>= new reading &lt; previous</span>
        <span style={{ color: "#f97316", fontWeight: 600, marginLeft: 8 }}>⚠ LOW</span>
        <span style={{ color: "var(--muted)" }}>= &lt; 30% of 3-month avg</span>
        <span style={{ color: "#ef4444", fontWeight: 600, marginLeft: 8 }}>⚠ HIGH</span>
        <span style={{ color: "var(--muted)" }}>= &gt; 300% of 3-month avg</span>
        <span style={{ color: "#f59e0b", fontWeight: 600, marginLeft: 8 }}>⚠ ZERO</span>
        <span style={{ color: "var(--muted)" }}>= no consumption</span>
      </div>

      {/* Table */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--muted)",
            background: "var(--card)",
            borderRadius: 12,
            border: "1px solid var(--card-border)",
          }}
        >
          Loading connections…
        </div>
      ) : entries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--muted)",
            background: "var(--card)",
            borderRadius: 12,
            border: "1px solid var(--card-border)",
          }}
        >
          No electricity connections found
          {search && ` matching "${search}"`}
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--card-border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--sidebar)",
                  borderBottom: "1px solid var(--card-border)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  color: "var(--muted)",
                }}
              >
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Customer</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Meter</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Last Reading</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>
                  Avg Consumption (kWh)
                  <div style={{ fontWeight: 400, fontSize: 9, textTransform: "none", letterSpacing: 0 }}>
                    1M · 3M · 6M · 12M
                  </div>
                </th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>New Reading</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Consumption</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Flags</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>Save</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const rs       = rowState[entry.connectionId] ?? { value: "", saving: false, saved: false, error: null };
                const newVal   = parseFloat(rs.value);
                const hasInput = rs.value !== "" && !isNaN(newVal);
                const vr       = hasInput ? validate(newVal, entry.lastReading, entry.avgConsumptions) : null;
                const hasError = hasInput && vr && (vr.reversal || vr.highConsumption);
                const hasWarn  = hasInput && vr && (vr.zero || vr.lowConsumption);
                const days     = entry.lastReading ? daysSince(entry.lastReading.readingDate) : null;

                return (
                  <tr
                    key={entry.connectionId}
                    style={{
                      borderBottom: idx < entries.length - 1 ? "1px solid var(--card-border)" : "none",
                      background: rs.saved
                        ? "rgba(16,185,129,0.04)"
                        : hasError
                        ? "rgba(239,68,68,0.04)"
                        : hasWarn
                        ? "rgba(249,115,22,0.04)"
                        : "transparent",
                      transition: "background 0.2s",
                    }}
                  >
                    {/* Customer */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--foreground)" }}>
                        {entry.customer?.fullName ?? "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {entry.accountId.slice(-8)}
                      </div>
                    </td>

                    {/* Meter */}
                    <td style={{ padding: "12px 14px" }}>
                      {entry.meter ? (
                        <>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#eab308", fontFamily: "monospace" }}>
                            {entry.meter.serialNo}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                            {entry.meter.meterType} {entry.meter.make ? `· ${entry.meter.make}` : ""}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>No meter</span>
                      )}
                    </td>

                    {/* Last Reading */}
                    <td style={{ padding: "12px 14px" }}>
                      {entry.lastReading ? (
                        <>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", fontFamily: "monospace" }}>
                            {entry.lastReading.readingValue.toFixed(2)}
                            <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)", marginLeft: 4 }}>kWh</span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                            {fmtDate(entry.lastReading.readingDate)}
                            {days !== null && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  color: days > 45 ? "#ef4444" : days > 35 ? "#f59e0b" : "var(--muted)",
                                  fontWeight: days > 35 ? 600 : 400,
                                }}
                              >
                                ({days}d ago)
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>No prior read</span>
                      )}
                    </td>

                    {/* Historical averages */}
                    <td style={{ padding: "12px 14px" }}>
                      {entry.readingCount > 0 ? (
                        <AvgBar avgs={entry.avgConsumptions} consumption={vr?.consumption ?? 0} />
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>No history</span>
                      )}
                    </td>

                    {/* New reading input */}
                    <td style={{ padding: "12px 14px" }}>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder={
                          entry.lastReading
                            ? `> ${entry.lastReading.readingValue.toFixed(2)}`
                            : "Enter reading"
                        }
                        value={rs.value}
                        onChange={(e) =>
                          updateRow(entry.connectionId, {
                            value: e.target.value,
                            saved: false,
                            error: null,
                          })
                        }
                        onKeyDown={(e) => { if (e.key === "Enter") saveRow(entry); }}
                        disabled={rs.saving || !entry.meter || !entry.route}
                        style={{
                          width: 130,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${
                            hasError
                              ? "#ef4444"
                              : hasWarn
                              ? "#f97316"
                              : rs.saved
                              ? "#10b981"
                              : "var(--card-border)"
                          }`,
                          background: "var(--sidebar)",
                          color: "var(--foreground)",
                          fontSize: 13,
                          fontFamily: "monospace",
                          outline: "none",
                          opacity: rs.saving ? 0.6 : 1,
                        }}
                      />
                      {rs.error && (
                        <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>{rs.error}</div>
                      )}
                      {!entry.meter && (
                        <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", marginTop: 4 }}>
                          No active meter
                        </div>
                      )}
                      {entry.meter && !entry.route && (
                        <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", marginTop: 4 }}>
                          No route assigned
                        </div>
                      )}
                    </td>

                    {/* Consumption display */}
                    <td style={{ padding: "12px 14px" }}>
                      {vr ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {vr.reversal ? (
                            <TrendingDown size={14} color="#ef4444" />
                          ) : vr.zero ? (
                            <Minus size={14} color="#f59e0b" />
                          ) : (
                            <TrendingUp size={14} color="#10b981" />
                          )}
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              fontFamily: "monospace",
                              color: vr.reversal ? "#ef4444" : vr.zero ? "#f59e0b" : "var(--foreground)",
                            }}
                          >
                            {vr.consumption >= 0 ? "+" : ""}
                            {vr.consumption.toFixed(2)}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>kWh</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>
                      )}
                    </td>

                    {/* Flags */}
                    <td style={{ padding: "12px 14px", maxWidth: 140 }}>
                      {rs.saved ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                          <CheckCircle size={14} /> Saved
                        </span>
                      ) : vr ? (
                        <ValidationBadges v={vr} />
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>
                      )}
                    </td>

                    {/* Save button */}
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <button
                        onClick={() => saveRow(entry)}
                        disabled={!hasInput || rs.saving || rs.saved || !entry.meter || !entry.route}
                        title={
                          !entry.meter
                            ? "No active meter installed"
                            : !entry.route
                            ? "No route assigned"
                            : vr?.reversal
                            ? "Warning: reversal — confirm save"
                            : "Save reading"
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background:
                            rs.saved
                              ? "#10b981"
                              : hasInput && !rs.saving
                              ? hasError
                                ? "#ef4444"
                                : "#eab308"
                              : "var(--sidebar)",
                          color: hasInput || rs.saved ? "#fff" : "var(--muted)",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor:
                            !hasInput || rs.saving || rs.saved || !entry.meter || !entry.route
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            !hasInput || !entry.meter || !entry.route ? 0.45 : 1,
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {rs.saving ? (
                          <RefreshCw size={12} />
                        ) : rs.saved ? (
                          <CheckCircle size={12} />
                        ) : (
                          <Save size={12} />
                        )}
                        {rs.saving ? "Saving…" : rs.saved ? "Done" : "Save"}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--muted)",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--muted)",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
