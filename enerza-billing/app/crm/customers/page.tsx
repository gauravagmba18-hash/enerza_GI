export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import { Users, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function Customer360List({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const customers = await prisma.customer.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    where: q
      ? {
          OR: [
            { fullName:   { contains: q, mode: "insensitive" } },
            { mobile:     { contains: q } },
            { customerId: { contains: q, mode: "insensitive" } },
            { email:      { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      accounts: {
        take: 1,
        include: { serviceConnections: { take: 1 } },
      },
      segment: true,
    },
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
            Customer Master
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {q
              ? `${customers.length} result${customers.length !== 1 ? "s" : ""} for "${q}"`
              : `Showing ${customers.length} most recent customers`}
          </p>
        </div>
        <Link href="/new-connection" style={{
          background: "var(--accent)", color: "#fff", padding: "8px 16px",
          borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          + New Customer
        </Link>
      </div>

      {/* Search */}
      <form method="GET" style={{
        background: "var(--card-bg)", border: "1px solid var(--card-border)",
        borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center",
      }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--muted)",
          }} />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, Customer ID, mobile or email…"
            style={{
              width: "100%", background: "var(--bg-lighter)",
              border: "1px solid var(--card-border)", borderRadius: 8,
              padding: "8px 12px 8px 36px", fontSize: 13, color: "var(--foreground)",
            }}
          />
        </div>
        <button type="submit" style={{
          background: "var(--accent)", color: "#fff", border: "none",
          padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          Search
        </button>
        {q && (
          <Link href="/crm/customers" style={{
            fontSize: 12, color: "var(--muted)", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--card-border)",
        borderRadius: 12, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              {["Customer ID", "Customer Name", "Segment", "Mobile", "Accounts", "Status", ""].map((h) => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: h === "" ? "right" : "left",
                  fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                  No customers found{q ? ` for "${q}"` : ""}.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.customerId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                {/* Full customerId — same value shown in /data/customers */}
                <td style={{ padding: "14px 16px", fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
                  {c.customerId}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600 }}>
                  {c.fullName}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--muted)" }}>
                  {c.segment?.segmentName ?? "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--muted)" }}>
                  {c.mobile || "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4,
                    background: "rgba(37,99,235,0.1)", color: "#2563eb",
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {c.accounts.length}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <CRMStatusPill status={c.status} />
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <Link
                    href={`/crm/customers/${c.customerId}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 6,
                      border: "1px solid var(--card-border)", color: "var(--accent)",
                      fontSize: 12, fontWeight: 600, textDecoration: "none",
                    }}
                  >
                    360° Profile <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
