import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

// ── Tunable constants ─────────────────────────────────────────────────────────
const NUM_CUSTOMERS = 2000;
const BATCH_SIZE    = 500;

// ── Master-data IDs (must already exist via `npx prisma db seed`) ─────────────
const AREAS    = ["AHM-WEST","AHM-EAST","GAN-NORTH","SURAT-N","VAD-CENTRAL"] as const;
const CYCLES   = ["BC-MONTHLY-1","BC-MONTHLY-2","BC-MONTHLY-3","BC-QTR-1"]   as const;
const ROUTES   = ["RT-AHM-W-01","RT-AHM-W-02","RT-AHM-E-01","RT-GAN-01"]    as const;
const CHANNELS = ["CH-UPI","CH-BBPS","CH-CARD","CH-NB","CH-CASH"]            as const;
const GATEWAYS = ["GW-RAZORPAY","GW-PAYTM"]                                  as const;
const MODES    = ["EMAIL","APP","SMS","PRINT"]                                as const;

// ── Utility type configs (10 slots → weighted distribution) ──────────────────
// Slot weight:  4 × GAS-DOM  |  2 × GAS-COM  |  1 × GAS-IND  |  2 × ELEC-DOM  |  1 × WATER-DOM
interface U {
  utility: string; seg: string; uom: string; ctype: string;
  fixC: string; varC: string; taxC: string;
  fix: number; lo: number; hi: number; rate: number; tax: number;
}
const UTYPES: U[] = [
  { utility:"GAS_PNG",    seg:"SEG-GAS-DOM",  uom:"SCM", ctype:"INDIVIDUAL", fixC:"CC-GD-FIX",  varC:"CC-GD-V1",  taxC:"CC-GD-GST",  fix:120, lo:8,   hi:40,   rate:32,  tax:0.05 },
  { utility:"GAS_PNG",    seg:"SEG-GAS-DOM",  uom:"SCM", ctype:"INDIVIDUAL", fixC:"CC-GD-FIX",  varC:"CC-GD-V2",  taxC:"CC-GD-GST",  fix:120, lo:8,   hi:40,   rate:35,  tax:0.05 },
  { utility:"GAS_PNG",    seg:"SEG-GAS-DOM",  uom:"SCM", ctype:"INDIVIDUAL", fixC:"CC-GD-FIX",  varC:"CC-GD-V1",  taxC:"CC-GD-GST",  fix:120, lo:8,   hi:40,   rate:32,  tax:0.05 },
  { utility:"GAS_PNG",    seg:"SEG-GAS-DOM",  uom:"SCM", ctype:"INDIVIDUAL", fixC:"CC-GD-FIX",  varC:"CC-GD-V3",  taxC:"CC-GD-GST",  fix:120, lo:8,   hi:40,   rate:42,  tax:0.05 },
  { utility:"GAS_PNG",    seg:"SEG-GAS-COM",  uom:"SCM", ctype:"CORPORATE",  fixC:"CC-GC-FIX",  varC:"CC-GC-VAR", taxC:"CC-GC-GST",  fix:350, lo:50,  hi:200,  rate:38,  tax:0.05 },
  { utility:"GAS_PNG",    seg:"SEG-GAS-COM",  uom:"SCM", ctype:"CORPORATE",  fixC:"CC-GC-FIX",  varC:"CC-GC-VAR", taxC:"CC-GC-GST",  fix:350, lo:50,  hi:200,  rate:38,  tax:0.05 },
  { utility:"GAS_PNG",    seg:"SEG-GAS-IND",  uom:"SCM", ctype:"CORPORATE",  fixC:"CC-GI-FIX",  varC:"CC-GI-VAR", taxC:"CC-GI-GST",  fix:800, lo:200, hi:1000, rate:45,  tax:0.05 },
  { utility:"ELECTRICITY",seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E1",  taxC:"CC-ED-DUTY", fix:45,  lo:50,  hi:400,  rate:4.5, tax:0.15 },
  { utility:"ELECTRICITY",seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E2",  taxC:"CC-ED-DUTY", fix:45,  lo:50,  hi:400,  rate:5.0, tax:0.15 },
  { utility:"WATER",      seg:"SEG-WATER-DOM",uom:"KL",  ctype:"INDIVIDUAL", fixC:"CC-WD-FIX",  varC:"CC-WD-W1",  taxC:"CC-WD-TAX",  fix:80,  lo:5,   hi:30,   rate:10,  tax:0.05 },
];

// ── Indian-name pools ─────────────────────────────────────────────────────────
const FNAMES = ["Ramesh","Priya","Suresh","Anita","Mahesh","Kavita","Dinesh","Sunita",
                "Rajesh","Geeta","Manish","Sonal","Vijay","Rekha","Anil","Meena",
                "Kishore","Jyoti","Deepak","Shilpa","Nilesh","Pooja","Bharat","Lata"];
const LNAMES = ["Shah","Patel","Mehta","Joshi","Desai","Kumar","Sharma","Singh",
                "Gupta","Agarwal","Modi","Parekh","Bhatt","Trivedi","Nair","Pillai",
                "Rao","Reddy","Iyer","Pillai","Verma","Tiwari","Mishra","Chaudhary"];

// ── Billing months (Jan-Feb billed; Mar validated-only) ───────────────────────
const MONTHS = [
  { rd: new Date("2026-01-05"), bd: new Date("2026-01-08"), dd: new Date("2026-01-28") },
  { rd: new Date("2026-02-05"), bd: new Date("2026-02-08"), dd: new Date("2026-02-28") },
  { rd: new Date("2026-03-05"), bd: new Date("2026-03-08"), dd: new Date("2026-03-28") },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function pid(prefix: string, n: number) {
  return `${prefix}${String(n).padStart(7, "0")}`;
}

// Deterministic pseudo-random: always same output for same seed
let _seed = 0;
function rng(lo: number, hi: number): number {
  _seed++;
  const x = Math.sin(_seed * 9301 + 49297) * 233280;
  const r = x - Math.floor(x); // [0, 1)
  return lo + r * (hi - lo);
}
function rngInt(lo: number, hi: number): number {
  return Math.floor(rng(lo, hi + 1 - 1e-10));
}
function r2(n: number) { return Math.round(n * 100) / 100; }

async function bulkInsert(label: string, model: string, rows: object[]) {
  if (!rows.length) { console.log(`  – ${label}: 0 rows`); return; }
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const res = await (prisma as any)[model].createMany({
      data: rows.slice(i, i + BATCH_SIZE),
      skipDuplicates: true,
    });
    inserted += res.count;
  }
  console.log(`  ✓ ${label}: ${inserted.toLocaleString()} new rows`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Pre-flight: ensure master data exists
  const [areaOk, segOk, cycleOk, routeOk, compOk] = await Promise.all([
    prisma.cgdArea.findUnique({ where: { areaId: "AHM-WEST" } }),
    prisma.consumerSegment.findUnique({ where: { segmentId: "SEG-GAS-DOM" } }),
    prisma.billCycle.findUnique({ where: { cycleId: "BC-MONTHLY-1" } }),
    prisma.route.findUnique({ where: { routeId: "RT-AHM-W-01" } }),
    prisma.chargeComponent.findUnique({ where: { componentId: "CC-GD-FIX" } }),
  ]);
  if (!areaOk || !segOk || !cycleOk || !routeOk || !compOk) {
    console.error("❌  Master data missing. Run:  npx prisma db seed  first.");
    process.exit(1);
  }

  console.log(`🌱  Generating ${NUM_CUSTOMERS.toLocaleString()} customers with readings, bills & payments…`);
  const t0 = Date.now();

  const customers:  object[] = [];
  const premises:   object[] = [];
  const accounts:   object[] = [];
  const conns:      object[] = [];
  const meters:     object[] = [];
  const installs:   object[] = [];
  const readings:   object[] = [];
  const bills:      object[] = [];
  const billLines:  object[] = [];
  const orders:     object[] = [];
  let   poIdx = 0;

  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const u      = UTYPES[i % UTYPES.length];
    const n      = i + 1;
    const area   = AREAS[i % AREAS.length];
    const cycle  = CYCLES[i % CYCLES.length];
    const route  = ROUTES[i % ROUTES.length];

    const custId = pid("BKCUST", n);
    const premId = pid("BKPREM", n);
    const acctId = pid("BKACCT", n);
    const connId = pid("BKCONN", n);
    const mtrId  = pid("BKMTR",  n);
    const instId = pid("BKINST", n);

    // Name
    const fn   = FNAMES[i % FNAMES.length];
    const ln   = LNAMES[Math.floor(i / FNAMES.length) % LNAMES.length];
    const name = u.ctype === "CORPORATE" ? `${ln} Industries Pvt Ltd` : `${fn} ${ln}`;

    // ── Customer ──────────────────────────────────────────────────────────────
    customers.push({
      customerId:   custId,
      fullName:     name,
      customerType: u.ctype === "CORPORATE" ? "CORPORATE" : "INDIVIDUAL",
      kycStatus:    "VERIFIED",
      mobile:       `+91${(9000000000 + n)}`,
      email:        `user${n}@enerza-demo.in`,
      status:       "ACTIVE",
      segmentId:    u.seg,
    });

    // ── Premise ───────────────────────────────────────────────────────────────
    const block = String.fromCharCode(65 + (i % 5)); // A-E
    premises.push({
      premiseId:    premId,
      addressLine1: `${(n % 500) + 1}, Block-${block}, ${area} Zone`,
      buildingType: u.ctype === "INDIVIDUAL" ? "RESIDENTIAL" : "COMMERCIAL",
      status:       "ACTIVE",
      areaId:       area,
    });

    // ── Account ───────────────────────────────────────────────────────────────
    accounts.push({
      accountId:       acctId,
      billDeliveryMode: MODES[i % MODES.length],
      status:          "ACTIVE",
      effectiveFrom:   new Date("2024-01-01"),
      customerId:      custId,
      premiseId:       premId,
      cycleId:         cycle,
    });

    // ── Service Connection ────────────────────────────────────────────────────
    conns.push({
      connectionId: connId,
      utilityType:  u.utility,
      startDate:    new Date("2024-01-01"),
      status:       "ACTIVE",
      accountId:    acctId,
      segmentId:    u.seg,
    });

    // ── Meter ─────────────────────────────────────────────────────────────────
    const uCode = u.utility === "GAS_PNG" ? "GAS" : u.utility === "ELECTRICITY" ? "ELC" : "WAT";
    meters.push({
      meterId:       mtrId,
      serialNo:      `BLK-${uCode}-${String(n).padStart(6, "0")}`,
      meterType:     u.utility === "ELECTRICITY" ? "Smart" : "Electronic",
      make:          u.utility === "ELECTRICITY" ? "Landis+Gyr" : "Honeywell",
      model:         u.utility === "ELECTRICITY" ? "E350" : "ELF-G4",
      uom:           u.uom,
      utilityType:   u.utility,
      calibrationDue: new Date("2028-01-01"),
      status:        "INSTALLED",
    });

    // ── Meter Installation ────────────────────────────────────────────────────
    installs.push({
      installId:    instId,
      installDate:  new Date("2024-01-15"),
      reason:       "NEW",
      meterId:      mtrId,
      connectionId: connId,
    });

    // ── Meter Readings (Jan, Feb, Mar 2026) ───────────────────────────────────
    let cumulative = 1000 + rngInt(0, 5000);
    for (let m = 0; m < 3; m++) {
      const cons = r2(rng(u.lo, u.hi));
      cumulative = r2(cumulative + cons);
      readings.push({
        readingId:    pid("BKRDG", i * 3 + m + 1),
        readingDate:  MONTHS[m].rd,
        readingValue: cumulative,
        consumption:  cons,
        readingType:  "ACTUAL",
        status:       m < 2 ? "BILLED" : "VALIDATED",
        meterId:      mtrId,
        connectionId: connId,
        routeId:      route,
      });
    }

    // ── Bills (Jan = PAID, Feb = PENDING; Mar not yet billed) ────────────────
    for (let m = 0; m < 2; m++) {
      const mo      = MONTHS[m];
      const cons    = r2(rng(u.lo, u.hi));
      const varAmt  = r2(cons * u.rate);
      const net     = r2(u.fix + varAmt);
      const tax     = r2(net * u.tax);
      const total   = r2(net + tax);
      const paid    = m === 0; // Jan always paid
      const billId  = pid("BKBIL", i * 2 + m + 1);

      bills.push({
        billId,
        billDate:    mo.bd,
        dueDate:     mo.dd,
        netAmount:   net,
        taxAmount:   tax,
        totalAmount: total,
        status:      paid ? "PAID" : "PENDING",
        accountId:   acctId,
        connectionId: connId,
        cycleId:     cycle,
      });

      // 3 bill lines per bill
      const lb = (i * 2 + m) * 3 + 1;
      billLines.push({ lineId: pid("BKLN", lb),     description: "Fixed Charge",    quantity: 1,    rate: u.fix,        amount: u.fix,   lineType: "FIXED",    billId, componentId: u.fixC });
      billLines.push({ lineId: pid("BKLN", lb + 1), description: "Variable Charge", quantity: cons, rate: u.rate,       amount: varAmt,  lineType: "VARIABLE", billId, componentId: u.varC });
      billLines.push({ lineId: pid("BKLN", lb + 2), description: "Tax",             quantity: 1,    rate: u.tax * 100,  amount: tax,     lineType: "TAX",      billId, componentId: u.taxC });

      // Payment order for Jan (paid) bills
      if (paid) {
        poIdx++;
        orders.push({
          orderId:       pid("BKPORD", poIdx),
          amount:        total,
          convenienceFee: 0,
          status:        "SUCCESS",
          initiatedAt:   new Date(mo.dd.getTime() - 5 * 86_400_000), // paid 5 days before due
          billId,
          accountId:     acctId,
          channelId:     CHANNELS[i % CHANNELS.length],
          gatewayId:     GATEWAYS[i % GATEWAYS.length],
        });
      }
    }
  }

  // ── Insert (dependency order: parent tables first) ────────────────────────
  await bulkInsert("Customers",          "customer",           customers);
  await bulkInsert("Premises",           "premise",            premises);
  await bulkInsert("Accounts",           "account",            accounts);
  await bulkInsert("Service connections","serviceConnection",  conns);
  await bulkInsert("Meters",             "meter",              meters);
  await bulkInsert("Meter installations","meterInstallation",  installs);
  await bulkInsert("Meter readings",     "meterReading",       readings);
  await bulkInsert("Bills",              "bill",               bills);
  await bulkInsert("Bill lines",         "billLine",           billLines);
  await bulkInsert("Payment orders",     "paymentOrder",       orders);

  const total = customers.length + premises.length + accounts.length + conns.length +
    meters.length + installs.length + readings.length + bills.length + billLines.length + orders.length;

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅  Bulk seed complete in ${elapsed}s`);
  console.log(`   ${NUM_CUSTOMERS.toLocaleString()} customers → ${total.toLocaleString()} records total`);
  console.log(`   ${orders.length.toLocaleString()} paid (Jan) + ${orders.length.toLocaleString()} pending (Feb) bills`);
  console.log("   Safe to re-run (skipDuplicates: true — no duplicates inserted).");
}

main()
  .catch((e) => { console.error("❌  Bulk seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
