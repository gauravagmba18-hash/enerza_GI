export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";
import { 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  AlertCircle, 
  Wrench, 
  ChevronLeft,
  Zap,
  PlusCircle
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function Customer360Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { customerId: id },
    include: {
      accounts: {
        include: {
          premise: true,
          serviceConnections: {
            include: {
              elecConnDetail: true,
              gasConnDetail: true,
              waterConnDetail: true
            }
          },
          bills: { take: 5, orderBy: { billDate: "desc" } },
          serviceTickets: { 
            take: 5, 
            orderBy: { createdAt: "desc" },
            include: { workOrders: true }
          }
        }
      }
    }
  });

  if (!customer) return notFound();

  const primaryAccount = customer.accounts[0];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/crm/customers" style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          width: 32, 
          height: 32, 
          borderRadius: "50%", 
          border: "1px solid var(--card-border)", 
          color: "var(--muted)",
          textDecoration: "none"
        }}>
          <ChevronLeft size={18} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Customer 360° Profile</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={{ 
            background: "#fff", 
            color: "#475569", 
            border: "1px solid #cbd5e1", 
            padding: "6px 14px", 
            borderRadius: 6, 
            fontSize: 12, 
            fontWeight: 600, 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            cursor: "pointer"
          }}>
            <PlusCircle size={14} /> + Service Request
          </button>
          <button style={{ 
            background: "#0F172A", 
            color: "#fff", 
            border: "none", 
            padding: "6px 14px", 
            borderRadius: 6, 
            fontSize: 12, 
            fontWeight: 600, 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            cursor: "pointer"
          }}>
            <AlertCircle size={14} /> + Complaint
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div style={{ 
        background: "var(--bg-lighter)", 
        border: "1px solid var(--card-border)", 
        borderRadius: 16, 
        padding: 24,
        display: "flex",
        gap: 24,
        alignItems: "flex-start"
      }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: 16, 
          background: "var(--accent)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          fontSize: 28,
          color: "#fff"
        }}>
          {customer.fullName.charAt(0)}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{customer.fullName}</h2>
            <CRMStatusPill status={customer.status} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={14} /> BP ID: <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{customer.customerId.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Phone size={14} /> <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{customer.mobile || "N/A"}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Mail size={14} /> <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{customer.email || "N/A"}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Outstanding</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>₹14,284</div>
          <button style={{ 
            background: "var(--accent)", 
            color: "#fff", 
            border: "none", 
            padding: "6px 16px", 
            borderRadius: 8, 
            fontSize: 12, 
            fontWeight: 700, 
            marginTop: 8,
            cursor: "pointer" 
          }}>Pay Now</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Main Tabs Simulation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Service Section */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color="var(--accent)" /> Service Agreements
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {primaryAccount?.serviceConnections.map(conn => (
                <div key={conn.connectionId} style={{ padding: 12, background: "var(--bg-lighter)", borderRadius: 8, border: "1px solid var(--card-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{conn.utilityType} Connection</span>
                    <CRMStatusPill status={conn.status} />
                  </div>
                  <div style={{ fontSize: 12 }}>ID: <span style={{ fontFamily: "monospace" }}>{conn.connectionId}</span></div>
                  {conn.elecConnDetail && (
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{conn.elecConnDetail.loadKw} kW · {conn.elecConnDetail.phaseType} · {conn.elecConnDetail.tariffCategory}</div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Started: {conn.startDate?.toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Section */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={16} color="var(--accent)" /> Recent Bills
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-lighter)", borderBottom: "1px solid var(--card-border)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Bill ID</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Month</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {primaryAccount?.bills.map(bill => (
                  <tr key={bill.billId} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "monospace" }}>{bill.billId.slice(-6).toUpperCase()}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12 }}>{bill.billDate?.toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, textAlign: "right" }}>₹{bill.netAmount.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}><CRMStatusPill status={bill.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Premise Card */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={16} color="var(--accent)" /> Premise Detail
            </h3>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {primaryAccount?.premise.addressLine1}<br/>
              {primaryAccount?.premise.addressLine2}<br/>
              {primaryAccount?.premise.areaId}
            </div>
            <div style={{ marginTop: 12, borderTop: "1px solid var(--card-border)", paddingTop: 12 }}>
              <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Type</span> <span style={{ fontWeight: 600 }}>{primaryAccount?.premise.buildingType || "Residential"}</span>
              </div>
              <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between" }}>
                <span>CAN</span> <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{primaryAccount?.accountId}</span>
              </div>
            </div>
          </div>

          {/* Complaints Summary */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} color="#ef4444" /> Complaints (Recent)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {primaryAccount?.serviceTickets.map(ticket => (
                <div key={ticket.ticketId} style={{ fontSize: 12, padding: 8, background: "var(--bg-lighter)", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{ticket.category || "Complaint"}</span>
                    <CRMStatusPill status={ticket.status} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{ticket.createdAt?.toLocaleDateString()} · {ticket.priority}</div>
                </div>
              ))}
              <Link href="/crm/complaints" style={{ fontSize: 11, color: "var(--accent)", textAlign: "center", textDecoration: "none", marginTop: 4 }}>All Complaints →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
