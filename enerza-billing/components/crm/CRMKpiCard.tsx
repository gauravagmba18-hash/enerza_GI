import { LucideIcon } from "lucide-react";

interface CRMKpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  delta?: { value: string; isUp: boolean };
  icon: LucideIcon;
  color: string;
}

export function CRMKpiCard({ label, value, subtext, delta, icon: Icon, color }: CRMKpiCardProps) {
  return (
    <div style={{ 
      background: "var(--card-bg)", 
      border: "1px solid var(--card-border)", 
      borderRadius: 12, 
      padding: 16,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: 4, 
        height: "100%", 
        background: color 
      }} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ 
          fontSize: 10, 
          textTransform: "uppercase", 
          letterSpacing: 0.5, 
          color: "var(--muted)", 
          fontWeight: 600 
        }}>
          {label}
        </div>
        <Icon size={16} style={{ color }} />
      </div>
      
      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", fontFamily: "sans-serif" }}>
        {value}
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
        {subtext && <span style={{ fontSize: 11, color: "var(--muted)" }}>{subtext}</span>}
        {delta && (
          <span style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: delta.isUp ? "#10b981" : "#ef4444" 
          }}>
            {delta.isUp ? "↑" : "↓"} {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}
