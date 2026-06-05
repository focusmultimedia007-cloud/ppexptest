import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";

    const where: {
      name?: { contains: string; mode: "insensitive" };
      categoryId?: string;
      currentStock?: { lte: number } | { gt: number };
    } = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (status === "low") {
      where.currentStock = { lte: 5 };
    } else if (status === "out") {
      where.currentStock = { lte: 0 };
    } else if (status === "ok") {
      where.currentStock = { gt: 5 };
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      categoryId,
      unit,
      minStockLevel,
      currentStock,
      purchasePrice,
      supplierId,
      notes,
    } = body;

    if (!name || !categoryId || !unit) {
      return NextResponse.json(
        { error: "Name, category, and unit are required" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        categoryId,
        unit,
        minStockLevel: parseFloat(minStockLevel) || 0,
        currentStock: parseFloat(currentStock) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        supplierId: supplierId || null,
        notes: notes || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
