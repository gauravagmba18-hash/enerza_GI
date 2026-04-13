"use client";
import React from "react";
import type { DispatchKpis } from "./types";

const CARDS = [
  { key: "pending" as const,   label: "PENDING",     color: "#f59e0b" },
  { key: "onVisit" as const,   label: "ON VISIT",    color: "#3b82f6" },
  { key: "resolved" as const,  label: "RESOLVED",    color: "#22c55e" },
  { key: "slaBreach" as const, label: "SLA BREACH",  color: "#ef4444" },
  { key: "sparesHeld" as const,label: "SPARES HELD", color: "#8b5cf6" },
];

export function DispatchKpiBar({ kpis }: { kpis: DispatchKpis }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      {CARDS.map(({ key, label, color }) => (
        <div
          key={key}
          className="glass"
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: 10,
            borderLeft: `4px solid ${color}`,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
            {kpis[key]}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.08em" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
