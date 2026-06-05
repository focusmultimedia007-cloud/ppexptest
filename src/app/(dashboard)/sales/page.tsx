"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, ShoppingCart, RefreshCw, ChefHat } from "lucide-react";
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

const saleSchema = z.object({
  recipeId: z.string().min(1, "Recipe is required"),
  quantity: z.string().min(1, "Quantity is required"),
  date: z.string().min(1),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface Recipe {
  id: string;
  name: string;
  category: string | null;
  servings: number;
  ingredients: {
    quantity: number;
    unit: string;
    item: { id: string; name: string; unit: string; currentStock: number };
  }[];
}

interface SaleLog {
  id: string;
  date: string;
  quantity: number;
  recipe: { id: string; name: string; category: string | null };
}

export default function SalesPage() {
  const [saleLogs, setSaleLogs] = useState<SaleLog[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      quantity: "1",
    },
  });

  const watchQuantity = parseInt(watch("quantity") || "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, recipesRes] = await Promise.all([
        fetch("/api/sales?limit=50"),
        fetch("/api/recipes"),
      ]);
      setSaleLogs(await logsRes.json());
      setRecipes(await recipesRes.json());
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: SaleFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setDialogOpen(false);
        setSelectedRecipe(null);
        reset({ date: format(new Date(), "yyyy-MM-dd"), quantity: "1" });
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to record sale");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Failed to save:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500 text-sm">Record sales and auto-deduct inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Sale</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" {...register("date")} />
                </div>

                <div className="space-y-1">
                  <Label>Recipe *</Label>
                  <Select onValueChange={(v) => {
                    setValue("recipeId", v);
                    setSelectedRecipe(recipes.find(r => r.id === v) || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name} {recipe.category ? `(${recipe.category})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.recipeId && <p className="text-red-500 text-xs">{errors.recipeId.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Quantity (portions) *</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    {...register("quantity")}
                  />
                  {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
                </div>

                {selectedRecipe && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-orange-800 mb-2">
                      Ingredients to be deducted (x{watchQuantity}):
                    </p>
                    <div className="space-y-1">
                      {selectedRecipe.ingredients.map((ing) => {
                        const needed = ing.quantity * watchQuantity;
                        const sufficient = ing.item.currentStock >= needed;
                        return (
                          <div key={ing.item.id} className="flex justify-between text-xs">
                            <span className="text-gray-700">{ing.item.name}</span>
                            <span className={sufficient ? "text-gray-600" : "text-red-600 font-semibold"}>
                              {needed.toFixed(3)} {ing.unit}
                              {!sufficient && " (Low!)"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Processing..." : "Record Sale"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-orange-600" />
            Sales Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mx-auto" />
            </div>
          ) : saleLogs.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No sales recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Recipe</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Portions</th>
                  </tr>
                </thead>
                <tbody>
                  {saleLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {format(new Date(log.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{log.recipe.name}</td>
                      <td className="px-4 py-3 text-gray-600">{log.recipe.category || "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-orange-600">
                        {log.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
