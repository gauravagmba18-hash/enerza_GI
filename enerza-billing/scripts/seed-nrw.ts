import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedNRW() {
  console.log("🌱 Seeding NRW data...");

  // 1. Create Supply Zones
  const zoneA = await prisma.supplyZone.create({
    data: { name: "Sector 14 - North Zone", utilityType: "WATER" }
  });
  const zoneB = await prisma.supplyZone.create({
    data: { name: "Indira Nagar - Zone B", utilityType: "WATER" }
  });

  // 2. Add Bulk Meter Reads for last 30 days
  const now = new Date();
  await prisma.bulkMeterRead.createMany({
    data: [
      { supplyZoneId: zoneA.supplyZoneId, readDate: now, valueScm: 5000, status: "FINAL" },
      { supplyZoneId: zoneB.supplyZoneId, readDate: now, valueScm: 8000, status: "FINAL" },
    ]
  });

  // 3. Link some existing Water Connections to these Zones
  const waterConns = await prisma.waterConnDetail.findMany({ take: 10 });
  for (let i = 0; i < waterConns.length; i++) {
    await prisma.waterConnDetail.update({
      where: { connectionId: waterConns[i].connectionId },
      data: { supplyZoneId: i < 5 ? zoneA.supplyZoneId : zoneB.supplyZoneId }
    });
    
    // Create mock consumption reading for these connections
    await prisma.meterReading.create({
      data: {
        connectionId: waterConns[i].connectionId,
        meterId: "dummy-meter", // Assumes a meter exists or just bypass FK if possible
        readingDate: now,
        readingValue: 100,
        consumption: i < 5 ? 800 : 1200, // Zone A total ~4000 (20% loss), Zone B total ~6000 (25% loss)
        readingType: "ACTUAL",
        status: "FINAL",
        routeId: "dummy-route"
      }
    });
  }

  console.log("✅ NRW Seed complete!");
}

seedNRW().catch(e => console.error(e)).finally(() => prisma.$disconnect());
