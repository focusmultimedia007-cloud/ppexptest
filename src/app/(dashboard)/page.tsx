"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Package,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Utensils,
  Trash2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  todayPurchases: number;
  todayConsumption: number;
  todayWastage: number;
  totalItems: number;
}

interface StockInRecord {
  id: string;
  date: string;
  quantity: number;
  unit: string;
  totalCost: number;
  item: { name: string; unit: string };
  supplier: { name: string } | null;
}

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  category: { name: string };
}

interface DashboardData {
  stats: DashboardStats;
  recentStockIn: StockInRecord[];
  lowStockItems: LowStockItem[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="col-span-2 lg:col-span-1 border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Inventory Value</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  ₹{stats?.totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 }) || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Low Stock</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">
                  {stats?.lowStock || 0}
                </p>
                <p className="text-xs text-gray-400">items</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Out of Stock</p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {stats?.outOfStock || 0}
                </p>
                <p className="text-xs text-gray-400">items</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Today&apos;s Purchases</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  ₹{stats?.todayPurchases.toLocaleString("en-IN", { maximumFractionDigits: 0 }) || 0}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Today&apos;s Consumption</p>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {stats?.todayConsumption || 0}
                </p>
                <p className="text-xs text-gray-400">records</p>
              </div>
              <Utensils className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Today&apos;s Wastage</p>
                <p className="text-xl font-bold text-purple-600 mt-1">
                  {stats?.todayWastage?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-gray-400">units</p>
              </div>
              <Trash2 className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock In */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              Recent Stock In
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data?.recentStockIn.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No recent stock in records</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-2 text-gray-500 font-medium">Item</th>
                      <th className="text-right px-4 py-2 text-gray-500 font-medium">Qty</th>
                      <th className="text-right px-4 py-2 text-gray-500 font-medium">Cost</th>
                      <th className="text-right px-4 py-2 text-gray-500 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentStockIn.map((record) => (
                      <tr key={record.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {record.item.name}
                          {record.supplier && (
                            <span className="block text-xs text-gray-400">{record.supplier.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {record.quantity} {record.unit}
                        </td>
                        <td className="px-4 py-2 text-right text-green-600 font-medium">
                          ₹{record.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-400 text-xs">
                          {format(new Date(record.date), "dd MMM")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data?.lowStockItems.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">All items have sufficient stock</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-2 text-gray-500 font-medium">Item</th>
                      <th className="text-right px-4 py-2 text-gray-500 font-medium">Stock</th>
                      <th className="text-right px-4 py-2 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.lowStockItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.category.name}</p>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={item.currentStock <= 0 ? "text-red-600 font-bold" : "text-yellow-600 font-medium"}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {item.currentStock <= 0 ? (
                            <Badge variant="danger">Out of Stock</Badge>
                          ) : (
                            <Badge variant="warning">Low Stock</Badge>
                          )}
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
    </div>
  );
}
