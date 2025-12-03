import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const period = searchParams.get("period") || "week"; // day, week, month, all

    let stats;

    try {
      // Get all scans
      const allScans = await prisma.qRScan.findMany({
        where: businessId ? { businessId } : undefined,
        orderBy: { scannedAt: "desc" },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const now = new Date();
      let filteredScans = allScans;

      // Filter by period
      if (period === "day") {
        const start = startOfDay(now);
        filteredScans = allScans.filter(
          (scan) => new Date(scan.scannedAt) >= start
        );
      } else if (period === "week") {
        const start = startOfWeek(now);
        filteredScans = allScans.filter(
          (scan) => new Date(scan.scannedAt) >= start
        );
      } else if (period === "month") {
        const start = startOfMonth(now);
        filteredScans = allScans.filter(
          (scan) => new Date(scan.scannedAt) >= start
        );
      }

      // Calculate statistics
      const totalScans = allScans.length;
      const periodScans = filteredScans.length;

      // Group by business
      const byBusiness = allScans.reduce((acc, scan) => {
        const id = scan.businessId;
        if (!acc[id]) {
          acc[id] = {
            businessId: id,
            businessName: scan.business.name,
            totalScans: 0,
            periodScans: 0,
          };
        }
        acc[id].totalScans++;
        if (filteredScans.includes(scan)) {
          acc[id].periodScans++;
        }
        return acc;
      }, {} as Record<string, any>);

      // Group by hour for heatmap
      const byHour = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
      }));

      filteredScans.forEach((scan) => {
        const hour = new Date(scan.scannedAt).getHours();
        byHour[hour].count++;
      });

      // Group by date for trends
      const byDate = filteredScans.reduce((acc, scan) => {
        const date = new Date(scan.scannedAt).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate trends (compare with previous period)
      let previousPeriodScans = 0;
      if (period === "day") {
        const previousStart = startOfDay(subDays(now, 1));
        const previousEnd = startOfDay(now);
        previousPeriodScans = allScans.filter(
          (scan) =>
            new Date(scan.scannedAt) >= previousStart &&
            new Date(scan.scannedAt) < previousEnd
        ).length;
      } else if (period === "week") {
        const previousStart = startOfWeek(subWeeks(now, 1));
        const previousEnd = startOfWeek(now);
        previousPeriodScans = allScans.filter(
          (scan) =>
            new Date(scan.scannedAt) >= previousStart &&
            new Date(scan.scannedAt) < previousEnd
        ).length;
      } else if (period === "month") {
        const previousStart = startOfMonth(subMonths(now, 1));
        const previousEnd = startOfMonth(now);
        previousPeriodScans = allScans.filter(
          (scan) =>
            new Date(scan.scannedAt) >= previousStart &&
            new Date(scan.scannedAt) < previousEnd
        ).length;
      }

      const trend =
        previousPeriodScans > 0
          ? ((periodScans - previousPeriodScans) / previousPeriodScans) * 100
          : periodScans > 0
          ? 100
          : 0;

      stats = {
        totalScans,
        periodScans,
        trend: Math.round(trend * 100) / 100,
        byBusiness: Object.values(byBusiness),
        byHour,
        byDate: Object.entries(byDate).map(([date, count]) => ({
          date,
          count,
        })),
        recentScans: filteredScans.slice(0, 50).map((scan) => ({
          id: scan.id,
          businessId: scan.businessId,
          businessName: scan.business.name,
          scannedAt: scan.scannedAt,
        })),
      };
    } catch (error) {
      // Fallback to Supabase
      const supabase = createServerSupabaseClient();
      let query = supabase
        .from("QRScan")
        .select("*, business:Business(id, name)");

      if (businessId) {
        query = query.eq("businessId", businessId);
      }

      const { data: allScans, error: scanError } = await query.order(
        "scannedAt",
        { ascending: false }
      );

      if (scanError) {
        throw new Error(`Supabase error: ${scanError.message}`);
      }

      const now = new Date();
      let filteredScans = allScans || [];

      // Filter by period
      if (period === "day") {
        const start = startOfDay(now);
        filteredScans = (allScans || []).filter(
          (scan: any) => new Date(scan.scannedAt) >= start
        );
      } else if (period === "week") {
        const start = startOfWeek(now);
        filteredScans = (allScans || []).filter(
          (scan: any) => new Date(scan.scannedAt) >= start
        );
      } else if (period === "month") {
        const start = startOfMonth(now);
        filteredScans = (allScans || []).filter(
          (scan: any) => new Date(scan.scannedAt) >= start
        );
      }

      const totalScans = (allScans || []).length;
      const periodScans = filteredScans.length;

      // Group by business
      const byBusiness = (allScans || []).reduce((acc: any, scan: any) => {
        const id = scan.businessId;
        if (!acc[id]) {
          acc[id] = {
            businessId: id,
            businessName: scan.business?.name || "Unknown",
            totalScans: 0,
            periodScans: 0,
          };
        }
        acc[id].totalScans++;
        if (filteredScans.includes(scan)) {
          acc[id].periodScans++;
        }
        return acc;
      }, {});

      // Group by hour
      const byHour = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
      }));

      filteredScans.forEach((scan: any) => {
        const hour = new Date(scan.scannedAt).getHours();
        byHour[hour].count++;
      });

      // Group by date
      const byDate = filteredScans.reduce((acc: any, scan: any) => {
        const date = new Date(scan.scannedAt).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Calculate trends
      let previousPeriodScans = 0;
      if (period === "day") {
        const previousStart = startOfDay(subDays(now, 1));
        const previousEnd = startOfDay(now);
        previousPeriodScans = (allScans || []).filter(
          (scan: any) =>
            new Date(scan.scannedAt) >= previousStart &&
            new Date(scan.scannedAt) < previousEnd
        ).length;
      } else if (period === "week") {
        const previousStart = startOfWeek(subWeeks(now, 1));
        const previousEnd = startOfWeek(now);
        previousPeriodScans = (allScans || []).filter(
          (scan: any) =>
            new Date(scan.scannedAt) >= previousStart &&
            new Date(scan.scannedAt) < previousEnd
        ).length;
      } else if (period === "month") {
        const previousStart = startOfMonth(subMonths(now, 1));
        const previousEnd = startOfMonth(now);
        previousPeriodScans = (allScans || []).filter(
          (scan: any) =>
            new Date(scan.scannedAt) >= previousStart &&
            new Date(scan.scannedAt) < previousEnd
        ).length;
      }

      const trend =
        previousPeriodScans > 0
          ? ((periodScans - previousPeriodScans) / previousPeriodScans) * 100
          : periodScans > 0
          ? 100
          : 0;

      stats = {
        totalScans,
        periodScans,
        trend: Math.round(trend * 100) / 100,
        byBusiness: Object.values(byBusiness),
        byHour,
        byDate: Object.entries(byDate).map(([date, count]) => ({
          date,
          count,
        })),
        recentScans: filteredScans.slice(0, 50).map((scan: any) => ({
          id: scan.id,
          businessId: scan.businessId,
          businessName: scan.business?.name || "Unknown",
          scannedAt: scan.scannedAt,
        })),
      };
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching QR scan analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
