import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function POST(_req: NextRequest) {
  try {
    const now = new Date();
    const nowMs = now.getTime();

    // ── 1. Load dunning levels, ordered by daysOverdue asc ─────────────────────
    const levels = await (prisma.dunningLevel as any).findMany({
      orderBy: { daysOverdue: "asc" },
    });

    if (!levels.length) {
      return ok({ processed: 0, issued: 0, skipped: 0, notices: [], message: "No dunning levels configured" });
    }

    // ── 2. Fetch overdue/pending bills with dueDate < now ───────────────────────
    const overdueBills = await (prisma.bill as any).findMany({
      where: {
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { lt: now },
      },
      select: {
        billId: true,
        accountId: true,
        dueDate: true,
        totalAmount: true,
        status: true,
      },
    });

    // ── 3. For each overdue bill, get accounts with PTP suspension ───────────────
    const suspendedAccountIds = new Set<string>();
    const activePtps = await (prisma.dunningNotice as any).findMany({
      where: { suspendedUntil: { gt: now } },
      select: { accountId: true },
    });
    for (const p of activePtps) suspendedAccountIds.add(p.accountId);

    // ── 4. Load existing notices to avoid duplicate issuance ───────────────────
    const existingNotices = await (prisma.dunningNotice as any).findMany({
      where: {
        billId: { in: overdueBills.map((b: any) => b.billId) },
      },
      select: { billId: true, levelId: true },
    });
    const existingKey = new Set<string>(
      existingNotices.map((n: any) => `${n.billId}::${n.levelId}`)
    );

    let processed = 0;
    let issued = 0;
    let skipped = 0;
    const notices: any[] = [];

    for (const bill of overdueBills) {
      processed++;

      // Skip if account has active PTP suspension
      if (suspendedAccountIds.has(bill.accountId)) {
        skipped++;
        continue;
      }

      const daysOverdue = Math.max(0, Math.floor((nowMs - new Date(bill.dueDate).getTime()) / 86_400_000));

      // Find the highest matching level (level.daysOverdue <= daysOverdue)
      let matchedLevel: any = null;
      for (const level of levels) {
        if (level.daysOverdue <= daysOverdue) {
          matchedLevel = level;
        }
      }

      if (!matchedLevel) {
        skipped++;
        continue;
      }

      const key = `${bill.billId}::${matchedLevel.levelId}`;
      if (existingKey.has(key)) {
        skipped++;
        continue;
      }

      // Create notice
      const notice = await (prisma.dunningNotice as any).create({
        data: {
          accountId: bill.accountId,
          billId: bill.billId,
          levelId: matchedLevel.levelId,
          issuedAt: now,
          status: "ISSUED",
        },
      });

      // Update bill status to OVERDUE if not already
      if (bill.status !== "OVERDUE") {
        await (prisma.bill as any).update({
          where: { billId: bill.billId },
          data: { status: "OVERDUE" },
        });
      }

      existingKey.add(key);
      issued++;
      notices.push({
        noticeId: notice.noticeId,
        accountId: bill.accountId,
        billId: bill.billId,
        levelName: matchedLevel.levelName,
        daysOverdue,
        billAmount: bill.totalAmount,
      });
    }

    return ok({ processed, issued, skipped, notices });
  } catch (err) {
    return serverError(err);
  }
}
