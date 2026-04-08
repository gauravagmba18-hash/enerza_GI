"use client";

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", border: "rgba(59,130,246,0.2)" },
  ACTIVE: { bg: "rgba(16,185,129,0.1)", text: "#10b981", border: "rgba(16,185,129,0.2)" },
  PENDING: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  CLOSED: { bg: "rgba(107,114,128,0.1)", text: "#6b7280", border: "rgba(107,114,128,0.2)" },
  URGENT: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  BREACHED: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  IN_PROGRESS: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6", border: "rgba(139,92,246,0.2)" },
  DISPATCHED: { bg: "rgba(6,182,212,0.1)", text: "#06b6d2", border: "rgba(6,182,212,0.2)" },
};

interface CRMStatusPillProps {
  status: string;
}

export function CRMStatusPill({ status }: CRMStatusPillProps) {
  const normStatus = status.toUpperCase().replace(/\s+/g, '_');
  const colors = STATUS_COLORS[normStatus] || STATUS_COLORS.OPEN;

  return (
    <span style={{ 
      display: "inline-flex", 
      alignItems: "center", 
      gap: 4, 
      padding: "2px 8px", 
      borderRadius: 10, 
      fontSize: 10, 
      fontWeight: 600, 
      textTransform: "uppercase",
      letterSpacing: 0.3,
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      whiteSpace: "nowrap"
    }}>
      {status}
    </span>
  );
}
