import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [consumptions, total] = await Promise.all([
      prisma.consumption.findMany({
        take: limit,
        skip: offset,
        orderBy: { date: "desc" },
        include: {
          item: { select: { id: true, name: true, unit: true } },
        },
      }),
      prisma.consumption.count(),
    ]);

    return NextResponse.json({ data: consumptions, total });
  } catch (error) {
    console.error("Consumption GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consumption records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, itemId, quantity, unit, notes, source, recipeId } = body;

    if (!itemId || !quantity || !unit) {
      return NextResponse.json(
        { error: "Item, quantity, and unit are required" },
        { status: 400 }
      );
    }

    const qty = parseFloat(quantity);

    const [consumption] = await prisma.$transaction([
      prisma.consumption.create({
        data: {
          date: new Date(date || Date.now()),
          itemId,
          quantity: qty,
          unit,
          notes: notes || null,
          source: source || "MANUAL",
          recipeId: recipeId || null,
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

    return NextResponse.json(consumption, { status: 201 });
  } catch (error) {
    console.error("Consumption POST error:", error);
    return NextResponse.json(
      { error: "Failed to create consumption record" },
      { status: 500 }
    );
  }
}
