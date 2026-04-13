"use client";
import React from "react";
import { Filter, AlertTriangle } from "lucide-react";
import type { CriticalSpare } from "./types";

const FILTERS = [
  { key: "all",           label: "All Items" },
  { key: "high-priority", label: "High Priority" },
  { key: "unassigned",    label: "Unassigned" },
  { key: "sla-breach",    label: "SLA Breach" },
  { key: "spares-held",   label: "Spares Held" },
];

interface Props {
  activeFilter: string;
  onFilterChange: (f: string) => void;
  criticalSpares: CriticalSpare[];
}

export function DispatchFilters({ activeFilter, onFilterChange, criticalSpares }: Props) {
  return (
    <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Quick Filters */}
      <div
        className="glass"
        style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12 }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Filter size={13} style={{ color: "var(--muted)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", letterSpacing: "0.04em" }}>
            Quick Filters
          </span>
        </div>
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "9px 14px",
                fontSize: 13,
                cursor: "pointer",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--foreground)",
                border: "none",
                borderBottom: "1px solid var(--card-border)",
                fontWeight: active ? 600 : 400,
                transition: "background 0.15s",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Critical Spares */}
      <div className="glass" style={{ borderRadius: 10, overflow: "hidden" }}>
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <AlertTriangle size={13} style={{ color: "#ef4444" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", letterSpacing: "0.04em" }}>
            Critical Spares
          </span>
        </div>
        {criticalSpares.length === 0 ? (
          <p style={{ padding: "12px 14px", fontSize: 12, color: "var(--muted)" }}>
            All stock levels OK
          </p>
        ) : (
          criticalSpares.map((s) => (
            <div
              key={s.itemId}
              style={{
                padding: "8px 14px",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>
                  {s.itemName}
                </div>
                <div style={{ marginTop: 3, height: 3, background: "#ef444433", borderRadius: 2, width: 80 }}>
                  <div
                    style={{
                      height: "100%",
                      background: "#ef4444",
                      borderRadius: 2,
                      width: `${Math.min(100, (s.quantityOnHand / s.minLevel) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Low Stock</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
