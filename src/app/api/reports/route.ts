import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(new Date());
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());

    // Get all inventory items
    const items = await prisma.inventoryItem.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    // Get stock movements for the period
    const [stockIns, consumptions, wastages] = await Promise.all([
      prisma.stockIn.findMany({
        where: { date: { gte: start, lte: end } },
        include: { item: { select: { id: true, name: true } } },
      }),
      prisma.consumption.findMany({
        where: { date: { gte: start, lte: end } },
        include: { item: { select: { id: true, name: true } } },
      }),
      prisma.wastage.findMany({
        where: { date: { gte: start, lte: end } },
        include: { item: { select: { id: true, name: true } } },
      }),
    ]);

    // Build report per item
    const report = items.map((item) => {
      const itemStockIns = stockIns.filter((s) => s.itemId === item.id);
      const itemConsumptions = consumptions.filter((c) => c.itemId === item.id);
      const itemWastages = wastages.filter((w) => w.itemId === item.id);

      const purchased = itemStockIns.reduce((sum, s) => sum + s.quantity, 0);
      const purchasedCost = itemStockIns.reduce((sum, s) => sum + s.totalCost, 0);
      const consumed = itemConsumptions.reduce((sum, c) => sum + c.quantity, 0);
      const wasted = itemWastages.reduce((sum, w) => sum + w.quantity, 0);

      // Opening stock = current - purchased + consumed + wasted
      const openingStock = item.currentStock - purchased + consumed + wasted;
      const closingStock = item.currentStock;

      return {
        id: item.id,
        name: item.name,
        category: item.category.name,
        unit: item.unit,
        openingStock: Math.max(0, openingStock),
        purchased,
        purchasedCost,
        consumed,
        wasted,
        closingStock,
        currentValue: closingStock * item.purchasePrice,
        purchasePrice: item.purchasePrice,
      };
    });

    const summary = {
      totalPurchasedCost: stockIns.reduce((sum, s) => sum + s.totalCost, 0),
      totalConsumed: consumptions.length,
      totalWasted: wastages.length,
      totalItems: items.length,
    };

    return NextResponse.json({ report, summary, startDate: start, endDate: end });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
