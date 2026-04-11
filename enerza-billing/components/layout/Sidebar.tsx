"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Users, Zap, CreditCard, BarChart3, Smartphone,
  Globe, ChevronDown, ChevronRight, Activity,
  Gauge, Flame, Building2, Receipt, FlaskConical, ShieldAlert, Droplets,
  Sun, Moon, Wrench, Database, LucideIcon
} from "lucide-react";

interface SidebarItem {
  label: string;
  path: string;
  badge?: string;
}

interface SidebarGroup {
  label: string;
  icon: LucideIcon;
  color: string;
  items: SidebarItem[];
}

// ─── Operational groups ────────────────────────────────────────────────────────
const OPERATIONAL_GROUPS: SidebarGroup[] = [
  {
    label: "Customer Hub",
    icon: Users,
    color: "#10b981",
    items: [
      { label: "Customer 360°",  path: "/crm/customers" },
      { label: "Meter Readings", path: "/data/meter-readings" },
      { label: "Create Bill",    path: "/billing-engine" },
    ],
  },
  {
    label: "Electricity Hub",
    icon: Zap,
    color: "#eab308",
    items: [
      { label: "Power Ops Hub",        path: "/power-ops" },
      { label: "Net Metering (Solar)", path: "/power-ops/net-metering" },
    ],
  },
  {
    label: "Gas Utility Hub",
    icon: Flame,
    color: "#06b6d4",
    items: [
      { label: "PNG Ops Hub", path: "/gas" },
      { label: "CNG Sales",   path: "/data/cng-sales" },
    ],
  },
  {
    label: "Water Utility Hub",
    icon: Droplets,
    color: "#3b82f6",
    items: [
      { label: "Water Ops Hub",    path: "/water" },
      { label: "NRW Hub (Leaks)", path: "/water-ops/nrw" },
      { label: "Bulk Meter Reads", path: "/data/bulk-meter-reads" },
    ],
  },
  {
    label: "Commercial & FI-CA",
    icon: CreditCard,
    color: "#818cf8",
    items: [
      { label: "FI-CA Dashboard",      path: "/fica" },
      { label: "Settlements",          path: "/data/settlements" },
      { label: "Gateway Transactions", path: "/data/gateway-txns" },
      { label: "Suspense Records",     path: "/data/suspense-records" },
    ],
  },
  {
    label: "Field Operations",
    icon: Wrench,
    color: "#f59e0b",
    items: [
      { label: "Dispatch Board",     path: "/field" },
      { label: "Technician Hub",     path: "/field/technician" },
      { label: "Inventory & Spares", path: "/data/inventory-items" },
    ],
  },
  {
    label: "CRM & FSM",
    icon: Activity,
    color: "#2dd4bf",
    items: [
      { label: "CRM Dashboard",       path: "/crm" },
      { label: "Billing Lifecycle",   path: "/crm/lifecycle" },
      { label: "Complaints Register", path: "/crm/complaints", badge: "3" },
      { label: "Work Order Dispatch", path: "/crm/work-orders" },
      { label: "Device Replacement",  path: "/crm/replacement" },
      { label: "Asset Maintenance",   path: "/crm/maintenance" },
      { label: "Outage Management",   path: "/crm/outages" },
      { label: "Analytics & Reports", path: "/crm/reports" },
    ],
  },
];

