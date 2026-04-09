"use client";
import { useEffect, useState } from "react";
import { Users, Phone, MapPin, Plus, RefreshCw } from "lucide-react";

export default function TechnicianHub() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/field/technicians")
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d.data) ? d.data : []); setLoading(false); })
      .catch(() => { setData([]); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(t =>
    !search || t.fullName?.toLowerCase().includes(search.toLowerCase()) || t.mobile?.includes(search)
  );

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Technician Hub</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Field technician registry & assignment management</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={load} style={{ background: "var(--bg-lighter)", border: "1px solid var(--card-border)", padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--foreground)" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Onboard Technician
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 12 }}>
        <input
          placeholder="Search by name or mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", background: "var(--bg-lighter)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "var(--foreground)" }}
        />
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Total Technicians", value: data.length, color: "#3b82f6" },
          { label: "Active", value: data.filter(t => t.status === "ACTIVE").length, color: "#10b981" },
          { label: "Inactive", value: data.filter(t => t.status !== "ACTIVE").length, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              {["Technician", "Mobile", "Service Scope (Pincodes)", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontStyle: "italic" }}>Loading technicians...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No technicians found.</td></tr>
            ) : filtered.map((t: any) => (
              <tr key={t.technicianId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={16} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.fullName}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{t.technicianId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={12} color="var(--muted)" />{t.mobile}</div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={12} color="var(--accent)" />{t.pincodeScope || "—"}</div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: t.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: t.status === "ACTIVE" ? "#10b981" : "#ef4444" }}>
                    {t.status || "ACTIVE"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--card-border)", background: "transparent", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--accent)" }}>
                    Assign WO
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
