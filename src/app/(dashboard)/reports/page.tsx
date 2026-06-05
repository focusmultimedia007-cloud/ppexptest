"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { BarChart3, Download, RefreshCw, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  openingStock: number;
  purchased: number;
  purchasedCost: number;
  consumed: number;
  wasted: number;
  closingStock: number;
  currentValue: number;
  purchasePrice: number;
}

interface ReportSummary {
  totalPurchasedCost: number;
  totalConsumed: number;
  totalWasted: number;
  totalItems: number;
}

interface ReportData {
  report: ReportItem[];
  summary: ReportSummary;
  startDate: string;
  endDate: string;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportToCSV = () => {
    if (!reportData) return;
    const headers = ["Item", "Category", "Unit", "Opening Stock", "Purchased", "Cost", "Consumed", "Wasted", "Closing Stock", "Value"];
    const rows = reportData.report.map((item) => [
      item.name,
      item.category,
      item.unit,
      item.openingStock.toFixed(2),
      item.purchased.toFixed(2),
      item.purchasedCost.toFixed(2),
      item.consumed.toFixed(2),
      item.wasted.toFixed(2),
      item.closingStock.toFixed(2),
      item.currentValue.toFixed(2),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    if (!reportData) return;
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(
        reportData.report.map((item) => ({
          "Item Name": item.name,
          "Category": item.category,
          "Unit": item.unit,
          "Opening Stock": item.openingStock,
          "Purchased (Qty)": item.purchased,
          "Purchase Cost (₹)": item.purchasedCost,
          "Consumed": item.consumed,
          "Wasted": item.wasted,
          "Closing Stock": item.closingStock,
          "Current Value (₹)": item.currentValue,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
      XLSX.writeFile(wb, `inventory-report-${startDate}-to-${endDate}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(18);
      doc.setTextColor(234, 88, 12);
      doc.text("HAPPY PUNJAB RDC - Inventory Report", 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Period: ${format(new Date(startDate), "dd MMM yyyy")} to ${format(new Date(endDate), "dd MMM yyyy")}`, 14, 30);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 38);

      autoTable(doc, {
        startY: 45,
        head: [["Item", "Category", "Unit", "Opening", "Purchased", "Consumed", "Wasted", "Closing", "Value (₹)"]],
        body: reportData.report.map((item) => [
          item.name,
          item.category,
          item.unit,
          item.openingStock.toFixed(2),
          item.purchased.toFixed(2),
          item.consumed.toFixed(2),
          item.wasted.toFixed(2),
          item.closingStock.toFixed(2),
          item.currentValue.toFixed(2),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [234, 88, 12] },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      });

      doc.save(`inventory-report-${startDate}-to-${endDate}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm">Generate inventory movement reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2" disabled={!reportData}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2 text-green-700 border-green-200 hover:bg-green-50" disabled={!reportData}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-2 text-red-700 border-red-200 hover:bg-red-50" disabled={!reportData}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {[
                { label: "Today", days: 0 },
                { label: "7 Days", days: 7 },
                { label: "30 Days", days: 30 },
                { label: "90 Days", days: 90 },
              ].map(({ label, days }) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate(format(subDays(new Date(), days), "yyyy-MM-dd"));
                    setEndDate(format(new Date(), "yyyy-MM-dd"));
                  }}
                >
                  {label}
                </Button>
              ))}
              <Button onClick={fetchReport} size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalItems}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total Purchases</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{reportData.summary.totalPurchasedCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Consumption Records</p>
              <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalConsumed}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Wastage Records</p>
              <p className="text-2xl font-bold text-red-600">{reportData.summary.totalWasted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-600" />
            Inventory Movement Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mx-auto" />
              <p className="text-gray-400 text-sm mt-2">Generating report...</p>
            </div>
          ) : reportData?.report.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No data for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Item</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Opening</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Purchased</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Cost</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Consumed</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Wasted</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Closing</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.report.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-2 text-gray-500">{item.category}</td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {item.openingStock.toFixed(2)} {item.unit}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600">
                        +{item.purchased.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-green-700">
                        ₹{item.purchasedCost.toFixed(0)}
                      </td>
                      <td className="px-4 py-2 text-right text-blue-600">
                        -{item.consumed.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-red-600">
                        -{item.wasted.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        <span className={item.closingStock <= 0 ? "text-red-600" : "text-gray-900"}>
                          {item.closingStock.toFixed(2)} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-orange-600">
                        ₹{item.currentValue.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {reportData && (
                  <tfoot>
                    <tr className="border-t bg-orange-50">
                      <td colSpan={4} className="px-4 py-3 font-semibold text-gray-700">Total</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">
                        ₹{reportData.summary.totalPurchasedCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td colSpan={3} className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-bold text-orange-700">
                        ₹{reportData.report.reduce((sum, i) => sum + i.currentValue, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
