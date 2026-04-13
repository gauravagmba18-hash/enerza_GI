"use client";
import { useState, useEffect } from "react";

const fmt = (n: number) =>
  "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DunningPtp() {
  const [levels, setLevels] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [ptpNotices, setPtpNotices] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [ptpForm, setPtpForm] = useState<Record<string, { date: string; status: string; by: string }>>({});
  const [savingPtp, setSavingPtp] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dunning-levels?limit=20").then((r) => r.json()),
      fetch("/api/dunning-notices?status=ISSUED&limit=50").then((r) => r.json()),
      fetch("/api/dunning-notices?hasPtp=1&limit=50").then((r) => r.json()),
    ]).then(([l, n, p]) => {
      setLevels(l.data?.data ?? l.data ?? []);
      setNotices(n.data?.data ?? n.data ?? []);
      setPtpNotices(p.data?.data ?? p.data ?? []);
    });
  }, []);

  const runDunning = async () => {
    setRunning(true);
    const res = await fetch("/api/dunning/run", { method: "POST" });
    const json = await res.json();
    setRunResult(json.data ?? json);
    setRunning(false);
    // Refresh notices
    fetch("/api/dunning-notices?status=ISSUED&limit=50").then((r) => r.json()).then((n) => setNotices(n.data?.data ?? n.data ?? []));
  };

  const savePtp = async (noticeId: string) => {
    const form = ptpForm[noticeId];
    if (!form?.date) return;
    setSavingPtp(noticeId);
    await fetch(`/api/dunning-notices/${noticeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ptpDate: form.date, ptpStatus: form.status || "PROMISED", ptpRecordedBy: form.by || "SYSTEM" }),
    });
    setSavingPtp(null);
    setPtpForm((prev) => { const n = { ...prev }; delete n[noticeId]; return n; });
    // Refresh
    fetch("/api/dunning-notices?hasPtp=1&limit=50").then((r) => r.json()).then((p) => setPtpNotices(p.data?.data ?? p.data ?? []));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Level definitions */}
      <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Dunning Level Definitions</span>
          <button onClick={runDunning} disabled={running}
            style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            {running ? "Running…" : "▶ Run Dunning Engine"}
          </button>
        </div>
        {runResult && (
          <div style={{ padding: "10px 18px", background: "#10b98112", borderBottom: "1px solid var(--card-border)", fontSize: 13, color: "#10b981" }}>
            ✓ Processed {runResult.processed} bills — {runResult.issued} new notices issued, {runResult.skipped} skipped.
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Level", "Days Overdue", "Action", "Fee", "Status"].map((h) => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((lv: any, i: number) => (
              <tr key={lv.levelId ?? i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "8px 14px", fontWeight: 700, color: "#ef4444" }}>{lv.levelName}</td>
                <td style={{ padding: "8px 14px", color: "var(--foreground)" }}>{lv.daysOverdue}d</td>
                <td style={{ padding: "8px 14px", color: "var(--muted)" }}>{lv.actionType}</td>
                <td style={{ padding: "8px 14px", color: lv.penaltyFee > 0 ? "#f59e0b" : "var(--muted)" }}>
                  {lv.penaltyFee > 0 ? fmt(lv.penaltyFee) : "—"}
                </td>
                <td style={{ padding: "8px 14px" }}>
                  <span style={{ background: lv.status === "ACTIVE" ? "#10b98122" : "#ef444422", color: lv.status === "ACTIVE" ? "#10b981" : "#ef4444", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {lv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active notices */}
      <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", fontWeight: 600, fontSize: 14 }}>
          Active Dunning Notices — {notices.length}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Customer", "Account", "Level", "Issued At", "Status", "PTP"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>No active notices.</td></tr>
              )}
              {notices.map((n: any, i: number) => {
                const nid = n.noticeId;
                const hasPtp = !!ptpForm[nid];
                return (
                  <tr key={nid ?? i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{n.account?.customer?.fullName ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "var(--muted)", fontFamily: "monospace", fontSize: 11 }}>{n.accountId}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#ef4444" }}>{n.level?.levelName ?? "?"}</td>
                    <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{n.issuedAt ? new Date(n.issuedAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: "#f59e0b22", color: "#f59e0b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{n.status}</span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      {hasPtp ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="date" value={ptpForm[nid]?.date ?? ""} onChange={(e) => setPtpForm((p) => ({ ...p, [nid]: { ...p[nid], date: e.target.value } }))}
                            style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid var(--card-border)", background: "var(--sidebar)", color: "var(--foreground)", fontSize: 11 }} />
                          <button onClick={() => savePtp(nid)} disabled={savingPtp === nid}
                            style={{ padding: "3px 10px", borderRadius: 4, border: "none", background: "#10b981", color: "#fff", fontSize: 11, cursor: "pointer" }}>
                            {savingPtp === nid ? "…" : "Save"}
                          </button>
                          <button onClick={() => setPtpForm((p) => { const x = { ...p }; delete x[nid]; return x; })}
                            style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--card-border)", background: "transparent", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setPtpForm((p) => ({ ...p, [nid]: { date: "", status: "PROMISED", by: "" } }))}
                          style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid #3b82f644", background: "transparent", color: "#3b82f6", fontSize: 11, cursor: "pointer" }}>+ PTP</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PTP register */}
      <div className="glass" style={{ borderRadius: 12, border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--card-border)", fontWeight: 600, fontSize: 14 }}>
          Promise-to-Pay Register — {ptpNotices.length}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Customer", "Account", "PTP Date", "PTP Status", "Recorded By"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--card-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ptpNotices.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>No PTP records yet.</td></tr>
            )}
            {ptpNotices.map((n: any, i: number) => (
              <tr key={n.noticeId ?? i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{n.account?.customer?.fullName ?? "—"}</td>
                <td style={{ padding: "8px 12px", color: "var(--muted)", fontFamily: "monospace", fontSize: 11 }}>{n.accountId}</td>
                <td style={{ padding: "8px 12px", color: "#3b82f6" }}>{n.ptpDate ? new Date(n.ptpDate).toLocaleDateString("en-IN") : "—"}</td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ background: n.ptpStatus === "FULFILLED" ? "#10b98122" : n.ptpStatus === "BROKEN" ? "#ef444422" : "#f59e0b22", color: n.ptpStatus === "FULFILLED" ? "#10b981" : n.ptpStatus === "BROKEN" ? "#ef4444" : "#f59e0b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {n.ptpStatus ?? "PROMISED"}
                  </span>
                </td>
                <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{n.ptpRecordedBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
