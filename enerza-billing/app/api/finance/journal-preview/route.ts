import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/api-response";

// ── GL Account mapping ─────────────────────────────────────────────────────────
const GL_MAP: Record<string, { code: string; name: string; costCentre: string; taxCode: string }> = {
  ENERGY:                 { code: "400100", name: "LT Domestic / Commercial Revenue", costCentre: "DIST-LT",   taxCode: "V0" },
  ENERGY_HT:              { code: "400300", name: "HT Industrial Revenue",             costCentre: "DIST-HT",   taxCode: "V0" },
  FIXED:                  { code: "400400", name: "Fixed / Meter Rent Revenue",         costCentre: "DIST-ALL",  taxCode: "V1" },
  DEMAND:                 { code: "400500", name: "Maximum Demand Charges",             costCentre: "DIST-HT",   taxCode: "V0" },
  MINIMUM_CHARGE:         { code: "400400", name: "Fixed / Meter Rent Revenue",         costCentre: "DIST-ALL",  taxCode: "V0" },
  FPPC:                   { code: "400700", name: "FPPC Surcharge",                     costCentre: "DIST-ALL",  taxCode: "V0" },
  INTEREST:               { code: "400800", name: "Late Payment Interest",              costCentre: "DIST-ALL",  taxCode: "V0" },
  TAX_ELECTRICITY_DUTY:   { code: "210200", name: "Electricity Duty Payable",           costCentre: "TAX-DEPT",  taxCode: "V2" },
  TAX_GST:                { code: "210100", name: "GST Output Tax Payable",             costCentre: "TAX-DEPT",  taxCode: "V1" },
};

const AR_GL = { code: "110100", name: "Accounts Receivable — Trade", costCentre: "DIST-ALL", taxCode: "V0" };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const historyMode = searchParams.get("history") === "1";

    if (historyMode) {
      // Return mock posting history (last 12 periods)
      const history = [];
      const now = new Date();
      for (let i = 1; i <= 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const pk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        history.push({
          periodKey: pk,
          erpRef: `ERP-JE-${pk.replace("-", "")}`,
          status: "POSTED",
          totalDebit: Math.floor(Math.random() * 500000 + 100000),
          postedAt: new Date(d.getFullYear(), d.getMonth() + 1, 5).toISOString(),
        });
      }
      return ok({ history });
    }

    const periodKey = searchParams.get("periodKey") ?? "";
    if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) {
      const now = new Date();
      const defaultKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return ok({ redirect: defaultKey });
    }

    const [year, month] = periodKey.split("-").map(Number);
    const startOfPeriod = new Date(year, month - 1, 1);
    const endOfPeriod   = new Date(year, month, 1);

    // ── Aggregate BillLine amounts by lineType ───────────────────────────────────
    const billLines = await (prisma.billLine as any).findMany({
      where: {
        bill: { billDate: { gte: startOfPeriod, lt: endOfPeriod } },
      },
      select: { lineType: true, amount: true },
    });

    const lineAgg: Record<string, number> = {};
    for (const ln of billLines) {
      const lt = ln.lineType ?? "OTHER";
      lineAgg[lt] = (lineAgg[lt] ?? 0) + ln.amount;
    }

    const totalRevenue = Object.values(lineAgg).reduce((s, v) => s + v, 0);

    // ── Build journal lines ──────────────────────────────────────────────────────
    const journalLines: any[] = [];

    // AR debit (total)
    if (totalRevenue > 0) {
      journalLines.push({
        line: 1,
        glCode: AR_GL.code,
        glName: AR_GL.name,
        costCentre: AR_GL.costCentre,
        taxCode: AR_GL.taxCode,
        debit: parseFloat(totalRevenue.toFixed(2)),
        credit: 0,
        reference: `BILL-${periodKey}`,
      });
    }

    // Revenue credits
    let lineNum = 2;
    for (const [lt, amount] of Object.entries(lineAgg)) {
      const gl = GL_MAP[lt] ?? { code: "499999", name: `Other Revenue (${lt})`, costCentre: "DIST-ALL", taxCode: "V0" };
      journalLines.push({
        line: lineNum++,
        glCode: gl.code,
        glName: gl.name,
        costCentre: gl.costCentre,
        taxCode: gl.taxCode,
        debit: 0,
        credit: parseFloat(amount.toFixed(2)),
        reference: `BILL-${lt}-${periodKey}`,
      });
    }

    const totalDebit  = journalLines.reduce((s, l) => s + l.debit,  0);
    const totalCredit = journalLines.reduce((s, l) => s + l.credit, 0);

    return ok({
      periodKey,
      journalLines,
      totals: {
        debit:   parseFloat(totalDebit.toFixed(2)),
        credit:  parseFloat(totalCredit.toFixed(2)),
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
      status: "DRAFT",
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodKey = searchParams.get("periodKey") ?? "";

    if (!periodKey) return badRequest("periodKey is required");

    // Mock ERP posting
    const erpRef = `ERP-JE-${periodKey.replace("-", "")}-${Date.now().toString().slice(-4)}`;
    console.log(`[ERP] Journal posted for period ${periodKey}: ${erpRef}`);

    return ok({
      periodKey,
      erpRef,
      status: "POSTED",
      postedAt: new Date().toISOString(),
      message: `Journal entry ${erpRef} posted to ERP successfully`,
    });
  } catch (err) {
    return serverError(err);
  }
}
