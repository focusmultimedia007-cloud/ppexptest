"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Trash2, RefreshCw } from "lucide-react";
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

const wastageSchema = z.object({
  date: z.string().min(1),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  reason: z.string().min(1, "Reason is required"),
});

type WastageFormData = z.infer<typeof wastageSchema>;

const WASTAGE_REASONS = [
  "Expired",
  "Damaged",
  "Overcooked",
  "Spoiled",
  "Quality Issue",
  "Preparation Error",
  "Other",
];

interface WastageRecord {
  id: string;
  date: string;
  quantity: number;
  unit: string;
  reason: string;
  item: { id: string; name: string; unit: string };
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
}

export default function WastagePage() {
  const [records, setRecords] = useState<WastageRecord[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<WastageFormData>({
    resolver: zodResolver(wastageSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      quantity: "",
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, itemsRes] = await Promise.all([
        fetch("/api/wastage?limit=50"),
        fetch("/api/inventory"),
      ]);
      const recordsData = await recordsRes.json();
      setRecords(recordsData.data || []);
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

  const onSubmit = async (data: WastageFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/wastage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setDialogOpen(false);
        reset({ date: format(new Date(), "yyyy-MM-dd"), quantity: "" });
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
          <h1 className="text-2xl font-bold text-gray-900">Wastage</h1>
          <p className="text-gray-500 text-sm">Track and reduce food waste</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Record Wastage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Wastage</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" {...register("date")} />
                </div>

                <div className="space-y-1">
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
                          {item.name} (Stock: {item.currentStock} {item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.itemId && <p className="text-red-500 text-xs">{errors.itemId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-1">
                  <Label>Reason *</Label>
                  <Select onValueChange={(v) => setValue("reason", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {WASTAGE_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.reason && <p className="text-red-500 text-xs">{errors.reason.message}</p>}
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} variant="destructive">
                    {submitting ? "Saving..." : "Record Wastage"}
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
            <Trash2 className="h-4 w-4 text-red-500" />
            Wastage Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mx-auto" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No wastage records yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Item</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Quantity</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {format(new Date(record.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{record.item.name}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">
                        -{record.quantity} {record.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full">
                          {record.reason}
                        </span>
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
