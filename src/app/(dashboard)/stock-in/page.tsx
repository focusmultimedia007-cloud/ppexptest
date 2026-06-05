"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, PackagePlus, RefreshCw } from "lucide-react";
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

const stockInSchema = z.object({
  date: z.string().min(1),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.string().min(1, "Rate is required"),
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  remarks: z.string().optional(),
});

type StockInFormData = z.infer<typeof stockInSchema>;

interface StockInRecord {
  id: string;
  date: string;
  quantity: number;
  unit: string;
  rate: number;
  totalCost: number;
  invoiceNumber: string | null;
  remarks: string | null;
  item: { id: string; name: string; unit: string };
  supplier: { id: string; name: string } | null;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
}

export default function StockInPage() {
  const [records, setRecords] = useState<StockInRecord[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<StockInFormData>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      quantity: "",
      rate: "",
    },
  });

  const watchQuantity = watch("quantity");
  const watchRate = watch("rate");
  const totalCost = (parseFloat(watchQuantity || "0") * parseFloat(watchRate || "0")).toFixed(2);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, itemsRes, suppRes] = await Promise.all([
        fetch("/api/stock-in?limit=50"),
        fetch("/api/inventory"),
        fetch("/api/suppliers"),
      ]);
      const recordsData = await recordsRes.json();
      setRecords(recordsData.data || []);
      setTotalCount(recordsData.total || 0);
      setItems(await itemsRes.json());
      setSuppliers(await suppRes.json());
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: StockInFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setDialogOpen(false);
        reset({ date: format(new Date(), "yyyy-MM-dd"), quantity: "", rate: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock In</h1>
          <p className="text-gray-500 text-sm">{totalCount} records total</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Stock In
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Stock In</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label>Date *</Label>
                    <Input type="date" {...register("date")} />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label>Item *</Label>
                    <Select onValueChange={(v) => {
                      setValue("itemId", v);
                      const item = items.find(i => i.id === v);
                      if (item) setValue("unit", item.unit);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.itemId && <p className="text-red-500 text-xs">{errors.itemId.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Quantity *</Label>
                    <Input type="number" step="0.01" placeholder="0" {...register("quantity")} />
                    {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Unit *</Label>
                    <Input {...register("unit")} placeholder="kg, L, pcs..." />
                    {errors.unit && <p className="text-red-500 text-xs">{errors.unit.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Rate (₹ per unit) *</Label>
                    <Input type="number" step="0.01" placeholder="0" {...register("rate")} />
                    {errors.rate && <p className="text-red-500 text-xs">{errors.rate.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Total Cost</Label>
                    <div className="h-10 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 font-semibold flex items-center">
                      ₹{totalCost}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label>Supplier</Label>
                    <Select onValueChange={(v) => setValue("supplierId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Invoice Number</Label>
                    <Input {...register("invoiceNumber")} placeholder="INV-001" />
                  </div>

                  <div className="space-y-1">
                    <Label>Remarks</Label>
                    <Input {...register("remarks")} placeholder="Optional remarks" />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Record Stock In"}
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
            <PackagePlus className="h-4 w-4 text-orange-600" />
            Stock In Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mx-auto" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No stock in records yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Item</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Supplier</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Quantity</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Rate</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Total</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {format(new Date(record.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{record.item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{record.supplier?.name || "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {record.quantity} {record.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{record.rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        ₹{record.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{record.invoiceNumber || "-"}</td>
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
