"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Utensils,
  Trash2,
  BookOpen,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  Truck,
  Settings,
  LogOut,
  ChefHat,
  Menu,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/stock-in", icon: PackagePlus, label: "Stock In" },
  { href: "/consumption", icon: Utensils, label: "Consumption" },
  { href: "/wastage", icon: Trash2, label: "Wastage" },
  { href: "/recipes", icon: BookOpen, label: "Recipes" },
  { href: "/sales", icon: ShoppingCart, label: "Sales" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/suppliers", icon: Truck, label: "Suppliers" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="bg-orange-600 p-2 rounded-lg flex-shrink-0">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-orange-400 truncate">HAPPY PUNJAB RDC</h1>
            <p className="text-xs text-slate-400">Inventory System</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-orange-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-slate-700 p-2 rounded-full">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {(session?.user as { role?: string })?.role || "STAFF"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-orange-600 hidden sm:block">
              HAPPY PUNJAB RDC - Inventory Management System
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:inline">{session?.user?.email}</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {(session?.user as { role?: string })?.role || "STAFF"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
