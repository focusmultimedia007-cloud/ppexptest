"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, BookOpen, RefreshCw, Trash2, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const recipeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  servings: z.string(),
  notes: z.string().optional(),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface IngredientRow {
  itemId: string;
  quantity: string;
  unit: string;
}

interface RecipeIngredient {
  id: string;
  quantity: number;
  unit: string;
  item: { id: string; name: string; unit: string; currentStock: number };
}

interface Recipe {
  id: string;
  name: string;
  category: string | null;
  servings: number;
  notes: string | null;
  ingredients: RecipeIngredient[];
  _count: { saleLogs: number };
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
}

const RECIPE_CATEGORIES = ["Starter", "Main Course", "Dessert", "Beverages", "Breads", "Rice", "Dal", "Other"];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ itemId: "", quantity: "", unit: "" }]);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { servings: "1" },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recipesRes, itemsRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/inventory"),
      ]);
      setRecipes(await recipesRes.json());
      setItems(await itemsRes.json());
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddDialog = () => {
    setEditRecipe(null);
    reset({ name: "", servings: "1", category: "", notes: "" });
    setIngredients([{ itemId: "", quantity: "", unit: "" }]);
    setDialogOpen(true);
  };

  const openEditDialog = (recipe: Recipe) => {
    setEditRecipe(recipe);
    reset({
      name: recipe.name,
      servings: String(recipe.servings),
      category: recipe.category || "",
      notes: recipe.notes || "",
    });
    setIngredients(
      recipe.ingredients.map((ing) => ({
        itemId: ing.item.id,
        quantity: String(ing.quantity),
        unit: ing.unit,
      }))
    );
    setDialogOpen(true);
  };

  const onSubmit = async (data: RecipeFormData) => {
    setSubmitting(true);
    try {
      const validIngredients = ingredients.filter((i) => i.itemId && i.quantity && i.unit);
      const url = editRecipe ? `/api/recipes/${editRecipe.id}` : "/api/recipes";
      const method = editRecipe ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ingredients: validIngredients }),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    try {
      await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { itemId: "", quantity: "", unit: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientRow, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "itemId") {
      const item = items.find((i) => i.id === value);
      if (item) updated[index].unit = item.unit;
    }
    setIngredients(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-500 text-sm">{recipes.length} recipes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editRecipe ? "Edit Recipe" : "Create Recipe"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label>Recipe Name *</Label>
                    <Input {...register("name")} placeholder="e.g., Butter Chicken" />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Select onValueChange={(v) => setValue("category", v)} defaultValue={editRecipe?.category || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Servings</Label>
                    <Input type="number" min="1" {...register("servings")} />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label>Notes</Label>
                    <Input {...register("notes")} placeholder="Preparation notes..." />
                  </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Ingredients</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="gap-1">
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Select
                            value={ing.itemId}
                            onValueChange={(v) => updateIngredient(index, "itemId", v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Qty"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                          className="w-24 h-9"
                        />
                        <Input
                          placeholder="Unit"
                          value={ing.unit}
                          onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                          className="w-20 h-9"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                          className="h-9 w-9 p-0 text-red-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editRecipe ? "Update" : "Create Recipe"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mx-auto" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No recipes yet. Create your first recipe!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{recipe.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      {recipe.category && <Badge variant="secondary">{recipe.category}</Badge>}
                      <Badge variant="outline">{recipe.servings} serving{recipe.servings > 1 ? "s" : ""}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(recipe)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-orange-600"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRecipe(recipe.id)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium mb-2">
                    {recipe.ingredients.length} ingredients | {recipe._count.saleLogs} sales logged
                  </p>
                  {recipe.ingredients.slice(0, 5).map((ing) => (
                    <div key={ing.id} className="flex justify-between text-xs">
                      <span className="text-gray-700">{ing.item.name}</span>
                      <span className={`font-medium ${ing.item.currentStock < ing.quantity ? "text-red-500" : "text-gray-600"}`}>
                        {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <p className="text-xs text-gray-400">+{recipe.ingredients.length - 5} more...</p>
                  )}
                </div>
                {recipe.notes && (
                  <p className="text-xs text-gray-400 mt-2 italic">{recipe.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
