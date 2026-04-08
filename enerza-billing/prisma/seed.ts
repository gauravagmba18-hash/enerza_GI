import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱  Seeding Enerza-Billing database…");

  // ──────────────────────────────────────────────
  // 1. CGD Areas
  // ──────────────────────────────────────────────
  const areas = await Promise.all([
    prisma.cgdArea.upsert({ where: { areaId: "AHM-WEST" }, update: {}, create: { areaId: "AHM-WEST", areaName: "Ahmedabad West", city: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", zone: "West Gujarat", utilityType: "ALL", status: "ACTIVE" } }),
    prisma.cgdArea.upsert({ where: { areaId: "AHM-EAST" }, update: {}, create: { areaId: "AHM-EAST", areaName: "Ahmedabad East", city: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", zone: "East Gujarat", utilityType: "ALL", status: "ACTIVE" } }),
    prisma.cgdArea.upsert({ where: { areaId: "GAN-NORTH" }, update: {}, create: { areaId: "GAN-NORTH", areaName: "Gandhinagar North", city: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", zone: "Central Gujarat", utilityType: "ALL", status: "ACTIVE" } }),
    prisma.cgdArea.upsert({ where: { areaId: "SURAT-N" }, update: {}, create: { areaId: "SURAT-N", areaName: "Surat North", city: "Surat", district: "Surat", state: "Gujarat", zone: "South Gujarat", utilityType: "ALL", status: "ACTIVE" } }),
    prisma.cgdArea.upsert({ where: { areaId: "VAD-CENTRAL" }, update: {}, create: { areaId: "VAD-CENTRAL", areaName: "Vadodara Central", city: "Vadodara", district: "Vadodara", state: "Gujarat", zone: "Central Gujarat", utilityType: "ALL", status: "ACTIVE" } }),
  ]);
  console.log(`  ✓ CGD Areas: ${areas.length}`);

  // ──────────────────────────────────────────────
  // 2. Pressure Bands
  // ──────────────────────────────────────────────
  const bands = await Promise.all([
    prisma.pressureBand.upsert({ where: { bandId: "PBAND-LP-DOM" }, update: {}, create: { bandId: "PBAND-LP-DOM", bandName: "Domestic Low Pressure", minPressure: 0.01, maxPressure: 0.05, usageClass: "Domestic" } }),
    prisma.pressureBand.upsert({ where: { bandId: "PBAND-MP-COM" }, update: {}, create: { bandId: "PBAND-MP-COM", bandName: "Commercial Medium Pressure", minPressure: 0.05, maxPressure: 0.5, usageClass: "Commercial" } }),
    prisma.pressureBand.upsert({ where: { bandId: "PBAND-HP-IND" }, update: {}, create: { bandId: "PBAND-HP-IND", bandName: "Industrial High Pressure", minPressure: 0.5, maxPressure: 7.0, usageClass: "Industrial" } }),
    prisma.pressureBand.upsert({ where: { bandId: "PBAND-CNG-STA" }, update: {}, create: { bandId: "PBAND-CNG-STA", bandName: "CNG Station Pressure", minPressure: 200, maxPressure: 250, usageClass: "CNG Station" } }),
  ]);
  console.log(`  ✓ Pressure Bands: ${bands.length}`);

  // ──────────────────────────────────────────────
  // 3. Consumer Segments
  // ──────────────────────────────────────────────
  const segments = await Promise.all([
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-GAS-DOM" }, update: {}, create: { segmentId: "SEG-GAS-DOM", segmentName: "Domestic PNG", utilityType: "GAS", description: "Residential piped natural gas consumers" } }),
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-GAS-COM" }, update: {}, create: { segmentId: "SEG-GAS-COM", segmentName: "Commercial PNG", utilityType: "GAS", description: "Shops, hotels, restaurants with PNG" } }),
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-GAS-IND" }, update: {}, create: { segmentId: "SEG-GAS-IND", segmentName: "Industrial Gas", utilityType: "GAS", description: "Factories and industrial units" } }),
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-ELEC-DOM" }, update: {}, create: { segmentId: "SEG-ELEC-DOM", segmentName: "Domestic Electricity", utilityType: "ELECTRICITY", description: "Residential electricity consumers" } }),
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-ELEC-COM" }, update: {}, create: { segmentId: "SEG-ELEC-COM", segmentName: "Commercial Electricity", utilityType: "ELECTRICITY", description: "Commercial electricity consumers" } }),
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-WATER-DOM" }, update: {}, create: { segmentId: "SEG-WATER-DOM", segmentName: "Domestic Water", utilityType: "WATER", description: "Residential water supply consumers" } }),
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-CNG-PRIV" }, update: {}, create: { segmentId: "SEG-CNG-PRIV", segmentName: "CNG Private Vehicle", utilityType: "CNG", description: "Private vehicle CNG fueling" } }),
    prisma.consumerSegment.upsert({ where: { segmentId: "SEG-CNG-COMM" }, update: {}, create: { segmentId: "SEG-CNG-COMM", segmentName: "CNG Commercial Vehicle", utilityType: "CNG", description: "Commercial vehicle CNG fueling" } }),
  ]);
  console.log(`  ✓ Consumer Segments: ${segments.length}`);

  // ──────────────────────────────────────────────
  // 4. Vehicle Categories
  // ──────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicleCategory.upsert({ where: { categoryId: "VEH-CAR-PRIV" }, update: {}, create: { categoryId: "VEH-CAR-PRIV", categoryName: "Private Car", vehicleType: "CAR", commercialFlag: false } }),
    prisma.vehicleCategory.upsert({ where: { categoryId: "VEH-AUTO-3W" }, update: {}, create: { categoryId: "VEH-AUTO-3W", categoryName: "Auto Rickshaw 3W", vehicleType: "AUTO", commercialFlag: true } }),
    prisma.vehicleCategory.upsert({ where: { categoryId: "VEH-BUS-COMM" }, update: {}, create: { categoryId: "VEH-BUS-COMM", categoryName: "Commercial Bus", vehicleType: "BUS", commercialFlag: true } }),
    prisma.vehicleCategory.upsert({ where: { categoryId: "VEH-TRUCK-HCV" }, update: {}, create: { categoryId: "VEH-TRUCK-HCV", categoryName: "Heavy Commercial Truck", vehicleType: "TRUCK", commercialFlag: true } }),
    prisma.vehicleCategory.upsert({ where: { categoryId: "VEH-2W-PRIV" }, update: {}, create: { categoryId: "VEH-2W-PRIV", categoryName: "Two Wheeler", vehicleType: "TWO_WHEELER", commercialFlag: false } }),
  ]);
  console.log(`  ✓ Vehicle Categories: ${vehicles.length}`);

  // ──────────────────────────────────────────────
  // 5. Bill Cycles
  // ──────────────────────────────────────────────
  const cycles = await Promise.all([
    prisma.billCycle.upsert({ where: { cycleId: "BC-MONTHLY-1" }, update: {}, create: { cycleId: "BC-MONTHLY-1", cycleName: "Monthly Group 1", readDateRule: "5th of month", billDateRule: "8th of month", dueDateRule: "28th of month", graceDays: 7 } }),
    prisma.billCycle.upsert({ where: { cycleId: "BC-MONTHLY-2" }, update: {}, create: { cycleId: "BC-MONTHLY-2", cycleName: "Monthly Group 2", readDateRule: "10th of month", billDateRule: "13th of month", dueDateRule: "3rd next month", graceDays: 7 } }),
    prisma.billCycle.upsert({ where: { cycleId: "BC-MONTHLY-3" }, update: {}, create: { cycleId: "BC-MONTHLY-3", cycleName: "Monthly Group 3", readDateRule: "15th of month", billDateRule: "18th of month", dueDateRule: "8th next month", graceDays: 7 } }),
    prisma.billCycle.upsert({ where: { cycleId: "BC-QTR-1" }, update: {}, create: { cycleId: "BC-QTR-1", cycleName: "Quarterly Group 1", readDateRule: "Last day of quarter", billDateRule: "3rd of next month", dueDateRule: "30th of next month", graceDays: 15 } }),
  ]);
  console.log(`  ✓ Bill Cycles: ${cycles.length}`);

  // ──────────────────────────────────────────────
  // 6. Tax Masters
  // ──────────────────────────────────────────────
  const taxes = await Promise.all([
    prisma.taxMaster.upsert({ where: { taxId: "TAX-GST-5" }, update: {}, create: { taxId: "TAX-GST-5", taxName: "GST 5% on Gas", jurisdiction: "CENTRAL", taxRate: 5.0, applicability: "Gas PNG / CNG", effectiveFrom: new Date("2017-07-01") } }),
    prisma.taxMaster.upsert({ where: { taxId: "TAX-GST-18" }, update: {}, create: { taxId: "TAX-GST-18", taxName: "GST 18% on Services", jurisdiction: "CENTRAL", taxRate: 18.0, applicability: "Service Charges", effectiveFrom: new Date("2017-07-01") } }),
    prisma.taxMaster.upsert({ where: { taxId: "TAX-ELEC-DUTY" }, update: {}, create: { taxId: "TAX-ELEC-DUTY", taxName: "Electricity Duty 15%", jurisdiction: "STATE", taxRate: 15.0, applicability: "Electricity", effectiveFrom: new Date("2020-01-01") } }),
    prisma.taxMaster.upsert({ where: { taxId: "TAX-WATER-5" }, update: {}, create: { taxId: "TAX-WATER-5", taxName: "Water Tax 5%", jurisdiction: "MUNICIPAL", taxRate: 5.0, applicability: "Water Supply", effectiveFrom: new Date("2022-04-01") } }),
    prisma.taxMaster.upsert({ where: { taxId: "TAX-CESS-2" }, update: {}, create: { taxId: "TAX-CESS-2", taxName: "Swachh Bharat Cess 2%", jurisdiction: "CENTRAL", taxRate: 2.0, applicability: "All utilities", effectiveFrom: new Date("2020-04-01") } }),
  ]);
  console.log(`  ✓ Tax Masters: ${taxes.length}`);

  // ──────────────────────────────────────────────
  // 7. Rate Plans + Charge Components
  // ──────────────────────────────────────────────
  const ratePlans = [
    { id: "RP-GAS-DOM-01", name: "Domestic PNG Slab 2024", utility: "GAS_PNG", segId: "SEG-GAS-DOM", freq: "MONTHLY",
      components: [
        { id: "CC-GD-FIX", name: "Fixed Monthly Charge", type: "FIXED", rate: 120.0 },
        { id: "CC-GD-V1",  name: "Variable – Slab 1 (0–10 SCM)",  type: "VARIABLE", rate: 30.0, uom: "SCM", slabFrom: 0,  slabTo: 10 },
        { id: "CC-GD-V2",  name: "Variable – Slab 2 (10–30 SCM)", type: "VARIABLE", rate: 35.0, uom: "SCM", slabFrom: 10, slabTo: 30 },
        { id: "CC-GD-V3",  name: "Variable – Slab 3 (>30 SCM)",   type: "VARIABLE", rate: 42.0, uom: "SCM", slabFrom: 30, slabTo: null },
        { id: "CC-GD-GST", name: "GST @ 5%",                      type: "TAX",      rate: 5.0 },
      ]},
    { id: "RP-GAS-COM-01", name: "Commercial PNG Flat 2024", utility: "GAS_PNG", segId: "SEG-GAS-COM", freq: "MONTHLY",
      components: [
        { id: "CC-GC-FIX", name: "Fixed Monthly Charge", type: "FIXED",    rate: 350.0 },
        { id: "CC-GC-VAR", name: "Variable Charge",       type: "VARIABLE", rate: 38.0, uom: "SCM", slabFrom: 0, slabTo: null },
        { id: "CC-GC-GST", name: "GST @ 5%",              type: "TAX",      rate: 5.0 },
      ]},
    { id: "RP-GAS-IND-01", name: "Industrial Gas 2024", utility: "GAS_PNG", segId: "SEG-GAS-IND", freq: "MONTHLY",
      components: [
        { id: "CC-GI-FIX", name: "Fixed Monthly Charge", type: "FIXED",    rate: 800.0 },
        { id: "CC-GI-VAR", name: "Variable Charge",       type: "VARIABLE", rate: 45.0, uom: "SCM", slabFrom: 0, slabTo: null },
        { id: "CC-GI-GST", name: "GST @ 5%",              type: "TAX",      rate: 5.0 },
      ]},
    { id: "RP-ELEC-DOM-01", name: "Domestic Electricity 2024", utility: "ELECTRICITY", segId: "SEG-ELEC-DOM", freq: "MONTHLY",
      components: [
        { id: "CC-ED-RENT", name: "Meter Rent",                     type: "FIXED",    rate: 45.0 },
        { id: "CC-ED-E1",   name: "Energy – Slab 1 (0–100 kWh)",   type: "VARIABLE", rate: 3.5,  uom: "kWh", slabFrom: 0,   slabTo: 100 },
        { id: "CC-ED-E2",   name: "Energy – Slab 2 (101–300 kWh)", type: "VARIABLE", rate: 5.0,  uom: "kWh", slabFrom: 100, slabTo: 300 },
        { id: "CC-ED-E3",   name: "Energy – Slab 3 (>300 kWh)",    type: "VARIABLE", rate: 7.5,  uom: "kWh", slabFrom: 300, slabTo: null },
        { id: "CC-ED-DUTY", name: "Electricity Duty @ 15%",         type: "TAX",      rate: 15.0 },
        { id: "CC-ED-GST",  name: "GST @ 18% (Meter Rent)",         type: "TAX",      rate: 18.0 },
      ]},
    { id: "RP-WATER-DOM-01", name: "Domestic Water 2024", utility: "WATER", segId: "SEG-WATER-DOM", freq: "MONTHLY",
      components: [
        { id: "CC-WD-FIX", name: "Fixed Water Charge",        type: "FIXED",    rate: 80.0 },
        { id: "CC-WD-W1",  name: "Water – Slab 1 (0–10 KL)", type: "VARIABLE", rate: 8.0,  uom: "KL", slabFrom: 0,  slabTo: 10 },
        { id: "CC-WD-W2",  name: "Water – Slab 2 (>10 KL)",  type: "VARIABLE", rate: 14.0, uom: "KL", slabFrom: 10, slabTo: null },
        { id: "CC-WD-TAX", name: "Water Tax @ 5%",            type: "TAX",      rate: 5.0 },
      ]},
    { id: "RP-CNG-PRIV-01", name: "CNG Private Vehicle 2024", utility: "CNG", segId: "SEG-CNG-PRIV", freq: "DAILY",
      components: [
        { id: "CC-CP-CNG", name: "CNG Fuel Charge", type: "VARIABLE", rate: 80.0, uom: "KG", slabFrom: 0, slabTo: null },
        { id: "CC-CP-GST", name: "GST @ 5%",        type: "TAX",      rate: 5.0 },
      ]},
  ];

  for (const rp of ratePlans) {
    await prisma.ratePlan.upsert({
      where: { ratePlanId: rp.id },
      update: {},
      create: {
        ratePlanId: rp.id, planName: rp.name, utilityType: rp.utility,
        segmentId: rp.segId, billingFreq: rp.freq,
        effectiveFrom: new Date("2024-04-01"), status: "ACTIVE",
      },
    });
    for (const c of rp.components) {
      await prisma.chargeComponent.upsert({
        where: { componentId: c.id },
        update: {},
        create: {
          componentId: c.id, componentName: c.name, componentType: c.type,
          rate: c.rate, uom: c.uom ?? null,
          slabFrom: c.slabFrom ?? null, slabTo: c.slabTo ?? null,
          ratePlanId: rp.id,
        },
      });
    }
  }
  console.log(`  ✓ Rate Plans: ${ratePlans.length} with all charge components`);

  // ──────────────────────────────────────────────
  // 8. Service Request Types
  // ──────────────────────────────────────────────
  const srTypes = await Promise.all([
    prisma.serviceRequestType.upsert({ where: { typeId: "SRT-GAS-LEAK" }, update: {}, create: { typeId: "SRT-GAS-LEAK", category: "Emergency", subcategory: "Gas Leak", slaHours: 2, priority: "CRITICAL", department: "Operations" } }),
    prisma.serviceRequestType.upsert({ where: { typeId: "SRT-BILL-DISP" }, update: {}, create: { typeId: "SRT-BILL-DISP", category: "Billing", subcategory: "Bill Dispute", slaHours: 48, priority: "MEDIUM", department: "Finance" } }),
    prisma.serviceRequestType.upsert({ where: { typeId: "SRT-NEW-CONN" }, update: {}, create: { typeId: "SRT-NEW-CONN", category: "Connection", subcategory: "New Connection Request", slaHours: 72, priority: "LOW", department: "Tech Services" } }),
    prisma.serviceRequestType.upsert({ where: { typeId: "SRT-MTR-FAULT" }, update: {}, create: { typeId: "SRT-MTR-FAULT", category: "Metering", subcategory: "Meter Fault", slaHours: 24, priority: "HIGH", department: "Metering" } }),
    prisma.serviceRequestType.upsert({ where: { typeId: "SRT-PAY-FAIL" }, update: {}, create: { typeId: "SRT-PAY-FAIL", category: "Payment", subcategory: "Payment Failure", slaHours: 4, priority: "HIGH", department: "Finance" } }),
  ]);
  console.log(`  ✓ Service Request Types: ${srTypes.length}`);

  // ──────────────────────────────────────────────
  // 9. Notification Templates
  // ──────────────────────────────────────────────
  const templates = await Promise.all([
    prisma.notifTemplate.upsert({ where: { templateId: "NT-BILL-GEN-PUSH-EN" }, update: {}, create: { templateId: "NT-BILL-GEN-PUSH-EN", channel: "PUSH", eventType: "BILL_GENERATED", language: "en", bodyTemplate: "Your {{utility}} bill for {{billing_month}} is ₹{{bill_amount}}. Due by {{due_date}}." } }),
    prisma.notifTemplate.upsert({ where: { templateId: "NT-BILL-GEN-SMS-EN" },  update: {}, create: { templateId: "NT-BILL-GEN-SMS-EN",  channel: "SMS",  eventType: "BILL_GENERATED", language: "en", bodyTemplate: "BFS Enerza: Bill ₹{{bill_amount}} generated for {{billing_month}}. Due: {{due_date}}. Pay: {{payment_link}}" } }),
    prisma.notifTemplate.upsert({ where: { templateId: "NT-DUE-REM-PUSH-EN" },  update: {}, create: { templateId: "NT-DUE-REM-PUSH-EN",  channel: "PUSH", eventType: "DUE_REMINDER",   language: "en", bodyTemplate: "Reminder: Your bill of ₹{{bill_amount}} is due on {{due_date}}. Pay now to avoid late fees." } }),
    prisma.notifTemplate.upsert({ where: { templateId: "NT-PAY-RCV-PUSH-EN" },  update: {}, create: { templateId: "NT-PAY-RCV-PUSH-EN",  channel: "PUSH", eventType: "PAYMENT_RECEIVED", language: "en", bodyTemplate: "Payment of ₹{{amount}} received. Ref: {{gateway_ref}}. Thank you!" } }),
    prisma.notifTemplate.upsert({ where: { templateId: "NT-OUTAGE-PUSH-EN" },   update: {}, create: { templateId: "NT-OUTAGE-PUSH-EN",   channel: "PUSH", eventType: "OUTAGE",          language: "en", bodyTemplate: "Service disruption in {{area}}. Expected restoration: {{eta}}. We apologize for inconvenience." } }),
    prisma.notifTemplate.upsert({ where: { templateId: "NT-BILL-GEN-PUSH-HI" }, update: {}, create: { templateId: "NT-BILL-GEN-PUSH-HI", channel: "PUSH", eventType: "BILL_GENERATED", language: "hi", bodyTemplate: "आपका {{utility}} बिल ₹{{bill_amount}} जनरेट हुआ है। देय तिथि: {{due_date}}" } }),
  ]);
  console.log(`  ✓ Notif Templates: ${templates.length}`);

  // ──────────────────────────────────────────────
  // 10. Customers
  // ──────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({ where: { customerId: "CUST000001" }, update: {}, create: { customerId: "CUST000001", fullName: "Ramesh Haribhai Shah",   customerType: "INDIVIDUAL", kycStatus: "VERIFIED", mobile: "+919876543210", email: "ramesh.shah@email.com",   status: "ACTIVE", segmentId: "SEG-GAS-DOM" } }),
    prisma.customer.upsert({ where: { customerId: "CUST000002" }, update: {}, create: { customerId: "CUST000002", fullName: "Priya Nilesh Patel",      customerType: "INDIVIDUAL", kycStatus: "VERIFIED", mobile: "+918765432109", email: "priya.patel@email.com",    status: "ACTIVE", segmentId: "SEG-ELEC-DOM" } }),
    prisma.customer.upsert({ where: { customerId: "CUST000003" }, update: {}, create: { customerId: "CUST000003", fullName: "Mehta Industries Ltd.",   customerType: "CORPORATE",  kycStatus: "VERIFIED", mobile: "+917654321098", email: "accounts@mehtaind.com",    status: "ACTIVE", segmentId: "SEG-GAS-IND" } }),
    prisma.customer.upsert({ where: { customerId: "CUST000004" }, update: {}, create: { customerId: "CUST000004", fullName: "Sunita Ramesh Desai",     customerType: "INDIVIDUAL", kycStatus: "PENDING",  mobile: "+916543210987", email: "sunita.desai@email.com",   status: "DRAFT",  segmentId: "SEG-WATER-DOM" } }),
    prisma.customer.upsert({ where: { customerId: "CUST000005" }, update: {}, create: { customerId: "CUST000005", fullName: "Anand Infra Corporation", customerType: "CORPORATE",  kycStatus: "VERIFIED", mobile: "+915432109876", email: "info@anandinfra.com",      status: "ACTIVE", segmentId: "SEG-GAS-COM" } }),
    prisma.customer.upsert({ where: { customerId: "CUST000006" }, update: {}, create: { customerId: "CUST000006", fullName: "Geeta Bhimrao Kulkarni",  customerType: "INDIVIDUAL", kycStatus: "PENDING",  mobile: "+914321098765", email: "geeta.kulkarni@email.com", status: "DRAFT",  segmentId: "SEG-GAS-DOM" } }),
    prisma.customer.upsert({ where: { customerId: "CUST000007" }, update: {}, create: { customerId: "CUST000007", fullName: "Gujarat Ceramics Pvt Ltd", customerType: "CORPORATE", kycStatus: "VERIFIED", mobile: "+913210987654", email: "finance@gjceramics.com",   status: "ACTIVE", segmentId: "SEG-ELEC-COM" } }),
  ]);
  console.log(`  ✓ Customers: ${customers.length}`);

  // ──────────────────────────────────────────────
  // 11. Premises
  // ──────────────────────────────────────────────
  const premises = await Promise.all([
    prisma.premise.upsert({ where: { premiseId: "PREM000001" }, update: {}, create: { premiseId: "PREM000001", addressLine1: "H-23, Navrangpura", addressLine2: "Near Stadium", buildingType: "RESIDENTIAL", geoLat: 23.022505, geoLon: 72.571362, status: "ACTIVE", areaId: "AHM-WEST" } }),
    prisma.premise.upsert({ where: { premiseId: "PREM000002" }, update: {}, create: { premiseId: "PREM000002", addressLine1: "Shop-4, CG Road, Ellisbridge", buildingType: "COMMERCIAL", geoLat: 23.033, geoLon: 72.563, status: "ACTIVE", areaId: "AHM-EAST" } }),
    prisma.premise.upsert({ where: { premiseId: "PREM000003" }, update: {}, create: { premiseId: "PREM000003", addressLine1: "Plot-7, GIDC Industrial Estate", buildingType: "INDUSTRIAL", status: "ACTIVE", areaId: "GAN-NORTH" } }),
    prisma.premise.upsert({ where: { premiseId: "PREM000004" }, update: {}, create: { premiseId: "PREM000004", addressLine1: "B-12, Satellite Road", buildingType: "RESIDENTIAL", status: "ACTIVE", areaId: "AHM-WEST" } }),
    prisma.premise.upsert({ where: { premiseId: "PREM000005" }, update: {}, create: { premiseId: "PREM000005", addressLine1: "D-302, Vastrapur Lake Road", buildingType: "RESIDENTIAL", status: "DRAFT", areaId: "AHM-EAST" } }),
  ]);
  console.log(`  ✓ Premises: ${premises.length}`);

  // ──────────────────────────────────────────────
  // 12. Accounts
  // ──────────────────────────────────────────────
  const accounts = await Promise.all([
    prisma.account.upsert({ where: { accountId: "ACCT000001" }, update: {}, create: { accountId: "ACCT000001", billDeliveryMode: "EMAIL", status: "ACTIVE", effectiveFrom: new Date("2024-01-15"), customerId: "CUST000001", premiseId: "PREM000001", cycleId: "BC-MONTHLY-1" } }),
    prisma.account.upsert({ where: { accountId: "ACCT000002" }, update: {}, create: { accountId: "ACCT000002", billDeliveryMode: "APP",   status: "ACTIVE", effectiveFrom: new Date("2024-01-15"), customerId: "CUST000001", premiseId: "PREM000002", cycleId: "BC-MONTHLY-2" } }),
    prisma.account.upsert({ where: { accountId: "ACCT000003" }, update: {}, create: { accountId: "ACCT000003", billDeliveryMode: "SMS",   status: "ACTIVE", effectiveFrom: new Date("2024-01-15"), customerId: "CUST000002", premiseId: "PREM000004", cycleId: "BC-MONTHLY-1" } }),
    prisma.account.upsert({ where: { accountId: "ACCT000004" }, update: {}, create: { accountId: "ACCT000004", billDeliveryMode: "EMAIL", status: "ACTIVE", effectiveFrom: new Date("2022-03-15"), customerId: "CUST000003", premiseId: "PREM000003", cycleId: "BC-QTR-1" } }),
    prisma.account.upsert({ where: { accountId: "ACCT000005" }, update: {}, create: { accountId: "ACCT000005", billDeliveryMode: "PRINT", status: "DRAFT",  effectiveFrom: new Date("2024-03-01"), customerId: "CUST000004", premiseId: "PREM000005", cycleId: "BC-MONTHLY-3" } }),
  ]);
  console.log(`  ✓ Accounts: ${accounts.length}`);

  // ──────────────────────────────────────────────
  // 13. Service Connections
  // ──────────────────────────────────────────────
  const conns = await Promise.all([
    prisma.serviceConnection.upsert({ where: { connectionId: "CONN000001" }, update: {}, create: { connectionId: "CONN000001", utilityType: "GAS_PNG",    startDate: new Date("2024-01-15"), status: "ACTIVE", accountId: "ACCT000001", segmentId: "SEG-GAS-DOM" } }),
    prisma.serviceConnection.upsert({ where: { connectionId: "CONN000002" }, update: {}, create: { connectionId: "CONN000002", utilityType: "ELECTRICITY", startDate: new Date("2024-01-15"), status: "ACTIVE", accountId: "ACCT000001", segmentId: "SEG-ELEC-DOM" } }),
    prisma.serviceConnection.upsert({ where: { connectionId: "CONN000003" }, update: {}, create: { connectionId: "CONN000003", utilityType: "GAS_PNG",    startDate: new Date("2023-06-01"), status: "ACTIVE", accountId: "ACCT000004", segmentId: "SEG-GAS-IND" } }),
    prisma.serviceConnection.upsert({ where: { connectionId: "CONN000004" }, update: {}, create: { connectionId: "CONN000004", utilityType: "GAS_PNG",    startDate: new Date("2022-03-15"), status: "ACTIVE", accountId: "ACCT000003", segmentId: "SEG-GAS-COM" } }),
    prisma.serviceConnection.upsert({ where: { connectionId: "CONN000005" }, update: {}, create: { connectionId: "CONN000005", utilityType: "WATER",      startDate: new Date("2024-03-01"), status: "DRAFT",  accountId: "ACCT000005", segmentId: "SEG-WATER-DOM" } }),
  ]);
  console.log(`  ✓ Service Connections: ${conns.length}`);

  // Gas Conn Details
  await prisma.gasConnDetail.upsert({ where: { connectionId: "CONN000001" }, update: {}, create: { connectionId: "CONN000001", serviceType: "PNG", regulatorSerial: "REG-2024-00123", pressureBandId: "PBAND-LP-DOM" } });
  await prisma.gasConnDetail.upsert({ where: { connectionId: "CONN000003" }, update: {}, create: { connectionId: "CONN000003", serviceType: "PNG", regulatorSerial: "REG-2022-00456", pressureBandId: "PBAND-HP-IND" } });
  await prisma.gasConnDetail.upsert({ where: { connectionId: "CONN000004" }, update: {}, create: { connectionId: "CONN000004", serviceType: "PNG", regulatorSerial: "REG-2023-00789", pressureBandId: "PBAND-MP-COM" } });
  await prisma.elecConnDetail.upsert({ where: { connectionId: "CONN000002" }, update: {}, create: { connectionId: "CONN000002", loadKw: 5.0, supplyVoltage: "LT", phaseType: "SINGLE" } });
  console.log(`  ✓ Connection Details seeded`);

  // ──────────────────────────────────────────────
  // 14. Routes
  // ──────────────────────────────────────────────
  await Promise.all([
    prisma.route.upsert({ where: { routeId: "RT-AHM-W-01" }, update: {}, create: { routeId: "RT-AHM-W-01", routeName: "AHM-West-Route-1", cycleGroup: "GRP-A", readerId: "EMP00123", status: "ACTIVE", areaId: "AHM-WEST" } }),
    prisma.route.upsert({ where: { routeId: "RT-AHM-W-02" }, update: {}, create: { routeId: "RT-AHM-W-02", routeName: "AHM-West-Route-2", cycleGroup: "GRP-A", readerId: "EMP00124", status: "ACTIVE", areaId: "AHM-WEST" } }),
    prisma.route.upsert({ where: { routeId: "RT-AHM-E-01" }, update: {}, create: { routeId: "RT-AHM-E-01", routeName: "AHM-East-Route-1", cycleGroup: "GRP-B", readerId: "EMP00125", status: "ACTIVE", areaId: "AHM-EAST" } }),
    prisma.route.upsert({ where: { routeId: "RT-GAN-01" },   update: {}, create: { routeId: "RT-GAN-01",   routeName: "Gandhinagar-Route-1", cycleGroup: "GRP-C", readerId: "EMP00126", status: "ACTIVE", areaId: "GAN-NORTH" } }),
  ]);
  console.log(`  ✓ Routes: 4`);

  // ──────────────────────────────────────────────
  // 15. Meters + Installations + Readings
  // ──────────────────────────────────────────────
  await Promise.all([
    prisma.meter.upsert({ where: { serialNo: "GAS-4521-XY" }, update: {}, create: { meterId: "MTR000001", serialNo: "GAS-4521-XY", meterType: "Electronic", make: "Honeywell", model: "ELF-G4", uom: "SCM", utilityType: "GAS", calibrationDue: new Date("2027-01-15"), status: "INSTALLED" } }),
    prisma.meter.upsert({ where: { serialNo: "GAS-4522-AB" }, update: {}, create: { meterId: "MTR000002", serialNo: "GAS-4522-AB", meterType: "Electronic", make: "Elster",    model: "BK-G4", uom: "SCM", utilityType: "GAS", calibrationDue: new Date("2027-02-20"), status: "INSTALLED" } }),
    prisma.meter.upsert({ where: { serialNo: "ELEC-7891-CD" }, update: {}, create: { meterId: "MTR000003", serialNo: "ELEC-7891-CD", meterType: "Smart", make: "Landis+Gyr", model: "E350", uom: "kWh", utilityType: "ELECTRICITY", calibrationDue: new Date("2028-06-01"), status: "INSTALLED" } }),
    prisma.meter.upsert({ where: { serialNo: "WAT-3301-EF" }, update: {}, create: { meterId: "MTR000004", serialNo: "WAT-3301-EF", meterType: "Mechanical", make: "Kranti", model: "WM-25", uom: "KL", utilityType: "WATER", calibrationDue: new Date("2026-12-01"), status: "INSTALLED" } }),
    prisma.meter.upsert({ where: { serialNo: "GAS-4523-GH" }, update: {}, create: { meterId: "MTR000005", serialNo: "GAS-4523-GH", meterType: "Electronic", make: "Honeywell", model: "ELF-G4", uom: "SCM", utilityType: "GAS", calibrationDue: new Date("2027-03-10"), status: "IN_STOCK" } }),
  ]);

  // Meter Installations
  await prisma.meterInstallation.upsert({ where: { installId: "INST000001" }, update: {}, create: { installId: "INST000001", installDate: new Date("2024-01-15"), reason: "NEW", meterId: "MTR000001", connectionId: "CONN000001" } });
  await prisma.meterInstallation.upsert({ where: { installId: "INST000002" }, update: {}, create: { installId: "INST000002", installDate: new Date("2024-01-15"), reason: "NEW", meterId: "MTR000003", connectionId: "CONN000002" } });

  // Meter Readings
  await prisma.meterReading.upsert({ where: { readingId: "RDG000001" }, update: {}, create: { readingId: "RDG000001", readingDate: new Date("2026-03-05"), readingValue: 1048.4, consumption: 8.4, readingType: "ACTUAL", status: "BILLED", meterId: "MTR000001", connectionId: "CONN000001", routeId: "RT-AHM-W-01" } });
  await prisma.meterReading.upsert({ where: { readingId: "RDG000002" }, update: {}, create: { readingId: "RDG000002", readingDate: new Date("2026-02-05"), readingValue: 1040.0, consumption: 9.2, readingType: "ACTUAL", status: "BILLED", meterId: "MTR000001", connectionId: "CONN000001", routeId: "RT-AHM-W-01" } });
  await prisma.meterReading.upsert({ where: { readingId: "RDG000003" }, update: {}, create: { readingId: "RDG000003", readingDate: new Date("2026-03-05"), readingValue: 8945.0, consumption: 245.0, readingType: "ACTUAL", status: "BILLED", meterId: "MTR000003", connectionId: "CONN000002", routeId: "RT-AHM-W-01" } });
  console.log(`  ✓ Meters: 5, Installations: 2, Readings: 3`);

  // ──────────────────────────────────────────────
  // 16. CNG Stations + Sales
  // ──────────────────────────────────────────────
  await Promise.all([
    prisma.cngStation.upsert({ where: { stationId: "CNG-AHM-001" }, update: {}, create: { stationId: "CNG-AHM-001", stationName: "Navrangpura CNG Station", city: "Ahmedabad", compressorType: "Fast-fill", dispenserCount: 4, status: "ACTIVE", areaId: "AHM-WEST" } }),
    prisma.cngStation.upsert({ where: { stationId: "CNG-AHM-002" }, update: {}, create: { stationId: "CNG-AHM-002", stationName: "Satellite Road CNG", city: "Ahmedabad", compressorType: "Standard", dispenserCount: 2, status: "ACTIVE", areaId: "AHM-WEST" } }),
    prisma.cngStation.upsert({ where: { stationId: "CNG-SURAT-001" }, update: {}, create: { stationId: "CNG-SURAT-001", stationName: "Surat Ring Road CNG", city: "Surat", compressorType: "Mother", dispenserCount: 6, status: "ACTIVE", areaId: "SURAT-N" } }),
    prisma.cngStation.upsert({ where: { stationId: "CNG-GAN-001" }, update: {}, create: { stationId: "CNG-GAN-001", stationName: "Gandhinagar Sector 11", city: "Gandhinagar", compressorType: "Standard", dispenserCount: 2, status: "ACTIVE", areaId: "GAN-NORTH" } }),
  ]);
  await prisma.cngSale.upsert({ where: { saleId: "SALE000001" }, update: {}, create: { saleId: "SALE000001", saleDate: new Date("2026-03-29"), quantityScm: 3.8, unitPrice: 80.0, amount: 304.0, stationId: "CNG-AHM-001", categoryId: "VEH-CAR-PRIV" } });
  await prisma.cngSale.upsert({ where: { saleId: "SALE000002" }, update: {}, create: { saleId: "SALE000002", saleDate: new Date("2026-03-29"), quantityScm: 2.2, unitPrice: 80.0, amount: 176.0, stationId: "CNG-AHM-001", categoryId: "VEH-AUTO-3W" } });
  console.log(`  ✓ CNG Stations: 4, Sales: 2`);

  // ──────────────────────────────────────────────
  // 17. Payment Channels & Gateways
  // ──────────────────────────────────────────────
  await Promise.all([
    prisma.paymentChannel.upsert({ where: { channelId: "CH-UPI" },    update: {}, create: { channelId: "CH-UPI",    channelName: "UPI",          channelType: "UPI",         provider: "NPCI",    status: "ACTIVE" } }),
    prisma.paymentChannel.upsert({ where: { channelId: "CH-BBPS" },   update: {}, create: { channelId: "CH-BBPS",   channelName: "BBPS",         channelType: "BBPS",        provider: "NPCI",    status: "ACTIVE" } }),
    prisma.paymentChannel.upsert({ where: { channelId: "CH-CARD" },   update: {}, create: { channelId: "CH-CARD",   channelName: "Credit/Debit Card", channelType: "CARD",   provider: "Visa/MC", status: "ACTIVE" } }),
    prisma.paymentChannel.upsert({ where: { channelId: "CH-NB" },     update: {}, create: { channelId: "CH-NB",     channelName: "Net Banking",  channelType: "NET_BANKING", provider: "Various", status: "ACTIVE" } }),
    prisma.paymentChannel.upsert({ where: { channelId: "CH-CASH" },   update: {}, create: { channelId: "CH-CASH",   channelName: "Cash Counter", channelType: "CASH",        provider: null,      status: "ACTIVE" } }),
  ]);
  await prisma.paymentGateway.upsert({ where: { gatewayId: "GW-RAZORPAY" }, update: {}, create: { gatewayId: "GW-RAZORPAY", provider: "Razorpay", merchantId: "rzp_live_enz001", callbackUrl: "https://api.enerza.in/webhooks/razorpay", environment: "PRODUCTION", status: "ACTIVE" } });
  await prisma.paymentGateway.upsert({ where: { gatewayId: "GW-PAYTM" },    update: {}, create: { gatewayId: "GW-PAYTM",    provider: "Paytm",    merchantId: "ENERZA_PAYTM_01", callbackUrl: "https://api.enerza.in/webhooks/paytm", environment: "PRODUCTION", status: "ACTIVE" } });
  console.log(`  ✓ Payment Channels: 5, Gateways: 2`);

  // ──────────────────────────────────────────────
  // 18. API Partners + Credentials + Endpoints
  // ──────────────────────────────────────────────
  const partners = await Promise.all([
    prisma.apiPartner.upsert({ where: { partnerId: "PART-BBPS-01" },    update: {}, create: { partnerId: "PART-BBPS-01",    partnerName: "BharatBillPay System (NPCI)", partnerType: "PAYMENT_AGG", contactEmail: "api@bbps.npci.org.in",  settlementMode: "NEFT", status: "ACTIVE" } }),
    prisma.apiPartner.upsert({ where: { partnerId: "PART-PAYTM-01" },   update: {}, create: { partnerId: "PART-PAYTM-01",   partnerName: "Paytm Payments Bank",         partnerType: "PAYMENT_AGG", contactEmail: "util@paytm.com",         settlementMode: "NEFT", status: "ACTIVE" } }),
    prisma.apiPartner.upsert({ where: { partnerId: "PART-PHONEPE-01" }, update: {}, create: { partnerId: "PART-PHONEPE-01", partnerName: "PhonePe Pvt Ltd",             partnerType: "PAYMENT_AGG", contactEmail: "billers@phonepe.com",    settlementMode: "RTGS", status: "ACTIVE" } }),
    prisma.apiPartner.upsert({ where: { partnerId: "PART-GSTN-01" },    update: {}, create: { partnerId: "PART-GSTN-01",    partnerName: "GSTN Government Portal",       partnerType: "GOVT_PORTAL", contactEmail: "api@gstn.gov.in",        settlementMode: null,   status: "ACTIVE" } }),
    prisma.apiPartner.upsert({ where: { partnerId: "PART-HDFC-01" },    update: {}, create: { partnerId: "PART-HDFC-01",    partnerName: "HDFC Bank",                    partnerType: "BANK",        contactEmail: "apiteam@hdfcbank.com",   settlementMode: "NEFT", status: "ACTIVE" } }),
  ]);
  await prisma.apiCredential.upsert({ where: { credentialId: "CRED-BBPS-01" },    update: {}, create: { credentialId: "CRED-BBPS-01",    clientId: "bbps_client_001",    secretRef: "vault:bbps/prod/secret",    ipWhitelist: '["103.22.45.0/24"]', partnerId: "PART-BBPS-01",    tokenExpiry: new Date("2027-02-01") } });
  await prisma.apiCredential.upsert({ where: { credentialId: "CRED-PAYTM-01" },   update: {}, create: { credentialId: "CRED-PAYTM-01",   clientId: "paytm_client_001",   secretRef: "vault:paytm/prod/secret",   ipWhitelist: '["182.73.0.0/16"]',  partnerId: "PART-PAYTM-01",   tokenExpiry: new Date("2027-04-01") } });
  await prisma.apiCredential.upsert({ where: { credentialId: "CRED-PHONEPE-01" }, update: {}, create: { credentialId: "CRED-PHONEPE-01", clientId: "phonepe_client_001", secretRef: "vault:phonepe/prod/secret", ipWhitelist: '["103.21.0.0/16"]',  partnerId: "PART-PHONEPE-01", tokenExpiry: new Date("2027-01-01") } });

  const endpoints = await Promise.all([
    prisma.apiEndpointCatalog.upsert({ where: { endpointCode: "FETCH_BILL" },    update: {}, create: { endpointId: "EP-FETCH-BILL",    endpointCode: "FETCH_BILL",    operationType: "FETCH_BILL",    requestMethod: "GET",  authType: "OAUTH2", syncFlag: true,  version: "v1" } }),
    prisma.apiEndpointCatalog.upsert({ where: { endpointCode: "POST_PAYMENT" },  update: {}, create: { endpointId: "EP-POST-PAYMENT",  endpointCode: "POST_PAYMENT",  operationType: "POST_PAYMENT",  requestMethod: "POST", authType: "OAUTH2", syncFlag: true,  version: "v1" } }),
    prisma.apiEndpointCatalog.upsert({ where: { endpointCode: "CHECK_STATUS" },  update: {}, create: { endpointId: "EP-CHECK-STATUS",  endpointCode: "CHECK_STATUS",  operationType: "CHECK_STATUS",  requestMethod: "GET",  authType: "OAUTH2", syncFlag: true,  version: "v1" } }),
    prisma.apiEndpointCatalog.upsert({ where: { endpointCode: "WEBHOOK_EVENT" }, update: {}, create: { endpointId: "EP-WEBHOOK-EVENT", endpointCode: "WEBHOOK_EVENT", operationType: "WEBHOOK",       requestMethod: "POST", authType: "HMAC",   syncFlag: false, version: "v1" } }),
  ]);

  // Endpoint Mappings
  for (const ep of endpoints) {
    await prisma.apiEndpointMapping.upsert({
      where: { mappingId: `MAP-BBPS-${ep.endpointId}` },
      update: {},
      create: { mappingId: `MAP-BBPS-${ep.endpointId}`, partnerId: "PART-BBPS-01", endpointId: ep.endpointId, enabled: true, effectiveFrom: new Date("2024-02-01") },
    });
  }
  console.log(`  ✓ API Partners: ${partners.length}, Credentials: 3, Endpoints: ${endpoints.length}`);

  // ──────────────────────────────────────────────
  // 19. App Users + Devices + Account Links
  // ──────────────────────────────────────────────
  await Promise.all([
    prisma.appUser.upsert({ where: { customerId: "CUST000001" }, update: {}, create: { appUserId: "APPU000001", mobile: "+919876543210", email: "ramesh.shah@email.com", otpVerified: "Y", status: "ACTIVE", customerId: "CUST000001" } }),
    prisma.appUser.upsert({ where: { customerId: "CUST000002" }, update: {}, create: { appUserId: "APPU000002", mobile: "+918765432109", email: "priya.patel@email.com",  otpVerified: "Y", status: "ACTIVE", customerId: "CUST000002" } }),
    prisma.appUser.upsert({ where: { customerId: "CUST000003" }, update: {}, create: { appUserId: "APPU000003", mobile: "+917654321098", email: "accounts@mehtaind.com",   otpVerified: "Y", status: "ACTIVE", customerId: "CUST000003" } }),
  ]);
  await prisma.appDevice.upsert({ where: { deviceId: "DEV000001" }, update: {}, create: { deviceId: "DEV000001", osType: "ANDROID", appVersion: "3.2.1", pushToken: "fcm:abc123", active: true, appUserId: "APPU000001" } });
  await prisma.appDevice.upsert({ where: { deviceId: "DEV000002" }, update: {}, create: { deviceId: "DEV000002", osType: "IOS",     appVersion: "3.2.1", pushToken: "apns:xyz456", active: true, appUserId: "APPU000001" } });
  await prisma.appDevice.upsert({ where: { deviceId: "DEV000003" }, update: {}, create: { deviceId: "DEV000003", osType: "ANDROID", appVersion: "3.1.4", pushToken: "fcm:def789", active: true, appUserId: "APPU000002" } });
  await prisma.appAccountLink.upsert({ where: { linkId: "LNK000001" }, update: {}, create: { linkId: "LNK000001", ownershipType: "OWNER", appUserId: "APPU000001", accountId: "ACCT000001" } });
  await prisma.appAccountLink.upsert({ where: { linkId: "LNK000002" }, update: {}, create: { linkId: "LNK000002", ownershipType: "OWNER", appUserId: "APPU000001", accountId: "ACCT000002" } });
  await prisma.appAccountLink.upsert({ where: { linkId: "LNK000003" }, update: {}, create: { linkId: "LNK000003", ownershipType: "OWNER", appUserId: "APPU000002", accountId: "ACCT000003" } });
  console.log(`  ✓ App Users: 3, Devices: 3, Account Links: 3`);
  
  // 20. FI-CA & Commercial Data (Idempotent)
  // ──────────────────────────────────────────────
  console.log("- Seeding FI-CA & Commercial...");

  try {
    await prisma.dunningLevel.createMany({
      data: [
        { levelId: "L0_REMINDER",   levelName: "Soft Reminder",      daysOverdue: 5,  penaltyFee: 0.00,   actionType: "EMAIL", status: "ACTIVE" },
        { levelId: "L1_FORMAL",     levelName: "Formal Notice",      daysOverdue: 15, penaltyFee: 150.00, actionType: "NOTICE", status: "ACTIVE" },
        { levelId: "L2_DISCONNECT", levelName: "Disconnection Warning", daysOverdue: 25, penaltyFee: 500.00, actionType: "DISCONNECT", status: "ACTIVE" },
        { levelId: "L3_LEGAL",      levelName: "Legal Recovery",     daysOverdue: 45, penaltyFee: 1200.00, actionType: "RECOVERY", status: "ACTIVE" },
      ],
      skipDuplicates: true
    });
  } catch (e) { console.log("  ! Dunning Levels already exist."); }

  const activeAccounts = await prisma.account.findMany({ take: 5 });
  for (const acc of activeAccounts) {
    // Budget Billing Plan (Upserting based on accountId)
    const existingBBP = await prisma.budgetBillingPlan.findFirst({ where: { accountId: acc.accountId } });
    if (!existingBBP) {
      await prisma.budgetBillingPlan.create({
        data: {
          accountId: acc.accountId,
          monthlyAmount: 2500.00,
          startDate: new Date(),
          reconciliationMonth: 3, // March
          status: "ACTIVE"
        }
      });
    }

    const existingSD = await prisma.securityDeposit.findFirst({ where: { accountId: acc.accountId } });
    if (!existingSD) {
      await prisma.securityDeposit.create({
        data: {
          accountId: acc.accountId,
          amount: 5000.00,
          paymentDate: new Date("2024-01-01"),
          status: "HELD"
        }
      });
    }
  }

  const sampleBills = await prisma.bill.findMany({ 
    take: 3, 
    where: { status: "PENDING" } 
  });
  
  for (const bill of sampleBills) {
    await prisma.paymentOrder.create({
      data: {
        billId: bill.billId,
        accountId: bill.accountId,
        amount: bill.totalAmount,
        channelId: "CH-BBPS",
        gatewayId: "GW-RAZORPAY",
        status: "SUCCESS"
      }
    });
  }
  // ──────────────────────────────────────────────
  // 21. TOD Slots & Power Network (New) Secure Seeding
  // ──────────────────────────────────────────────
  console.log("- Seeding TOD Slots & Power Network (Guarded)...");
  
  try {
    await prisma.todSlot.createMany({
      data: [
        { slotId: "TOD-OFF", name: "Off-Peak", startTime: "22:00", endTime: "06:00", rateModifier: 0.8 },
        { slotId: "TOD-NRM", name: "Normal",   startTime: "06:00", endTime: "18:00", rateModifier: 1.0 },
        { slotId: "TOD-PEK", name: "Peak",     startTime: "18:00", endTime: "22:00", rateModifier: 1.2 },
      ],
      skipDuplicates: true
    });
  } catch (e) { console.log("  ! TOD Slots already exist."); }

  const sub = await prisma.subStation.upsert({
    where: { subStationId: "SS-WEST-01" },
    update: {},
    create: {
      subStationId: "SS-WEST-01",
      name: "West Zone Substation A",
      voltageLevel: "66kV",
      status: "ACTIVE"
    }
  });

  const feeder = await prisma.feeder.upsert({
    where: { feederId: "FDR-IND-01" },
    update: {},
    create: {
      feederId: "FDR-IND-01",
      name: "Industrial Feeder 1",
      subStationId: sub.subStationId,
      status: "ACTIVE"
    }
  });

  const dt = await prisma.distributionTransformer.upsert({
    where: { dtId: "DT-IND-A1" },
    update: {},
    create: {
      dtId: "DT-IND-A1",
      name: "Industrial DT Block A",
      feederId: feeder.feederId,
      capacityKva: 1000.0,
      status: "ACTIVE"
    }
  });

  // Update existing accounts for BRD alignment
  const powAccounts = await prisma.account.findMany({ 
    where: { serviceConnections: { some: { utilityType: "ELECTRICITY" } } }
  });

  for (const acc of powAccounts) {
    await prisma.account.update({
      where: { accountId: acc.accountId },
      data: { bpType: "CORPORATE" }
    });

    const conn = await prisma.serviceConnection.findFirst({
      where: { accountId: acc.accountId, utilityType: "ELECTRICITY" }
    });

    if (conn) {
      await prisma.serviceConnection.update({
        where: { connectionId: conn.connectionId },
        data: { podId: `POD-${conn.connectionId.substring(0, 8).toUpperCase()}` }
      });

      await prisma.elecConnDetail.update({
        where: { connectionId: conn.connectionId },
        data: { 
          dtId: dt.dtId,
          contractDemandKva: 50.0,
          isNetMetered: true,
          solarCapacityKw: 15.0
        }
      });
    }
  }

  // Add sample industrial readings (Secure IDs)
  const firstMeter = await prisma.meter.findFirst();
  const firstRoute = await prisma.route.findFirst();

  if (firstMeter && firstRoute) {
    for (const acc of powAccounts) {
      const conn = await prisma.serviceConnection.findFirst({
        where: { accountId: acc.accountId, utilityType: "ELECTRICITY" }
      });
      if (conn) {
        await prisma.meterReading.create({
          data: {
            connectionId: conn.connectionId,
            readingDate: new Date(),
            readingValue: 5000.0,
            consumption: 1200.0,
            kvah: 1305.0,
            maxDemand: 55.0,
            readingType: "AUTO",
            meterId: firstMeter.meterId,
            routeId: firstRoute.routeId,
            status: "FINAL"
          }
        });
      }
    }
    console.log(`  ✓ Industrial Readings: ${powAccounts.length} seeded.`);
  } else {
    console.log("  ! Skipping industrial readings (No meter/route found).");
  }

  console.log(`  ✓ TOD: 3, Networks: 1 SS/FDR/DT, Readings: Industrial.`);

  // ──────────────────────────────────────────────
  // 22. Field Service & Config (Phase 1)
  // ──────────────────────────────────────────────
  console.log("- Seeding Field Service & Config...");

  await prisma.utilityConfig.upsert({
    where: { configId: "SYSTEM_DEFAULT" },
    update: {},
    create: {
      configId: "SYSTEM_DEFAULT",
      utilityName: "Enerza Unified Utility",
      prorationMode: "IMMEDIATE",
      minBillingMode: "FIXED",
      minBillingValue: 250.00,
      defaultSlaHours: 24,
    }
  });

  const technicians = [
    { technicianId: "TECH001", fullName: "John Field", mobile: "9876543210", pincodeScope: "400001" },
    { technicianId: "TECH002", fullName: "Sarah Service", mobile: "9876543211", pincodeScope: "400002" },
  ];

  for (const tech of technicians) {
    await prisma.technician.upsert({
      where: { mobile: tech.mobile },
      update: { fullName: tech.fullName, pincodeScope: tech.pincodeScope },
      create: tech
    });
  }

  const items = [
    { itemId: "ITEM001", itemName: "Meter Seal (Green)", category: "SEAL", uom: "NOS", unitCost: 5.50 },
    { itemId: "ITEM002", itemName: "Gas Regulator (Std)", category: "REGULATOR", uom: "NOS", unitCost: 450.00 },
    { itemId: "ITEM003", itemName: "Gasket (1/2 inch)", category: "SPARE", uom: "NOS", unitCost: 1.25 },
  ];

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { itemId: item.itemId },
      update: { itemName: item.itemName, unitCost: item.unitCost },
      create: item
    });
  }

  const firstAcc = await prisma.account.findFirst();
  if (firstAcc) {
    const ticket = await prisma.serviceTicket.upsert({
      where: { ticketId: "TKT-0001" },
      update: {},
      create: {
        ticketId: "TKT-0001",
        accountId: firstAcc.accountId,
        subject: "High Bill Dispute",
        description: "Customer reports unusually high bill compared to last month.",
        status: "OPEN",
        priority: "HIGH",
        category: "BILLING"
      }
    });

    await prisma.workOrder.upsert({
      where: { workOrderId: "WO-0001" },
      update: {},
      create: {
        workOrderId: "WO-0001",
        ticketId: ticket.ticketId,
        technicianId: "TECH001",
        status: "ASSIGNED",
        scheduledDate: new Date(),
        inspectionNotes: "Pending technician arrival."
      }
    });
  }

  console.log("\n✅  Seed complete — Industrial Field Service Ready!\n");
}

main()
  .catch((e) => { 
    console.error("❌  Seed Failed Detailed:");
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(JSON.stringify(e, null, 2));
    }
    process.exit(1); 
  })
  .finally(async () => { await prisma.$disconnect(); });
