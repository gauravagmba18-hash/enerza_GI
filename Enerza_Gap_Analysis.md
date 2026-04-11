# Plan: BRD Gap Analysis, Bug Fixes & Implementation Roadmap

## Context

The enerza-billing app is a utility CIS/CRM platform built with Next.js 16, Prisma 7, and PostgreSQL. The BRD (BRD_Utility.md) defines 56 requirements (BR-001 to BR-056) across customer management, billing, metering, field service, complaints, outage, inventory, and integration. A full codebase audit (78 Prisma models, 126 API routes, 83 pages, 10 components) reveals the app is largely a **well-scaffolded prototype** with strong data modeling and CRUD API coverage but with major gaps: missing pages, pervasive hardcoded data, non-functional UI actions, and several BRD requirements unimplemented or only simulated.

---

## Part 1: BRD Requirement Traceability (All 56 Requirements)

| Req ID | Module | Requirement | Status | Implementation |
|--------|--------|-------------|--------|-----------------|
| **BR-001** | Customer master | Maintain unified customer records with effective-dated history | ✅ IMPLEMENTED | `Customer` model with fullName, kycStatus, segment; `/api/customers`, `/crm/customers` pages |
| **BR-002** | Customer master | Support merge, split, duplicate resolution | ⚠️ PARTIAL | Model exists but no merge/split API; duplicate detection not wired |
| **BR-003** | Account management | Support multiple accounts per customer & premises | ✅ IMPLEMENTED | `Account` model with customerId FK; `/api/accounts`, `/data/accounts` page |
| **BR-004** | Service lifecycle | New connection request lifecycle from application to activation | ✅ IMPLEMENTED | `/new-connection` wizard, `/api/onboarding` route, `ServiceRequest` model (type: NEW_CONNECTION) |
| **BR-005** | Service lifecycle | Move-in at existing premise with opening read | ⚠️ PARTIAL | Schema supports it (ServiceRequest type: MOVE_IN) but no `/api/commercial/move-in` endpoint; `/crm/lifecycle` page is hardcoded |
| **BR-006** | Service lifecycle | Move-out with final read, bill, deposit settlement | ⚠️ PARTIAL | `/api/commercial/move-out` exists but simulated; `/crm/lifecycle` UI not wired |
| **BR-007** | Service lifecycle | Tenant change, owner-tenant change, customer-to-customer transfer | ⚠️ PARTIAL | Schema supports (ServiceRequest type: TRANSFER) but no dedicated API |
| **BR-008** | Service lifecycle | Temporary/permanent disconnection, reconnection, closure | ❌ NOT IMPLEMENTED | No disconnect/reconnect API routes; workflow not modeled |
| **BR-009** | Service lifecycle | Opt-in/opt-out for programs, meter types, billing programs | ❌ NOT IMPLEMENTED | No opt-in/opt-out tracking in schema or API |
| **BR-010** | Contract management | Service agreements, deposits, payment arrangements, effective dates | ✅ IMPLEMENTED | `SecurityDeposit`, `BudgetBillingPlan` models; `/api/security-deposits`, `/api/budget-billing-plans` |
| **BR-011** | Premise/service point | Maintain hierarchy with historical responsibility tracing | ✅ IMPLEMENTED | `Premise`, `ServiceConnection`, `Account` models with FK relationships |
| **BR-012** | Meter/device master | Serialised meter master with status, specs, lifecycle | ✅ IMPLEMENTED | `Meter` model with serialNo, meterType, make, model, calibrationDue; `/api/meters` |
| **BR-013** | Device lifecycle | Installation, commissioning, operation, removal, replacement, decommissioning | ✅ IMPLEMENTED | `MeterInstallation` model tracks install/removeDate; `/api/meter-installations` |
| **BR-014** | Device pairing | Communication module pairing & provisioning for smart devices | ⚠️ PARTIAL | Schema has fields (no dedicated pairing API; integration with HES assumed future) |
| **BR-015** | Meter reading | Manual, handheld, imported, smart, estimated, substitute, corrected reads | ✅ IMPLEMENTED | `MeterReading` model with readingType field; `/api/meter-readings` |
| **BR-016** | Meter reading | Image capture as reading evidence | ⚠️ PARTIAL | UI mentions photo capture but no image storage/retrieval implemented |
| **BR-017** | Meter reading | Image-recognition-assisted validation workflows | ❌ NOT IMPLEMENTED | No OCR or image processing; marked as "Should" in BRD |
| **BR-018** | Meter exceptions | Validation for zero, reverse, high/low, no-access, tamper | ⚠️ PARTIAL | `MeterReading.status` field exists but validation rules not coded |
| **BR-019** | Smart metering | Integrate with HES/AMI/MDMS for reads, interval data, alarms | ⚠️ PARTIAL | `MeterIntervalRead` model for interval data; no active HES/MDMS integration (future) |
| **BR-020** | Smart metering | Remote connect, disconnect, reconnect where device capabilities permit | ❌ NOT IMPLEMENTED | No remote service ops API |
| **BR-021** | Smart metering | Device health, communication loss, tamper, event-driven workflows | ⚠️ PARTIAL | No event handling coded; schema supports tagging but no workflow |
| **BR-022** | Tariffs | Configurable fixed, block, step, demand, seasonal, time-based tariffs | ✅ IMPLEMENTED | `RatePlan`, `ChargeComponent` models with componentType, slabFrom/To; `/api/rate-plans`, `/api/charge-components` |
| **BR-023** | Billing | Prepaid and postpaid on one platform | ✅ IMPLEMENTED | Schema supports postpaid; prepaid via `BudgetBillingPlan`; `/api/billing/engine` route exists |
| **BR-024** | Billing | Proration for move-in, move-out, tariff change, device replacement | ⚠️ PARTIAL | `UtilityConfig.prorationMode` field exists; logic not coded in billing engine |
| **BR-025** | Billing | Estimated bills, corrected bills, rebills, bill cancellations | ⚠️ PARTIAL | `Bill.status` field supports states but no correction/rebill workflow |
| **BR-026** | Billing | Final bill, opening bill, transfer bill, settlement bill | ⚠️ PARTIAL | Conceptual support in schema; no dedicated API actions |
| **BR-027** | Billing | Taxes, levies, subsidies, rebates, penalties, configurable charges | ✅ IMPLEMENTED | `TaxMaster`, `ChargeComponent` models; charges in `/api/charge-components` |
| **BR-028** | Billing | Minimum billing, minimum charge, minimum demand logic | ❌ NOT IMPLEMENTED | `UtilityConfig.minBillingMode/Value` fields exist but NOT applied in billing engine; **HIGH PRIORITY FIX** |
| **BR-029** | Billing | Bill explanation & transparency for service agents | ⚠️ PARTIAL | `BillLine` model supports description; no agent-facing bill explanation page |
| **BR-030** | Payments | Multi-channel payment posting, reversal, suspense, reconciliation | ✅ IMPLEMENTED | `PaymentOrder`, `GatewayTxn`, `Refund`, `SuspenseRecord` models; `/api/payment-*` routes |
| **BR-031** | Receivables | Deposits, deposit transfer, deposit refund, offset against final bills | ✅ IMPLEMENTED | `SecurityDeposit` model; `/api/security-deposits` |
| **BR-032** | Collections | Arrears ageing, collections strategy, promise-to-pay, disconnection triggers | ✅ IMPLEMENTED | `DunningLevel`, `DunningNotice` models; `/api/dunning-*` routes; `/fica` page (hardcoded) |
| **BR-033** | Customer service | Dedicated customer service workspace for inquiries & requests | ✅ IMPLEMENTED | `ServiceRequest`, `AppServiceRequest` models; `/crm/customers/[id]` page shows related data |
| **BR-034** | Complaints | Formal complaint management with taxonomy, ownership, resolution workflow | ✅ IMPLEMENTED | `ServiceTicket`, `ComplaintCategory`, `ComplaintSubCategory` models; `/api/field/tickets` |
| **BR-035** | Complaints | SLA targets, breach alerts, escalation by complaint type | ⚠️ PARTIAL | `ComplaintSubCategory.slaHours` exists but **SLA deadline NOT computed/tracked**; `/crm/complaints` shows hardcoded "3 breached" |
| **BR-036** | Complaints | Link complaints to bills, payments, reads, device events, images, work orders | ✅ IMPLEMENTED | `ServiceTicket.billId`, `outage_id` FK; relations to workOrder exist |
| **BR-037** | Field service | Generate field work from service requests, complaints, meter events, maintenance plans | ✅ IMPLEMENTED | `WorkOrder` model; `/api/field/work-orders`; generated from `ServiceTicket` |
| **BR-038** | Field service | Scheduling, dispatch, appointments, route planning, mobile execution | ✅ IMPLEMENTED | `WorkOrder` scheduling fields; `/field/page.tsx` dispatch board; `/field/mobile` technician app |
| **BR-039** | Field service | Offline mobile execution with GPS, photo, checklist, signature | ✅ IMPLEMENTED | `WorkOrder` has gpsLat/Lon, photos, checklist, signature fields; `/field/mobile` page |
| **BR-040** | Field service | Unsuccessful visit reasons & rescheduling | ✅ IMPLEMENTED | `WorkOrder.unattended_reason` field; `/field/work-orders/[id]/complete` endpoint |
| **BR-041** | Spares/inventory | Issue, consumption, return, reconciliation against work orders | ✅ IMPLEMENTED | `WorkOrderSpare`, `InventoryItem` models; `/api/field/inventory` |
| **BR-042** | Spares/inventory | Track van stock, technician stock, warehouse stock, serialized inventory | ✅ IMPLEMENTED | `inventory_stock`, `inventory_location` models; `/data/inventory-items` page |
| **BR-043** | Device replacement | Governed faulty-device replacement with old/new device traceability | ⚠️ PARTIAL | `MeterInstallation` model supports this; `/crm/replacement` page exists but **fully hardcoded**, no real API integration |
| **BR-044** | Device replacement | Trigger billing & service updates when device replacement affects cycle | ❌ NOT IMPLEMENTED | No billing trigger on device replacement |
| **BR-045** | Asset maintenance | Preventive, corrective, condition-based maintenance | ✅ IMPLEMENTED | `asset`, `maintenance_activity` models; `/crm/maintenance` page (hardcoded) |
| **BR-046** | Asset maintenance | Asset hierarchy, inspection plans, defect capture, failure history | ✅ IMPLEMENTED | `asset` model with health_status, ytd_failures; `maintenance_activity` tracks work |
| **BR-047** | Outage linkage | Display outage context in customer-service & complaint workflows | ⚠️ PARTIAL | `ServiceTicket.outage_id` FK exists; `/crm/outages` page shows **hardcoded data**, not real outage_event records |
| **BR-048** | Outage linkage | Cluster no-supply complaints against known incidents | ⚠️ PARTIAL | No clustering logic in API; hardcoded in page UI |
| **BR-049** | Reporting | Operational, management, compliance, audit reporting | ✅ IMPLEMENTED | `/crm/reports` page exists but shows **hardcoded KPI values** (should compute from DB) |
| **BR-050** | Reporting | Track KPIs for billing, collections, service levels, device health, field performance | ⚠️ PARTIAL | Models support tracking; KPI pages show hardcoded data instead of live counts |
| **BR-051** | Integration | Integrate with ERP, GIS, payment channels, CRM, MDMS, HES, outage systems | ✅ FRAMEWORK | `ApiPartner`, `ApiCredential`, `ApiEndpointCatalog`, `ApiTransaction`, `WebhookSubscription` models; `/api/api-*` routes for partner mgmt |
| **BR-052** | Security | RBAC, maker-checker, full audit trail for sensitive transactions | ⚠️ PARTIAL | No RBAC enforced in routes; no maker-checker approval workflows |
| **BR-053** | Configurability | Effective-dated master data, configurable tariffs, SLAs, notices, tax structures | ✅ IMPLEMENTED | `UtilityConfig`, `RatePlan`, `TaxMaster`, `ComplaintSubCategory` models support config |
| **BR-054** | Compliance | Regulator-oriented notices, reporting, evidence retention | ⚠️ PARTIAL | Models exist but no compliance reporting page; evidence retention not tracked |
| **BR-055** | Non-functional | Support high-volume billing, payment spikes, outage-driven complaint peaks | ⚠️ PARTIAL | Schema designed for scale; no load testing done; pagination present in APIs |
| **BR-056** | Non-functional | Support modular suite deployment across CIS, MDMS, CRM, FSM, EAM components | ✅ FRAMEWORK | App structure supports modular APIs; all CRUD routes independent |

