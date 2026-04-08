import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import { Users, Search, Filter, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function Customer360List() {
  const customers = await prisma.customer.findMany({
    take: 5, // Tight limit for maximum performance
    include: {
      accounts: {
        take: 1, // Only need primary account for list view
        include: {
          serviceConnections: { take: 1 }
        }
      }
    }
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Customer Master</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Unified customer records for CRM and billing operations</p>
        </div>
        <button style={{ 
          background: "var(--accent)", 
          color: "#fff", 
          padding: "8px 16px", 
          borderRadius: 8, 
          border: "none", 
          fontWeight: 600, 
          fontSize: 13, 
          cursor: "pointer" 
        }}>
          + New Customer
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ 
        background: "var(--card-bg)", 
        border: "1px solid var(--card-border)", 
        borderRadius: 12, 
        padding: 12,
        display: "flex",
        gap: 12,
        alignItems: "center"
      }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input 
            placeholder="Search by name, BP ID, account, or mobile..." 
            style={{ 
              width: "100%", 
              background: "var(--bg-lighter)", 
              border: "1px solid var(--card-border)", 
              borderRadius: 8, 
              padding: "8px 12px 8px 36px", 
              fontSize: 13, 
              color: "var(--foreground)" 
            }} 
          />
        </div>
        <button style={{ 
          background: "transparent", 
          border: "1px solid var(--card-border)", 
          padding: "8px 12px", 
          borderRadius: 8, 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          fontSize: 13, 
          color: "var(--muted)",
          cursor: "pointer"
        }}>
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* Customer Table */}
      <div style={{ 
        background: "var(--card-bg)", 
        border: "1px solid var(--card-border)", 
        borderRadius: 12, 
        overflow: "hidden" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>BP ID</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Customer Name</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Mobile</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Accounts</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(customers || []).map((customer) => (
              <tr key={customer.customerId} style={{ borderBottom: "1px solid var(--card-border)", transition: "all 0.15s" }}>
                <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace" }}>{customer.customerId.slice(-8).toUpperCase()}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600 }}>{customer.fullName}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--muted)" }}>{customer.mobile || "—"}</td>
                <td style={{ padding: "14px 16px", fontSize: 12 }}>
                  <span style={{ 
                    padding: "2px 6px", 
                    borderRadius: 4, 
                    background: "rgba(37,99,235,0.1)", 
                    color: "#2563eb", 
                    fontSize: 10, 
                    fontWeight: 700 
                  }}>
                    {customer.accounts.length}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}><CRMStatusPill status={customer.status} /></td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <Link href={`/crm/customers/${customer.customerId}`} style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: 6, 
                    padding: "6px 12px", 
                    borderRadius: 6, 
                    background: "transparent", 
                    border: "1px solid var(--card-border)", 
                    color: "var(--accent)", 
                    fontSize: 12, 
                    fontWeight: 600, 
                    textDecoration: "none" 
                  }}>
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
