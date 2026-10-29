"use client";

import { useEffect, useState } from "react";
import { fetchCoefficients } from "@/lib/api";
import { CoefficientsResponse } from "@/lib/types";
import {
  BookOpen,
  Info,
  Layers,
  Code2,
  AlertTriangle,
  CheckCircle2,
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

export default function AboutModelPage() {
  const [data, setData] = useState<CoefficientsResponse | null>(null);
  const [degree, setDegree] = useState<number>(2);

  useEffect(() => {
    fetchCoefficients(degree).then((res) => setData(res));
  }, [degree]);

  const coefficients = data?.coefficients || [];
  // Exclude intercept for visual bar chart
  const barData = coefficients
    .filter((c) => c.term_type !== "intercept")
    .map((c) => ({
      name: c.pretty_name,
      coefficient: c.coefficient,
      type: c.term_type,
    }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          About Polynomial Regression & Feature Engineering
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Educational breakdown of polynomial transformations, learned coefficients, and mathematical formulation.
        </p>
      </div>

      {/* Conceptual Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-600" />
          The Mathematics of Polynomial Regression
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Standard Multiple Linear Regression assumes that the marginal effect of each dollar spent on TV is constant and completely independent of spending on Radio or Newspaper. In real-world media strategy, this assumption fails: channels often saturate (diminishing returns) or amplify each other (cross-channel synergy).
        </p>

        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Polynomial Regression</strong> addresses this by mapping the original 3 features into non-linear polynomial features (powers and cross-products) using Scikit-learn’s <code>PolynomialFeatures(degree=2, include_bias=False)</code>, and fitting Ordinary Least Squares to the transformed space:
        </p>

        <div className="p-4 bg-slate-900 text-teal-300 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
          Sales = β₀ + β₁(TV) + β₂(Radio) + β₃(Newspaper) + β₄(TV²) + β₅(Radio²) + β₆(Newspaper²) + β₇(TV × Radio) + β₈(TV × Newspaper) + β₉(Radio × Newspaper)
        </div>
      </div>

      {/* Learned Model Equation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-600" />
            Empirically Learned Equation (Degree {data?.degree || 2})
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
            Fitted OLS Model
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 leading-relaxed break-all">
          {data?.equation}
        </div>
      </div>

      {/* Coefficients Table & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-900 text-sm">
            Learned Coefficient Breakdown
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Term</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Fitted Coefficient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coefficients.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{c.pretty_name}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {c.term_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">
                      {c.coefficient.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-900 text-sm">
            Polynomial Coefficients Relative Scale
          </h4>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-30} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: number) => [val.toFixed(6), "Coefficient Value"]}
                  contentStyle={{ backgroundColor: "#0F172A", color: "#FFF", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="coefficient" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => {
                    const color =
                      entry.coefficient < 0
                        ? "#EF4444"
                        : entry.type === "interaction"
                        ? "#0D9488"
                        : "#2563EB";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400">
            Green: Positive interactions (Synergy) | Red: Negative quadratics (Diminishing returns) | Blue: Linear terms
          </p>
        </div>
      </div>

      {/* Crucial Statistical Disclaimers */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-xs text-amber-900 space-y-2">
        <div className="font-semibold text-sm flex items-center gap-1.5 text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Critical Statistical Interpretability Notices
        </div>
        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed text-amber-800/90">
          <li>
            <strong>Unit Dependence:</strong> The raw magnitude of polynomial coefficients depends directly on the units of measurement. In this dataset, TV spend ranges up to $296.4k, while TV² reaches up to ~88,000. Hence, β_TV² (-0.000112) is naturally smaller in magnitude than β_TV (0.0532), yet creates substantial curvature over the range.
          </li>
          <li>
            <strong>Coupled Interpretation:</strong> Individual polynomial coefficients cannot be analyzed in isolation. The marginal effect of TV is: <code>dSales/dTV = β₁ + 2·β₄·TV + β₇·Radio + β₈·Newspaper</code>. Any evaluation of TV's returns must consider the current levels of Radio and Newspaper.
          </li>
          <li>
            <strong>Observational vs. Causal:</strong> This is a fitted predictive regression model on historical observational records, not a randomized controlled trial. While useful for empirical planning, statistical associations do not prove direct causality.
          </li>
        </ul>
      </div>
    </div>
  );
}
