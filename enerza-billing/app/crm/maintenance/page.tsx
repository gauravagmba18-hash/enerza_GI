export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function AssetMaintenance() {
  const assets = await prisma.asset.findMany({
    orderBy: { next_maint_date: "asc" },
    include: {
      maintenance_activity: {
        orderBy: { performed_at: "desc" },
        take: 1,
      },
    },
  });

  const now = new Date();
  const overdueCount = assets.filter(a => a.next_maint_date && new Date(a.next_maint_date) < now).length;
  const goodCount = assets.filter(a => a.health_status === "GOOD").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>Asset Maintenance Register</h1>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>BR-045, BR-046 — Preventive &amp; Corrective Maintenance History</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{overdueCount} overdue</span>
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{goodCount} healthy</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Total Assets", val: assets.length, color: "var(--foreground)" },
          { label: "Maintenance Overdue", val: overdueCount, color: "#ef4444" },
          { label: "Healthy", val: goodCount, color: "#10b981" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              {["Asset ID", "Name / Category", "Last Maintenance", "Next Due", "YTD Failures", "Health", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No assets found. Add assets via the data management section.</td></tr>
            ) : assets.map((asset) => {
              const isOverdue = asset.next_maint_date && new Date(asset.next_maint_date) < now;
              return (
                <tr key={asset.asset_id} style={{ borderBottom: "1px solid var(--card-border)", background: isOverdue ? "rgba(239,68,68,0.02)" : undefined }}>
                  <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>
                    {asset.asset_code ?? asset.asset_id.slice(-8).toUpperCase()}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>
                    <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{asset.name}</div>
                    <span style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, color: "var(--muted)", fontWeight: 700 }}>{asset.category.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>
                    {asset.last_maint_date ? new Date(asset.last_maint_date).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: isOverdue ? "#ef4444" : "var(--muted)", fontWeight: isOverdue ? 700 : 400 }}>
                    {asset.next_maint_date ? new Date(asset.next_maint_date).toLocaleDateString() : "—"}
                    {isOverdue && " ⚠"}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center", fontSize: 13, fontWeight: 700, color: asset.ytd_failures > 0 ? "#ef4444" : "#10b981" }}>
                    {asset.ytd_failures}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 12, background: asset.health_status === "GOOD" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: asset.health_status === "GOOD" ? "#10b981" : "#ef4444" }}>
                      {asset.health_status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "4px 10px", borderRadius: 4, background: "transparent", border: "1px solid var(--card-border)", fontSize: 11, cursor: "pointer", color: "var(--foreground)" }}>Inspect</button>
                      <button style={{ padding: "4px 10px", borderRadius: 4, background: "transparent", border: "1px solid var(--card-border)", fontSize: 11, cursor: "pointer", color: "var(--accent)" }}>+WO</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
