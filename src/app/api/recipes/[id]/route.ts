import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            item: { select: { id: true, name: true, unit: true, currentStock: true } },
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe GET[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, servings, notes, ingredients } = body;

    // Delete existing ingredients and recreate
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });

    const recipe = await prisma.recipe.update({
      where: { id },
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

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe PUT error:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.recipe.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recipe DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}
