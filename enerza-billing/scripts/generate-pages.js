/**
 * generate-pages.js
 * Generates Next.js page files for all 46 entities under /app/data/[route]/page.tsx
 */
const fs = require("fs");
const path = require("path");

const ENTITIES = [
  // Domain 1
  { route: "customers", title: "Customers", color: "#06b6d4", columns: [
    { key: "customerId", label: "ID" },
    { key: "fullName", label: "Full Name" },
    { key: "customerType", label: "Type" },
    { key: "mobile", label: "Mobile", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "kycStatus", label: "KYC Status" },
    { key: "status", label: "Status" },
  ]},
  { route: "consumer-segments", title: "Consumer Segments", color: "#06b6d4", columns: [
    { key: "segmentId", label: "ID" },
    { key: "segmentName", label: "Segment Name" },
    { key: "utilityType", label: "Utility Type" },
    { key: "description", label: "Description" },
  ]},
  { route: "premises", title: "Premises", color: "#06b6d4", columns: [
    { key: "premiseId", label: "ID" },
    { key: "addressLine1", label: "Address Line 1" },
    { key: "addressLine2", label: "Address Line 2" },
    { key: "areaId", label: "Area ID" },
    { key: "buildingType", label: "Building Type" },
    { key: "status", label: "Status" },
  ]},
  { route: "accounts", title: "Accounts", color: "#06b6d4", columns: [
    { key: "accountId", label: "ID" },
    { key: "customerId", label: "Customer ID" },
    { key: "premiseId", label: "Premise ID" },
    { key: "cycleId", label: "Cycle ID" },
    { key: "billDeliveryMode", label: "Bill Delivery" },
    { key: "status", label: "Status" },
    { key: "effectiveFrom", label: "Effective From", type: "date" },
  ]},
  { route: "service-connections", title: "Service Connections", color: "#06b6d4", columns: [
    { key: "connectionId", label: "ID" },
    { key: "accountId", label: "Account ID" },
    { key: "segmentId", label: "Segment ID" },
    { key: "utilityType", label: "Utility Type" },
    { key: "startDate", label: "Start Date", type: "date" },
    { key: "endDate", label: "End Date", type: "date" },
    { key: "status", label: "Status" },
  ]},
  { route: "gas-conn-details", title: "Gas Connection Details", color: "#06b6d4", columns: [
    { key: "connectionId", label: "Connection ID" },
    { key: "serviceType", label: "Service Type" },
    { key: "pressureBandId", label: "Pressure Band ID" },
    { key: "regulatorSerial", label: "Regulator Serial" },
  ]},
  { route: "elec-conn-details", title: "Electricity Connection Details", color: "#06b6d4", columns: [
    { key: "connectionId", label: "Connection ID" },
    { key: "loadKw", label: "Load (kW)", type: "number" },
    { key: "supplyVoltage", label: "Supply Voltage" },
    { key: "phaseType", label: "Phase Type" },
    { key: "tariffCategory", label: "Tariff Category" },
  ]},
  { route: "water-conn-details", title: "Water Connection Details", color: "#06b6d4", columns: [
    { key: "connectionId", label: "Connection ID" },
    { key: "pipeSizeMm", label: "Pipe Size (mm)", type: "number" },
    { key: "supplyZoneId", label: "Supply Zone" },
    { key: "meterType", label: "Meter Type" },
  ]},
  { route: "pressure-bands", title: "Pressure Bands", color: "#06b6d4", columns: [
    { key: "bandId", label: "ID" },
    { key: "bandName", label: "Band Name" },
    { key: "minPressure", label: "Min Pressure", type: "number" },
    { key: "maxPressure", label: "Max Pressure", type: "number" },
    { key: "usageClass", label: "Usage Class" },
  ]},
  // Domain 2
  { route: "rate-plans", title: "Rate Plans", color: "#818cf8", columns: [
    { key: "ratePlanId", label: "ID" },
    { key: "planName", label: "Plan Name" },
    { key: "utilityType", label: "Utility Type" },
    { key: "segmentId", label: "Segment ID" },
    { key: "billingFreq", label: "Billing Freq" },
    { key: "effectiveFrom", label: "From", type: "date" },
    { key: "effectiveTo", label: "To", type: "date" },
    { key: "status", label: "Status" },
  ]},
  { route: "charge-components", title: "Charge Components", color: "#818cf8", columns: [
    { key: "componentId", label: "ID" },
    { key: "ratePlanId", label: "Rate Plan" },
    { key: "componentName", label: "Component Name" },
    { key: "componentType", label: "Type" },
    { key: "uom", label: "UOM" },
    { key: "rate", label: "Rate", type: "number" },
    { key: "slabFrom", label: "Slab From", type: "number" },
    { key: "slabTo", label: "Slab To", type: "number" },
  ]},
  { route: "tax-masters", title: "Tax Masters", color: "#818cf8", columns: [
    { key: "taxId", label: "ID" },
    { key: "taxName", label: "Tax Name" },
    { key: "jurisdiction", label: "Jurisdiction" },
    { key: "taxRate", label: "Tax Rate (%)", type: "number" },
    { key: "applicability", label: "Applicability" },
    { key: "effectiveFrom", label: "From", type: "date" },
    { key: "effectiveTo", label: "To", type: "date" },
  ]},
  { route: "bill-cycles", title: "Bill Cycles", color: "#818cf8", columns: [
    { key: "cycleId", label: "ID" },
    { key: "cycleName", label: "Cycle Name" },
    { key: "readDateRule", label: "Read Date Rule" },
    { key: "billDateRule", label: "Bill Date Rule" },
    { key: "dueDateRule", label: "Due Date Rule" },
    { key: "graceDays", label: "Grace Days", type: "number" },
    { key: "status", label: "Status" },
  ]},
  { route: "bills", title: "Bills", color: "#818cf8", columns: [
    { key: "billId", label: "ID" },
    { key: "accountId", label: "Account ID" },
    { key: "connectionId", label: "Connection ID" },
    { key: "billDate", label: "Bill Date", type: "date" },
    { key: "dueDate", label: "Due Date", type: "date" },
    { key: "netAmount", label: "Net Amount", type: "number" },
    { key: "taxAmount", label: "Tax Amount", type: "number" },
    { key: "totalAmount", label: "Total", type: "number" },
    { key: "status", label: "Status" },
  ]},
  { route: "bill-lines", title: "Bill Lines", color: "#818cf8", columns: [
    { key: "lineId", label: "ID" },
    { key: "billId", label: "Bill ID" },
    { key: "componentId", label: "Component ID" },
    { key: "description", label: "Description" },
    { key: "quantity", label: "Qty", type: "number" },
    { key: "rate", label: "Rate", type: "number" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "lineType", label: "Line Type" },
  ]},
  // Domain 3
  { route: "payment-channels", title: "Payment Channels", color: "#10b981", columns: [
    { key: "channelId", label: "ID" },
    { key: "channelName", label: "Channel Name" },
    { key: "channelType", label: "Type" },
    { key: "provider", label: "Provider" },
    { key: "status", label: "Status" },
  ]},
  { route: "payment-gateways", title: "Payment Gateways", color: "#10b981", columns: [
    { key: "gatewayId", label: "ID" },
    { key: "provider", label: "Provider" },
    { key: "merchantId", label: "Merchant ID" },
    { key: "environment", label: "Environment" },
    { key: "status", label: "Status" },
  ]},
  { route: "payment-orders", title: "Payment Orders", color: "#10b981", columns: [
    { key: "orderId", label: "ID" },
    { key: "billId", label: "Bill ID" },
    { key: "accountId", label: "Account ID" },
    { key: "channelId", label: "Channel ID" },
    { key: "gatewayId", label: "Gateway ID" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "convenienceFee", label: "Conv. Fee", type: "number" },
    { key: "status", label: "Status" },
    { key: "initiatedAt", label: "Initiated At", type: "date" },
  ]},
  { route: "gateway-txns", title: "Gateway Transactions", color: "#10b981", columns: [
    { key: "txnId", label: "ID" },
    { key: "orderId", label: "Order ID" },
    { key: "settlementId", label: "Settlement ID" },
    { key: "gatewayRef", label: "Gateway Ref" },
    { key: "gatewayStatus", label: "Status" },
    { key: "responseAt", label: "Response At", type: "date" },
    { key: "settledAt", label: "Settled At", type: "date" },
  ]},
  { route: "settlements", title: "Settlements", color: "#10b981", columns: [
    { key: "settlementId", label: "ID" },
    { key: "gatewayId", label: "Gateway ID" },
    { key: "settlementDate", label: "Date", type: "date" },
    { key: "grossAmount", label: "Gross Amount", type: "number" },
    { key: "netAmount", label: "Net Amount", type: "number" },
    { key: "matchedCount", label: "Matched", type: "number" },
    { key: "exceptionCount", label: "Exceptions", type: "number" },
  ]},
  { route: "refunds", title: "Refunds", color: "#10b981", columns: [
    { key: "refundId", label: "ID" },
    { key: "orderId", label: "Order ID" },
    { key: "reasonCode", label: "Reason" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "status", label: "Status" },
    { key: "initiatedAt", label: "Initiated At", type: "date" },
  ]},
  { route: "suspense-records", title: "Suspense Records", color: "#10b981", columns: [
    { key: "suspenseId", label: "ID" },
    { key: "txnId", label: "Txn ID" },
    { key: "reason", label: "Reason" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "resolutionStatus", label: "Resolution Status" },
  ]},
  // Domain 4
  { route: "cgd-areas", title: "CGD Areas", color: "#f59e0b", columns: [
    { key: "areaId", label: "ID" },
    { key: "areaName", label: "Area Name" },
    { key: "city", label: "City" },
    { key: "district", label: "District" },
    { key: "state", label: "State" },
    { key: "zone", label: "Zone" },
    { key: "utilityType", label: "Utility Type" },
    { key: "status", label: "Status" },
  ]},
  { route: "routes", title: "Routes", color: "#f59e0b", columns: [
    { key: "routeId", label: "ID" },
    { key: "areaId", label: "Area ID" },
    { key: "routeName", label: "Route Name" },
    { key: "cycleGroup", label: "Cycle Group" },
    { key: "readerId", label: "Reader ID" },
    { key: "status", label: "Status" },
  ]},
  { route: "meters", title: "Meters", color: "#f59e0b", columns: [
    { key: "meterId", label: "ID" },
    { key: "serialNo", label: "Serial No." },
    { key: "meterType", label: "Type" },
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "utilityType", label: "Utility Type" },
    { key: "calibrationDue", label: "Calibration Due", type: "date" },
    { key: "status", label: "Status" },
  ]},
  { route: "meter-installations", title: "Meter Installations", color: "#f59e0b", columns: [
    { key: "installId", label: "ID" },
    { key: "meterId", label: "Meter ID" },
    { key: "connectionId", label: "Connection ID" },
    { key: "installDate", label: "Install Date", type: "date" },
    { key: "removeDate", label: "Remove Date", type: "date" },
    { key: "sealNo", label: "Seal No." },
    { key: "reason", label: "Reason" },
  ]},
  { route: "meter-readings", title: "Meter Readings", color: "#f59e0b", columns: [
    { key: "readingId", label: "ID" },
    { key: "meterId", label: "Meter ID" },
    { key: "connectionId", label: "Connection ID" },
    { key: "routeId", label: "Route ID" },
    { key: "readingDate", label: "Reading Date", type: "date" },
    { key: "readingValue", label: "Reading Value", type: "number" },
    { key: "consumption", label: "Consumption", type: "number" },
    { key: "readingType", label: "Type" },
    { key: "status", label: "Status" },
  ]},
  { route: "cng-stations", title: "CNG Stations", color: "#f59e0b", columns: [
    { key: "stationId", label: "ID" },
    { key: "stationName", label: "Station Name" },
    { key: "areaId", label: "Area ID" },
    { key: "city", label: "City" },
    { key: "compressorType", label: "Compressor Type" },
    { key: "dispenserCount", label: "Dispensers", type: "number" },
    { key: "status", label: "Status" },
  ]},
  { route: "vehicle-categories", title: "Vehicle Categories", color: "#f59e0b", columns: [
    { key: "categoryId", label: "ID" },
    { key: "categoryName", label: "Category Name" },
    { key: "vehicleType", label: "Vehicle Type" },
    { key: "commercialFlag", label: "Commercial?", type: "boolean" },
    { key: "status", label: "Status" },
  ]},
  { route: "cng-sales", title: "CNG Sales", color: "#f59e0b", columns: [
    { key: "saleId", label: "ID" },
    { key: "stationId", label: "Station ID" },
    { key: "categoryId", label: "Category ID" },
    { key: "saleDate", label: "Sale Date", type: "date" },
    { key: "quantityScm", label: "Qty (SCM)", type: "number" },
    { key: "unitPrice", label: "Unit Price", type: "number" },
    { key: "amount", label: "Amount", type: "number" },
  ]},
  // Domain 5
  { route: "app-users", title: "App Users", color: "#f472b6", columns: [
    { key: "appUserId", label: "ID" },
    { key: "customerId", label: "Customer ID" },
    { key: "mobile", label: "Mobile" },
    { key: "email", label: "Email", type: "email" },
    { key: "otpVerified", label: "OTP Verified" },
    { key: "status", label: "Status" },
  ]},
  { route: "app-devices", title: "App Devices", color: "#f472b6", columns: [
    { key: "deviceId", label: "ID" },
    { key: "appUserId", label: "User ID" },
    { key: "osType", label: "OS Type" },
    { key: "appVersion", label: "App Version" },
    { key: "deviceFingerprint", label: "Fingerprint" },
    { key: "active", label: "Active?", type: "boolean" },
  ]},
  { route: "app-account-links", title: "App Account Links", color: "#f472b6", columns: [
    { key: "linkId", label: "ID" },
    { key: "appUserId", label: "User ID" },
    { key: "accountId", label: "Account ID" },
    { key: "ownershipType", label: "Ownership Type" },
    { key: "linkedAt", label: "Linked At", type: "date" },
  ]},
  { route: "app-sessions", title: "App Sessions", color: "#f472b6", columns: [
    { key: "sessionId", label: "ID" },
    { key: "appUserId", label: "User ID" },
    { key: "deviceId", label: "Device ID" },
    { key: "startedAt", label: "Started At", type: "date" },
    { key: "endedAt", label: "Ended At", type: "date" },
    { key: "sessionStatus", label: "Status" },
  ]},
  { route: "app-notifications", title: "App Notifications", color: "#f472b6", columns: [
    { key: "notifId", label: "ID" },
    { key: "appUserId", label: "User ID" },
    { key: "templateId", label: "Template ID" },
    { key: "channel", label: "Channel" },
    { key: "message", label: "Message" },
    { key: "sentAt", label: "Sent At", type: "date" },
    { key: "readFlag", label: "Read?", type: "boolean" },
  ]},
  { route: "notif-templates", title: "Notification Templates", color: "#f472b6", columns: [
    { key: "templateId", label: "ID" },
    { key: "channel", label: "Channel" },
    { key: "eventType", label: "Event Type" },
    { key: "language", label: "Language" },
    { key: "bodyTemplate", label: "Body Template" },
    { key: "active", label: "Active?", type: "boolean" },
  ]},
  { route: "app-service-requests", title: "App Service Requests", color: "#f472b6", columns: [
    { key: "requestId", label: "ID" },
    { key: "appUserId", label: "User ID" },
    { key: "accountId", label: "Account ID" },
    { key: "typeId", label: "Type ID" },
    { key: "description", label: "Description" },
    { key: "status", label: "Status" },
  ]},
  { route: "service-request-types", title: "Service Request Types", color: "#f472b6", columns: [
    { key: "typeId", label: "ID" },
    { key: "category", label: "Category" },
    { key: "subcategory", label: "Subcategory" },
    { key: "slaHours", label: "SLA Hours", type: "number" },
    { key: "priority", label: "Priority" },
    { key: "department", label: "Department" },
  ]},
  // Domain 6
  { route: "api-partners", title: "API Partners", color: "#fb923c", columns: [
    { key: "partnerId", label: "ID" },
    { key: "partnerName", label: "Partner Name" },
    { key: "partnerType", label: "Type" },
    { key: "contactEmail", label: "Email", type: "email" },
    { key: "contactMobile", label: "Mobile" },
    { key: "settlementMode", label: "Settlement Mode" },
    { key: "status", label: "Status" },
  ]},
  { route: "api-credentials", title: "API Credentials", color: "#fb923c", columns: [
    { key: "credentialId", label: "ID" },
    { key: "partnerId", label: "Partner ID" },
    { key: "clientId", label: "Client ID" },
    { key: "ipWhitelist", label: "IP Whitelist" },
    { key: "tokenExpiry", label: "Token Expiry", type: "date" },
  ]},
  { route: "api-endpoint-catalogs", title: "API Endpoint Catalog", color: "#fb923c", columns: [
    { key: "endpointId", label: "ID" },
    { key: "endpointCode", label: "Endpoint Code" },
    { key: "operationType", label: "Operation" },
    { key: "requestMethod", label: "Method" },
    { key: "authType", label: "Auth Type" },
    { key: "syncFlag", label: "Sync?", type: "boolean" },
    { key: "version", label: "Version" },
  ]},
  { route: "api-endpoint-mappings", title: "API Endpoint Mappings", color: "#fb923c", columns: [
    { key: "mappingId", label: "ID" },
    { key: "partnerId", label: "Partner ID" },
    { key: "endpointId", label: "Endpoint ID" },
    { key: "enabled", label: "Enabled?", type: "boolean" },
    { key: "effectiveFrom", label: "Effective From", type: "date" },
  ]},
  { route: "api-transactions", title: "API Transactions", color: "#fb923c", columns: [
    { key: "apiTxnId", label: "ID" },
    { key: "partnerId", label: "Partner ID" },
    { key: "endpointId", label: "Endpoint ID" },
    { key: "requestTime", label: "Request Time", type: "date" },
    { key: "responseMs", label: "Response (ms)", type: "number" },
    { key: "statusCode", label: "Status Code" },
    { key: "errorCode", label: "Error Code" },
  ]},
  { route: "webhook-subscriptions", title: "Webhook Subscriptions", color: "#fb923c", columns: [
    { key: "webhookId", label: "ID" },
    { key: "partnerId", label: "Partner ID" },
    { key: "eventType", label: "Event Type" },
    { key: "targetUrl", label: "Target URL" },
    { key: "signatureMethod", label: "Signature Method" },
    { key: "retryCount", label: "Retry Count", type: "number" },
    { key: "active", label: "Active?", type: "boolean" },
  ]},
  { route: "api-rate-limits", title: "API Rate Limits", color: "#fb923c", columns: [
    { key: "limitId", label: "ID" },
    { key: "partnerId", label: "Partner ID" },
    { key: "requestsPerMin", label: "Req/min", type: "number" },
    { key: "burstLimit", label: "Burst Limit", type: "number" },
    { key: "timeoutMs", label: "Timeout (ms)", type: "number" },
    { key: "retryPolicy", label: "Retry Policy" },
  ]},
  { route: "api-error-codes", title: "API Error Codes", color: "#fb923c", columns: [
    { key: "errorCode", label: "Error Code" },
    { key: "httpStatus", label: "HTTP Status", type: "number" },
    { key: "message", label: "Message" },
    { key: "retryable", label: "Retryable?", type: "boolean" },
    { key: "category", label: "Category" },
  ]},
  // Power Grid
  { route: "sub-stations", title: "Sub-Stations", color: "#eab308", columns: [
    { key: "subStationId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "voltageLevel", label: "Voltage Level" },
    { key: "areaId", label: "Area ID" },
    { key: "status", label: "Status" },
  ]},
  { route: "feeders", title: "Feeders", color: "#eab308", columns: [
    { key: "feederId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "subStationId", label: "Sub-Station ID" },
    { key: "status", label: "Status" },
  ]},
  { route: "distribution-transformers", title: "Transformers (DT)", color: "#eab308", columns: [
    { key: "dtId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "feederId", label: "Feeder ID" },
    { key: "capacityKva", label: "Capacity (kVA)", type: "number" },
    { key: "status", label: "Status" },
  ]},
  { route: "tod-slots", title: "TOD Slots", color: "#eab308", columns: [
    { key: "slotId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "startTime", label: "Start Time" },
    { key: "endTime", label: "End Time" },
    { key: "rateModifier", label: "Rate Modifier", type: "number" },
    { key: "status", label: "Status" },
  ]},
  // FI-CA
  { route: "dunning-levels", title: "Dunning Levels", color: "#ef4444", columns: [
    { key: "levelId", label: "ID" },
    { key: "levelName", label: "Level Name" },
    { key: "daysOverdue", label: "Days Overdue", type: "number" },
    { key: "penaltyFee", label: "Penalty Fee", type: "number" },
    { key: "actionType", label: "Action Type" },
  ]},
  { route: "dunning-notices", title: "Dunning Notices", color: "#ef4444", columns: [
    { key: "noticeId", label: "ID" },
    { key: "accountId", label: "Account ID" },
    { key: "levelId", label: "Level ID" },
    { key: "status", label: "Status" },
    { key: "issuedAt", label: "Issued At", type: "date" },
  ]},
  { route: "security-deposits", title: "Security Deposits", color: "#ef4444", columns: [
    { key: "depositId", label: "ID" },
    { key: "accountId", label: "Account ID" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "status", label: "Status" },
    { key: "paymentDate", label: "Payment Date", type: "date" },
  ]},
  { route: "budget-billing-plans", title: "Budget Billing Plans", color: "#ef4444", columns: [
    { key: "planId", label: "ID" },
    { key: "accountId", label: "Account ID" },
    { key: "monthlyAmount", label: "Monthly Amount", type: "number" },
    { key: "startDate", label: "Start Date", type: "date" },
    { key: "reconciliationMonth", label: "True-Up Month", type: "number" },
  ]},
  // NRW / Water
  { route: "supply-zones", title: "Supply Zones", color: "#3b82f6", columns: [
    { key: "supplyZoneId", label: "ID" },
    { key: "name", label: "Zone Name" },
    { key: "utilityType", label: "Utility" },
    { key: "status", label: "Status" },
  ]},
  { route: "bulk-meter-reads", title: "Bulk Meter Reads", color: "#3b82f6", columns: [
    { key: "readId", label: "ID" },
    { key: "supplyZoneId", label: "Zone ID" },
    { key: "readDate", label: "Date", type: "date" },
    { key: "valueScm", label: "Volume (SCM)", type: "number" },
    { key: "status", label: "Status" },
  ]},
];

const BASE = path.join(__dirname, "..", "app", "data");

function makePage(e) {
  const colsJson = JSON.stringify(e.columns, null, 6).replace(/"/g, '"');
  return `import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = ${colsJson};

  return (
    <DataTable
      title="${e.title}"
      apiPath="/api/${e.route}"
      columns={columns}
      color="${e.color}"
    />
  );
}
`;
}

let count = 0;
for (const e of ENTITIES) {
  const dir = path.join(BASE, e.route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "page.tsx"), makePage(e));
  count++;
  console.log(`✓ /data/${e.route}`);
}
console.log(`\nDone — ${count} page files generated.`);
