import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: { name: "asc" },
      include: {
        ingredients: {
          include: {
            item: { select: { id: true, name: true, unit: true, currentStock: true } },
          },
        },
        _count: { select: { saleLogs: true } },
      },
    });
    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Recipes GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, servings, notes, ingredients } = body;

    if (!name) {
      return NextResponse.json({ error: "Recipe name is required" }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        category: category || null,
        servings: parseInt(servings) || 1,
        notes: notes || null,
        ingredients: {
          create: (ingredients || []).map((ing: { itemId: string; quantity: number; unit: string }) => ({
            itemId: ing.itemId,
            quantity: parseFloat(String(ing.quantity)),
            unit: ing.unit,
          })),
        },
      },
      include: {
        ingredients: {
          include: {
            item: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Recipes POST error:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
