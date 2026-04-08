import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNRW } from "@/lib/water-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get("zoneId");
    
    // Default to last 30 days if no dates provided
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : thirtyDaysAgo;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : now;

    if (zoneId) {
      const result = await calculateNRW(zoneId, startDate, endDate);
      return NextResponse.json({ success: true, data: result });
    }

    // If no zoneId, return summary for all zones
    const zones = await prisma.supplyZone.findMany({ where: { status: "ACTIVE" } });
    const results = await Promise.all(
      zones.map((z: { supplyZoneId: string }) => calculateNRW(z.supplyZoneId, startDate, endDate))
    );

    return NextResponse.json({
      success: true,
      data: results.filter((r): r is NonNullable<typeof r> => r !== null)
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
