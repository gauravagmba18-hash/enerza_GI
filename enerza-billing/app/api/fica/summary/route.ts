import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();

    // ── Date helpers ──────────────────────────────────────────────────────────
    const startOf = (y: number, m: number) => new Date(y, m, 1);
    const currentY = now.getFullYear();
    const currentM = now.getMonth(); // 0-indexed
    const thirteenMonthsAgo = startOf(currentY, currentM - 13);

    // ── 1. Bills: last 13 months for trend + all outstanding for AR aging ─────
    const [recentBills, outstandingBills] = await Promise.all([
      (prisma.bill as any).findMany({
        where: { billDate: { gte: thirteenMonthsAgo } },
        select: {
          billId: true, billDate: true, dueDate: true,
          totalAmount: true, status: true, accountId: true,
        },
        orderBy: { billDate: "asc" },
      }),
      (prisma.bill as any).findMany({
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        select: { dueDate: true, totalAmount: true, accountId: true, billId: true },
      }),
    ]);

    // ── 2. Monthly billing trend ───────────────────────────────────────────────
    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const currentKey = monthKey(now);

    const monthlyMap: Record<string, { billed: number; count: number }> = {};
    for (const b of recentBills) {
      const k = monthKey(new Date(b.billDate));
      if (!monthlyMap[k]) monthlyMap[k] = { billed: 0, count: 0 };
      monthlyMap[k].billed += b.totalAmount;
      monthlyMap[k].count++;
    }

    // Build 13-slot array (current + 12 prior), newest to oldest
    const monthlyTrend: { month: string; label: string; billed: number; count: number }[] = [];
    for (let i = 0; i < 13; i++) {
      const d = new Date(currentY, currentM - i, 1);
      const k = monthKey(d);
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthlyTrend.push({ month: k, label, ...(monthlyMap[k] ?? { billed: 0, count: 0 }) });
    }
    monthlyTrend.reverse(); // oldest first for chart display

    // Slices: past months only (exclude current)
    const pastMonths = monthlyTrend.filter((m) => m.month < currentKey).reverse(); // newest first
    const avg = (arr: typeof pastMonths, n: number) => {
      const slice = arr.slice(0, n);
      return slice.length ? slice.reduce((s, m) => s + m.billed, 0) / slice.length : 0;
    };
    const currentMonthBilled = monthlyMap[currentKey]?.billed ?? 0;
    const currentMonthCount  = monthlyMap[currentKey]?.count  ?? 0;
    const prev1MonthBilled   = pastMonths[0]?.billed ?? 0;
    const prev3MonthAvg      = avg(pastMonths, 3);
    const prev6MonthAvg      = avg(pastMonths, 6);
    const prev12MonthAvg     = avg(pastMonths, 12);

    // ── 3. All-time totals ─────────────────────────────────────────────────────
    const [billedAgg, collectedAgg, pendingPayAgg, failedPayAgg] = await Promise.all([
      (prisma.bill as any).aggregate({ _sum: { totalAmount: true }, _count: true }),
      (prisma.paymentOrder as any).aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true }, _count: true,
      }),
      (prisma.paymentOrder as any).aggregate({
        where: { status: { in: ["INITIATED", "PENDING"] } },
        _sum: { amount: true }, _count: true,
      }),
      (prisma.paymentOrder as any).aggregate({
        where: { status: "FAILED" },
        _sum: { amount: true }, _count: true,
      }),
    ]);

    const totalBilled      = billedAgg._sum?.totalAmount ?? 0;
    const totalCollected   = collectedAgg._sum?.amount ?? 0;
    const totalBillCount   = billedAgg._count ?? 0;
    const totalPending     = outstandingBills.reduce((s: number, b: any) => s + b.totalAmount, 0);
    const collectionRate   = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // ── 4. AR Aging buckets ────────────────────────────────────────────────────
    const nowMs = now.getTime();
    const aging = [
      { label: "Current (0-30d)",  min: 0,  max: 30,  amount: 0, count: 0 },
      { label: "31-60 days",       min: 31, max: 60,  amount: 0, count: 0 },
      { label: "61-90 days",       min: 61, max: 90,  amount: 0, count: 0 },
      { label: "90+ days",         min: 91, max: Infinity, amount: 0, count: 0 },
    ];
    for (const b of outstandingBills) {
      const daysOverdue = Math.max(0, Math.floor((nowMs - new Date(b.dueDate).getTime()) / 86_400_000));
      const bucket = aging.find((a) => daysOverdue >= a.min && daysOverdue <= a.max);
      if (bucket) { bucket.amount += b.totalAmount; bucket.count++; }
    }

    // ── 5. Dunning notices with customer+account mapping ──────────────────────
    const dunningNotices = await (prisma.dunningNotice as any).findMany({
      where: { status: "ISSUED" },
      include: {
        level:   true,
        account: { include: { customer: { select: { customerId: true, fullName: true, mobile: true } } } },
        bill:    { select: { totalAmount: true, dueDate: true, billDate: true } },
      },
      orderBy: { issuedAt: "desc" },
      take: 50,
    });

    const dunningRows = dunningNotices.map((n: any) => ({
      noticeId:    n.noticeId,
      accountId:   n.accountId,
      customerId:  n.account?.customer?.customerId ?? null,
      customerName: n.account?.customer?.fullName ?? "Unknown",
      mobile:      n.account?.customer?.mobile ?? null,
      levelName:   n.level?.levelName ?? "—",
      levelAction: n.level?.actionType ?? "—",
      daysOverdue: n.level?.daysOverdue ?? 0,
      billAmount:  n.bill?.totalAmount ?? 0,
      billDueDate: n.bill?.dueDate ?? null,
      issuedAt:    n.issuedAt,
    }));

    const dunningCount = await (prisma.dunningNotice as any).count({ where: { status: "ISSUED" } });

    // ── 6. Top outstanding accounts ───────────────────────────────────────────
    // Group outstanding bills by accountId, then join customer
    const accountOutstandingMap: Record<string, { amount: number; count: number }> = {};
    for (const b of outstandingBills) {
      if (!accountOutstandingMap[b.accountId]) accountOutstandingMap[b.accountId] = { amount: 0, count: 0 };
      accountOutstandingMap[b.accountId].amount += b.totalAmount;
      accountOutstandingMap[b.accountId].count++;
    }
    const topAccountIds = Object.entries(accountOutstandingMap)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 15)
      .map(([id]) => id);

    const topAccounts = topAccountIds.length
      ? await (prisma.account as any).findMany({
          where: { accountId: { in: topAccountIds } },
          include: { customer: { select: { customerId: true, fullName: true } } },
        })
      : [];

    const topOutstanding = topAccountIds.map((id) => {
      const acct = topAccounts.find((a: any) => a.accountId === id);
      return {
        accountId:    id,
        customerId:   acct?.customer?.customerId ?? null,
        customerName: acct?.customer?.fullName ?? "Unknown",
        outstandingAmount: accountOutstandingMap[id].amount,
        billCount:    accountOutstandingMap[id].count,
      };
    });

    // ── 7. Deposits + budget plans ────────────────────────────────────────────
    const [depositAgg, budgetCount] = await Promise.all([
      (prisma.securityDeposit as any).aggregate({
        where: { status: "PAID" },
        _sum: { amount: true }, _count: true,
      }),
      (prisma.budgetBillingPlan as any).count({ where: { endDate: null } }),
    ]);

    // ── Response ──────────────────────────────────────────────────────────────
    return ok({
      // Totals
      totalBilled,
      totalBillCount,
      totalCollected,
      totalPending,
      collectionRate: parseFloat(collectionRate.toFixed(1)),

      // Payment breakdown
      payments: {
        collected: { amount: collectedAgg._sum?.amount ?? 0, count: collectedAgg._count ?? 0 },
        pending:   { amount: pendingPayAgg._sum?.amount ?? 0, count: pendingPayAgg._count ?? 0 },
        failed:    { amount: failedPayAgg._sum?.amount ?? 0,  count: failedPayAgg._count ?? 0 },
      },

      // Billing trend KPI
      billingTrend: {
        currentMonthBilled,
        currentMonthCount,
        prev1MonthBilled,
        prev3MonthAvg:  parseFloat(prev3MonthAvg.toFixed(2)),
        prev6MonthAvg:  parseFloat(prev6MonthAvg.toFixed(2)),
        prev12MonthAvg: parseFloat(prev12MonthAvg.toFixed(2)),
        monthlyTrend,
      },

      // AR Aging
      aging,

      // Dunning
      dunningCount,
      dunningRows,

      // Top outstanding accounts
      topOutstanding,

      // Deposits / budget
      deposits: { total: depositAgg._sum?.amount ?? 0, count: depositAgg._count ?? 0 },
      budgetPlanCount: budgetCount,
    });
  } catch (err) {
    return serverError(err);
  }
}
