import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

// ── Tunable constants ─────────────────────────────────────────────────────────
const NUM_CUSTOMERS = 20_000;
const BATCH_SIZE    = 1_000;

// ── Master-data IDs (must already exist via `npx prisma db seed`) ─────────────
const AREAS    = ["AHM-WEST","AHM-EAST","GAN-NORTH","SURAT-N","VAD-CENTRAL"] as const;
const CYCLES   = ["BC-MONTHLY-1","BC-MONTHLY-2","BC-MONTHLY-3","BC-QTR-1"]   as const;
const ROUTES   = ["RT-AHM-W-01","RT-AHM-W-02","RT-AHM-E-01","RT-GAN-01"]    as const;
const CHANNELS = ["CH-UPI","CH-BBPS","CH-CARD","CH-NB","CH-CASH"]            as const;
const GATEWAYS = ["GW-RAZORPAY","GW-PAYTM"]                                  as const;
const MODES    = ["EMAIL","APP","SMS","PRINT"]                                as const;

// ── Electricity utility configs ───────────────────────────────────────────────
// 10 slots → 7 DOM (70%) | 2 COM (20%) | 1 IND (10%)
interface U {
  utility: string; seg: string; uom: string; ctype: string;
  fixC: string; varC: string; taxC: string;
  fix: number; lo: number; hi: number; rate: number; tax: number;
}
const UTYPES: U[] = [
  // ── 7 × Domestic (70 %) ──────────────────────────────────────────────────
  { utility:"ELECTRICITY", seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E1",  taxC:"CC-ED-DUTY", fix:45,  lo:50,  hi:150,  rate:3.5, tax:0.15 },
  { utility:"ELECTRICITY", seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E2",  taxC:"CC-ED-DUTY", fix:45,  lo:100, hi:300,  rate:5.0, tax:0.15 },
  { utility:"ELECTRICITY", seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E3",  taxC:"CC-ED-DUTY", fix:45,  lo:200, hi:400,  rate:7.5, tax:0.15 },
  { utility:"ELECTRICITY", seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E1",  taxC:"CC-ED-DUTY", fix:45,  lo:50,  hi:120,  rate:3.5, tax:0.15 },
  { utility:"ELECTRICITY", seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E2",  taxC:"CC-ED-DUTY", fix:45,  lo:80,  hi:250,  rate:5.0, tax:0.15 },
  { utility:"ELECTRICITY", seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E3",  taxC:"CC-ED-DUTY", fix:45,  lo:250, hi:400,  rate:7.5, tax:0.15 },
  { utility:"ELECTRICITY", seg:"SEG-ELEC-DOM", uom:"kWh", ctype:"INDIVIDUAL", fixC:"CC-ED-RENT", varC:"CC-ED-E1",  taxC:"CC-ED-DUTY", fix:45,  lo:50,  hi:100,  rate:3.5, tax:0.15 },
  // ── 2 × Commercial (20 %) ────────────────────────────────────────────────
  { utility:"ELECTRICITY", seg:"SEG-ELEC-COM", uom:"kWh", ctype:"CORPORATE",  fixC:"CC-EC-RENT", varC:"CC-EC-E1",  taxC:"CC-EC-DUTY", fix:150, lo:300, hi:2000, rate:6.5, tax:0.15 },
  { utility:"ELECTRICITY", seg:"SEG-ELEC-COM", uom:"kWh", ctype:"CORPORATE",  fixC:"CC-EC-RENT", varC:"CC-EC-E2",  taxC:"CC-EC-DUTY", fix:150, lo:500, hi:5000, rate:7.0, tax:0.15 },
  // ── 1 × Industrial (10 %) ────────────────────────────────────────────────
  { utility:"ELECTRICITY", seg:"SEG-ELEC-IND", uom:"kWh", ctype:"CORPORATE",  fixC:"CC-EI-RENT", varC:"CC-EI-E1",  taxC:"CC-EI-DUTY", fix:500, lo:2000,hi:20000,rate:8.5, tax:0.15 },
];

// ── Indian-name pools ─────────────────────────────────────────────────────────
const FNAMES = ["Ramesh","Priya","Suresh","Anita","Mahesh","Kavita","Dinesh","Sunita",
                "Rajesh","Geeta","Manish","Sonal","Vijay","Rekha","Anil","Meena",
                "Kishore","Jyoti","Deepak","Shilpa","Nilesh","Pooja","Bharat","Lata"];
const LNAMES = ["Shah","Patel","Mehta","Joshi","Desai","Kumar","Sharma","Singh",
                "Gupta","Agarwal","Modi","Parekh","Bhatt","Trivedi","Nair","Pillai",
                "Rao","Reddy","Iyer","Verma","Tiwari","Mishra","Chaudhary","Srivastava"];

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

let _seed = 0;
function rng(lo: number, hi: number): number {
  _seed++;
  const x = Math.sin(_seed * 9301 + 49297) * 233280;
  const r = x - Math.floor(x); // deterministic [0,1)
  return lo + r * (hi - lo);
}
function rngInt(lo: number, hi: number) { return Math.floor(rng(lo, hi + 1 - 1e-10)); }
function r2(n: number)                  { return Math.round(n * 100) / 100; }

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

// ── Setup: upsert electricity commercial & industrial master data ─────────────
// seed.ts only creates SEG-ELEC-DOM + RP-ELEC-DOM-01.
// This step adds the commercial and industrial counterparts idempotently.
async function setupMasterData() {
  console.log("  Setting up electricity master data…");

  // Segments
  await prisma.consumerSegment.upsert({
    where:  { segmentId: "SEG-ELEC-COM" },
    update: {},
    create: { segmentId: "SEG-ELEC-COM", segmentName: "Commercial Electricity", utilityType: "ELECTRICITY", description: "Commercial electricity consumers" },
  });
  await prisma.consumerSegment.upsert({
    where:  { segmentId: "SEG-ELEC-IND" },
    update: {},
    create: { segmentId: "SEG-ELEC-IND", segmentName: "Industrial Electricity", utilityType: "ELECTRICITY", description: "Industrial & HT electricity consumers" },
  });

  // Rate plans
  await prisma.ratePlan.upsert({
    where:  { ratePlanId: "RP-ELEC-COM-01" },
    update: {},
    create: { ratePlanId: "RP-ELEC-COM-01", planName: "Commercial Electricity 2024", utilityType: "ELECTRICITY", segmentId: "SEG-ELEC-COM", billingFreq: "MONTHLY", effectiveFrom: new Date("2024-04-01"), status: "ACTIVE" },
  });
  await prisma.ratePlan.upsert({
    where:  { ratePlanId: "RP-ELEC-IND-01" },
    update: {},
    create: { ratePlanId: "RP-ELEC-IND-01", planName: "Industrial Electricity 2024", utilityType: "ELECTRICITY", segmentId: "SEG-ELEC-IND", billingFreq: "MONTHLY", effectiveFrom: new Date("2024-04-01"), status: "ACTIVE" },
  });

  // Commercial charge components
  const comComponents = [
    { componentId: "CC-EC-RENT", componentName: "Meter Rent",             componentType: "FIXED",    rate: 150.0, uom: null,   slabFrom: null, slabTo: null,  ratePlanId: "RP-ELEC-COM-01" },
    { componentId: "CC-EC-E1",   componentName: "Energy – Slab 1 (≤500)", componentType: "VARIABLE", rate: 6.5,   uom: "kWh",  slabFrom: 0,    slabTo: 500,   ratePlanId: "RP-ELEC-COM-01" },
    { componentId: "CC-EC-E2",   componentName: "Energy – Slab 2 (>500)", componentType: "VARIABLE", rate: 7.0,   uom: "kWh",  slabFrom: 500,  slabTo: null,  ratePlanId: "RP-ELEC-COM-01" },
    { componentId: "CC-EC-DUTY", componentName: "Electricity Duty @ 15%", componentType: "TAX",      rate: 15.0,  uom: null,   slabFrom: null, slabTo: null,  ratePlanId: "RP-ELEC-COM-01" },
  ];
  for (const c of comComponents) {
    await prisma.chargeComponent.upsert({ where: { componentId: c.componentId }, update: {}, create: c });
  }

  // Industrial charge components
  const indComponents = [
    { componentId: "CC-EI-RENT", componentName: "Demand/Meter Rent",      componentType: "FIXED",    rate: 500.0, uom: null,   slabFrom: null, slabTo: null,  ratePlanId: "RP-ELEC-IND-01" },
    { componentId: "CC-EI-E1",   componentName: "Energy (HT flat rate)",   componentType: "VARIABLE", rate: 8.5,   uom: "kWh",  slabFrom: 0,    slabTo: null,  ratePlanId: "RP-ELEC-IND-01" },
    { componentId: "CC-EI-DUTY", componentName: "Electricity Duty @ 15%", componentType: "TAX",      rate: 15.0,  uom: null,   slabFrom: null, slabTo: null,  ratePlanId: "RP-ELEC-IND-01" },
  ];
  for (const c of indComponents) {
    await prisma.chargeComponent.upsert({ where: { componentId: c.componentId }, update: {}, create: c });
  }

  console.log("  ✓ SEG-ELEC-COM, SEG-ELEC-IND, RP-ELEC-COM-01, RP-ELEC-IND-01 + 7 charge components");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Pre-flight: ensure seed.ts master data exists
  const [areaOk, segOk, cycleOk, routeOk, compOk] = await Promise.all([
    prisma.cgdArea.findUnique({ where: { areaId: "AHM-WEST" } }),
    prisma.consumerSegment.findUnique({ where: { segmentId: "SEG-ELEC-DOM" } }),
    prisma.billCycle.findUnique({ where: { cycleId: "BC-MONTHLY-1" } }),
    prisma.route.findUnique({ where: { routeId: "RT-AHM-W-01" } }),
    prisma.chargeComponent.findUnique({ where: { componentId: "CC-ED-RENT" } }),
  ]);
  if (!areaOk || !segOk || !cycleOk || !routeOk || !compOk) {
    console.error("❌  Master data missing. Run:  npx prisma db seed  first.");
    process.exit(1);
  }

  console.log(`🌱  Bulk seeding ${NUM_CUSTOMERS.toLocaleString()} electricity customers…`);
  console.log("    Distribution: 70% Domestic | 20% Commercial | 10% Industrial\n");

  await setupMasterData();
  console.log();

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
    const u     = UTYPES[i % UTYPES.length];
    const n     = i + 1;
    const area  = AREAS[i % AREAS.length];
    const cycle = CYCLES[i % CYCLES.length];
    const route = ROUTES[i % ROUTES.length];

    const custId = pid("BKCUST", n);
    const premId = pid("BKPREM", n);
    const acctId = pid("BKACCT", n);
    const connId = pid("BKCONN", n);
    const mtrId  = pid("BKMTR",  n);
    const instId = pid("BKINST", n);

    const fn   = FNAMES[i % FNAMES.length];
    const ln   = LNAMES[Math.floor(i / FNAMES.length) % LNAMES.length];
    const name = u.ctype === "CORPORATE"
      ? `${ln} ${["Industries","Power","Corp","Energy","Electricals"][i % 5]} Pvt Ltd`
      : `${fn} ${ln}`;

    // ── Customer ──────────────────────────────────────────────────────────────
    customers.push({
      customerId:   custId,
      fullName:     name,
      customerType: u.ctype === "CORPORATE" ? "CORPORATE" : "INDIVIDUAL",
      kycStatus:    "VERIFIED",
      mobile:       `+91${9000000000 + n}`,
      email:        `user${n}@enerza-demo.in`,
      status:       "ACTIVE",
      segmentId:    u.seg,
    });

    // ── Premise ───────────────────────────────────────────────────────────────
    const block = String.fromCharCode(65 + (i % 5)); // A–E
    premises.push({
      premiseId:    premId,
      addressLine1: `${(n % 500) + 1}, Block-${block}, ${area} Zone`,
      buildingType: u.ctype === "INDIVIDUAL" ? "RESIDENTIAL" : "COMMERCIAL",
      status:       "ACTIVE",
      areaId:       area,
    });

    // ── Account ───────────────────────────────────────────────────────────────
    accounts.push({
      accountId:        acctId,
      billDeliveryMode: MODES[i % MODES.length],
      status:           "ACTIVE",
      effectiveFrom:    new Date("2024-01-01"),
      customerId:       custId,
      premiseId:        premId,
      cycleId:          cycle,
    });

    // ── Service Connection ────────────────────────────────────────────────────
    conns.push({
      connectionId: connId,
      utilityType:  "ELECTRICITY",
      startDate:    new Date("2024-01-01"),
      status:       "ACTIVE",
      accountId:    acctId,
      segmentId:    u.seg,
    });

    // ── Meter ─────────────────────────────────────────────────────────────────
    meters.push({
      meterId:        mtrId,
      serialNo:       `BLK-ELC-${String(n).padStart(6, "0")}`,
      meterType:      u.seg === "SEG-ELEC-IND" ? "CT-Operated" : "Smart",
      make:           "Landis+Gyr",
      model:          u.seg === "SEG-ELEC-IND" ? "ZMD" : "E350",
      uom:            "kWh",
      utilityType:    "ELECTRICITY",
      calibrationDue: new Date("2028-01-01"),
      status:         "INSTALLED",
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
    let cumulative = 1000 + rngInt(0, 50000);
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

    // ── Bills (Jan = PAID, Feb = PENDING) ─────────────────────────────────────
    for (let m = 0; m < 2; m++) {
      const mo     = MONTHS[m];
      const cons   = r2(rng(u.lo, u.hi));
      const varAmt = r2(cons * u.rate);
      const net    = r2(u.fix + varAmt);
      const tax    = r2(net * u.tax);
      const total  = r2(net + tax);
      const paid   = m === 0;
      const billId = pid("BKBIL", i * 2 + m + 1);

      bills.push({
        billId,
        billDate:     mo.bd,
        dueDate:      mo.dd,
        netAmount:    net,
        taxAmount:    tax,
        totalAmount:  total,
        status:       paid ? "PAID" : "PENDING",
        accountId:    acctId,
        connectionId: connId,
        cycleId:      cycle,
      });

      // 3 bill lines per bill: fixed + variable + tax
      const lb = (i * 2 + m) * 3 + 1;
      billLines.push({ lineId: pid("BKLN", lb),     description: "Fixed/Meter Charge",  quantity: 1,    rate: u.fix,       amount: u.fix,   lineType: "FIXED",    billId, componentId: u.fixC });
      billLines.push({ lineId: pid("BKLN", lb + 1), description: "Energy Charge",        quantity: cons, rate: u.rate,      amount: varAmt,  lineType: "VARIABLE", billId, componentId: u.varC });
      billLines.push({ lineId: pid("BKLN", lb + 2), description: "Electricity Duty 15%", quantity: 1,    rate: u.tax * 100, amount: tax,     lineType: "TAX",      billId, componentId: u.taxC });

      // Payment order for Jan (paid) bills
      if (paid) {
        poIdx++;
        orders.push({
          orderId:        pid("BKPORD", poIdx),
          amount:         total,
          convenienceFee: 0,
          status:         "SUCCESS",
          initiatedAt:    new Date(mo.dd.getTime() - 5 * 86_400_000),
          billId,
          accountId:      acctId,
          channelId:      CHANNELS[i % CHANNELS.length],
          gatewayId:      GATEWAYS[i % GATEWAYS.length],
        });
      }
    }
  }

  // ── Insert in dependency order ─────────────────────────────────────────────
  const t0 = Date.now();
  await bulkInsert("Customers",           "customer",          customers);
  await bulkInsert("Premises",            "premise",           premises);
  await bulkInsert("Accounts",            "account",           accounts);
  await bulkInsert("Service connections", "serviceConnection", conns);
  await bulkInsert("Meters",              "meter",             meters);
  await bulkInsert("Meter installations", "meterInstallation", installs);
  await bulkInsert("Meter readings",      "meterReading",      readings);
  await bulkInsert("Bills",               "bill",              bills);
  await bulkInsert("Bill lines",          "billLine",          billLines);
  await bulkInsert("Payment orders",      "paymentOrder",      orders);

  const total = customers.length + premises.length + accounts.length + conns.length +
    meters.length + installs.length + readings.length + bills.length + billLines.length + orders.length;
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Distribution summary
  const dom = Math.round(NUM_CUSTOMERS * 0.7);
  const com = Math.round(NUM_CUSTOMERS * 0.2);
  const ind = Math.round(NUM_CUSTOMERS * 0.1);

  console.log(`\n✅  Bulk seed complete in ${elapsed}s`);
  console.log(`   ${NUM_CUSTOMERS.toLocaleString()} electricity customers → ${total.toLocaleString()} total records`);
  console.log(`   Domestic: ~${dom.toLocaleString()} | Commercial: ~${com.toLocaleString()} | Industrial: ~${ind.toLocaleString()}`);
  console.log(`   ${orders.length.toLocaleString()} Jan bills PAID | ${(bills.length - orders.length).toLocaleString()} Feb bills PENDING`);
  console.log("   Safe to re-run (skipDuplicates: true).");
}

main()
  .catch((e) => { console.error("❌  Bulk seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
