"use client";
import React from "react";
import { Clock, Navigation, CheckCircle, AlertTriangle, Wrench } from "lucide-react";
import type { DispatchKpis } from "./types";

const CARDS = [
  { key: "pending" as const,    label: "Pending",     color: "#f59e0b", Icon: Clock },
  { key: "onVisit" as const,    label: "On Visit",    color: "#3b82f6", Icon: Navigation },
  { key: "resolved" as const,   label: "Resolved",    color: "#22c55e", Icon: CheckCircle },
  { key: "slaBreach" as const,  label: "SLA Breach",  color: "#ef4444", Icon: AlertTriangle },
  { key: "sparesHeld" as const, label: "Spares Held", color: "#8b5cf6", Icon: Wrench },
];

export function DispatchKpiBar({ kpis }: { kpis: DispatchKpis }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      {CARDS.map(({ key, label, color, Icon }) => (
        <div
          key={key}
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: 12,
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ padding: 10, borderRadius: 10, background: `${color}18`, flexShrink: 0 }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 4, letterSpacing: "0.06em" }}>
              {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)" }}>
              {kpis[key]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