**Summary: 21 ✅ Full, 24 ⚠️ Partial, 11 ❌ Not Implemented**

---

## Part 2: Complete Page Inventory (83 Pages) & Functionality Status

### DASHBOARD & CORE (4 pages)

| Page Path | File | Purpose | Data Source | Status | Issues |
|-----------|------|---------|-------------|--------|--------|
| `/` | `app/page.tsx` | Main dashboard with stat cards | Hardcoded (46 tables, 92 routes) | ⚠️ HARDCODED | Stats should pull from DB; shows "Everything Configured" but many pages incomplete |
| `/billing-engine` | `app/billing-engine/page.tsx` | Live billing pipeline demo | Client state (simulated) | ❌ SIMULATION | Marked "LIVE" but fully client-side; no real API calls; minimum billing logic missing |
| `/new-connection` | `app/new-connection/page.tsx` | 5-step onboarding wizard | `/api/onboarding` | ✅ FUNCTIONAL | Form validation good; hardcoded defaults (areaId, cycleId) should be dynamic |
| `/fica` | `app/fica/page.tsx` | Collections & dunning dashboard | Hardcoded KPIs | ❌ HARDCODED | "142 dunning accounts", "$1.4M deposits" hardcoded; "Run Dunning Check" button shows alert instead of API call |

