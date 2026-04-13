"use client";
import React from "react";
import { Clock, User, AlertTriangle, Wrench } from "lucide-react";
import type { DispatchItem } from "./types";

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "#ef4444", URGENT: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e",
};
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: "#dbeafe", text: "#1d4ed8" },
  ASSIGNED:    { bg: "#fef9c3", text: "#854d0e" },
  IN_PROGRESS: { bg: "#d1fae5", text: "#065f46" },
  CLOSED:      { bg: "#f3f4f6", text: "#6b7280" },
  RESOLVED:    { bg: "#f3f4f6", text: "#6b7280" },
  SUBMITTED:   { bg: "#ede9fe", text: "#5b21b6" },
  VERIFIED:    { bg: "#dbeafe", text: "#1d4ed8" },
};

const TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  TICKET: { bg: "#ecfeff", text: "#0e7490",  label: "COMPLAINT" },
  SR:     { bg: "#f5f3ff", text: "#6d28d9",  label: "NEW CONN" },
};

interface Props {
  item: DispatchItem;
  onDispatch: (item: DispatchItem) => void;
  onTrack: (woId: string) => void;
}

export function DispatchTicketCard({ item, onDispatch, onTrack }: Props) {
  const priColor = PRIORITY_COLOR[item.priority] ?? "#6b7280";
  const isClosed = item.status === "CLOSED" || item.status === "RESOLVED" || item.status === "ACTIVE";
  const statusStyle = STATUS_STYLE[item.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  const typeStyle = TYPE_STYLE[item.type] ?? TYPE_STYLE.TICKET;

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderLeft: item.slaBreached ? "3px solid #ef4444" : "1px solid var(--card-border)",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        opacity: isClosed ? 0.6 : 1,
        transition: "box-shadow 0.15s",
      }}
    >
      {/* Top row: type badge + ID + category + account | priority + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 9999,
          background: typeStyle.bg, color: typeStyle.text, letterSpacing: "0.04em",
        }}>
          {typeStyle.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", fontFamily: "monospace" }}>
          {item.id.length > 8 ? item.id.slice(-8).toUpperCase() : item.id.toUpperCase()}
        </span>
        {item.category && (
          <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {item.category.replace(/_/g, " ")}
          </span>
        )}
        {item.accountId && (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            · ACCT: {item.accountId.slice(-8)}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: priColor }}>● {item.priority}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
            background: statusStyle.bg, color: statusStyle.text,
          }}>
            {item.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Subject */}
      <p style={{ fontSize: 13, color: "var(--foreground)", margin: "0 0 8px", lineHeight: 1.45 }}>
        {item.subject}
      </p>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} />
          {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <User size={11} />
          {item.technicianName
            ? <span style={{ color: "#22c55e", fontWeight: 500 }}>{item.technicianName}</span>
            : <span style={{ color: "#f59e0b" }}>Unassigned</span>}
        </span>
        {item.customerName && item.customerName !== "—" && (
          <span>{item.customerName}</span>
        )}
        {item.slaBreached && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontWeight: 600 }}>
            <AlertTriangle size={11} /> SLA BREACH
          </span>
        )}
        {item.sparesHeld && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#8b5cf6", fontWeight: 600 }}>
            <Wrench size={11} /> SPARES HELD
          </span>
        )}

        {/* Action buttons inline-right */}
        {!isClosed && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
            {item.workOrderId && (
              <button onClick={() => onTrack(item.workOrderId!)} style={{
                padding: "5px 14px", fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: "pointer",
                background: "transparent", border: "1px solid var(--card-border)", color: "var(--foreground)",
              }}>
                TRACK
              </button>
            )}
            <button onClick={() => onDispatch(item)} style={{
              padding: "5px 14px", fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: "pointer",
              background: item.technicianId ? "#f59e0b" : "var(--accent)", border: "none", color: "#fff",
            }}>
              {item.technicianId ? "RE-ASSIGN" : "DISPATCH"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
