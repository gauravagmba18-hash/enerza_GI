"use client";
import { useState, useEffect, useCallback } from "react";
import { PlusCircle, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Clock, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

const STAGE_LABELS = [
  { id: 1, label: "Application Details",   short: "Application" },
  { id: 2, label: "Document Verification", short: "Verification" },
  { id: 3, label: "Field Work",            short: "Field Work" },
  { id: 4, label: "Billing Setup",         short: "Billing Setup" },
  { id: 5, label: "Activation",            short: "Activation" },
];

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
                {done
                  ? <CheckCircle2 size={13} color="#10b981" />
                  : active
                    ? <Clock size={12} color="#3b82f6" />
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
    ACTIVE:    { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
    DRAFT:     { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
    SUBMITTED: { bg: "rgba(234,179,8,0.12)",  color: "#ca8a04" },
    CLOSED:    { bg: "rgba(107,114,128,0.15)", color: "var(--muted)" },
    CANCELLED: { bg: "rgba(239,68,68,0.10)",  color: "#ef4444" },
  };
  const s = map[status] ?? { bg: "rgba(107,114,128,0.1)", color: "var(--muted)" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function ServiceLifecycle() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ total: 0, active: 0, draft: 0, closed: 0 });
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
        active: data.filter((r: any) => r.status === "ACTIVE").length,
        draft:  data.filter((r: any) => r.status === "DRAFT").length,
        closed: data.filter((r: any) => r.status === "CLOSED" || r.status === "CANCELLED").length,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const loadLogs = async (requestId: string) => {
    if (logs[requestId]) return; // already fetched
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
    if (expanded === requestId) {
      setExpanded(null);
    } else {
      setExpanded(requestId);
      loadLogs(requestId);
    }
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
            Track all new connection service requests through the 5-stage BFS CRM FSM lifecycle.
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
          { label: "Total Requests",  val: kpis.total,  color: "#3b82f6" },
          { label: "Active",          val: kpis.active, color: "#10b981" },
          { label: "Draft",           val: kpis.draft,  color: "#eab308" },
          { label: "Closed / Cancelled", val: kpis.closed, color: "#6b7280" },
        ].map(({ label, val, color }) => (
          <div key={label} className="glass" style={{ border: "1px solid var(--card-border)",
            borderTop: `4px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px" }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color }}>{loading ? "—" : val}</div>
          </div>
        ))}
      </div>

      {/* Lifecycle Stage Guide */}
      <div className="glass" style={{ border: "1px solid var(--card-border)", borderRadius: 10,
        padding: "14px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          5-Stage BFS Lifecycle
        </div>
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
          {STAGE_LABELS.map((stage, idx) => (
            <div key={stage.id} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 100 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(59,130,246,0.10)", border: "2px solid #3b82f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, color: "#3b82f6" }}>{stage.id}</div>
                <span style={{ fontSize: 11, color: "var(--foreground)", fontWeight: 600, textAlign: "center" }}>{stage.label}</span>
              </div>
              {idx < STAGE_LABELS.length - 1 && (
                <div style={{ width: 40, height: 2, background: "var(--card-border)", margin: "0 4px", marginBottom: 20 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="glass" style={{ border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Service Requests {total > 0 && <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 12 }}>({total} total)</span>}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--card-border)",
                background: "transparent", color: page === 1 ? "var(--muted)" : "var(--foreground)",
                fontSize: 12, cursor: page === 1 ? "default" : "pointer" }}>← Prev</button>
            <span style={{ fontSize: 12, color: "var(--muted)", padding: "4px 8px" }}>Page {page} of {Math.max(1, Math.ceil(total / LIMIT))}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--card-border)",
                background: "transparent", color: page * LIMIT >= total ? "var(--muted)" : "var(--foreground)",
                fontSize: 12, cursor: page * LIMIT >= total ? "default" : "pointer" }}>Next →</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading service requests…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>No service requests yet</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              Create a new connection to generate the first lifecycle record.
            </div>
            <button onClick={() => router.push("/new-connection")}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none",
                background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + New Connection
            </button>
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 3fr 1fr 1fr 40px",
              padding: "8px 20px", background: "rgba(255,255,255,0.02)",
              borderBottom: "1px solid var(--card-border)" }}>
              {["Request ID", "Description", "Status", "Stage Progress", "Step", "Created", ""].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>

            {requests.map((req: any) => (
              <div key={req.requestId}>
                <div
                  onClick={() => toggleExpand(req.requestId)}
                  style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 3fr 1fr 1fr 40px",
                    padding: "12px 20px", borderBottom: "1px solid var(--card-border)",
                    alignItems: "center", cursor: "pointer",
                    background: expanded === req.requestId ? "rgba(59,130,246,0.04)" : "transparent",
                    transition: "background 0.15s" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>
                    {req.requestId.slice(0, 14)}…
                  </div>
                  <div style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                    {req.description ?? "—"}
                  </div>
                  <div><StatusPill status={req.status} /></div>
                  <div><StageBar currentStep={req.currentStep ?? 1} logs={logs[req.requestId]} /></div>
                  <div style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 700, textAlign: "center" }}>
                    {req.currentStep ?? 1} / 5
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {expanded === req.requestId
                      ? <ChevronUp size={14} color="var(--muted)" />
                      : <ChevronDown size={14} color="var(--muted)" />}
                  </div>
                </div>

                {/* Expanded Workflow Logs */}
                {expanded === req.requestId && (
                  <div style={{ padding: "16px 24px 20px 24px",
                    background: "rgba(59,130,246,0.02)", borderBottom: "1px solid var(--card-border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase",
                      letterSpacing: "0.5px", marginBottom: 14 }}>Workflow Log</div>
                    {!logs[req.requestId] ? (
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Loading…</div>
                    ) : logs[req.requestId].length === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>No workflow log entries found.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {STAGE_LABELS.map(stage => {
                          const log = logs[req.requestId]?.find((l: any) => l.stepName === stage.label);
                          return (
                            <div key={stage.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr 120px 100px",
                              gap: 12, alignItems: "flex-start", padding: "8px 0",
                              borderBottom: "1px solid var(--card-border)" }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%",
                                background: log?.status === "COMPLETED" ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.1)",
                                border: `2px solid ${log?.status === "COMPLETED" ? "#10b981" : "var(--muted)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, marginTop: 2 }}>
                                {log?.status === "COMPLETED"
                                  ? <CheckCircle2 size={12} color="#10b981" />
                                  : <Circle size={12} color="var(--muted)" />}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{stage.label}</div>
                                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                                  {log?.notes ?? "Pending"}
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                {log?.performedBy ?? "—"}
                              </div>
                              <div>
                                {log ? (
                                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                                    background: log.status === "COMPLETED" ? "rgba(16,185,129,0.12)" : "rgba(234,179,8,0.12)",
                                    color: log.status === "COMPLETED" ? "#10b981" : "#ca8a04" }}>
                                    {log.status}
                                  </span>
                                ) : (
                                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                                    background: "rgba(107,114,128,0.1)", color: "var(--muted)" }}>PENDING</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Detail links */}
                    <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                      {req.accountId && (
                        <button onClick={() => router.push(`/data/accounts`)}
                          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--card-border)",
                            background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          View Account
                        </button>
                      )}
                      {req.customerId && (
                        <button onClick={() => router.push(`/data/customers`)}
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
