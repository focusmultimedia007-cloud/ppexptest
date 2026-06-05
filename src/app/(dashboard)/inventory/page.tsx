"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  minStockLevel: z.string(),
  currentStock: z.string(),
  purchasePrice: z.string(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  minStockLevel: number;
  currentStock: number;
  purchasePrice: number;
  notes: string | null;
  category: { id: string; name: string };
  supplier: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

const UNITS = ["kg", "g", "L", "ml", "pcs", "dozen", "box", "bag", "bottle", "packet"];

export default function InventoryPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      minStockLevel: "0",
      currentStock: "0",
      purchasePrice: "0",
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [itemsRes, catsRes, suppRes] = await Promise.all([
        fetch(`/api/inventory?${params}`),
        fetch("/api/categories"),
        fetch("/api/suppliers"),
      ]);

      setItems(await itemsRes.json());
      setCategories(await catsRes.json());
      setSuppliers(await suppRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEditDialog = (item: InventoryItem) => {
    setEditItem(item);
    reset({
      name: item.name,
      categoryId: item.category.id,
      unit: item.unit,
      minStockLevel: String(item.minStockLevel),
      currentStock: String(item.currentStock),
      purchasePrice: String(item.purchasePrice),
      supplierId: item.supplier?.id || "",
      notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditItem(null);
    reset({
      name: "",
      categoryId: "",
      unit: "",
      minStockLevel: "0",
      currentStock: "0",
      purchasePrice: "0",
      supplierId: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ItemFormData) => {
    setSubmitting(true);
    try {
      const url = editItem ? `/api/inventory/${editItem.id}` : "/api/inventory";
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save item:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.currentStock <= 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (item.currentStock <= item.minStockLevel) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">OK</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm">{items.length} items total</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label>Item Name *</Label>
                    <Input {...register("name")} placeholder="e.g., Chicken Breast" />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Category *</Label>
                    <Select onValueChange={(v) => setValue("categoryId", v)} defaultValue={editItem?.category.id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-red-500 text-xs">{errors.categoryId.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Unit *</Label>
                    <Select onValueChange={(v) => setValue("unit", v)} defaultValue={editItem?.unit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unit && <p className="text-red-500 text-xs">{errors.unit.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Current Stock</Label>
                    <Input type="number" step="0.01" {...register("currentStock")} />
                  </div>

                  <div className="space-y-1">
                    <Label>Min Stock Level</Label>
                    <Input type="number" step="0.01" {...register("minStockLevel")} />
                  </div>

                  <div className="space-y-1">
                    <Label>Purchase Price (₹)</Label>
                    <Input type="number" step="0.01" {...register("purchasePrice")} />
                  </div>

                  <div className="space-y-1">
                    <Label>Supplier</Label>
                    <Select onValueChange={(v) => setValue("supplierId", v)} defaultValue={editItem?.supplier?.id || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label>Notes</Label>
                    <Input {...register("notes")} placeholder="Optional notes" />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editItem ? "Update" : "Add Item"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mx-auto" />
              <p className="text-gray-400 text-sm mt-2">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No items found</p>
              <p className="text-gray-300 text-sm">Add your first inventory item</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Item</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Stock</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Min Level</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Price</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Value</th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                    {isAdmin && <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.supplier && (
                          <p className="text-xs text-gray-400">{item.supplier.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.category.name}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={item.currentStock <= 0 ? "text-red-600" : item.currentStock <= item.minStockLevel ? "text-yellow-600" : "text-gray-900"}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {item.minStockLevel} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ₹{item.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        ₹{(item.currentStock * item.purchasePrice).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(item)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(item)}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-orange-600"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item.id)}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
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
