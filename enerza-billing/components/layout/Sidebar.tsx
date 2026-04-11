"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Users, MapPin, Zap, CreditCard, BarChart3, Smartphone,
  Globe, ChevronDown, ChevronRight, Layers, Activity,
  Gauge, Flame, Building2, FileText, Receipt, Wifi, FlaskConical, ShieldAlert, Droplets,
  Sun, Moon, Wrench, LucideIcon
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

const UTILITY_GROUPS: SidebarGroup[] = [
  {
    label: "Electricity Hub",
    icon: Zap,
    color: "#eab308",
    items: [
      { label: "Power Ops Hub",       path: "/power-ops" },
      { label: "Net Metering (Solar)",path: "/power-ops/net-metering" },
      { label: "Sub-Stations",        path: "/data/sub-stations" },
      { label: "Feeders",             path: "/data/feeders" },
      { label: "Transformers (DT)",   path: "/data/distribution-transformers" },
      { label: "Power Connections",   path: "/data/elec-conn-details" },
      { label: "TOD Slots",           path: "/data/tod-slots" },
    ],
  },
  {
    label: "Gas Utility Hub",
    icon: Flame,
    color: "#06b6d4",
    items: [
      { label: "PNG Ops Hub",         path: "/gas" },
      { label: "Pressure Bands",      path: "/data/pressure-bands" },
      { label: "Gas Connections",     path: "/data/gas-conn-details" },
      { label: "CNG Stations",        path: "/data/cng-stations" },
      { label: "CNG Sales",           path: "/data/cng-sales" },
      { label: "Vehicle Categories",  path: "/data/vehicle-categories" },
    ],
  },
  {
    label: "Water Utility Hub",
    icon: Droplets,
    color: "#3b82f6",
    items: [
      { label: "Water Ops Hub",       path: "/water" },
      { label: "NRW Hub (Leaks)",     path: "/water-ops/nrw" },
      { label: "Supply Zones",        path: "/data/supply-zones" },
      { label: "Bulk Meter Reads",    path: "/data/bulk-meter-reads" },
      { label: "Water Connections",    path: "/data/water-conn-details" },
    ],
  },
  {
    label: "Commercial & FI-CA",
    icon: CreditCard,
    color: "#818cf8",
    items: [
      { label: "FI-CA Dashboard",     path: "/fica" },
      { label: "Dunning Levels",      path: "/data/dunning-levels" },
      { label: "Security Deposits",   path: "/data/security-deposits" },
      { label: "Budget Billing",      path: "/data/budget-billing-plans" },
      { label: "Payment Orders",      path: "/data/payment-orders" },
      { label: "Refunds",             path: "/data/refunds" },
      { label: "Settlements",         path: "/data/settlements" },
    ],
  },
  {
    label: "Field Operations",
    icon: Wrench,
    color: "#f59e0b",
    items: [
      { label: "Dispatch Board",      path: "/field" },
      { label: "Technician Hub",      path: "/field/technician" },
      { label: "Inventory & Spares",  path: "/data/inventory-items" },
    ],
  },
  {
    label: "Customer Hub",
    icon: Users,
    color: "#10b981",
    items: [
      { label: "Customer 360",        path: "/data/customers" },
      { label: "Accounts",            path: "/data/accounts" },
      { label: "Billing Lifecycle",   path: "/data/bill-cycles" },
    ],
  },
  {
    label: "CRM & FSM",
    icon: Users,
    color: "#2dd4bf",
    items: [
      { label: "CRM Dashboard",       path: "/crm" },
      { label: "Customer Master",      path: "/crm/customers" },
      { label: "Service Lifecycle",   path: "/crm/lifecycle" },
      { label: "Complaints Register", path: "/crm/complaints", badge: "3" },
      { label: "Work Order Dispatch", path: "/crm/work-orders", badge: "?" },
      { label: "Device Replacement",  path: "/crm/replacement" },
      { label: "Inventory & Spares",  path: "/crm/inventory" },
      { label: "Asset Maintenance",   path: "/crm/maintenance" },
      { label: "Outage Linkage",      path: "/crm/outages" },
      { label: "Technician Master",   path: "/crm/technician" },
      { label: "Analytics & Reports", path: "/crm/reports" },
    ],
  },
  {
    label: "System & API",
    icon: Globe,
    color: "#fb923c",
    items: [
      { label: "Utility Config",       path: "/data/utility-configs" },
      { label: "API Partners",        path: "/data/api-partners" },
      { label: "API Transactions",    path: "/data/api-transactions" },
      { label: "Webhooks",            path: "/data/webhook-subscriptions" },
      { label: "App Users",           path: "/data/app-users" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<number[]>([0]);
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

  const toggle = (i: number) =>
    setOpen((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  return (
    <aside style={{ width: 260, minWidth: 260, background: "var(--sidebar)", borderRight: "1px solid var(--card-border)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--card-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #06b6d4, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: pathname === "/" ? "var(--accent-glow)" : "transparent", color: pathname === "/" ? "var(--accent)" : "var(--muted)", transition: "all 0.2s", cursor: "pointer" }}>
            <BarChart3 size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Dashboard</span>
          </div>
        </Link>
      </div>

      {/* Billing Engine quick-link */}
      <div style={{ padding: "4px 8px 0" }}>
        <Link href="/billing-engine" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: pathname.startsWith("/billing-engine") ? "rgba(249,115,22,0.15)" : "transparent", color: pathname.startsWith("/billing-engine") ? "#f97316" : "var(--muted)", transition: "all 0.2s", cursor: "pointer" }}>
            <FlaskConical size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Billing Engine</span>
            <span style={{ marginLeft: "auto", fontSize: 10, background: "#f97316", color: "#fff", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>LIVE</span>
          </div>
        </Link>
      </div>

      {/* New Connection Workflow quick-link */}
      <div style={{ padding: "8px 12px 0" }}>
        <Link href="/new-connection" style={{ textDecoration: "none" }}>
          <div className="glass" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: pathname.startsWith("/new-connection") ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.02)", border: "1px solid var(--card-border)", color: pathname.startsWith("/new-connection") ? "#3b82f6" : "var(--foreground)", transition: "all 0.2s", cursor: "pointer", marginTop: 4 }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ background: "#3b82f6", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(59,130,246,0.3)" }}>
               <Users size={12} color="#fff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>New Connection</span>
          </div>
        </Link>
      </div>

      {/* FI-CA quick-link */}
      <div style={{ padding: "8px 12px 16px", borderBottom: "1px solid var(--card-border)" }}>
        <Link href="/fica" style={{ textDecoration: "none" }}>
          <div className="glass" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: pathname.startsWith("/fica") ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.02)", border: "1px solid var(--card-border)", color: pathname.startsWith("/fica") ? "#ef4444" : "var(--foreground)", transition: "all 0.2s", cursor: "pointer", marginTop: 4 }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ background: "#ef4444", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(239,68,68,0.3)" }}>
               <ShieldAlert size={12} color="#fff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>FI-CA Collections</span>
          </div>
        </Link>
      </div>

      {/* Domain groups */}
      <nav style={{ flex: 1, padding: "4px 8px 16px" }}>
        {UTILITY_GROUPS.map((domain, i) => {
          const Icon = domain.icon;
          const isOpen = open.includes(i);
          const isActive = domain.items.some((item) => pathname.startsWith(item.path));
          return (
            <div key={i} style={{ marginBottom: 2 }}>
              <button
                onClick={() => toggle(i)}
                suppressHydrationWarning
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: "none", background: isActive ? `${domain.color}18` : "transparent", cursor: "pointer", color: isActive ? domain.color : "var(--muted)", transition: "all 0.2s" }}
              >
                <Icon size={16} style={{ color: domain.color, flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 500 }}>{domain.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div style={{ paddingLeft: 8, marginTop: 2 }}>
                  {domain.items.map((item) => {
                    const active = pathname === item.path;
                    return (
                      <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px 6px 28px", borderRadius: 6, fontSize: 12, color: active ? domain.color : "var(--muted)", background: active ? `${domain.color}12` : "transparent", borderLeft: active ? `2px solid ${domain.color}` : "2px solid transparent", marginBottom: 1, transition: "all 0.15s", cursor: "pointer", fontWeight: active ? 500 : 400 }}>
                          <span>{item.label}</span>
                          {item.badge && (
                            <span style={{ 
                              background: "#9b2c2c", 
                              color: "#fff", 
                              fontSize: 10, 
                              fontWeight: 700, 
                              borderRadius: "50%", 
                              width: 16, 
                              height: 16, 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center" 
                            }}>{item.badge}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {/* Footer / Theme Toggle */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--card-border)", marginTop: "auto" }}>
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
            fontWeight: 600
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