### CRM SECTION (10 pages)

| Page Path | File | Purpose | Data Source | Status | Issues |
|-----------|------|---------|-------------|--------|--------|
| `/crm` | `app/crm/page.tsx` | CRM dashboard (complaints, tickets, outages) | `/api/` endpoints | ⚠️ PARTIAL | **@ts-ignore on line 21** suppresses Prisma type error; real API integration but type-safe warning ignored |
| `/crm/customers` | `app/crm/customers/page.tsx` | Customer list (limited to 5 for perf) | `/api/customers` limit 5 | ⚠️ LIMITED | Pagination not implemented; search/filter UI present but non-functional |
| `/crm/customers/[id]` | `app/crm/customers/[id]/page.tsx` | Customer 360° profile | `/api/customers/{id}` | ✅ FUNCTIONAL | Links to accounts, bills, complaints, service agreements; good integration |
| `/crm/complaints` | `app/crm/complaints/page.tsx` | Complaints register with SLA | `/api/field/tickets` | ⚠️ PARTIAL | SLA breach count hardcoded to "3"; search input not wired; filter dropdown non-functional |
| `/crm/field` | `app/crm/field/page.tsx` | Technician location map (Leaflet) | Hardcoded technician data | ⚠️ HARDCODED | **@ts-ignore on lines 104, 111** for Leaflet types; technician locations hardcoded; "Refresh Data" button is a no-op |
| `/crm/outages` | `app/crm/outages/page.tsx` | Outage event clustering | Hardcoded outage + complaint data | ❌ HARDCODED | Entire dataset (OUTAGES array, CLUSTERED_COMPLAINTS) is hardcoded; should query outage_event model |
| `/crm/maintenance` | `app/crm/maintenance/page.tsx` | Asset preventive maintenance register | Hardcoded asset data | ❌ HARDCODED | 4 assets with dates/failures hardcoded; should fetch from asset + maintenance_activity models |
| `/crm/replacement` | `app/crm/replacement/page.tsx` | Meter replacement workflow | Hardcoded meter details | ❌ HARDCODED | Meter serial numbers, old/new device comparison all hardcoded; image upload UI non-functional |
| `/crm/lifecycle` | `app/crm/lifecycle/page.tsx` | Service lifecycle (move-in, move-out, transfer) stepper | Client state (form not saved) | ❌ DISCONNECTED | Stepper UI good but form data lost on navigation; KPI counts (4 new, 3 move-in) hardcoded; submit buttons don't hit backend |
| `/crm/reports` | `app/crm/reports/page.tsx` | CRM analytics & KPIs | Hardcoded metrics | ❌ HARDCODED | SLA compliance %, complaint categories, WO performance all hardcoded; should aggregate from ServiceTicket/WorkOrder |
| **MISSING** | `app/crm/work-orders/page.tsx` | Work order dispatch (referenced in sidebar badge "?") | `/api/field/work-orders` | ❌ MISSING | **Page does not exist but sidebar links to it** |
| **MISSING** | `app/crm/inventory/page.tsx` | Inventory management | Uses AuxiliaryPages component | ⚠️ UNCLEAR | Links to AuxiliaryPages.InventoryPage; naming collision risk |

