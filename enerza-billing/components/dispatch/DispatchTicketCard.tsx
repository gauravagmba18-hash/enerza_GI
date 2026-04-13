"use client";
import React from "react";
import { Clock, User, AlertTriangle, Wrench } from "lucide-react";
import type { DispatchItem } from "./types";

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "#ef4444", URGENT: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e",
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: "#dbeafe", text: "#1d4ed8" },
  ASSIGNED:    { bg: "#fef9c3", text: "#854d0e" },
  IN_PROGRESS: { bg: "#d1fae5", text: "#065f46" },
  CLOSED:      { bg: "#f3f4f6", text: "#6b7280" },
  RESOLVED:    { bg: "#f3f4f6", text: "#6b7280" },
  SUBMITTED:   { bg: "#ede9fe", text: "#5b21b6" },
  VERIFIED:    { bg: "#dbeafe", text: "#1d4ed8" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: s.bg, color: s.text }}>
      {status.replace("_", " ")}
    </span>
  );
}

interface Props {
  item: DispatchItem;
  onDispatch: (item: DispatchItem) => void;
  onTrack: (woId: string) => void;
}

export function DispatchTicketCard({ item, onDispatch, onTrack }: Props) {
  const priColor = PRIORITY_COLOR[item.priority] ?? "#6b7280";
  const isClosed = item.status === "CLOSED" || item.status === "RESOLVED" || item.status === "ACTIVE";
  const typeBg = item.type === "TICKET" ? { bg: "#ecfeff", text: "#0e7490" } : { bg: "#f5f3ff", text: "#6d28d9" };
  const typeLabel = item.type === "TICKET" ? "COMPLAINT" : "NEW CONN SR";

  return (
    <div
      className="glass"
      style={{
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
        borderLeft: item.slaBreached ? "3px solid #ef4444" : "3px solid transparent",
        opacity: isClosed ? 0.65 : 1,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 9999, background: typeBg.bg, color: typeBg.text }}>
          {typeLabel}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
          {item.id.slice(0, 12).toUpperCase()}
        </span>
        {item.category && (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {item.category.replace("_", " ")}
          </span>
        )}
        {item.accountId && (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            • ACCT: {item.accountId}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: priColor }}>
            ● {item.priority}
          </span>
          <StatusPill status={item.status} />
        </div>
      </div>

      {/* Subject */}
      <p style={{ fontSize: 13, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.4 }}>
        {item.subject}
      </p>

      {/* Meta row */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12, color: "var(--muted)", marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} />
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <User size={11} />
          {item.technicianName ? (
            <span style={{ color: "#22c55e", fontWeight: 500 }}>{item.technicianName}</span>
          ) : (
            <span style={{ color: "#f59e0b" }}>Unassigned</span>
          )}
        </span>
        {item.customerName !== "—" && (
          <span style={{ color: "var(--muted)" }}>{item.customerName}</span>
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
      </div>

      {/* Action buttons */}
      {!isClosed && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {item.workOrderId && (
            <button
              onClick={() => onTrack(item.workOrderId!)}
              style={{
                padding: "5px 14px", fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: "pointer",
                background: "transparent", border: "1px solid var(--card-border)", color: "var(--foreground)",
              }}
            >
              TRACK
            </button>
          )}
          {item.type === "TICKET" && (
            <button
              onClick={() => onDispatch(item)}
              style={{
                padding: "5px 14px", fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                background: "var(--accent)", border: "none", color: "#fff",
              }}
            >
              {item.technicianId ? "RE-ASSIGN" : "DISPATCH"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
