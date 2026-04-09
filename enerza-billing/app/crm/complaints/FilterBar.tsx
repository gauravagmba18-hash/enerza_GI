"use client";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

interface Props {
  currentQ?: string;
  currentStatus?: string;
  currentType?: string;
}

export default function ComplaintsFilterBar({ currentQ, currentStatus, currentType }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const push = useCallback((q: string, status: string, type: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status && status !== "ALL") params.set("status", status);
    if (type && type !== "ALL") params.set("type", type);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname]);

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        <input
          defaultValue={currentQ}
          placeholder="Search by complaint ID, customer, category..."
          style={{ width: "100%", background: "var(--bg-lighter)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "8px 12px 8px 36px", fontSize: 13, color: "var(--foreground)" }}
          onKeyDown={e => {
            if (e.key === "Enter") push((e.target as HTMLInputElement).value, currentStatus || "ALL", currentType || "ALL");
          }}
          onBlur={e => push(e.target.value, currentStatus || "ALL", currentType || "ALL")}
        />
      </div>
      <select
        defaultValue={currentStatus || "ALL"}
        onChange={e => push(currentQ || "", e.target.value, currentType || "ALL")}
        style={{ background: "var(--bg-lighter)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--foreground)" }}
      >
        <option value="ALL">All Statuses</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="CLOSED">Closed</option>
      </select>
      <select
        defaultValue={currentType || "ALL"}
        onChange={e => push(currentQ || "", currentStatus || "ALL", e.target.value)}
        style={{ background: "var(--bg-lighter)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--foreground)" }}
      >
        <option value="ALL">All Types</option>
        <option value="Billing">Billing</option>
        <option value="Technical">Technical</option>
        <option value="No Supply">No Supply</option>
        <option value="Meter">Meter</option>
      </select>
    </div>
  );
}
