"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#ea580c", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

interface AnalyticsData {
  topConsumed: { name: string; unit: string; quantity: number }[];
  wastageByReason: { reason: string; quantity: number; count: number }[];
  dailyStockIn: { date: string; value: number }[];
  categoryValues: { name: string; value: number }[];
  monthlyFoodCost: { month: string; cost: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">Visual insights into your inventory</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Consumed Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              Top Consumed Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.topConsumed.length ? (
              <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.topConsumed} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: unknown) =>
                      [`${Number(value).toFixed(2)}`, "Consumed"]
                    }
                  />
                  <Bar dataKey="quantity" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Wastage by Reason */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Wastage by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.wastageByReason.length ? (
              <div className="h-64 flex items-center justify-center text-gray-400">No wastage data</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.wastageByReason}
                      dataKey="quantity"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.wastageByReason.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => [Number(value).toFixed(2), "Qty"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {data.wastageByReason.map((item, index) => (
                    <div key={item.reason} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-600 flex-1">{item.reason}</span>
                      <span className="font-medium">{item.count} records</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Purchase Cost */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Purchase Cost (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.dailyStockIn.length ? (
              <div className="h-64 flex items-center justify-center text-gray-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.dailyStockIn.slice(-30)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                  <Tooltip formatter={(value: unknown) => [`₹${Number(value).toLocaleString("en-IN")}`, "Purchase Cost"]} />
                  <Line type="monotone" dataKey="value" stroke="#ea580c" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category-wise Inventory Value */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.categoryValues.filter((c) => c.value > 0).length ? (
              <div className="h-64 flex items-center justify-center text-gray-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={data.categoryValues.filter((c) => c.value > 0)}
                  margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                  <Tooltip formatter={(value: unknown) => [`₹${Number(value).toLocaleString("en-IN")}`, "Value"]} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Food Cost */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Food Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthlyFoodCost || []} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: unknown) => [`₹${Number(value).toLocaleString("en-IN")}`, "Food Cost"]} />
                <Legend />
                <Bar dataKey="cost" name="Food Cost (₹)" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
