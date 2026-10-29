"use client";

import { useState } from "react";
import { postOptimization } from "@/lib/api";
import { OptimizationResult } from "@/lib/types";
import {
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  Info,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function BudgetOptimizerPage() {
  const [totalBudget, setTotalBudget] = useState<number>(150.0);
  const [tvMax, setTvMax] = useState<number>(250.0);
  const [radioMax, setRadioMax] = useState<number>(45.0);
  const [newsMax, setNewsMax] = useState<number>(50.0);
  const [fullyAllocated, setFullyAllocated] = useState<boolean>(true);
  const [unitRev, setUnitRev] = useState<number>(15.0);
  const [degree, setDegree] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await postOptimization({
        total_budget: totalBudget,
        tv_max: tvMax,
        radio_max: radioMax,
        newspaper_max: newsMax,
        fully_allocated: fullyAllocated,
        degree,
        assumed_revenue_per_unit: unitRev > 0 ? unitRev : null,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    handleOptimize();
  });

  const comparisonChartData =
    result?.candidate_comparisons.map((c) => ({
      name: c.name,
      TV: Math.round(c.tv * 10) / 10,
      Radio: Math.round(c.radio * 10) / 10,
      Newspaper: Math.round(c.newspaper * 10) / 10,
      Sales: c.predicted_sales,
    })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Advertising Budget Optimizer
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Find the optimal channel allocation that maximizes model-predicted sales subject to explicit capacity constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Budget & Channel Bounds
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Sum = ${totalBudget}k
            </span>
          </div>

          {/* Total Budget */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Total Advertising Budget ($1,000s)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                min={10}
                max={400}
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total marketing capital available for deployment.
            </p>
          </div>

          {/* Channel Max Limits */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">Channel Capacity Caps ($1,000s)</div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>TV Max Cap</span>
                <span className="font-mono font-bold">${tvMax}k</span>
              </div>
              <input
                type="range"
                min={10}
                max={300}
                value={tvMax}
                onChange={(e) => setTvMax(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Radio Max Cap</span>
                <span className="font-mono font-bold">${radioMax}k</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                value={radioMax}
                onChange={(e) => setRadioMax(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Newspaper Max Cap</span>
                <span className="font-mono font-bold">${newsMax}k</span>
              </div>
              <input
                type="range"
                min={0}
                max={115}
                value={newsMax}
                onChange={(e) => setNewsMax(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>

          {/* Constraint Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fullyAllocated}
                onChange={(e) => setFullyAllocated(e.target.checked)}
                className="rounded accent-teal-600"
              />
              Enforce Exact 100% Allocation (TV + Radio + Newspaper = Total)
            </label>
          </div>

          {/* Optional Economic Assumption */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
              <span>Assumed Revenue per Sales Unit ($)</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <input
              type="number"
              min={0}
              value={unitRev}
              onChange={(e) => setUnitRev(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Optional scenario assumption for illustrative gross revenue & ROI estimations.
            </p>
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Optimizing..." : "Compute Optimal Allocation"}
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Recommendation Highlight */}
          <div className="bg-white rounded-xl border border-teal-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
                  <CheckCircle className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Recommended Allocation
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Lift: +{result?.sales_difference.toFixed(2)}k units ({result?.percent_lift.toFixed(1)}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-medium">TV Spend</div>
                <div className="text-lg font-bold text-teal-700 mt-1">
                  ${result?.recommended_allocation.TV.toFixed(1)}k
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-medium">Radio Spend</div>
                <div className="text-lg font-bold text-blue-700 mt-1">
                  ${result?.recommended_allocation.Radio.toFixed(1)}k
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-medium">Newspaper</div>
                <div className="text-lg font-bold text-amber-700 mt-1">
                  ${result?.recommended_allocation.Newspaper.toFixed(1)}k
                </div>
              </div>
              <div className="bg-teal-50/60 p-3 rounded-lg border border-teal-200">
                <div className="text-[11px] text-teal-800 uppercase font-semibold">Predicted Sales</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {result?.predicted_sales.toFixed(2)}k
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              <strong>Optimization Insights:</strong> Because TV and Radio have a strong positive interaction synergy (<code>+0.001111 TV·Radio</code>) and TV experiences mild diminishing returns at extreme budgets, the optimizer balances TV with Radio capacity while minimizing Newspaper allocation.
            </p>
          </div>

          {/* Allocation Strategy Comparison Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="font-semibold text-slate-900 text-sm">
              Candidate Allocation Strategy Comparisons
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="k" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="TV" stackId="a" fill="#0D9488" />
                  <Bar dataKey="Radio" stackId="a" fill="#2563EB" />
                  <Bar dataKey="Newspaper" stackId="a" fill="#D97706" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Illustrative Financial ROI Scenario */}
          {result?.financial_scenario && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-sm text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Illustrative Financial Scenario (${result.financial_scenario.assumed_revenue_per_sales_unit}/unit)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <span className="text-slate-400">Optimized Gross Rev:</span>
                  <div className="font-bold text-slate-800">${result.financial_scenario.optimized_gross_revenue}k</div>
                </div>
                <div>
                  <span className="text-slate-400">Baseline Gross Rev:</span>
                  <div className="font-bold text-slate-800">${result.financial_scenario.baseline_gross_revenue}k</div>
                </div>
                <div>
                  <span className="text-slate-400">Optimized Est. ROI:</span>
                  <div className="font-bold text-emerald-700">{result.financial_scenario.optimized_est_roi_pct}%</div>
                </div>
                <div>
                  <span className="text-slate-400">Baseline Est. ROI:</span>
                  <div className="font-bold text-slate-700">{result.financial_scenario.baseline_est_roi_pct}%</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                {result.financial_scenario.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
