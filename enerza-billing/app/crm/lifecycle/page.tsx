"use client";
import { useState, useEffect, useCallback } from "react";
import { PlusCircle, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Clock, Circle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const STAGE_LABELS = [
  { id: 1, label: "Application Details",   short: "Application", action: null },
  { id: 2, label: "Document Verification", short: "Verification", action: "verify-docs" },
  { id: 3, label: "Field Work",            short: "Field Work",   action: "field-work" },
  { id: 4, label: "Billing Setup",         short: "Billing Setup", action: "billing-setup" },
  { id: 5, label: "Activation",            short: "Activation",  action: "activate" },
];

const STAGE_ACTIONS: Record<number, { label: string; color: string; nextLabel: string; placeholder: string }> = {
  1: { label: "Proceed to Document Verification", color: "#3b82f6", nextLabel: "Verify Documents", placeholder: "Verification notes (optional)" },
  2: { label: "Complete Field Work", color: "#8b5cf6", nextLabel: "Field Work Done", placeholder: "Field work notes (optional)" },
  3: { label: "Complete Billing Setup", color: "#f59e0b", nextLabel: "Billing Setup Done", placeholder: "Billing setup notes (optional)" },
  4: { label: "Activate Connection", color: "#10b981", nextLabel: "Activate", placeholder: "Activation notes (optional)" },
};

function StageBar({ currentStep, logs }: { currentStep: number; logs?: any[] }) {
  const completedNames = new Set((logs ?? []).filter(l => l.status === "COMPLETED").map((l: any) => l.stepName));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {STAGE_LABELS.map((stage, idx) => {
        const done = completedNames.has(stage.label) || stage.id < currentStep;
        const active = stage.id === currentStep;
        const color = done ? "#10b981" : active ? "#3b82f6" : "var(--muted)";
        return (
          <div key={stage.id} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%",
                background: done ? "#10b98120" : active ? "#3b82f620" : "transparent",
                border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done ? <CheckCircle2 size={13} color="#10b981" />
                  : active ? <Clock size={12} color="#3b82f6" />
                  : <Circle size={12} color="var(--muted)" />}
              </div>
              <span style={{ fontSize: 9, color, fontWeight: done || active ? 700 : 400, whiteSpace: "nowrap" }}>
                {stage.short}
              </span>
            </div>
            {idx < STAGE_LABELS.length - 1 && (
              <div style={{ width: 28, height: 2, background: done ? "#10b981" : "var(--card-border)", margin: "0 2px", marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    ACTIVE:     { bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
    SUBMITTED:  { bg: "rgba(234,179,8,0.12)",   color: "#ca8a04" },
    DRAFT:      { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6" },
    CLOSED:     { bg: "rgba(107,114,128,0.15)", color: "var(--muted)" },
    CANCELLED:  { bg: "rgba(239,68,68,0.10)",   color: "#ef4444" },
  };
  const s = map[status] ?? { bg: "rgba(107,114,128,0.1)", color: "var(--muted)" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ── Action Panel for the current stage ───────────────────────────────────────
function StageActionPanel({
  req, onAdvanced,
}: { req: any; onAdvanced: () => void }) {
  const step: number = req.currentStep ?? 1;
  const [notes, setNotes] = useState("");
  const [meterSerial, setMeterSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionResult, setActionResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (req.status === "ACTIVE") {
    return (
      <div style={{ padding: "12px 16px", borderRadius: 8,
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
        display: "flex", alignItems: "center", gap: 10 }}>
        <CheckCircle2 size={16} color="#10b981" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
          Connection Activated — all 5 stages complete
        </span>
        {req.accountId && (
          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto", fontFamily: "monospace" }}>
            Account: {req.accountId.slice(0, 14)}…
          </span>
        )}
      </div>
    );
  }

  if (!STAGE_ACTIONS[step]) return null;

  const meta = STAGE_ACTIONS[step];
  const actionKey = STAGE_LABELS[step]?.action ?? STAGE_LABELS[step - 1]?.action ?? "verify-docs";

  // Determine the correct action key from the current step
  const actionForStep: Record<number, string> = { 1: "verify-docs", 2: "field-work", 3: "billing-setup", 4: "activate" };
  const action = actionForStep[step] ?? "verify-docs";

  const advance = async () => {
    setBusy(true);
    setActionResult(null);
    try {
      const res = await fetch("/api/service-requests/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.requestId, action, notes: notes || undefined, meterSerial: meterSerial || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance");
      setActionResult({ ok: true, msg: action === "activate" ? "Connection activated successfully!" : "Stage advanced." });
      onAdvanced();
    } catch (e: any) {
      setActionResult({ ok: false, msg: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "14px 16px", borderRadius: 8, marginBottom: 16,
      background: `rgba(${meta.color === "#10b981" ? "16,185,129" : meta.color === "#3b82f6" ? "59,130,246" : meta.color === "#8b5cf6" ? "139,92,246" : "245,158,11"},0.06)`,
      border: `1px solid ${meta.color}30` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
        Next Action — Stage {step + 1}: {STAGE_LABELS[step]?.label ?? "Activate"}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        {action === "activate" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>METER SERIAL NO. *</label>
            <input
              value={meterSerial}
              onChange={e => setMeterSerial(e.target.value)}
              placeholder="e.g. LG-2024-001234"
              style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid var(--card-border)",
                background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12, width: 200 }}
            />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>NOTES</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={meta.placeholder}
            style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid var(--card-border)",
              background: "var(--sidebar)", color: "var(--foreground)", fontSize: 12 }}
          />
        </div>
        <button
          onClick={advance}
          disabled={busy || (action === "activate" && !meterSerial)}
          style={{ padding: "8px 20px", borderRadius: 7, border: "none",
            background: (action === "activate" && !meterSerial) ? "var(--muted)" : meta.color,
            color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: (busy || (action === "activate" && !meterSerial)) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
          {busy ? "Processing…" : action === "activate" ? <><Zap size={13} /> {meta.label}</> : meta.label + " →"}
        </button>
      </div>
      {actionResult && (
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600,
          color: actionResult.ok ? "#10b981" : "#ef4444" }}>
          {actionResult.ok ? "✓ " : "✗ "}{actionResult.msg}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ServiceLifecycle() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ total: 0, active: 0, submitted: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/service-requests?type=NEW_CONNECTION&page=${page}&limit=${LIMIT}`);
      const d = await res.json();
      const data: any[] = Array.isArray(d.data?.data) ? d.data.data : Array.isArray(d.data) ? d.data : [];
      const tot: number = d.data?.total ?? data.length;
      setRequests(data);
      setTotal(tot);
      setKpis({
        total: tot,
        active:    data.filter((r: any) => r.status === "ACTIVE").length,
        submitted: data.filter((r: any) => r.status === "SUBMITTED" || r.status === "DRAFT").length,
        closed:    data.filter((r: any) => r.status === "CLOSED" || r.status === "CANCELLED").length,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const loadLogs = async (requestId: string) => {
    try {
      const res = await fetch(`/api/workflow-logs?requestId=${requestId}`);
      const d = await res.json();
      const data: any[] = Array.isArray(d.data?.data) ? d.data.data : Array.isArray(d.data) ? d.data : [];
      setLogs(prev => ({ ...prev, [requestId]: data }));
    } catch {
      setLogs(prev => ({ ...prev, [requestId]: [] }));
    }
  };

  const toggleExpand = (requestId: string) => {
    if (expanded === requestId) { setExpanded(null); return; }
    setExpanded(requestId);
    loadLogs(requestId);
  };

  // After advancing a stage, refresh that SR's data
  const onAdvanced = (requestId: string) => {
    // Reload logs and requests
    loadLogs(requestId);
    load();
  };

  // Parse summary from SR description JSON
  const getSummary = (req: any) => {
    try { return JSON.parse(req.description).summary ?? req.description; } catch { return req.description ?? "—"; }
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
            New Connection Lifecycle
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            5-stage BFS CRM FSM: Application → Verification → Field Work → Billing Setup → Activation
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 8, border: "1px solid var(--card-border)", background: "transparent",
            color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => router.push("/new-connection")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, border: "none", background: "#3b82f6",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <PlusCircle size={13} /> New Connection
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Requests",  val: kpis.total,     color: "#3b82f6" },
          { label: "Activated",       val: kpis.active,    color: "#10b981" },
          { label: "In Progress",     val: kpis.submitted, color: "#eab308" },
          { label: "Closed",          val: kpis.closed,    color: "#6b7280" },
        ].map(({ label, val, color }) => (
          <div key={label} className="glass" style={{ border: "1px solid var(--card-border)",
            borderTop: `4px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px" }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color }}>{loading ? "—" : val}</div>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <div className="glass" style={{ border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Service Requests{total > 0 && <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 12 }}> ({total})</span>}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--card-border)",
                background: "transparent", color: page === 1 ? "var(--muted)" : "var(--foreground)", fontSize: 12, cursor: page === 1 ? "default" : "pointer" }}>← Prev</button>
            <span style={{ fontSize: 12, color: "var(--muted)", padding: "4px 6px" }}>
              {page} / {Math.max(1, Math.ceil(total / LIMIT))}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--card-border)",
                background: "transparent", color: page * LIMIT >= total ? "var(--muted)" : "var(--foreground)", fontSize: 12, cursor: page * LIMIT >= total ? "default" : "pointer" }}>Next →</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>No service requests yet</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              Use the New Connection wizard to raise the first application.
            </div>
            <button onClick={() => router.push("/new-connection")}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none",
                background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Raise New Connection
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 3fr 1fr 1fr 40px",
              padding: "8px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--card-border)" }}>
              {["Request ID", "Application", "Status", "Stage Progress", "Step", "Created", ""].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>

            {requests.map((req: any) => (
              <div key={req.requestId}>
                {/* Row */}
                <div onClick={() => toggleExpand(req.requestId)}
                  style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 3fr 1fr 1fr 40px",
                    padding: "12px 20px", borderBottom: "1px solid var(--card-border)",
                    alignItems: "center", cursor: "pointer",
                    background: expanded === req.requestId ? "rgba(59,130,246,0.04)" : "transparent" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>
                    {req.requestId.slice(0, 14)}…
                  </div>
                  <div style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                    {getSummary(req)}
                  </div>
                  <div><StatusPill status={req.status} /></div>
                  <div><StageBar currentStep={req.currentStep ?? 1} logs={logs[req.requestId]} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", textAlign: "center" }}>
                    {req.currentStep ?? 1} / 5
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {expanded === req.requestId ? <ChevronUp size={14} color="var(--muted)" /> : <ChevronDown size={14} color="var(--muted)" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === req.requestId && (
                  <div style={{ padding: "16px 24px 20px", background: "rgba(59,130,246,0.02)",
                    borderBottom: "1px solid var(--card-border)" }}>

                    {/* Stage action panel */}
                    <StageActionPanel req={req} onAdvanced={() => onAdvanced(req.requestId)} />

                    {/* Workflow log */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase",
                      letterSpacing: "0.5px", marginBottom: 12 }}>Workflow Log</div>
                    {!logs[req.requestId] ? (
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Loading…</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {STAGE_LABELS.map(stage => {
                          const log = logs[req.requestId]?.find((l: any) => l.stepName === stage.label);
                          return (
                            <div key={stage.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr 120px 100px",
                              gap: 12, alignItems: "flex-start", padding: "8px 0",
                              borderBottom: "1px solid var(--card-border)" }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%",
                                background: log?.status === "COMPLETED" ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.1)",
                                border: `2px solid ${log?.status === "COMPLETED" ? "#10b981" : "var(--muted)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                                {log?.status === "COMPLETED" ? <CheckCircle2 size={12} color="#10b981" /> : <Circle size={12} color="var(--muted)" />}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{stage.label}</div>
                                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{log?.notes ?? "Pending"}</div>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>{log?.performedBy ?? "—"}</div>
                              <div>
                                <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                                  background: log ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.1)",
                                  color: log ? "#10b981" : "var(--muted)" }}>
                                  {log ? "COMPLETED" : "PENDING"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Links */}
                    <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                      {req.accountId && (
                        <button onClick={() => router.push("/data/accounts")}
                          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--card-border)",
                            background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          View Account
                        </button>
                      )}
                      {req.customerId && (
                        <button onClick={() => router.push("/data/customers")}
                          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--card-border)",
                            background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          View Customer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
