import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Top consumed items
    const consumptionByItem = await prisma.consumption.groupBy({
      by: ["itemId"],
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const topItemIds = consumptionByItem.map((c) => c.itemId);
    const topItems = await prisma.inventoryItem.findMany({
      where: { id: { in: topItemIds } },
      select: { id: true, name: true, unit: true },
    });

    const topConsumed = consumptionByItem.map((c) => {
      const item = topItems.find((i) => i.id === c.itemId);
      return {
        name: item?.name || "Unknown",
        unit: item?.unit || "",
        quantity: c._sum.quantity || 0,
      };
    });

    // Wastage by reason
    const wastageByReason = await prisma.wastage.groupBy({
      by: ["reason"],
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { quantity: true },
      _count: { id: true },
    });

    // Daily stock in (last 30 days)
    const dailyStockIn = await prisma.stockIn.groupBy({
      by: ["date"],
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { totalCost: true },
      orderBy: { date: "asc" },
    });

    // Format daily data
    const dailyData: Record<string, number> = {};
    for (let i = days; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM dd");
      dailyData[d] = 0;
    }
    dailyStockIn.forEach((d) => {
      const key = format(new Date(d.date), "MMM dd");
      dailyData[key] = (dailyData[key] || 0) + (d._sum.totalCost || 0);
    });

    const dailyStockInFormatted = Object.entries(dailyData).map(([date, value]) => ({
      date,
      value,
    }));

    // Category-wise inventory value
    const categories = await prisma.category.findMany({
      include: {
        items: { select: { currentStock: true, purchasePrice: true } },
      },
    });

    const categoryValues = categories.map((cat) => ({
      name: cat.name,
      value: cat.items.reduce((sum, item) => sum + item.currentStock * item.purchasePrice, 0),
    }));

    // Monthly food cost (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfDay(subDays(new Date(), i * 30 + 30));
      const monthEnd = endOfDay(subDays(new Date(), i * 30));
      const cost = await prisma.stockIn.aggregate({
        where: { date: { gte: monthStart, lte: monthEnd } },
        _sum: { totalCost: true },
      });
      monthlyData.push({
        month: format(monthEnd, "MMM yyyy"),
        cost: cost._sum.totalCost || 0,
      });
    }

    return NextResponse.json({
      topConsumed,
      wastageByReason: wastageByReason.map((w) => ({
        reason: w.reason,
        quantity: w._sum.quantity || 0,
        count: w._count.id,
      })),
      dailyStockIn: dailyStockInFormatted,
      categoryValues,
      monthlyFoodCost: monthlyData,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
