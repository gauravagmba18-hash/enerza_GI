"use client";
import { useState, useEffect } from "react";
import { Camera, AlertTriangle, Search } from "lucide-react";

export default function DeviceReplacement() {
  const [can, setCan] = useState("");
  const [meters, setMeters] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [selectedInstall, setSelectedInstall] = useState<any>(null);
  const [newSerial, setNewSerial] = useState("");
  const [finalReading, setFinalReading] = useState("");
  const [reason, setReason] = useState("Faulty Meter");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available meters for new device selection
    fetch("/api/meters?limit=50")
      .then(r => r.json())
      .then(d => setMeters(Array.isArray(d.data?.data) ? d.data.data : Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
    // Fetch active meter installations
    fetch("/api/meter-installations?limit=50")
      .then(r => r.json())
      .then(d => setInstallations(Array.isArray(d.data?.data) ? d.data.data : Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const currentInstall = installations.find(i =>
    i.meter?.serialNo?.toLowerCase().includes(can.toLowerCase()) ||
    i.connectionId?.toLowerCase().includes(can.toLowerCase())
  ) ?? installations[0];

  const handleComplete = async () => {
    if (!currentInstall || !newSerial) return;
    setSubmitting(true);
    setResult(null);
    try {
      // Close old installation by setting removeDate
      await fetch(`/api/meter-installations/${currentInstall.installId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeDate: new Date().toISOString(), reason }),
      });
      // Find new meter by serial
      const newMeter = meters.find(m => m.serialNo === newSerial);
      if (newMeter) {
        // Create new installation
        await fetch("/api/meter-installations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meterId: newMeter.meterId,
            connectionId: currentInstall.connectionId,
            installDate: new Date().toISOString(),
            reason,
          }),
        });
      }
      setResult("Replacement completed successfully. New device recorded.");
    } catch {
      setResult("Error completing replacement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>Device Replacement</h1>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>BR-043, BR-044 — Traceability &amp; Inventory Movement</span>
        </div>
      </div>

      {result && (
        <div style={{ padding: "12px 16px", background: result.includes("Error") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${result.includes("Error") ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: 8, fontSize: 13, color: result.includes("Error") ? "#ef4444" : "#10b981", fontWeight: 600 }}>
          {result}
        </div>
      )}

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          {/* Step 1: Old Device */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 1 — Old Device Removal</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Search by Serial No. or Connection ID</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={can} onChange={(e) => setCan(e.target.value)} placeholder="e.g. SN-1928 or CONN-..." />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Reason for Replacement</label>
              <select style={{ padding: "8px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={reason} onChange={e => setReason(e.target.value)}>
                <option>Faulty Meter</option>
                <option>Smart Meter Upgrade</option>
                <option>Consumer Request</option>
                <option>Tampered</option>
                <option>Calibration Failed</option>
              </select>
            </div>

            {currentInstall ? (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "var(--foreground)" }}>
                  Current Device: {currentInstall.meter?.serialNo ?? "Unknown"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--muted)" }}>Type</span>
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{currentInstall.meter?.meterType ?? "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--muted)" }}>Make / Model</span>
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{currentInstall.meter?.make ?? "—"} · {currentInstall.meter?.model ?? "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--muted)" }}>Install Date</span>
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{currentInstall.installDate ? new Date(currentInstall.installDate).toLocaleDateString() : "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--muted)" }}>Connection</span>
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>{currentInstall.connectionId}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 16, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
                {installations.length === 0 ? "Loading installations..." : "No matching installation found."}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Final Reading *</label>
              <input type="number" style={{ padding: "8px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={finalReading} onChange={e => setFinalReading(e.target.value)} placeholder="Enter final meter reading" />
            </div>

            <div style={{ border: "2px dashed var(--card-border)", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", color: "var(--muted)" }}>
              <Camera style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13 }}>Capture / Upload meter photo</div>
            </div>
          </div>

          {/* Step 2: New Device */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 2 — New Device Installation</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>New Meter Serial No *</label>
              <select style={{ padding: "8px 12px", border: "1px solid var(--card-border)", borderRadius: 6, fontSize: 13, background: "var(--bg-lighter)", color: "var(--foreground)" }} value={newSerial} onChange={e => setNewSerial(e.target.value)}>
                <option value="">Select meter from stock...</option>
                {meters.filter(m => !installations.find(i => i.meterId === m.meterId && !i.removeDate)).map(m => (
                  <option key={m.meterId} value={m.serialNo}>{m.serialNo} — {m.meterType ?? ""} {m.make ?? ""}</option>
                ))}
              </select>
            </div>

            {newSerial && (() => {
              const m = meters.find(m => m.serialNo === newSerial);
              return m ? (
                <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#10b981" }}>New Device: {m.serialNo} ✓ Available</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#10b981" }}>Type</span><span style={{ fontWeight: 600, color: "var(--foreground)" }}>{m.meterType ?? "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#10b981" }}>Make / Model</span><span style={{ fontWeight: 600, color: "var(--foreground)" }}>{m.make ?? "—"} · {m.model ?? "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#10b981" }}>Calibration Due</span><span style={{ fontWeight: 600, color: "var(--foreground)" }}>{m.calibrationDue ? new Date(m.calibrationDue).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            <div style={{ border: "2px dashed rgba(16,185,129,0.3)", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", color: "#10b981", background: "rgba(16,185,129,0.03)" }}>
              <Camera style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13 }}>Capture installed meter photo</div>
            </div>

            <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: 12, display: "flex", gap: 10 }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <div style={{ fontSize: 11, color: "#f59e0b" }}>
                <strong>BR-044 — Billing Impact:</strong> Bills from the replacement date onwards will use the new meter.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--card-border)" }}>
          <button style={{ padding: "10px 20px", borderRadius: 6, border: "1px solid var(--card-border)", background: "transparent", fontSize: 14, fontWeight: 600, color: "var(--foreground)", cursor: "pointer" }}>Save Draft</button>
          <button
            onClick={handleComplete}
            disabled={submitting || !currentInstall || !newSerial}
            style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: submitting || !currentInstall || !newSerial ? "var(--card-border)" : "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "wait" : "pointer" }}
          >
            {submitting ? "Processing..." : "✓ Complete Replacement"}
          </button>
        </div>
      </div>
    </div>
  );
}
