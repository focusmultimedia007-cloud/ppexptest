import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [wastages, total] = await Promise.all([
      prisma.wastage.findMany({
        take: limit,
        skip: offset,
        orderBy: { date: "desc" },
        include: {
          item: { select: { id: true, name: true, unit: true } },
        },
      }),
      prisma.wastage.count(),
    ]);

    return NextResponse.json({ data: wastages, total });
  } catch (error) {
    console.error("Wastage GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wastage records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, itemId, quantity, unit, reason } = body;

    if (!itemId || !quantity || !unit || !reason) {
      return NextResponse.json(
        { error: "Item, quantity, unit, and reason are required" },
        { status: 400 }
      );
    }

    const qty = parseFloat(quantity);

    const [wastage] = await prisma.$transaction([
      prisma.wastage.create({
        data: {
          date: new Date(date || Date.now()),
          itemId,
          quantity: qty,
          unit,
          reason,
        },
        include: {
          item: { select: { id: true, name: true, unit: true } },
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: { decrement: qty } },
      }),
    ]);

    return NextResponse.json(wastage, { status: 201 });
  } catch (error) {
    console.error("Wastage POST error:", error);
    return NextResponse.json(
      { error: "Failed to create wastage record" },
      { status: 500 }
    );
  }
}
