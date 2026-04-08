import { prisma } from "./prisma";

export interface NRWResult {
  zoneId: string;
  zoneName: string;
  supplyVolume: number;
  consumptionVolume: number;
  lossValue: number;
  lossPercentage: number;
  period: string;
}

/**
 * Calculates the Non-Revenue Water (NRW) metric for a specific supply zone.
 * NRW = (Bulk Supply - Consumer Consumption) / Bulk Supply * 100
 */
export async function calculateNRW(zoneId: string, startDate: Date, endDate: Date): Promise<NRWResult | null> {
  // 1. Get Zone Info
  const zone = await prisma.supplyZone.findUnique({
    where: { supplyZoneId: zoneId },
  });
  if (!zone) return null;

  // 2. Get Bulk Supply total for the period
  const bulkReads = await prisma.bulkMeterRead.findMany({
    where: {
      supplyZoneId: zoneId,
      readDate: { gte: startDate, lte: endDate },
    }
  });
  const supplyVolume = bulkReads.reduce((acc: number, r: { valueScm: number }) => acc + r.valueScm, 0);

  // 3. Get all Customer Connections in this zone
  const connections = await prisma.waterConnDetail.findMany({
    where: { supplyZoneId: zoneId },
    select: { connectionId: true }
  });
  const connIds = connections.map(c => c.connectionId);

  // 4. Sum Customer Consumption from Meter Readings
  const readings = await prisma.meterReading.findMany({
    where: {
      connectionId: { in: connIds },
      readingDate: { gte: startDate, lte: endDate },
      status: "FINAL" // Only count confirmed readings
    }
  });
  const consumptionVolume = readings.reduce((acc: number, r: { consumption: number }) => acc + r.consumption, 0);

  // 5. Calculate Metrics
  const lossValue = supplyVolume - consumptionVolume;
  const lossPercentage = supplyVolume > 0 ? (lossValue / supplyVolume) * 100 : 0;

  return {
    zoneId,
    zoneName: zone.name,
    supplyVolume,
    consumptionVolume,
    lossValue,
    lossPercentage,
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
  };
}
