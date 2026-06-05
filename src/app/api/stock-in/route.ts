import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [stockIns, total] = await Promise.all([
      prisma.stockIn.findMany({
        take: limit,
        skip: offset,
        orderBy: { date: "desc" },
        include: {
          item: { select: { id: true, name: true, unit: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      prisma.stockIn.count(),
    ]);

    return NextResponse.json({ data: stockIns, total });
  } catch (error) {
    console.error("StockIn GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock in records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      itemId,
      quantity,
      unit,
      rate,
      supplierId,
      invoiceNumber,
      remarks,
    } = body;

    if (!itemId || !quantity || !unit || !rate) {
      return NextResponse.json(
        { error: "Item, quantity, unit, and rate are required" },
        { status: 400 }
      );
    }

    const qty = parseFloat(quantity);
    const rateVal = parseFloat(rate);
    const totalCost = qty * rateVal;

    const [stockIn] = await prisma.$transaction([
      prisma.stockIn.create({
        data: {
          date: new Date(date || Date.now()),
          itemId,
          quantity: qty,
          unit,
          rate: rateVal,
          supplierId: supplierId || null,
          invoiceNumber: invoiceNumber || null,
          totalCost,
          remarks: remarks || null,
        },
        include: {
          item: { select: { id: true, name: true, unit: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: { increment: qty } },
      }),
    ]);

    return NextResponse.json(stockIn, { status: 201 });
  } catch (error) {
    console.error("StockIn POST error:", error);
    return NextResponse.json(
      { error: "Failed to create stock in record" },
      { status: 500 }
    );
  }
}
