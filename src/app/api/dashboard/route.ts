import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const [
      allItems,
      todayStockIn,
      todayConsumption,
      todayWastage,
      recentStockIn,
      lowStockItems,
    ] = await Promise.all([
      prisma.inventoryItem.findMany({
        select: { currentStock: true, purchasePrice: true, minStockLevel: true },
      }),
      prisma.stockIn.aggregate({
        where: { date: { gte: dayStart, lte: dayEnd } },
        _sum: { totalCost: true },
      }),
      prisma.consumption.count({
        where: { date: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.wastage.aggregate({
        where: { date: { gte: dayStart, lte: dayEnd } },
        _sum: { quantity: true },
      }),
      prisma.stockIn.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          item: { select: { name: true, unit: true } },
          supplier: { select: { name: true } },
        },
      }),
      prisma.inventoryItem.findMany({
        where: {
          AND: [
            { currentStock: { lte: prisma.inventoryItem.fields.minStockLevel } },
          ],
        },
        include: { category: { select: { name: true } } },
        orderBy: { currentStock: "asc" },
        take: 10,
      }),
    ]);

    const totalValue = allItems.reduce(
      (sum, item) => sum + item.currentStock * item.purchasePrice,
      0
    );
    const lowStock = allItems.filter(
      (item) => item.currentStock <= item.minStockLevel && item.currentStock > 0
    ).length;
    const outOfStock = allItems.filter((item) => item.currentStock <= 0).length;

    // Get actual low stock items with details
    const lowStockItemsDetailed = await prisma.inventoryItem.findMany({
      where: { currentStock: { lte: 5 } },
      include: { category: { select: { name: true } } },
      orderBy: { currentStock: "asc" },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        totalValue,
        lowStock,
        outOfStock,
        todayPurchases: todayStockIn._sum.totalCost || 0,
        todayConsumption,
        todayWastage: todayWastage._sum.quantity || 0,
        totalItems: allItems.length,
      },
      recentStockIn,
      lowStockItems: lowStockItemsDetailed,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
