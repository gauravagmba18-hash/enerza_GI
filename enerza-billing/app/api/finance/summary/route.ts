import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth();
    const startOfMonth = new Date(currentY, currentM, 1);
    const startOfNextMonth = new Date(currentY, currentM + 1, 1);

    // ── Fetch BillLines for current month with bill + connection + segment ───────
    const lines = await (prisma.billLine as any).findMany({
      where: {
        bill: {
          billDate: { gte: startOfMonth, lt: startOfNextMonth },
        },
      },
      include: {
        component: { select: { lineType: true } },
        bill: {
          include: {
            connection: {
              include: {
                segment: { select: { segmentName: true } },
              },
            },
          },
        },
      },
    });

    // ── Group by lineType × segmentName ─────────────────────────────────────────
    const matrix: Record<string, Record<string, number>> = {};
    const lineTypes = new Set<string>();
    const segments  = new Set<string>();

    for (const ln of lines) {
      const lt  = ln.component?.lineType ?? ln.lineType ?? "OTHER";
      const seg = ln.bill?.connection?.segment?.segmentName ?? "UNKNOWN";
      lineTypes.add(lt);
      segments.add(seg);
      if (!matrix[lt]) matrix[lt] = {};
      matrix[lt][seg] = (matrix[lt][seg] ?? 0) + ln.amount;
    }

    // ── Total revenue by lineType ────────────────────────────────────────────────
    const byLineType = Array.from(lineTypes).map((lt) => ({
      lineType: lt,
      total: Object.values(matrix[lt] ?? {}).reduce((s, v) => s + v, 0),
      bySegment: matrix[lt] ?? {},
    }));

    // ── Period totals ────────────────────────────────────────────────────────────
    const [billAgg, payAgg] = await Promise.all([
      (prisma.bill as any).aggregate({
        where: { billDate: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { totalAmount: true }, _count: true,
      }),
      (prisma.paymentOrder as any).aggregate({
        where: { status: "SUCCESS", initiatedAt: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { amount: true }, _count: true,
      }),
    ]);

    const periodKey = `${currentY}-${String(currentM + 1).padStart(2, "0")}`;

    return ok({
      periodKey,
      totalBilled:    billAgg._sum?.totalAmount ?? 0,
      totalCollected: payAgg._sum?.amount ?? 0,
      billCount:      billAgg._count ?? 0,
      paymentCount:   payAgg._count ?? 0,
      segments: Array.from(segments),
      lineTypes: Array.from(lineTypes),
      matrix,
      byLineType,
    });
  } catch (err) {
    return serverError(err);
  }
}