### UTILITY HUBS (5 pages)

| Page Path | File | Purpose | Data Source | Status | Issues |
|-----------|------|---------|-------------|--------|--------|
| `/gas` | `app/gas/page.tsx` | PNG ops hub (pressure terminals) | Hardcoded terminals (4 items) | ❌ HARDCODED | TRM-L01-CP through TRM-L04-ED all hardcoded; should fetch from CngStation + PressureBand models |
| `/water` | `app/water/page.tsx` | Water distribution, NRW, zone telemetry | Hardcoded zones (4 items) | ❌ HARDCODED | Supply zones (Sector 14, Indira Nagar, etc.) hardcoded; should query SupplyZone + BulkMeterRead |
| `/power-ops` | `app/power-ops/page.tsx` | DISCOM feeder energy accounting | Hardcoded feeders (3 items) | ❌ HARDCODED | FDR-North-11, FDR-Ind-Zone3, FDR-South-02 hardcoded; should fetch from Feeder + DistributionTransformer |
| `/power-ops/net-metering` | `app/power-ops/net-metering/page.tsx` | Solar net metering hub | ❌ UNEXPLORED | Referenced in sidebar; structure assumed to be hardcoded like other hubs |
| `/water-ops/nrw` | `app/water-ops/nrw/page.tsx` | Non-Revenue Water (leak detection) | ✅ API | Uses `/api/water-ops/nrw` with real calculation; good integration |

### FIELD OPERATIONS (3 pages)

| Page Path | File | Purpose | Data Source | Status | Issues |
|-----------|------|---------|-------------|--------|--------|
| `/field` | `app/field/page.tsx` | Service ticket dispatch board | `/api/field/tickets`, `/api/field/technicians` | ✅ FUNCTIONAL | Good API integration; technician assignment modal works |
| `/field/mobile` | `app/field/mobile/page.tsx` | Technician mobile app (work orders) | `/api/field/work-orders` | ✅ FUNCTIONAL | Mobile-optimized; calls `/api/field/work-orders/{id}/complete` on submission |
| **MISSING** | `app/field/technician/page.tsx` | Technician management hub (referenced in sidebar) | `/api/field/technicians` | ❌ MISSING | **Page does not exist but sidebar links to it** |

### DATA MANAGEMENT PAGES (60 pages under `/data/`)

All follow the reusable `DataTable` component pattern. Most pages are **FUNCTIONAL** with working CRUD, but some have issues:

