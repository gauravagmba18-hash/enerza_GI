"use client";
import { Bell, Search, Zap } from "lucide-react";

export function Header() {
  return (
    <header style={{ height: 60, background: "var(--sidebar)", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0 }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        <input
          placeholder="Search..."
          suppressHydrationWarning
          style={{ width: "100%", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "7px 14px 7px 36px", fontSize: 13, color: "var(--foreground)", outline: "none" }}
        />
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button 
          suppressHydrationWarning
          style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)", position: "relative" }}
        >
          <Bell size={16} />
          <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--card-border)", padding: "6px 12px", borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#06b6d4,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
            A
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1 }}>Admin</div>
            <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>Super User</div>
          </div>
        </div>
      </div>
    </header>
  );
}
