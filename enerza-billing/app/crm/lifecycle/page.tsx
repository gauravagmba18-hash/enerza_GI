"use client";
import { useState } from "react";
import { 
  PlusCircle,
  AlertCircle
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Application" },
  { id: 2, label: "Verification" },
  { id: 3, label: "Field Work" },
  { id: 4, label: "Billing Setup" },
  { id: 5, label: "Activation" },
];

export default function ServiceLifecycle() {
  const [activeStep, setActiveStep] = useState(1);
  const [lifecycleType, setLifecycleType] = useState("New Connection");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
      {/* Header with Buttons */}
      <div style={{ 
        padding: "12px 24px", 
        background: "#fff", 
        borderBottom: "1px solid #e2e8f0", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between" 
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0, fontFamily: "Syne, sans-serif" }}>Service Lifecycle</h1>
          <span style={{ fontSize: 13, color: "#64748B" }}>Move-in · Move-out · Transfer · BR-005 to BR-009</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ 
            background: "#fff", 
            color: "#475569", 
            border: "1px solid #cbd5e1", 
            padding: "6px 14px", 
            borderRadius: 6, 
            fontSize: 12, 
            fontWeight: 600, 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            cursor: "pointer"
          }}>
            <PlusCircle size={14} /> Service Request
          </button>
          <button style={{ 
            background: "#0F172A", 
            color: "#fff", 
            border: "none", 
            padding: "6px 14px", 
            borderRadius: 6, 
            fontSize: 12, 
            fontWeight: 600, 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            cursor: "pointer"
          }}>
            <AlertCircle size={14} /> + Complaint
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* KPI Top Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: "4px solid #3b82f6", borderRadius: 8, padding: "16px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748B", marginBottom: 8, fontWeight: 600, fontFamily: "var(--mono)" }}>New Connection</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1e40af", fontFamily: "Syne, sans-serif" }}>4</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Pending today</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: "4px solid #22c55e", borderRadius: 8, padding: "16px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748B", marginBottom: 8, fontWeight: 600, fontFamily: "var(--mono)" }}>Move-In</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#166534", fontFamily: "Syne, sans-serif" }}>3</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Pending today</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: "4px solid #eab308", borderRadius: 8, padding: "16px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748B", marginBottom: 8, fontWeight: 600, fontFamily: "var(--mono)" }}>Move-Out</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#854d0e", fontFamily: "Syne, sans-serif" }}>2</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Pending today</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: "4px solid #a855f7", borderRadius: 8, padding: "16px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748B", marginBottom: 8, fontWeight: 600, fontFamily: "var(--mono)" }}>Customer Transfer</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#6b21a8", fontFamily: "Syne, sans-serif" }}>1</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Pending today</div>
          </div>
        </div>

        {/* Main Workflow Card */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, fontFamily: "Syne, serif", color: "#0F172A" }}>Service Lifecycle Workflow <span style={{ fontWeight: 400, color: "#64748B", fontSize: 12 }}>BR-004 to BR-009 — New connection, move-in, move-out, transfer</span></h2>
            </div>
            <select 
              value={lifecycleType} 
              onChange={(e) => setLifecycleType(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 500, fontFamily: "inherit", background: "#f8fafc" }}
            >
              <option>New Connection</option>
              <option>Move-In</option>
              <option>Move-Out</option>
              <option>Customer Transfer</option>
              <option>Temporary Disconnection</option>
            </select>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Stepper */}
            <div style={{ display: "flex", marginBottom: 40, position: "relative" }}>
              <div style={{ position: "absolute", top: 18, left: "10%", right: "10%", height: 2, background: "#f1f5f9", zIndex: 0 }} />
              {STEPS.map((step) => (
                <div key={step.id} style={{ flex: 1, textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: "50%", 
                    background: step.id === activeStep ? "#0F172A" : step.id < activeStep ? "#22c55e" : "#fff", 
                    border: "2px solid", 
                    borderColor: step.id === activeStep ? "#0F172A" : step.id < activeStep ? "#22c55e" : "#f1f5f9", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: 12, 
                    fontWeight: 700, 
                    margin: "0 auto 8px",
                    color: (step.id <= activeStep) ? "#fff" : "#94a3b8",
                    fontFamily: "var(--mono)",
                    boxShadow: step.id === activeStep ? "0 4px 10px rgba(15,23,42,0.2)" : "none"
                  }}>
                    {step.id < activeStep ? "✓" : step.id}
                  </div>
                  <div style={{ 
                    fontSize: 11, 
                    color: step.id === activeStep ? "#0F172A" : "#64748B", 
                    fontWeight: step.id === activeStep ? 700 : 500,
                    letterSpacing: "0.02em"
                  }}>{step.label}</div>
                </div>
              ))}
            </div>

            {/* Form Content - Application Details */}
            <div style={{ display: activeStep === 1 ? "block" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Syne, serif", marginBottom: 20, color: "#0F172A" }}>Application Details</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Customer Name *</label>
                  <input style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1e293b" }} defaultValue="Vikram Shah" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Mobile *</label>
                  <input style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1e293b" }} defaultValue="+91 99012 34567" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Premise Address *</label>
                  <input style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1e293b" }} defaultValue="C-07, Bopal, Ahmedabad" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Connection Type *</label>
                  <select style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1e293b" }}>
                    <option>New Connection</option>
                    <option>Move-In (Existing)</option>
                    <option>Service Transfer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Consumer Category</label>
                  <select style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1e293b" }}>
                    <option>LT-1 Domestic</option>
                    <option>LT-2 Non-Domestic</option>
                    <option>HT-1 Industrial</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Sanctioned Load (kW)</label>
                  <input type="number" style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1e293b" }} defaultValue="5" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Phase Type</label>
                  <select style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1e293b" }}>
                    <option>Single Phase (1P)</option>
                    <option>Three Phase (3P)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, gap: 12 }}>
              {activeStep > 1 && (
                <button 
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                  style={{ background: "#fff", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 24px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ← Back
                </button>
              )}
              <button 
                onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
                style={{ background: "#0F172A", color: "#fff", border: "none", padding: "10px 32px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(15,23,42,0.3)" }}
              >
                {activeStep === 5 ? "Complete Activation" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