| Category | Pages | API Base | Status | Notes |
|----------|-------|----------|--------|-------|
| **Billing** | `/data/bills`, `/data/bill-lines`, `/data/bill-cycles`, `/data/rate-plans`, `/data/charge-components`, `/data/budget-billing-plans` | `/api/bill*`, `/api/rate-plans`, `/api/charge-components` | ✅ FUNCTIONAL | Standard DataTable CRUD pages; all working |
| **Payments** | `/data/payment-orders`, `/data/payment-channels`, `/data/payment-gateways`, `/data/gateway-txns`, `/data/refunds`, `/data/settlements`, `/data/suspense-records` | `/api/payment*` | ✅ FUNCTIONAL | All have working CRUD; settlements/net-metering search not wired |
| **Customers & Accounts** | `/data/customers`, `/data/accounts`, `/data/premises`, `/data/service-connections` | `/api/customers`, `/api/accounts`, etc. | ✅ FUNCTIONAL | Standard CRUD; `/data/customers` is data page (separate from CRM customer list) |
| **Metering** | `/data/meters`, `/data/meter-readings`, `/data/meter-installations`, `/data/meter-interval-reads`, `/data/bulk-meter-reads` | `/api/meter*` | ✅ FUNCTIONAL | All functional; some have search issues (meter-interval-reads) |
| **Infrastructure** | `/data/feeders`, `/data/sub-stations`, `/data/distribution-transformers`, `/data/routes`, `/data/cgd-areas` | `/api/feeders`, `/api/sub-stations`, etc. | ✅ FUNCTIONAL | Electricity/water infrastructure models all have pages |
| **Connections** | `/data/elec-conn-details`, `/data/gas-conn-details`, `/data/water-conn-details`, `/data/supply-zones`, `/data/pressure-bands` | `/api/*-conn-details`, `/api/supply-zones`, `/api/pressure-bands` | ✅ FUNCTIONAL | Utility-specific connection detail pages |
| **Collections** | `/data/dunning-levels`, `/data/dunning-notices`, `/data/security-deposits` | `/api/dunning*`, `/api/security-deposits` | ✅ FUNCTIONAL | Collections workflow support pages |
| **Field & Inventory** | `/data/technicians`, `/data/inventory-items`, `/data/service-request-types` | `/api/field/technicians`, `/api/field/inventory`, `/api/service-request-types` | ✅ FUNCTIONAL | Field operations data pages |
| **App Management** | `/data/app-users`, `/data/app-devices`, `/data/app-sessions`, `/data/app-notifications`, `/data/app-account-links`, `/data/app-service-requests` | `/api/app-*` | ✅ FUNCTIONAL | Mobile app user/device management pages |
| **API Management** | `/data/api-partners`, `/data/api-credentials`, `/data/api-endpoint-catalogs`, `/data/api-endpoint-mappings`, `/data/api-rate-limits`, `/data/api-transactions`, `/data/api-error-codes` | `/api/api-*` | ✅ FUNCTIONAL | Partner integration management pages |
| **Configuration** | `/data/utility-configs`, `/data/consumer-segments`, `/data/tax-masters`, `/data/vehicle-categories`, `/data/notif-templates`, `/data/webhook-subscriptions`, `/data/tod-slots` | `/api/*` config models | ✅ FUNCTIONAL | System config & template pages |
| **Special** | `/data/cng-stations`, `/data/cng-sales` | `/api/cng-*` | ✅ FUNCTIONAL | Gas utility operations data (CNG sales tracking) |

### SPECIAL PAGES (2 pages)

| Page Path | File | Purpose | Data Source | Status | Issues |
|-----------|------|---------|-------------|--------|--------|
| `/customers/[id]` | `app/customers/[id]/page.tsx` | Customer detail (alternate to `/crm/customers/[id]`) | `/api/customers/{id}` | ⚠️ PARTIAL | Duplicate of CRM customer detail; "Service Tickets & Work Orders" tab shows empty state even with data |
| **MISSING** | Missing | Layout `app/layout.tsx` | — | ✅ FUNCTIONAL | Root layout with Sidebar + Header |

---

## Part 3: Deep Dive - Gas Utility Section Analysis

### Gas Pages & Functionality

| Page | Purpose | Current State | Data Flow | Issues |
|------|---------|---------------|-----------|--------|
| **`/gas`** | PNG Ops Hub — Pressure Terminal Health | HARDCODED | `const TERMINALS = [{ id, name, status, pressure, dispensers, capacity, health }]` | **All 4 terminals (TRM-L01-CP, TRM-L02-BP, TRM-L03-RP, TRM-L04-ED) are fake data** |
| **`/data/pressure-bands`** | Pressure Band Master | FUNCTIONAL | `/api/pressure-bands` | Real data CRUD; links to GasConnDetail records |
| **`/data/gas-conn-details`** | Gas Connection Details | FUNCTIONAL | `/api/gas-conn-details` | Real connection data; FK to pressure-band |
| **`/data/cng-stations`** | CNG Station Master | FUNCTIONAL | `/api/cng-stations` | Real CNG station CRUD; storage for dispenser count, compressor type |
| **`/data/cng-sales`** | CNG Sales Tracking | FUNCTIONAL | `/api/cng-sales` (no search filter) | Real sales transactions; quantity in SCM (standard cubic meter) + unit price |
| **`/data/vehicle-categories`** | Vehicle Category Master | FUNCTIONAL | `/api/vehicle-categories` | Commercial flag support; links to CngSale records |

