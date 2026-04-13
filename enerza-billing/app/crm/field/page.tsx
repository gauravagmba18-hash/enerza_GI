"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, Plus, RefreshCw } from "lucide-react";
import { DispatchKpiBar } from "@/components/dispatch/DispatchKpiBar";
import { DispatchFilters } from "@/components/dispatch/DispatchFilters";
import { DispatchTicketCard } from "@/components/dispatch/DispatchTicketCard";
import { AssignModal } from "@/components/dispatch/AssignModal";
import { WorkOrderDetailModal } from "@/components/dispatch/WorkOrderDetailModal";
import type { DispatchItem, DispatchSummary } from "@/components/dispatch/types";

const DEFAULT_SUMMARY: DispatchSummary = {
  kpis: { pending: 0, onVisit: 0, resolved: 0, slaBreach: 0, sparesHeld: 0 },
  items: [],
  criticalSpares: [],
};

export default function DispatchBoard() {
  const [summary, setSummary]     = useState<DispatchSummary>(DEFAULT_SUMMARY);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [assignTarget, setAssignTarget] = useState<DispatchItem | null>(null);
  const [trackWoId, setTrackWoId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSummary = useCallback((f: string, s: string) => {
    setLoading(true);
    const params = new URLSearchParams({ filter: f });
    if (s) params.set("search", s);
    fetch(`/api/field/dispatch-summary?${params}`)
      .then(r => r.json())
      .then(d => { if (d.data) setSummary(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSummary(filter, search); }, [filter]);

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSummary(filter, val), 300);
  }

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Field Service Dispatch
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Unified view of complaints, service requests, and technician assignments.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => fetchSummary(filter, search)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--card-border)", background: "transparent", color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <a
            href="/crm/complaints/new"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, background: "var(--accent)", color: "#fff", borderRadius: 8, textDecoration: "none" }}
          >
            <Plus size={14} /> Create Quick Ticket
          </a>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <DispatchKpiBar kpis={summary.kpis} />

      {/* ── Two-column body ── */}
      <div style={{ flex: 1, display: "flex", gap: 20, minHeight: 0 }}>

        {/* Left: filter sidebar */}
        <DispatchFilters
          activeFilter={filter}
          onFilterChange={f => setFilter(f)}
          criticalSpares={summary.criticalSpares}
        />

        {/* Right: search bar + ticket list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by Ticket ID or Account…"
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>

          {/* Ticket list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                Loading dispatch board…
              </div>
            ) : summary.items.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>
                  No items match the current filter
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Try selecting a different filter or clearing the search.
                </div>
              </div>
            ) : (
              summary.items.map(item => (
                <DispatchTicketCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onDispatch={i => setAssignTarget(i)}
                  onTrack={woId => setTrackWoId(woId)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AssignModal
        item={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => fetchSummary(filter, search)}
      />
      <WorkOrderDetailModal
        woId={trackWoId}
        onClose={() => setTrackWoId(null)}
      />
    </div>
  );
}
