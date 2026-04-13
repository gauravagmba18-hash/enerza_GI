"use client";
import { useState } from "react";

interface BillActionProps {
  billId: string;
  defaultMobile: string;
  defaultEmail: string;
  totalAmount: number;
}

type Modal = "sms" | "email" | null;

export function BillActions({ billId, defaultMobile, defaultEmail, totalAmount }: BillActionProps) {
  const [modal, setModal]     = useState<Modal>(null);
  const [mobile, setMobile]   = useState(defaultMobile);
  const [email, setEmail]     = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; message: string } | null>(null);

  const close = () => { setModal(null); setResult(null); };

  const send = async (channel: "SMS" | "EMAIL") => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/bills/${billId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, mobile: channel === "SMS" ? mobile : undefined, email: channel === "EMAIL" ? email : undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setResult({ ok: true, message: json.data.message });
      } else {
        setResult({ ok: false, message: json.error ?? "Failed to send" });
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Action bar */}
      <div className="no-print" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* Download / Print */}
        <button
          onClick={() => window.print()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 8, padding: "10px 20px",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          ⬇ Download / Print
        </button>

        {/* Send SMS */}
        <button
          onClick={() => { setModal("sms"); setResult(null); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--card-bg)", color: "var(--foreground)",
            border: "1px solid var(--card-border)", borderRadius: 8,
            padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          📱 Send to Mobile
        </button>

        {/* Send Email */}
        <button
          onClick={() => { setModal("email"); setResult(null); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--card-bg)", color: "var(--foreground)",
            border: "1px solid var(--card-border)", borderRadius: 8,
            padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          ✉ Email Bill
        </button>
      </div>

      {/* Modal overlay */}
      {modal && (
        <div
          className="no-print"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={close}
        >
          <div
            style={{
              background: "var(--card-bg)", border: "1px solid var(--card-border)",
              borderRadius: 16, padding: 28, width: 420, maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
              {modal === "sms" ? "📱 Send Bill via SMS" : "✉ Email Bill"}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--muted)" }}>
              Bill #{billId.slice(-8).toUpperCase()} · ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>

            {!result ? (
              <>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
                  {modal === "sms" ? "Mobile Number" : "Email Address"}
                </label>
                {modal === "sms" ? (
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "var(--bg-lighter)", border: "1px solid var(--card-border)",
                      borderRadius: 8, padding: "10px 12px",
                      fontSize: 14, color: "var(--foreground)", marginBottom: 20,
                    }}
                  />
                ) : (
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "var(--bg-lighter)", border: "1px solid var(--card-border)",
                      borderRadius: 8, padding: "10px 12px",
                      fontSize: 14, color: "var(--foreground)", marginBottom: 20,
                    }}
                  />
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={close} style={{
                    background: "transparent", border: "1px solid var(--card-border)",
                    borderRadius: 8, padding: "8px 18px", cursor: "pointer",
                    color: "var(--muted)", fontSize: 13, fontWeight: 600,
                  }}>
                    Cancel
                  </button>
                  <button
                    disabled={sending || !(modal === "sms" ? mobile : email)}
                    onClick={() => send(modal === "sms" ? "SMS" : "EMAIL")}
                    style={{
                      background: "var(--accent)", color: "#fff", border: "none",
                      borderRadius: 8, padding: "8px 18px", cursor: "pointer",
                      fontSize: 13, fontWeight: 600,
                      opacity: sending ? 0.6 : 1,
                    }}
                  >
                    {sending ? "Sending…" : modal === "sms" ? "Send SMS" : "Send Email"}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{
                  padding: "14px 16px", borderRadius: 8, marginBottom: 20,
                  background: result.ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${result.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: result.ok ? "#22c55e" : "#ef4444",
                  fontWeight: 600, fontSize: 14,
                }}>
                  {result.ok ? "✓ " : "✕ "}{result.message}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={close} style={{
                    background: "var(--accent)", color: "#fff", border: "none",
                    borderRadius: 8, padding: "8px 18px", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                  }}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
