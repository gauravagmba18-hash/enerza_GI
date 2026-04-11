export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Building2, Gauge, Receipt, Smartphone, Globe,
  Users, MapPin, Zap, Database, ChevronRight,
} from "lucide-react";

export default async function MasterDataPage() {
  let customerCount = 0, premiseCount = 0, accountCount = 0,
    meterCount = 0, ratePlanCount = 0, appUserCount = 0, apiPartnerCount = 0;
  let dbError: string | null = null;

  try {
    [customerCount, premiseCount, accountCount, meterCount, ratePlanCount, appUserCount, apiPartnerCount] =
      await Promise.all([
        prisma.customer.count(),
        prisma.premise.count(),
        prisma.account.count(),
        prisma.meter.count(),
        prisma.ratePlan.count(),
        prisma.appUser.count(),
        prisma.apiPartner.count(),
      ]);
  } catch (err: any) {
    dbError = err?.message ?? "Database unavailable";
  }

  const sections = [
    {
      label: "Customer & Connection",
      icon: Building2,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      description: "Customer Master, Premises, Accounts, Consumer Segments, Service Connections",
      href: "/data/customers",
      links: [
        { label: "Customer Master",     path: "/data/customers",           count: customerCount },
        { label: "Premise Master",      path: "/data/premises",            count: premiseCount },
        { label: "Account (CAN)",       path: "/data/accounts",            count: accountCount },
        { label: "Consumer Segments",   path: "/data/consumer-segments",   count: null },
        { label: "Service Connections", path: "/data/service-connections", count: null },
      ],
    },
    {
      label: "Metering & Network",
      icon: Gauge,
      color: "#64748b",
      bg: "rgba(100,116,139,0.1)",
      description: "CGD Areas, Routes, Sub-Stations, Feeders, Transformers, Meter Master, CNG Stations",
      href: "/data/meters",
      links: [
        { label: "Meter Master",        path: "/data/meters",                      count: meterCount },
        { label: "CGD Areas",           path: "/data/cgd-areas",                   count: null },
        { label: "Routes",              path: "/data/routes",                      count: null },
        { label: "Sub-Stations",        path: "/data/sub-stations",                count: null },
        { label: "Feeders",             path: "/data/feeders",                     count: null },
        { label: "Transformers (DT)",   path: "/data/distribution-transformers",   count: null },
        { label: "Pressure Bands",      path: "/data/pressure-bands",              count: null },
        { label: "Supply Zones",        path: "/data/supply-zones",                count: null },
        { label: "CNG Stations",        path: "/data/cng-stations",                count: null },
        { label: "Vehicle Categories",  path: "/data/vehicle-categories",          count: null },
      ],
    },
    {
      label: "Tariff & Billing",
      icon: Receipt,
      color: "#f97316",
      bg: "rgba(249,115,22,0.1)",
      description: "Rate Plans, Charge Components, Tax Rules, Bill Cycles, TOD Slots, Dunning Levels",
      href: "/data/rate-plans",
      links: [
        { label: "Rate Plans",           path: "/data/rate-plans",           count: ratePlanCount },
        { label: "Charge Components",    path: "/data/charge-components",    count: null },
        { label: "Tax Masters",          path: "/data/tax-masters",          count: null },
        { label: "Bill Cycles",          path: "/data/bill-cycles",          count: null },
        { label: "TOD Slots",            path: "/data/tod-slots",            count: null },
        { label: "Budget Billing Plans", path: "/data/budget-billing-plans", count: null },
        { label: "Dunning Levels",       path: "/data/dunning-levels",       count: null },
      ],
    },
    {
      label: "Mobile App MDM",
      icon: Smartphone,
      color: "#22d3ee",
      bg: "rgba(34,211,238,0.1)",
      description: "App Users, Device Registry, Notifications, Service Request Types",
      href: "/data/app-users",
      links: [
        { label: "App Users",         path: "/data/app-users",           count: appUserCount },
        { label: "Device Registry",   path: "/data/app-devices",         count: null },
        { label: "App Sessions",      path: "/data/app-sessions",        count: null },
        { label: "Notif Templates",   path: "/data/notif-templates",     count: null },
        { label: "Service Req Types", path: "/data/service-request-types", count: null },
      ],
    },
    {
      label: "System & API",
      icon: Globe,
      color: "#fb923c",
      bg: "rgba(251,146,60,0.1)",
      description: "Utility Config, API Partners, Endpoint Catalog, Payment Channels, Gateways, Webhooks",
      href: "/data/api-partners",
      links: [
        { label: "API Partners",     path: "/data/api-partners",           count: apiPartnerCount },
        { label: "Utility Config",   path: "/data/utility-configs",        count: null },
        { label: "Endpoint Catalog", path: "/data/api-endpoint-catalogs",  count: null },
        { label: "Payment Channels", path: "/data/payment-channels",       count: null },
        { label: "Payment Gateways", path: "/data/payment-gateways",       count: null },
        { label: "Webhooks",         path: "/data/webhook-subscriptions",  count: null },
        { label: "API Transactions", path: "/data/api-transactions",       count: null },
      ],
    },
  ];

  const summaryStats = [
    { label: "Customers",   value: customerCount,  color: "#8b5cf6" },
    { label: "Premises",    value: premiseCount,   color: "#64748b" },
    { label: "Accounts",    value: accountCount,   color: "#f97316" },
    { label: "Meters",      value: meterCount,     color: "#22d3ee" },
    { label: "Rate Plans",  value: ratePlanCount,  color: "#10b981" },
    { label: "App Users",   value: appUserCount,   color: "#fb923c" },
  ];

  return (
    <div style={{ padding: 0 }}>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Database size={22} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              Master Data Management
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Multi-utility platform · Piped Gas · Electricity · Water · CNG
            </p>
          </div>
        </div>
      </div>

      {/* DB error banner */}
      {dbError && (
        <div
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
            color: "#f59e0b",
            fontSize: 13,
          }}
        >
          Database unavailable — counts show 0. Start your database and run{" "}
          <code>npx prisma migrate deploy</code>.
        </div>
      )}

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {summaryStats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: 12,
              padding: "14px 16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--muted)",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Section cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.label}
              style={{
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  background: section.bg,
                  borderBottom: "1px solid var(--card-border)",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: section.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>
                    {section.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {section.description}
                  </div>
                </div>
              </div>

              {/* Links list */}
              <div style={{ padding: "8px 0" }}>
                {section.links.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px 18px",
                        fontSize: 13,
                        color: "var(--foreground)",
                        transition: "background 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--sidebar-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <span style={{ flex: 1 }}>{link.label}</span>
                      {link.count !== null && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: section.color,
                            marginRight: 8,
                          }}
                        >
                          {link.count}
                        </span>
                      )}
                      <ChevronRight size={14} style={{ color: "var(--muted)", opacity: 0.5 }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