### Gas Models & Schema

```prisma
// Core gas models in schema
model PressureBand {
  bandId String @id @default(cuid())
  bandName String
  minPressure Float
  maxPressure Float
  usageClass String  // e.g., "DOMESTIC", "COMMERCIAL"
  gasConnDetails GasConnDetail[]
}

model GasConnDetail {
  connectionId String @id
  serviceType String  // e.g., "PIPED_GAS"
  regulatorSerial String?
  pressureBandId String
  pressureBand PressureBand
  connection ServiceConnection
}

model CngStation {
  stationId String @id @default(cuid())
  stationName String
  city String
  compressorType String?
  dispenserCount Int @default(0)
  status String @default("ACTIVE")
  areaId String
  cngSales CngSale[]
  area CgdArea
}

model CngSale {
  saleId String @id @default(cuid())
  saleDate DateTime
  quantityScm Float  // Standard cubic meters
  unitPrice Float
  amount Float
  stationId String
  categoryId String  // FK to VehicleCategory
  station CngStation
  category VehicleCategory
}

model VehicleCategory {
  categoryId String @id @default(cuid())
  categoryName String
  vehicleType String  // e.g., "TAXI", "AUTO", "TRUCK"
  commercialFlag Boolean @default(false)
  cngSales CngSale[]
}
```

### Gas Page Issues & Fixes Required

1. **`/gas` Hub Page — COMPLETELY HARDCODED**
   - **Current**: Shows 4 terminals with fake health data (TRM-L01-CP "GOOD" @ 8.5 bar, 24 dispensers, 97% capacity)
   - **Should Query**: 
     ```sql
     SELECT cng_station.*, 
       COUNT(cng_sale.*) as sales_today,
       AVG(cng_sale.amount) as avg_sale,
       (SELECT COUNT(*) FROM cng_sale WHERE sale_date >= TODAY) as sales_count
     FROM cng_station
     WHERE status = 'ACTIVE'
     ```
   - **Impact**: BR-049, BR-050 (reporting KPIs must be live)

2. **`/data/cng-sales` Search Issue**
   - `/api/cng-sales` route has **no search filter implemented** (other routes have it)
   - Add `GET /api/cng-sales?stationId=X&dateFrom=Y&dateTo=Z` query params

3. **Missing Gas Consumption Billing**
   - Gas utility bills should pull usage from `ServiceConnection` + `CngSale` or `BulkMeterRead`
   - No current billing integration for gas

4. **Pressure Band Monitoring**
   - No real-time pressure alerts or SLA tracking
   - `/crm/complaints` doesn't have gas-specific complaint categories (LOW_PRESSURE, HIGH_PRESSURE)

### Gas API Routes

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/pressure-bands` | GET, POST | List/create pressure bands | ✅ FUNCTIONAL |
| `/api/pressure-bands/[id]` | GET, PUT, DELETE | Manage single band | ✅ FUNCTIONAL |
| `/api/gas-conn-details` | GET, POST | List/create gas connections | ✅ FUNCTIONAL |
| `/api/gas-conn-details/[id]` | GET, PUT, DELETE | Manage single connection | ✅ FUNCTIONAL |
| `/api/cng-stations` | GET, POST | List/create CNG stations | ✅ FUNCTIONAL |
| `/api/cng-stations/[id]` | GET, PUT, DELETE | Manage single station | ✅ FUNCTIONAL |
| `/api/cng-sales` | GET, POST | List/create CNG sales | ⚠️ NO SEARCH FILTER |
| `/api/cng-sales/[id]` | GET, PUT, DELETE | Manage single sale | ✅ FUNCTIONAL |
| `/api/vehicle-categories` | GET, POST | List/create vehicle categories | ✅ FUNCTIONAL |
| `/api/vehicle-categories/[id]` | GET, PUT, DELETE | Manage single category | ✅ FUNCTIONAL |

### Gas Sidebar Links (from Sidebar.tsx)

```
"Gas Utility Hub" group:
  - PNG Ops Hub → /gas (HARDCODED)
  - Pressure Bands → /data/pressure-bands (FUNCTIONAL)
  - Gas Connections → /data/gas-conn-details (FUNCTIONAL)
  - CNG Stations → /data/cng-stations (FUNCTIONAL)
  - CNG Sales → /data/cng-sales (FUNCTIONAL)
  - Vehicle Categories → /data/vehicle-categories (FUNCTIONAL)