// ─── Master Data groups (MDM spec) ────────────────────────────────────────────
const MDM_GROUPS: SidebarGroup[] = [
  {
    label: "Customer & Connection",
    icon: Building2,
    color: "#8b5cf6",
    items: [
      { label: "Customer Master",     path: "/data/customers" },
      { label: "Premise Master",      path: "/data/premises" },
      { label: "Account (CAN)",       path: "/data/accounts" },
      { label: "Consumer Segments",   path: "/data/consumer-segments" },
      { label: "Service Connections", path: "/data/service-connections" },
    ],
  },
  {
    label: "Metering & Network",
    icon: Gauge,
    color: "#64748b",
    items: [
      { label: "CGD Areas",           path: "/data/cgd-areas" },
      { label: "Routes",              path: "/data/routes" },
      { label: "Sub-Stations",        path: "/data/sub-stations" },
      { label: "Feeders",             path: "/data/feeders" },
      { label: "Transformers (DT)",   path: "/data/distribution-transformers" },
      { label: "Pressure Bands",      path: "/data/pressure-bands" },
      { label: "Supply Zones",        path: "/data/supply-zones" },
      { label: "Meter Master",        path: "/data/meters" },
      { label: "CNG Stations",        path: "/data/cng-stations" },
      { label: "Vehicle Categories",  path: "/data/vehicle-categories" },
    ],
  },
  {
    label: "Tariff & Billing",
    icon: Receipt,
    color: "#f97316",
    items: [
      { label: "Rate Plans",           path: "/data/rate-plans" },
      { label: "Charge Components",    path: "/data/charge-components" },
      { label: "Tax Masters",          path: "/data/tax-masters" },
      { label: "Bill Cycles",          path: "/data/bill-cycles" },
      { label: "TOD Slots",            path: "/data/tod-slots" },
      { label: "Budget Billing Plans", path: "/data/budget-billing-plans" },
      { label: "Dunning Levels",       path: "/data/dunning-levels" },
    ],
  },
  {
    label: "Mobile App MDM",
    icon: Smartphone,
    color: "#22d3ee",
    items: [
      { label: "App Users",         path: "/data/app-users" },
      { label: "Device Registry",   path: "/data/app-devices" },
      { label: "App Sessions",      path: "/data/app-sessions" },
      { label: "Notif Templates",   path: "/data/notif-templates" },
      { label: "Service Req Types", path: "/data/service-request-types" },
    ],
  },
  {
    label: "System & API",
    icon: Globe,
    color: "#fb923c",
    items: [
      { label: "Utility Config",    path: "/data/utility-configs" },
      { label: "API Partners",      path: "/data/api-partners" },
      { label: "Endpoint Catalog",  path: "/data/api-endpoint-catalogs" },
      { label: "Payment Channels",  path: "/data/payment-channels" },
      { label: "Payment Gateways",  path: "/data/payment-gateways" },
      { label: "Webhooks",          path: "/data/webhook-subscriptions" },
      { label: "API Transactions",  path: "/data/api-transactions" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string[]>(["Customer Hub"]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  const toggle = (label: string) =>
    setOpen((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );

  const renderGroup = (group: SidebarGroup) => {
    const Icon = group.icon;
    const isOpen = open.includes(group.label);
    const isActive = group.items.some((item) => pathname.startsWith(item.path));
    return (
      <div key={group.label} style={{ marginBottom: 2 }}>
        <button
          onClick={() => toggle(group.label)}
          suppressHydrationWarning
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: isActive ? `${group.color}18` : "transparent",
            cursor: "pointer",
            color: isActive ? group.color : "var(--muted)",
            transition: "all 0.2s",
          }}
        >
          <Icon size={16} style={{ color: group.color, flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 500 }}>
            {group.label}
          </span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isOpen && (
          <div style={{ paddingLeft: 8, marginTop: 2 }}>
            {group.items.map((item) => {
              const active = pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px 6px 28px",
                      borderRadius: 6,
                      fontSize: 12,
                      color: active ? group.color : "var(--muted)",
                      background: active ? `${group.color}12` : "transparent",
                      borderLeft: active ? `2px solid ${group.color}` : "2px solid transparent",
                      marginBottom: 1,
                      transition: "all 0.15s",
                      cursor: "pointer",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          background: "#9b2c2c",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: "50%",
                          width: 16,
                          height: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--card-border)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--card-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #06b6d4, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>Enerza</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Billing System</div>
          </div>
        </div>
      </div>

      {/* Dashboard link */}
      <div style={{ padding: "8px 8px 4px" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 8,
              background: pathname === "/" ? "var(--accent-glow)" : "transparent",
              color: pathname === "/" ? "var(--accent)" : "var(--muted)",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            <BarChart3 size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Dashboard</span>
          </div>
        </Link>
      </div>

      {/* Billing Engine quick-link */}
      <div style={{ padding: "4px 8px 0" }}>
        <Link href="/billing-engine" style={{ textDecoration: "none" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 8,
              background: pathname.startsWith("/billing-engine")
                ? "rgba(249,115,22,0.15)"
                : "transparent",
              color: pathname.startsWith("/billing-engine") ? "#f97316" : "var(--muted)",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            <FlaskConical size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Billing Engine</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                background: "#f97316",
                color: "#fff",
                borderRadius: 4,
                padding: "1px 5px",
                fontWeight: 700,
              }}
            >
              LIVE
            </span>
          </div>
        </Link>
      </div>

      {/* New Connection Workflow quick-link */}
      <div style={{ padding: "8px 12px 0" }}>
        <Link href="/new-connection" style={{ textDecoration: "none" }}>
          <div
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background: pathname.startsWith("/new-connection")
                ? "rgba(37,99,235,0.15)"
                : "rgba(255,255,255,0.02)",
              border: "1px solid var(--card-border)",
              color: pathname.startsWith("/new-connection") ? "#3b82f6" : "var(--foreground)",
              transition: "all 0.2s",
              cursor: "pointer",
              marginTop: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div
              style={{
                background: "#3b82f6",
                borderRadius: "50%",
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(59,130,246,0.3)",
              }}
            >
              <Users size={12} color="#fff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>
              New Connection
            </span>
          </div>
        </Link>
      </div>

      {/* FI-CA quick-link */}
      <div style={{ padding: "6px 12px 0" }}>
        <Link href="/fica" style={{ textDecoration: "none" }}>
          <div
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background: pathname.startsWith("/fica")
                ? "rgba(239,68,68,0.15)"
                : "rgba(255,255,255,0.02)",
              border: "1px solid var(--card-border)",
              color: pathname.startsWith("/fica") ? "#ef4444" : "var(--foreground)",
              transition: "all 0.2s",
              cursor: "pointer",
              marginTop: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div
              style={{
                background: "#ef4444",
                borderRadius: "50%",
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(239,68,68,0.3)",
              }}
            >
              <ShieldAlert size={12} color="#fff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>
              FI-CA Collections
            </span>
          </div>
        </Link>
      </div>

      {/* Master Data quick-link */}
      <div style={{ padding: "6px 12px 12px", borderBottom: "1px solid var(--card-border)" }}>
        <Link href="/master-data" style={{ textDecoration: "none" }}>
          <div
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background: pathname.startsWith("/master-data")
                ? "rgba(139,92,246,0.15)"
                : "rgba(255,255,255,0.02)",
              border: "1px solid var(--card-border)",
              color: pathname.startsWith("/master-data") ? "#8b5cf6" : "var(--foreground)",
              transition: "all 0.2s",
              cursor: "pointer",
              marginTop: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div
              style={{
                background: "#8b5cf6",
                borderRadius: "50%",
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(139,92,246,0.3)",
              }}
            >
              <Database size={12} color="#fff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>
              Master Data
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "4px 8px 16px" }}>
        {/* Operational groups */}
        {OPERATIONAL_GROUPS.map(renderGroup)}

        {/* Master Data section divider */}
        <div
          style={{
            padding: "14px 10px 5px",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            borderTop: "1px solid var(--card-border)",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Database size={10} style={{ opacity: 0.6 }} />
          Master Data (MDM)
        </div>

        {/* MDM groups */}
        {MDM_GROUPS.map(renderGroup)}
      </nav>

      {/* Footer / Theme Toggle */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--card-border)",
          marginTop: "auto",
        }}
      >
        <button
          onClick={toggleTheme}
          suppressHydrationWarning
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            background: "var(--sidebar-hover)",
            border: "1px solid var(--card-border)",
            color: "var(--foreground)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {mounted ? (
            theme === "dark" ? (
              <><Sun size={18} /> Light Mode</>
            ) : (
              <><Moon size={18} /> Dark Mode</>
            )
          ) : (
            <div style={{ width: 18, height: 18 }} />
          )}
        </button>
      </div>
    </aside>
  );
}
