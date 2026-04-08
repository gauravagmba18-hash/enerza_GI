"use client";
import { useState } from "react";
import { 
  Camera, 
  AlertTriangle 
} from "lucide-react";

export default function DeviceReplacement() {
  const [can, setCan] = useState("56030099");
  
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>🔄 Device Replacement</h1>
          <span style={{ fontSize: 13, color: "#64748B" }}>BR-043, BR-044 — Traceability & Inventory Movement</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          {/* Step 1: Old Device */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 1 — Old Device Removal</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Consumer CAN</label>
                <input style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} value={can} onChange={(e) => setCan(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Reason for Replacement</label>
                <select style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                  <option>Faulty Meter</option>
                  <option>Smart Meter Upgrade</option>
                  <option>Consumer Request</option>
                  <option>Tampered</option>
                  <option>Calibration Failed</option>
                </select>
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>Current Device: SN-1928-0041</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#64748B" }}>Type</span> <span style={{ fontWeight: 600 }}>Single Phase Static</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#64748B" }}>Make / Model</span> <span style={{ fontWeight: 600 }}>Genus · Alpha 1P</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#64748B" }}>Install Date</span> <span style={{ fontWeight: 600 }}>12 Jun 2019</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#64748B" }}>Calibration Due</span> <span style={{ fontWeight: 700, color: "#854d0e" }}>12 Jun 2022 ⚠ OVERDUE</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Final Reading (kWh) *</label>
                <input type="number" style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} defaultValue="18721" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Seal Condition</label>
                <select style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                  <option>Both Intact</option>
                  <option>Meter Seal Broken</option>
                  <option>Both Broken</option>
                </select>
              </div>
            </div>

            <div style={{ border: "2px dashed #e2e8f0", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", color: "#64748B" }}>
              <Camera style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13 }}>Capture / Upload meter photo</div>
            </div>
          </div>

          {/* Step 2: New Device */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 2 — New Device Installation</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>New Meter Serial No *</label>
                <input style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} defaultValue="SN-2042-0991" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Source Stock</label>
                <select style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                  <option>Van A (Manoj Kumar)</option>
                  <option>Warehouse</option>
                </select>
              </div>
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bcf0da", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#166534" }}>New Device: SN-2042-0991 ✓ Stock confirmed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#166534" }}>Type</span> <span style={{ fontWeight: 600 }}>Single Phase Static (Secure Elite)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#166534" }}>Phase</span> <span style={{ fontWeight: 600 }}>1P · Class 1.0</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#166534" }}>Calibration Valid</span> <span style={{ fontWeight: 600 }}>15 Jan 2028</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Opening Reading (kWh) *</label>
                <input type="number" style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} defaultValue="0" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>New Seal No(s) *</label>
                <input style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} defaultValue="TS-9021-A, TS-9021-B" />
              </div>
            </div>

            <div style={{ border: "2px dashed #bcf0da", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", color: "#166534", background: "#f0fdf4" }}>
              <Camera style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13 }}>Capture installed meter photo</div>
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12, display: "flex", gap: 10 }}>
              <AlertTriangle size={16} color="#854d0e" />
              <div style={{ fontSize: 11, color: "#854d0e" }}>
                <b>BR-044 — Billing Impact:</b> Proration will be applied. Bills from 08 Apr 2026 onwards will use new meter SN-2042-0991.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
          <button style={{ padding: "10px 20px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 14, fontWeight: 600 }}>Save Draft</button>
          <button style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: "#0F172A", color: "#fff", fontSize: 14, fontWeight: 700 }}>✓ Complete Replacement</button>
        </div>
      </div>
    </div>
  );
}
