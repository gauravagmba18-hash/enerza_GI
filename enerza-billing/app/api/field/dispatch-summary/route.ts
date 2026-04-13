import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

const SLA_HOURS = 24;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all";
    const search = searchParams.get("search") ?? "";
    const now = new Date();
    const slaThreshold = new Date(now.getTime() - SLA_HOURS * 3_600_000);

    // Fetch tickets
    const tickets = await (prisma.serviceTicket as any).findMany({
      include: {
        account: { include: { customer: true } },
        workOrders: { include: { technician: true, spares: { include: { item: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch service requests needing field work (steps 2 & 3)
    const srs = await (prisma.serviceRequest as any).findMany({
      where: { currentStep: { in: [2, 3] }, status: { notIn: ["ACTIVE", "CANCELLED"] } },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    // Map tickets → DispatchItems
    let items: any[] = tickets.map((t: any) => {
      const activeWO = t.workOrders.find((w: any) => w.status !== "COMPLETED");
      const sparesHeld = t.workOrders.some(
        (w: any) => w.spares.length > 0 && w.status !== "COMPLETED"
      );
      const slaBreached =
        t.status !== "CLOSED" && new Date(t.createdAt) < slaThreshold;
      return {
        type: "TICKET",
        id: t.ticketId,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: t.category ?? "GENERAL",
        accountId: t.accountId,
        customerName: t.account?.customer?.fullName ?? "—",
        technicianId: activeWO?.technicianId ?? null,
        technicianName: activeWO?.technician?.fullName ?? null,
        workOrderId: activeWO?.workOrderId ?? null,
        slaBreached,
        sparesHeld,
        createdAt: t.createdAt,
      };
    });

    // Map SRs → DispatchItems
    const srItems: any[] = srs.map((sr: any) => {
      const stepLabel = sr.currentStep === 2 ? "Field Verification" : "Field Work";
      return {
        type: "SR",
        id: sr.requestId,
        subject: `${stepLabel}: ${sr.type.replace("_", " ")}`,
        status: sr.status,
        priority: sr.priority,
        category: sr.type,
        accountId: sr.accountId ?? null,
        customerName: sr.customer?.fullName ?? "—",
        technicianId: null,
        technicianName: null,
        workOrderId: null,
        slaBreached: false,
        sparesHeld: false,
        createdAt: sr.createdAt,
      };
    });

    items = [...items, ...srItems];

    // Apply filter
    if (filter === "high-priority")
      items = items.filter((i) => i.priority === "HIGH" || i.priority === "URGENT");
    else if (filter === "unassigned")
      items = items.filter((i) => !i.technicianId && i.status !== "CLOSED" && i.status !== "ACTIVE");
    else if (filter === "sla-breach")
      items = items.filter((i) => i.slaBreached);
    else if (filter === "spares-held")
      items = items.filter((i) => i.sparesHeld);

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.subject.toLowerCase().includes(q) ||
          (i.accountId ?? "").toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q)
      );
    }

    // KPIs (computed from all tickets, not filtered list)
    const allTickets: any[] = tickets;
    const pending = allTickets.filter(
      (t: any) => t.status === "OPEN" || t.status === "ASSIGNED"
    ).length;
    const onVisit = allTickets.filter((t: any) =>
      t.workOrders.some((w: any) => w.status === "IN_PROGRESS")
    ).length;
    const resolved = allTickets.filter(
      (t: any) => t.status === "CLOSED" || t.status === "RESOLVED"
    ).length;
    const slaBreach = allTickets.filter(
      (t: any) => t.status !== "CLOSED" && new Date(t.createdAt) < slaThreshold
    ).length;
    const sparesHeldCount = allTickets.filter((t: any) =>
      t.workOrders.some((w: any) => w.spares.length > 0 && w.status !== "COMPLETED")
    ).length;

    // Critical spares: items where total stock < min_level
    const inventoryItems = await (prisma.inventoryItem as any).findMany({
      include: { inventory_stock: true },
    });
    const criticalSpares = inventoryItems
      .map((item: any) => {
        const totalQty = item.inventory_stock.reduce(
          (sum: number, s: any) => sum + (s.quantity ?? 0),
          0
        );
        return { itemId: item.itemId, itemName: item.itemName, quantityOnHand: totalQty, minLevel: item.min_level };
      })
      .filter((item: any) => item.quantityOnHand < item.minLevel);

    return ok({
      kpis: { pending, onVisit, resolved, slaBreach, sparesHeld: sparesHeldCount },
      items,
      criticalSpares,
    });
  } catch (err) {
    return serverError(err);
  }
}
