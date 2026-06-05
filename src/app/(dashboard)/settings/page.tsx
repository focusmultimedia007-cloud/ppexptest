"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Plus, RefreshCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  _count: { items: number };
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      setCategories(await res.json());
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onSubmit = async (data: CategoryFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        reset();
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Manage categories and system configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Management */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-orange-600" />
              Inventory Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  {...register("name")}
                  placeholder="New category name..."
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <Button type="submit" disabled={submitting} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </form>

            <div className="border rounded-lg overflow-hidden">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-orange-600 mx-auto" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No categories yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-2 text-gray-500 font-medium">Category</th>
                      <th className="text-right px-4 py-2 text-gray-500 font-medium">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{cat.name}</td>
                        <td className="px-4 py-2 text-right">
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                            {cat._count.items} items
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500 text-sm">Restaurant Name</span>
                <span className="font-semibold text-orange-700">HAPPY PUNJAB RDC</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500 text-sm">System Version</span>
                <span className="font-medium">v1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500 text-sm">Currency</span>
                <span className="font-medium">INR (₹)</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500 text-sm">Timezone</span>
                <span className="font-medium">Asia/Kolkata</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 text-sm">Database</span>
                <span className="font-medium text-green-600">PostgreSQL Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
