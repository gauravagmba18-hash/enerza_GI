export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import {
  Users, Receipt, CreditCard, MapPin,
  Smartphone, Globe, Activity, TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default async function Dashboard() {
  let c = 0, a = 0, b = 0, po = 0, m = 0, cs = 0, au = 0, ap = 0;
  let dbError: string | null = null;

  try {
    [c, a, b, po, m, cs, au, ap] = await Promise.all([
      prisma.customer.count(),
      prisma.account.count(),
      prisma.bill.count(),
      prisma.paymentOrder.count(),
      prisma.meter.count(),
      prisma.cngStation.count(),
      prisma.appUser.count(),
      prisma.apiPartner.count(),
    ]);
  } catch (err: any) {
    dbError = err?.message ?? "Database query failed";
  }

  const stats = {
    customers: c, accounts: a, bills: b, paymentOrders: po,
    meters: m, cngStations: cs, appUsers: au, apiPartners: ap,
  };

  const cards = [
    { label: "Total Customers",  value: stats.customers,    icon: Users,       color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
    { label: "Active Accounts",  value: stats.accounts,     icon: Receipt,     color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
    { label: "Total Bills",      value: stats.bills,        icon: TrendingUp,  color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "Payment Orders",   value: stats.paymentOrders, icon: CreditCard,  color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    { label: "Meters Installed", value: stats.meters,       icon: MapPin,      color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
    { label: "CNG Stations",     value: stats.cngStations,  icon: Activity,    color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
    { label: "App Users",        value: stats.appUsers,     icon: Smartphone,  color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    { label: "API Partners",     value: stats.apiPartners,  icon: Globe,       color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  ];

  const domains = [
    { label: "Customer & Service", tables: 9,  color: "#06b6d4" },
    { label: "Tariff & Billing",   tables: 6,  color: "#818cf8" },
    { label: "Payments & Recon",   tables: 7,  color: "#10b981" },
    { label: "Geography & CNG",    tables: 9,  color: "#f59e0b" },
    { label: "Mobile App",         tables: 8,  color: "#f472b6" },
    { label: "API & Partners",     tables: 8,  color: "#fb923c" },
  ];

  return (
    <div style={{ padding: 0 }}>
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#06b6d4,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" }}>
          Enerza Billing Dashboard
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>
          Unified utility billing management &mdash; Gas &middot; Electricity &middot; Water &middot; CNG
        </p>
      </div>

      {/* DB migration warning */}
      {dbError && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 10, marginBottom: 24 }}>
          <AlertTriangle size={18} style={{ color: "#eab308", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, color: "#eab308", fontSize: 13, marginBottom: 4 }}>Database not ready — pending migrations</div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              Run <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4 }}>npx prisma migrate deploy</code> inside the <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4 }}>enerza-billing</code> directory, then restart the server.
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, fontFamily: "monospace", opacity: 0.6 }}>{dbError}</div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20, marginBottom: 40 }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16, transition: "transform 0.2s" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${card.bg}` }}>
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>
                  {card.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Domain overview */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }}></div>
          Database Domains
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {domains.map((d) => (
            <div key={d.label} className="glass" style={{ padding: 22, borderLeft: `4px solid ${d.color}`, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{d.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: d.color, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 10 }}>{d.tables} tables</div>
              </div>
              <div style={{ marginTop: 16, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", background: d.color, width: `${(d.tables / 9) * 100}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="glass" style={{ padding: "24px 32px", display: "flex", gap: 60, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        {[
          { v: "46",   label: "Database Tables",  color: "#06b6d4" },
          { v: "92",   label: "API Route Files",   color: "#818cf8" },
          { v: "~322", label: "API Endpoints",     color: "#10b981" },
          { v: "6",    label: "ERD Domains",       color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: s.color, letterSpacing: "-1px" }}>{s.v}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
