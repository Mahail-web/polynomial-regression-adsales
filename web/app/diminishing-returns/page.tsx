"use client";

import { useState } from "react";
import { postDiminishingReturns } from "@/lib/api";
import { DiminishingReturnsResult } from "@/lib/types";
import {
  TrendingDown,
  Info,
  Tv,
  Radio as RadioIcon,
  Newspaper,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

export default function DiminishingReturnsPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>("TV");
  const [fixedTv, setFixedTv] = useState<number>(150.0);
  const [fixedRadio, setFixedRadio] = useState<number>(25.0);
  const [fixedNews, setFixedNews] = useState<number>(20.0);
  const [activeSpend, setActiveSpend] = useState<number>(150.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DiminishingReturnsResult | null>(null);

  const handleAnalyze = async (ch = selectedChannel, spend = activeSpend) => {
    setLoading(true);
    try {
      const res = await postDiminishingReturns({
        selected_channel: ch,
        current_channel_spend: spend,
        fixed_tv: fixedTv,
        fixed_radio: fixedRadio,
        fixed_newspaper: fixedNews,
        degree: 2,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    handleAnalyze("TV", 150.0);
  });

  const isTV = selectedChannel === "TV";
  const maxLimit = isTV ? 300 : selectedChannel === "Radio" ? 50 : 115;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Diminishing Returns & Response Curve Analysis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Investigate non-linear concavity, marginal sales changes, and saturation effects for a selected channel while holding other channel investments constant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Focal Channel Selection
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "TV", label: "TV", icon: Tv, color: "text-teal-600" },
              { id: "Radio", label: "Radio", icon: RadioIcon, color: "text-blue-600" },
              { id: "Newspaper", label: "Newspaper", icon: Newspaper, color: "text-amber-600" },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = selectedChannel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedChannel(item.id);
                    const defaultSpend = item.id === "TV" ? 150.0 : item.id === "Radio" ? 25.0 : 20.0;
                    setActiveSpend(defaultSpend);
                    handleAnalyze(item.id, defaultSpend);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition ${
                    isSelected
                      ? "border-teal-500 bg-teal-50/50 text-teal-900"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Focal Spend Point Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>{selectedChannel} Evaluation Point</span>
              <span className="font-mono text-slate-900 font-bold">${activeSpend.toFixed(1)}k</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxLimit}
              step={1}
              value={activeSpend}
              onChange={(e) => {
                const val = Number(e.target.value);
                setActiveSpend(val);
                handleAnalyze(selectedChannel, val);
              }}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>$0k</span>
              <span className="text-teal-700">Current focal spend</span>
              <span>${maxLimit}k</span>
            </div>
          </div>

          {/* Fixed Background Channels */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Fixed Other Channels ($1,000s)</span>
              <span className="text-[11px] text-slate-400 font-normal">Ceteris Paribus</span>
            </div>

            {selectedChannel !== "TV" && (
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Fixed TV Spend ($k)</label>
                <input
                  type="number"
                  value={fixedTv}
                  onChange={(e) => {
                    setFixedTv(Number(e.target.value));
                    handleAnalyze(selectedChannel, activeSpend);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            )}

            {selectedChannel !== "Radio" && (
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Fixed Radio Spend ($k)</label>
                <input
                  type="number"
                  value={fixedRadio}
                  onChange={(e) => {
                    setFixedRadio(Number(e.target.value));
                    handleAnalyze(selectedChannel, activeSpend);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            )}

            {selectedChannel !== "Newspaper" && (
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Fixed Newspaper Spend ($k)</label>
                <input
                  type="number"
                  value={fixedNews}
                  onChange={(e) => {
                    setFixedNews(Number(e.target.value));
                    handleAnalyze(selectedChannel, activeSpend);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Predicted Sales at Point
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {result?.current_predicted_sales.toFixed(2)}k units
              </div>
              <span className="text-xs text-slate-400">At ${result?.current_spend.toFixed(1)}k spend</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Local Marginal Rate
              </span>
              <div className="text-2xl font-bold text-teal-700 mt-1">
                +{result?.estimated_marginal_sales_at_point.toFixed(4)}
              </div>
              <span className="text-xs text-slate-400">Sales units per additional $1k</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Curvature Behavior
              </span>
              <div className={`text-sm font-bold mt-2 ${result?.has_diminishing_returns ? "text-teal-700" : "text-blue-700"}`}>
                {result?.curvature}
              </div>
              <span className="text-xs text-slate-400">Over observed range</span>
            </div>
          </div>

          {/* Curvature Analysis Explanation Box */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 leading-relaxed">
            <div className="font-semibold text-sm mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-700" />
              Empirical Curvature Analysis: {result?.channel}
            </div>
            <p>{result?.curvature_explanation}</p>
          </div>

          {/* Response Curve Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Predicted Sales Response Curve
                </h4>
                <p className="text-xs text-slate-500">
                  Sales trajectory as {selectedChannel} varies across its range (Other channels held fixed)
                </p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result?.curve_points || []} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="spend" stroke="#94a3b8" fontSize={12} unit="k" />
                  <YAxis stroke="#94a3b8" fontSize={12} unit="k" domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(val: number) => [`${val.toFixed(2)}k units`, "Predicted Sales"]}
                    labelFormatter={(label) => `${selectedChannel} Spend: $${label}k`}
                    contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_sales"
                    stroke="#0D9488"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  {result && (
                    <ReferenceDot
                      x={result.current_spend}
                      y={result.current_predicted_sales}
                      r={6}
                      fill="#EF4444"
                      stroke="#FFF"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Marginal Sales (Derivative) Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">
                Marginal Sales Rate (dSales / dSpend)
              </h4>
              <p className="text-xs text-slate-500">
                Rate of additional sales gained per +$1,000 spend at each budget level
              </p>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result?.marginal_points || []} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="spend" stroke="#94a3b8" fontSize={12} unit="k" />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(val: number) => [`${val.toFixed(4)} units/$1k`, "Marginal Lift"]}
                    labelFormatter={(label) => `${selectedChannel} Spend: $${label}k`}
                    contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="marginal_sales"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
              * Note: A downward sloping marginal curve confirms diminishing returns (d²Sales/dSpend² &lt; 0). This is a fitted observational regression model, not a causal clinical trial.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
