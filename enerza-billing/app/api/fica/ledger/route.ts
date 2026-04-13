import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    if (!accountId) return badRequest("accountId is required");

    // ── Fetch all source documents in parallel ──────────────────────────────────
    const [bills, payments, dunningNotices, deposits, creditNotes] = await Promise.all([
      (prisma.bill as any).findMany({
        where: { accountId },
        select: { billId: true, billDate: true, dueDate: true, totalAmount: true, status: true },
        orderBy: { billDate: "desc" },
      }),
      (prisma.paymentOrder as any).findMany({
        where: { accountId, status: "SUCCESS" },
        select: { orderId: true, amount: true, initiatedAt: true, billId: true },
        orderBy: { initiatedAt: "desc" },
      }),
      (prisma.dunningNotice as any).findMany({
        where: { accountId },
        include: {
          level: { select: { levelName: true, penaltyFee: true, daysOverdue: true } },
          bill:  { select: { dueDate: true } },
        },
        orderBy: { issuedAt: "desc" },
      }),
      (prisma.securityDeposit as any).findMany({
        where: { accountId, status: "PAID" },
        select: { depositId: true, amount: true, paymentDate: true },
        orderBy: { paymentDate: "desc" },
      }),
      (prisma.creditNote as any).findMany({
        where: { accountId, status: "APPLIED" },
        select: { cnId: true, amount: true, reason: true, issuedOn: true },
        orderBy: { issuedOn: "desc" },
      }),
    ]);

    // ── Build unified ledger items ──────────────────────────────────────────────
    const items: any[] = [];

    for (const b of bills) {
      items.push({
        docType: "INVOICE",
        docNo: b.billId,
        postingDate: b.billDate,
        dueDate: b.dueDate,
        debit: b.totalAmount,
        credit: 0,
        status: b.status,
        dunningLevel: null,
      });
    }

    for (const p of payments) {
      items.push({
        docType: "PAYMENT",
        docNo: p.orderId,
        postingDate: p.initiatedAt,
        dueDate: null,
        debit: 0,
        credit: p.amount,
        status: "CLEARED",
        dunningLevel: null,
        linkedBillId: p.billId,
      });
    }

    for (const d of dunningNotices) {
      const fee = d.level?.penaltyFee ?? 0;
      if (fee > 0) {
        items.push({
          docType: "DUNNING_FEE",
          docNo: d.noticeId,
          postingDate: d.issuedAt,
          dueDate: d.bill?.dueDate ?? null,
          debit: fee,
          credit: 0,
          status: d.status,
          dunningLevel: d.level?.levelName ?? null,
        });
      }
    }

    for (const dep of deposits) {
      items.push({
        docType: "DEPOSIT",
        docNo: dep.depositId,
        postingDate: dep.paymentDate ?? new Date(),
        dueDate: null,
        debit: 0,
        credit: dep.amount,
        status: "CLEARED",
        dunningLevel: null,
      });
    }

    for (const cn of creditNotes) {
      items.push({
        docType: "CREDIT_NOTE",
        docNo: cn.cnId,
        postingDate: cn.issuedOn,
        dueDate: null,
        debit: 0,
        credit: cn.amount,
        status: "APPLIED",
        dunningLevel: null,
        reason: cn.reason,
      });
    }

    // ── Sort by postingDate descending ─────────────────────────────────────────
    items.sort((a, b) => new Date(b.postingDate).getTime() - new Date(a.postingDate).getTime());

    // ── Compute running balance (total debit - total credit) ───────────────────
    const totalDebit  = items.reduce((s, i) => s + i.debit,  0);
    const totalCredit = items.reduce((s, i) => s + i.credit, 0);
    const balance = totalDebit - totalCredit;

    // ── Paginate ────────────────────────────────────────────────────────────────
    const total = items.length;
    const skip = (page - 1) * limit;
    const paged = items.slice(skip, skip + limit);

    return ok({ accountId, balance, totalDebit, totalCredit, items: paged, total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}
