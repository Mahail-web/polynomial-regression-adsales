"use client";

import { useState } from "react";
import { postPrediction } from "@/lib/api";
import { PredictionResult } from "@/lib/types";
import {
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Tv,
  Radio as RadioIcon,
  Newspaper,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";

export default function SalesPredictorPage() {
  const [tv, setTv] = useState<number>(150.0);
  const [radio, setRadio] = useState<number>(25.0);
  const [newspaper, setNewspaper] = useState<number>(20.0);
  const [degree, setDegree] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handlePredict = async (
    tvVal = tv,
    radVal = radio,
    npVal = newspaper,
    degVal = degree
  ) => {
    setLoading(true);
    try {
      const res = await postPrediction(tvVal, radVal, npVal, degVal);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  // Predict on initial render if not done
  useState(() => {
    handlePredict(150.0, 25.0, 20.0, 2);
  });

  const handleReset = () => {
    setTv(150.0);
    setRadio(25.0);
    setNewspaper(20.0);
    setDegree(2);
    handlePredict(150.0, 25.0, 20.0, 2);
  };

  const chartData = [
    { name: "TV", budget: tv, color: "#0D9488" },
    { name: "Radio", budget: radio, color: "#2563EB" },
    { name: "Newspaper", budget: newspaper, color: "#D97706" },
  ];

  const totalBudget = tv + radio + newspaper;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Interactive Sales Predictor
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Estimate sales volume based on multi-channel advertising budget allocations using genuine Polynomial Regression.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form Controls */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-semibold text-slate-900 text-sm">
              Advertising Budget Allocation
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Model Degree:</label>
              <select
                value={degree}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setDegree(d);
                  handlePredict(tv, radio, newspaper, d);
                }}
                className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 bg-slate-50 text-slate-800"
              >
                <option value={1}>Degree 1 (Linear)</option>
                <option value={2}>Degree 2 (Quadratic - Default)</option>
                <option value={3}>Degree 3 (Cubic)</option>
                <option value={4}>Degree 4 (Quartic)</option>
              </select>
            </div>
          </div>

          {/* TV Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-2 text-slate-700">
                <Tv className="w-4 h-4 text-teal-600" />
                TV Advertising Budget
              </span>
              <span className="font-mono font-bold text-slate-900">${tv.toFixed(1)}k</span>
            </div>
            <input
              type="range"
              min={0}
              max={350}
              step={1}
              value={tv}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTv(val);
                handlePredict(val, radio, newspaper, degree);
              }}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Min: $0k</span>
              <span className="text-teal-700 font-medium">Observed: $0.7k - $296.4k</span>
              <span>Max: $350k</span>
            </div>
          </div>

          {/* Radio Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-2 text-slate-700">
                <RadioIcon className="w-4 h-4 text-blue-600" />
                Radio Advertising Budget
              </span>
              <span className="font-mono font-bold text-slate-900">${radio.toFixed(1)}k</span>
            </div>
            <input
              type="range"
              min={0}
              max={70}
              step={0.5}
              value={radio}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRadio(val);
                handlePredict(tv, val, newspaper, degree);
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Min: $0k</span>
              <span className="text-blue-700 font-medium">Observed: $0.0k - $49.6k</span>
              <span>Max: $70k</span>
            </div>
          </div>

          {/* Newspaper Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-2 text-slate-700">
                <Newspaper className="w-4 h-4 text-amber-600" />
                Newspaper Advertising Budget
              </span>
              <span className="font-mono font-bold text-slate-900">${newspaper.toFixed(1)}k</span>
            </div>
            <input
              type="range"
              min={0}
              max={140}
              step={1}
              value={newspaper}
              onChange={(e) => {
                const val = Number(e.target.value);
                setNewspaper(val);
                handlePredict(tv, radio, val, degree);
              }}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Min: $0k</span>
              <span className="text-amber-700 font-medium">Observed: $0.3k - $114.0k</span>
              <span>Max: $140k</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={() => handlePredict(tv, radio, newspaper, degree)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Calculating..." : "Predict Sales"}
            </button>
          </div>
        </div>

        {/* Right: Output & Prediction Display */}
        <div className="lg:col-span-6 space-y-6">
          {/* Prominent Sales Result Card */}
          <div className="bg-gradient-to-br from-teal-50 via-white to-slate-50 rounded-xl border border-teal-200 p-6 shadow-sm text-center relative overflow-hidden">
            <span className="text-xs font-semibold tracking-wider text-teal-800 uppercase">
              Model Predicted Sales
            </span>
            <div className="my-2">
              <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                {result ? result.predicted_sales.toFixed(2) : "0.00"}
              </span>
              <span className="text-base text-slate-500 ml-2 font-medium">
                thousand units
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Total Advertising Investment: <strong>${totalBudget.toFixed(1)}k</strong> (${totalBudget > 0 ? (totalBudget * 1000).toLocaleString() : 0} USD)
            </p>

            {result?.is_extrapolation && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Extrapolation Warning:</strong> One or more channel budgets lie outside the empirical training ranges. Predictions rely on polynomial projection and are not guaranteed.
                </div>
              </div>
            )}
          </div>

          {/* Allocation Breakdown Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 text-sm">
                Budget Allocation Breakdown
              </h4>
              <span className="text-xs text-slate-500">
                ${totalBudget.toFixed(1)}k Total
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} unit="k" />
                  <Tooltip
                    formatter={(val: number) => [`$${val.toFixed(1)}k`, "Budget"]}
                    contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="budget" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div>
                <div className="text-[11px] text-slate-400">TV Share</div>
                <div className="text-xs font-bold text-slate-800">
                  {result ? `${result.budget_breakdown.TV.share}%` : "0%"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Radio Share</div>
                <div className="text-xs font-bold text-slate-800">
                  {result ? `${result.budget_breakdown.Radio.share}%` : "0%"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Newspaper Share</div>
                <div className="text-xs font-bold text-slate-800">
                  {result ? `${result.budget_breakdown.Newspaper.share}%` : "0%"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
