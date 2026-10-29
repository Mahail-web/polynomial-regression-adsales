"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Sliders,
  TrendingDown,
  BarChart3,
  Database,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/predictor", label: "Sales Predictor", icon: Calculator },
  { href: "/optimizer", label: "Budget Optimizer", icon: Sliders },
  { href: "/diminishing-returns", label: "Diminishing Returns", icon: TrendingDown },
  { href: "/performance", label: "Model Performance", icon: BarChart3 },
  { href: "/explorer", label: "Data Explorer", icon: Database },
  { href: "/about", label: "About the Model", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-navy-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">
              AdSales Intelligence
            </h1>
            <p className="text-xs text-slate-400">Polynomial ML Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1.5">
        <div className="px-3 py-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Analytics & Predictions
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-teal-400" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Dataset & Model Badge */}
      <div className="p-4 border-t border-slate-800 m-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Active Engine</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Degree 2
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Kaggle Advertising Data (200 obs)
        </p>
        <p className="text-[11px] text-teal-400/90 font-mono mt-1">
          R² = 0.987 | MAE = 0.53k
        </p>
      </div>
    </aside>
  );
}
