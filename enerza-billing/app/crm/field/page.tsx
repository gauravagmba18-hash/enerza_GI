"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, Plus } from "lucide-react";
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
  const [summary, setSummary] = useState<DispatchSummary>(DEFAULT_SUMMARY);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState<DispatchItem | null>(null);
  const [trackWoId, setTrackWoId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSummary = useCallback((f: string, s: string) => {
    setLoading(true);
    const params = new URLSearchParams({ filter: f });
    if (s) params.set("search", s);
    fetch(`/api/field/dispatch-summary?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setSummary(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSummary(filter, search);
  }, [filter]);

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSummary(filter, val), 300);
  }

  function handleAssigned() {
    fetchSummary(filter, search);
  }

  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
          Industrial Field Service Dispatch
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Manage service tickets, technicians, and inventory.
        </p>
      </div>

      {/* KPI bar */}
      <DispatchKpiBar kpis={summary.kpis} />

      {/* Main layout: filter sidebar + ticket list */}
      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0 }}>
        {/* Left: filters */}
        <DispatchFilters
          activeFilter={filter}
          onFilterChange={(f) => setFilter(f)}
          criticalSpares={summary.criticalSpares}
        />

        {/* Right: search + list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Search + create */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by Ticket ID or Account"
                style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <a
              href="/crm/complaints/new"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, background: "var(--accent)", color: "#fff", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}
            >
              <Plus size={14} /> Create Quick Ticket
            </a>
          </div>

          {/* Ticket list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                Loading dispatch board…
              </div>
            ) : summary.items.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                No items match the current filter.
              </div>
            ) : (
              summary.items.map((item) => (
                <DispatchTicketCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onDispatch={(i) => setAssignTarget(i)}
                  onTrack={(woId) => setTrackWoId(woId)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        item={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
      <WorkOrderDetailModal
        woId={trackWoId}
        onClose={() => setTrackWoId(null)}
      />
    </div>
  );
}