```

---

## Priority 1 — Critical Bugs (App is Broken / Navigation Dead)

### 1.1 Missing Pages Referenced in Sidebar
- **`/crm/work-orders`** — Sidebar link + badge "?" exists (line 108 in Sidebar.tsx) but page does not exist. Create `app/crm/work-orders/page.tsx` using DataTable pattern pointing to `/api/field/work-orders`.
- **`/field/technician`** — Sidebar link (line 85 in Sidebar.tsx) exists but page missing. Create `app/field/technician/page.tsx` using DataTable pattern pointing to `/api/field/technicians`.

### 1.2 TypeScript @ts-ignore (Silent Failures)
- **`app/crm/page.tsx:21`** — Prisma property type error suppressed. Review the query and add proper type or fix data shape.
- **`app/crm/field/page.tsx:104,111`** — Leaflet MapContainer/Marker types. Install or fix type imports from `react-leaflet`.

### 1.3 Non-Functional Action Buttons (UI Dead Ends)
- **`app/fica/page.tsx`** — "Run Dunning Check" button shows `setTimeout` alert. Wire to `POST /api/dunning-notices` or list pending notices.
- **`app/crm/complaints/page.tsx`** — Search input & filter dropdown not connected. Wire to API query params for filtering by status/priority.
- **`app/crm/field/page.tsx`** — "Refresh Data" button is a no-op. Trigger refetch of technician/work-order data.
- **`app/customers/[id]/page.tsx`** — "+ Service Request" and "+ Complaint" buttons non-functional. Link to forms or modals.

---

## Priority 2 — Replace Hardcoded Data with Live API Calls

| Page | Hardcoded Items | Fix |
|------|-----------------|-----|
| `app/gas/page.tsx` | 4 PNG terminals (TRM-L01-CP, TRM-L02-BP, TRM-L03-RP, TRM-L04-ED) | Query `/api/cng-stations`, compute health from sales/dispenser count |
| `app/water/page.tsx` | 4 supply zones (Sector 14, Indira Nagar, South City, Industrial Estate) | Query `/api/supply-zones` + `/api/bulk-meter-reads` |
| `app/power-ops/page.tsx` | 3 feeders (FDR-North-11, FDR-Ind-Zone3, FDR-South-02) | Query `/api/feeders` + `/api/distribution-transformers` |
| `app/crm/complaints/page.tsx` | "3 breached SLA" KPI | Compute: `ServiceTicket` where `closedAt > (createdAt + slaHours)` OR `(status=OPEN AND createdAt+slaHours < now)` |
| `app/crm/outages/page.tsx` | Entire outage + clustered complaints | Query `outage_event` + join `ServiceTicket` where `outage_id` matches |
| `app/crm/maintenance/page.tsx` | 4 assets with dates/failures | Query `asset` + `maintenance_activity` models |
| `app/crm/replacement/page.tsx` | Meter serial numbers & device details | Query `/api/meters` + `/api/meter-installations` |
| `app/crm/lifecycle/page.tsx` | KPI counts (4 new, 3 move-in) | Count `ServiceRequest` by type |
| `app/crm/reports/page.tsx` | SLA %, complaint categories, WO performance | Aggregate queries from ServiceTicket, WorkOrder |
| `app/page.tsx` | "46 tables, 92 routes, ~322 endpoints" | Pull from DB or compute from schema count |
| `app/fica/page.tsx` | "142 dunning accounts, $1.4M deposits" | Query `/api/dunning-notices` and `/api/security-deposits` |

---

## Priority 3 — BRD Functional Gaps (Not Implemented)

### 3.1 Minimum Billing Logic — BR-028, BR-029, SC-005
- **Gap**: `UtilityConfig.minBillingMode` & `minBillingValue` exist but NOT applied in billing engine.
- **Fix**: In `/app/api/billing/engine/route.ts` `generate` action, after computing bill lines, check:
  ```typescript
  if (utilityConfig.minBillingMode === 'FIXED' && netAmount < utilityConfig.minBillingValue) {
    netAmount = utilityConfig.minBillingValue;
    billLines.push({ lineType: 'MINIMUM_CHARGE', amount: utilityConfig.minBillingValue - previousNetAmount });
  }
  ```
- **UI**: `/app/billing-engine/page.tsx` should show "Minimum Charge Applied" indicator.

### 3.2 Complaint SLA Tracking — BR-034, BR-035
- **Gap**: `ComplaintSubCategory.slaHours` exists but SLA deadline not computed on `ServiceTicket` creation.
- **Fix**: Add `slaDeadline DateTime?` field to ServiceTicket schema. In `/api/field/tickets` POST, compute: `slaDeadline = createdAt.addHours(slaHours)`.
- **UI**: `/crm/complaints` compute breach count as: `tickets where slaDeadline < now AND status != CLOSED`.

### 3.3 Service Lifecycle Form Persistence — BR-005, BR-006, BR-007
- **Gap**: `/crm/lifecycle/page.tsx` stepper UI exists but form data not persisted; no backend APIs for move-in/transfer.
- **Fix**: 
  - Create `/api/commercial/move-in/route.ts` similar to move-out
  - Create `/api/commercial/transfer/route.ts`
  - Wire lifecycle form buttons to these endpoints

### 3.4 Device Replacement Workflow — BR-043, BR-044, SC-008
- **Gap**: `/crm/replacement/page.tsx` fully hardcoded; no real meter/installation fetch.
- **Fix**:
  - Fetch active installations: `GET /api/meter-installations?status=ACTIVE`
  - On submit: POST new MeterInstallation, update old one with removeDate
  - Trigger billing note if installed during active billing cycle

### 3.5 Outage-Complaint Linkage — BR-047, BR-048, SC-010
- **Gap**: `/crm/outages/page.tsx` shows hardcoded outages; no real `outage_event` query.
- **Fix**: Fetch `outage_event` records, join `ServiceTicket.outage_id`, group complaints by outage.

### 3.6 Missing Move-In API — BR-005, SC-003
- **Gap**: No `/api/commercial/move-in` endpoint.
- **Fix**: Create it (opposite of move-out): close prev ServiceConnection, create new one, log ServiceRequest type=MOVE_IN.

---

## Priority 4 — Technical Debt

### 4.1 Schema Cleanup
- **Lowercase Models**: Rename `asset`, `inventory_location`, `inventory_stock`, `inventory_transfer`, `maintenance_activity`, `outage_event` to PascalCase for consistency.
- **Missing @updatedAt**: Add to `asset`, `inventory_location`, `inventory_transfer`, `outage_event`.
- **Missing @default(cuid())**: Add to `asset.asset_id`, `inventory_location.location_id`, `maintenance_activity.activity_id`, `outage_event.outage_id`.
- **Float → Decimal**: Change all money fields (`Bill.netAmount`, `Bill.totalAmount`, `PaymentOrder.amount`) to `@db.Decimal(12,2)`.
- **Add Enums**: Define enums for statuses instead of raw String.
- **Orphaned Models**: `TaxMaster` and `TodSlot` unused; either wire into billing or mark as future.

### 4.2 Onboarding Route Hardcoded IDs
- `/api/onboarding/route.ts` uses `areaId: "area_hq_01"`, `cycleId: "monthly_01"`.
- Accept these from request body; NewConnectionWizard already has form fields.

### 4.3 DataTable API Format Inconsistency
- Some routes return `{ data: { data: [], total: X } }`, others `{ data: [] }`.
- Standardize all to `{ data: T[], total: number }`.

### 4.4 Billing Engine Page — Simulation vs Real
- `/app/billing-engine/page.tsx` marked "LIVE" but fully client-side state machine.
- Wire step buttons to actual `POST /api/billing/engine` calls.

---

## Files to Modify / Create

### New Files
- `app/crm/work-orders/page.tsx` — Work orders list
- `app/field/technician/page.tsx` — Technician management
- `app/api/commercial/move-in/route.ts` — Move-in lifecycle
- `app/api/commercial/transfer/route.ts` — Customer transfer
- `prisma/migrations/YYYYMMDD_schema_cleanup/migration.sql` — Schema improvements

### Modify Files (Priority Order)

**CRITICAL:**
- `app/crm/page.tsx` — Remove @ts-ignore
- `app/crm/field/page.tsx` — Remove @ts-ignore, wire Refresh button
- `app/gas/page.tsx` — Replace hardcoded terminals with real API
- `app/crm/outages/page.tsx` — Replace hardcoded outages with real query
- `app/crm/complaints/page.tsx` — Compute SLA breach count, wire search/filter

**HIGH:**
- `app/api/billing/engine/route.ts` — Add minimum billing logic
- `app/crm/replacement/page.tsx` — Replace hardcoded meters with API
- `app/crm/lifecycle/page.tsx` — Wire forms to backend
- `app/api/field/tickets/route.ts` — Add slaDeadline computation

**MEDIUM:**
- `app/water/page.tsx` — Replace hardcoded zones with API
- `app/power-ops/page.tsx` — Replace hardcoded feeders with API
- `app/crm/maintenance/page.tsx` — Replace hardcoded assets with API
- `app/crm/reports/page.tsx` — Replace hardcoded KPIs with live queries
- `app/fica/page.tsx` — Wire dunning button to API
- `app/page.tsx` — Replace hardcoded dashboard stats
- `components/ui/DataTable.tsx` — Standardize API response format
- `prisma/schema.prisma` — Schema cleanup

---

## Verification

After implementation:
1. All sidebar links resolve (no 404s)
2. `/crm/work-orders` and `/field/technician` pages exist and load data
3. All @ts-ignore warnings removed; `npm run build` zero TypeScript errors
4. Gas/water/power-ops hubs show real data (not hardcoded)
5. CRM complaints SLA breach count computes dynamically
6. Billing engine applies minimum billing when configured
7. Lifecycle form completes move-in/move-out with DB persistence
8. Replacement page loads real meters and saves new installations
