/**
 * generate-routes.js
 * Generates CRUD + export + import route files for each Prisma model.
 * Run once from project root: node scripts/generate-routes.js
 */
const fs = require("fs");
const path = require("path");

// Map: routeSegment -> { model: PrismaModelName, idField: string, searchFields: string[] }
const ENTITIES = [
  // Domain 1: Customer & Service
  { route: "customers",           model: "customer",           id: "customerId",     search: ["fullName","mobile","email"] },
  { route: "consumer-segments",   model: "consumerSegment",    id: "segmentId",      search: ["segmentName","utilityType"] },
  { route: "premises",            model: "premise",            id: "premiseId",      search: ["addressLine1","city"] },
  { route: "accounts",            model: "account",            id: "accountId",      search: ["billDeliveryMode","status"] },
  { route: "service-connections", model: "serviceConnection",  id: "connectionId",   search: ["utilityType","status"] },
  { route: "gas-conn-details",    model: "gasConnDetail",      id: "connectionId",   search: ["serviceType"] },
  { route: "elec-conn-details",   model: "elecConnDetail",     id: "connectionId",   search: ["phaseType","tariffCategory"] },
  { route: "water-conn-details",  model: "waterConnDetail",    id: "connectionId",   search: ["meterType"] },
  { route: "pressure-bands",      model: "pressureBand",       id: "bandId",         search: ["bandName","usageClass"] },
  // Domain 2: Tariff & Billing
  { route: "rate-plans",          model: "ratePlan",           id: "ratePlanId",     search: ["planName","utilityType"] },
  { route: "charge-components",   model: "chargeComponent",    id: "componentId",    search: ["componentName","componentType"] },
  { route: "tax-masters",         model: "taxMaster",          id: "taxId",          search: ["taxName","jurisdiction"] },
  { route: "bill-cycles",         model: "billCycle",          id: "cycleId",        search: ["cycleName","status"] },
  { route: "bills",               model: "bill",               id: "billId",         search: ["status"] },
  { route: "bill-lines",          model: "billLine",           id: "lineId",         search: ["description","lineType"] },
  // Domain 3: Payments & Reconciliation
  { route: "payment-channels",    model: "paymentChannel",     id: "channelId",      search: ["channelName","channelType"] },
  { route: "payment-gateways",    model: "paymentGateway",     id: "gatewayId",      search: ["provider","merchantId"] },
  { route: "payment-orders",      model: "paymentOrder",       id: "orderId",        search: ["status"] },
  { route: "gateway-txns",        model: "gatewayTxn",         id: "txnId",          search: ["gatewayStatus"] },
  { route: "settlements",         model: "settlement",         id: "settlementId",   search: [] },
  { route: "refunds",             model: "refund",             id: "refundId",       search: ["status"] },
  { route: "suspense-records",    model: "suspenseRecord",     id: "suspenseId",     search: ["resolutionStatus"] },
  // Domain 4: Geography, Metering & CNG
  { route: "cgd-areas",           model: "cgdArea",            id: "areaId",         search: ["areaName","city","district"] },
  { route: "routes",              model: "route",              id: "routeId",        search: ["routeName","cycleGroup"] },
  { route: "meters",              model: "meter",              id: "meterId",        search: ["serialNo","meterType","make"] },
  { route: "meter-installations", model: "meterInstallation",  id: "installId",      search: ["sealNo","reason"] },
  { route: "meter-readings",      model: "meterReading",       id: "readingId",      search: ["readingType","status"] },
  { route: "cng-stations",        model: "cngStation",         id: "stationId",      search: ["stationName","city"] },
  { route: "vehicle-categories",  model: "vehicleCategory",    id: "categoryId",     search: ["categoryName","vehicleType"] },
  { route: "cng-sales",           model: "cngSale",            id: "saleId",         search: [] },
  // Domain 5: Mobile App
  { route: "app-users",           model: "appUser",            id: "appUserId",      search: ["mobile","email","status"] },
  { route: "app-devices",         model: "appDevice",          id: "deviceId",       search: ["osType","appVersion"] },
  { route: "app-account-links",   model: "appAccountLink",     id: "linkId",         search: ["ownershipType"] },
  { route: "app-sessions",        model: "appSession",         id: "sessionId",      search: ["sessionStatus"] },
  { route: "app-notifications",   model: "appNotification",    id: "notifId",        search: ["channel","message"] },
  { route: "notif-templates",     model: "notifTemplate",      id: "templateId",     search: ["channel","eventType","language"] },
  { route: "app-service-requests",model: "appServiceRequest",  id: "requestId",      search: ["status","description"] },
  { route: "service-request-types",model:"serviceRequestType", id: "typeId",         search: ["category","subcategory","department"] },
  // Domain 6: API & Partners
  { route: "api-partners",        model: "apiPartner",         id: "partnerId",      search: ["partnerName","partnerType"] },
  { route: "api-credentials",     model: "apiCredential",      id: "credentialId",   search: ["clientId"] },
  { route: "api-endpoint-catalogs",model:"apiEndpointCatalog", id: "endpointId",     search: ["endpointCode","operationType"] },
  { route: "api-endpoint-mappings",model:"apiEndpointMapping", id: "mappingId",      search: [] },
  { route: "api-transactions",    model: "apiTransaction",     id: "apiTxnId",       search: ["statusCode"] },
  { route: "webhook-subscriptions",model:"webhookSubscription",id: "webhookId",      search: ["eventType","targetUrl"] },
  { route: "api-rate-limits",     model: "apiRateLimit",       id: "limitId",        search: [] },
  { route: "api-error-codes",     model: "apiErrorCode",       id: "errorCode",      search: ["message","category"] },
  // Power Grid
  { route: "sub-stations",        model: "subStation",         id: "subStationId",   search: ["name","voltageLevel"] },
  { route: "feeders",             model: "feeder",             id: "feederId",       search: ["name"] },
  { route: "distribution-transformers", model: "distributionTransformer", id: "dtId", search: ["name"] },
  { route: "tod-slots",           model: "todSlot",            id: "slotId",         search: ["name"] },
  { route: "meter-interval-reads",model: "meterIntervalRead",  id: "intervalId",     search: [] },
  { route: "net-metering-credits",model: "netMeteringCredit",  id: "creditId",       search: [] },
  // FI-CA
  { route: "dunning-levels",      model: "dunningLevel",       id: "levelId",        search: ["levelName"] },
  { route: "dunning-notices",     model: "dunningNotice",      id: "noticeId",       search: ["status"] },
  { route: "security-deposits",   model: "securityDeposit",    id: "depositId",      search: ["status"] },
  { route: "budget-billing-plans",model: "budgetBillingPlan",  id: "planId",         search: ["status"] },
];

