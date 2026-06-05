import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const saleLogs = await prisma.saleLog.findMany({
      take: limit,
      orderBy: { date: "desc" },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            category: true,
            ingredients: {
              include: {
                item: { select: { id: true, name: true, unit: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(saleLogs);
  } catch (error) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId, quantity, date } = body;

    if (!recipeId || !quantity) {
      return NextResponse.json(
        { error: "Recipe and quantity are required" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity);
    const saleDate = new Date(date || Date.now());

    // Fetch recipe with ingredients
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: { item: true },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Create sale log and consumption records for each ingredient
    const saleLog = await prisma.$transaction(async (tx) => {
      const sale = await tx.saleLog.create({
        data: {
          date: saleDate,
          recipeId,
          quantity: qty,
        },
      });

      // Create consumption and reduce stock for each ingredient
      for (const ingredient of recipe.ingredients) {
        const consumedQty = ingredient.quantity * qty;

        await tx.consumption.create({
          data: {
            date: saleDate,
            itemId: ingredient.itemId,
            quantity: consumedQty,
            unit: ingredient.unit,
            source: "RECIPE",
            recipeId,
            notes: `Auto: ${recipe.name} x${qty}`,
          },
        });

        await tx.inventoryItem.update({
          where: { id: ingredient.itemId },
          data: { currentStock: { decrement: consumedQty } },
        });
      }

      return sale;
    });

    return NextResponse.json(saleLog, { status: 201 });
  } catch (error) {
    console.error("Sales POST error:", error);
    return NextResponse.json(
      { error: "Failed to record sale" },
      { status: 500 }
    );
  }
}
