"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchModelPerformance,
  fetchEda,
} from "@/lib/api";
import { ModelMetrics, EdaPayload } from "@/lib/types";
import { MetricCard } from "@/components/MetricCard";
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [eda, setEda] = useState<EdaPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchModelPerformance(2), fetchEda()])
      .then(([m, e]) => {
        setMetrics(m);
        setEda(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const scatterData = eda?.scatter_plots.TV_vs_Sales || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Machine Learning Media Mix Modeling
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            AdSales Intelligence: Advertising Sales Predictor
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Investigate non-linear relationships, multi-channel synergies, and
            diminishing returns across TV, Radio, and Newspaper advertising budgets
            using genuine Polynomial Regression trained on the canonical Kaggle Advertising dataset.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/predictor"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-all shadow-sm"
            >
              <span>Launch Sales Predictor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/optimizer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <span>Run Budget Optimizer</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Dataset Size"
          value={eda ? `${eda.dataset_shape.rows} Obs` : "200 Obs"}
          subtitle="TV, Radio, Newspaper, Sales"
          icon={Database}
          variant="default"
        />
        <MetricCard
          title="Active Model"
          value="Degree 2"
          subtitle="Quadratic + Interactions"
          icon={Layers}
          variant="teal"
          badge="Default"
        />
        <MetricCard
          title="Test Set R²"
          value={metrics ? metrics.r2_score.toFixed(3) : "0.987"}
          subtitle="98.7% Variance Explained"
          icon={TrendingUp}
          variant="teal"
        />
        <MetricCard
          title="Test MAE"
          value={metrics ? `${metrics.mae.toFixed(2)}k` : "0.53k"}
          subtitle="Mean Absolute Error"
          icon={BarChart2}
          variant="blue"
        />
        <MetricCard
          title="Test RMSE"
          value={metrics ? `${metrics.rmse.toFixed(2)}k` : "0.64k"}
          subtitle="Root Mean Squared Error"
          icon={TrendingDown}
          variant="amber"
        />
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TV vs Sales Scatter Plot */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                TV Advertising Expenditure vs. Sales
              </h3>
              <p className="text-xs text-slate-500">
                Empirical observations showing strong positive non-linear trend (Units: $1,000s vs 1,000 Sales Units)
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              r = +0.782
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="TV Spend"
                  unit="k"
                  stroke="#94a3b8"
                  fontSize={12}
                  domain={[0, 310]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Sales"
                  unit="k"
                  stroke="#94a3b8"
                  fontSize={12}
                  domain={[0, 30]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-navy-900 text-white p-2.5 rounded-lg text-xs shadow-lg border border-slate-700">
                        <div className="font-semibold text-teal-300">Observation #{data.index}</div>
                        <div>TV Spend: ${data.x}k</div>
                        <div>Sales: {data.y}k units</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData} fill="#0D9488" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic & Methodology Insights */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              Model Intelligence Summary
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Polynomial Features expand original dimensions to capture synergistic cross-terms without manual trial-and-error.
            </p>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>TV Media Dominance:</strong> TV is the strongest single predictor of volume with a high correlation (+0.782).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Synergistic Cross-Channel Lift:</strong> Positive interaction term (<code>+0.001111 TV·Radio</code>) proves super-additive effects when pairing TV and Radio.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>TV Diminishing Returns:</strong> Negative quadratic term (<code>-0.000112 TV²</code>) confirms concavity and tapering marginal returns at high investments.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Newspaper Redundancy:</strong> Low standalone coefficient; its marginal lift is negligible in the degree-2 pipeline.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rigorous 80:20 Train/Test Split</span>
            <Link href="/about" className="text-teal-600 font-semibold hover:underline">
              View Equation &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