const BASE = path.join(__dirname, "..", "app", "api");

function makeListRoute(e) {
  const whereClause = e.search.length > 0
    ? `search ? { OR: [${e.search.map(f => `{ ${f}: { contains: search } }`).join(", ")}] } : {}`
    : `{}`;
  return `import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, serverError } from "@/lib/api-response";
import { excelDownloadResponse, parseExcelBuffer } from "@/lib/excel";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("export") === "1") {
      const rows = await (prisma.${e.model} as any).findMany({ orderBy: { createdAt: "desc" } });
      return excelDownloadResponse(rows, "${e.route}");
    }
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "25");
    const search = searchParams.get("search") ?? "";
    const skip  = (page - 1) * limit;
    const where: any = ${whereClause};
    const [data, total] = await Promise.all([
      (prisma.${e.model} as any).findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      (prisma.${e.model} as any).count({ where }),
    ]);
    return ok({ data, total, page, limit });
  } catch (err) { return serverError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data") || contentType.includes("application/octet-stream")) {
      const buf = await req.arrayBuffer();
      const rows = parseExcelBuffer(buf);
      const created = await Promise.all(rows.map((r: any) => (prisma.${e.model} as any).create({ data: r })));
      return ok({ imported: created.length });
    }
    const body = await req.json();
    const record = await (prisma.${e.model} as any).create({ data: body });
    return ok(record, 201);
  } catch (err) { return serverError(err); }
}
`;
}

function makeDetailRoute(e) {
  return `import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const record = await (prisma.${e.model} as any).findUnique({ where: { ${e.id}: id } });
    if (!record) return notFound("${e.model}");
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await (prisma.${e.model} as any).update({ where: { ${e.id}: id }, data: body });
    return ok(record);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await (prisma.${e.model} as any).delete({ where: { ${e.id}: id } });
    return noContent();
  } catch (err) { return serverError(err); }
}
`;
}

let created = 0;
for (const e of ENTITIES) {
  // List + create + export + import route
  const listDir = path.join(BASE, e.route);
  fs.mkdirSync(listDir, { recursive: true });
  fs.writeFileSync(path.join(listDir, "route.ts"), makeListRoute(e));

  // Detail route
  const detailDir = path.join(BASE, e.route, "[id]");
  fs.mkdirSync(detailDir, { recursive: true });
  fs.writeFileSync(path.join(detailDir, "route.ts"), makeDetailRoute(e));

  created += 2;
  console.log(`✓ ${e.route}`);
}
console.log(`\nDone — ${created} route files generated.`);
