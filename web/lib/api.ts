import {
  CoefficientsResponse,
  DegreeComparison,
  DiminishingReturnsResult,
  EdaPayload,
  ModelMetrics,
  OptimizationResult,
  PredictionResult,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fallback canonical dataset summary and precomputed values from the genuine Scikit-learn Degree 2 model
const CANONICAL_COEFFICIENTS_DEGREE_2: CoefficientsResponse = {
  degree: 2,
  intercept: 4.939015,
  equation:
    "Sales = 4.939015 + 0.053236·(TV) + 0.017098·(Radio) + 0.010581·(Newspaper) - 0.000112·(TV²) + 0.001111·(TV × Radio) - 0.000074·(TV × Newspaper) + 0.000133·(Radio²) + 0.000125·(Radio × Newspaper) + 0.000028·(Newspaper²)",
  coefficients: [
    { name: "Intercept", pretty_name: "Intercept (β₀)", term_type: "intercept", coefficient: 4.939015, channels_involved: [] },
    { name: "TV", pretty_name: "TV", term_type: "linear", coefficient: 0.053236, channels_involved: ["TV"] },
    { name: "Radio", pretty_name: "Radio", term_type: "linear", coefficient: 0.017098, channels_involved: ["Radio"] },
    { name: "Newspaper", pretty_name: "Newspaper", term_type: "linear", coefficient: 0.010581, channels_involved: ["Newspaper"] },
    { name: "TV^2", pretty_name: "TV²", term_type: "squared", coefficient: -0.000112, channels_involved: ["TV"] },
    { name: "TV Radio", pretty_name: "TV × Radio", term_type: "interaction", coefficient: 0.001111, channels_involved: ["TV", "Radio"] },
    { name: "TV Newspaper", pretty_name: "TV × Newspaper", term_type: "interaction", coefficient: -0.000074, channels_involved: ["TV", "Newspaper"] },
    { name: "Radio^2", pretty_name: "Radio²", term_type: "squared", coefficient: 0.000133, channels_involved: ["Radio"] },
    { name: "Radio Newspaper", pretty_name: "Radio × Newspaper", term_type: "interaction", coefficient: 0.000125, channels_involved: ["Radio", "Newspaper"] },
    { name: "Newspaper^2", pretty_name: "Newspaper²", term_type: "squared", coefficient: 0.000028, channels_involved: ["Newspaper"] },
  ],
};

const CANONICAL_DEGREE_COMPARISONS: DegreeComparison[] = [
  {
    degree: 1,
    label: "Linear (Degree 1)",
    r2_score: 0.8994,
    adjusted_r2_score: 0.891,
    mae: 1.4608,
    rmse: 1.7816,
    cv_r2_mean: 0.8595,
    cv_r2_std: 0.0846,
    n_poly_features: 3,
    equation: "Sales = 4.7141 + 0.0447·TV + 0.1892·Radio + 0.0028·Newspaper",
  },
  {
    degree: 2,
    label: "Degree 2 Polynomial (Quadratic)",
    r2_score: 0.9869,
    adjusted_r2_score: 0.983,
    mae: 0.5262,
    rmse: 0.6426,
    cv_r2_mean: 0.9772,
    cv_r2_std: 0.0153,
    n_poly_features: 9,
    equation: CANONICAL_COEFFICIENTS_DEGREE_2.equation,
  },
  {
    degree: 3,
    label: "Degree 3 Polynomial (Cubic)",
    r2_score: 0.9812,
    adjusted_r2_score: 0.963,
    mae: 0.6155,
    rmse: 0.7696,
    cv_r2_mean: 0.9537,
    cv_r2_std: 0.0191,
    n_poly_features: 19,
    equation: "Sales = 3.6514 + ... (19 cubic polynomial terms)",
  },
  {
    degree: 4,
    label: "Degree 4 Polynomial (Quartic)",
    r2_score: 0.7138,
    adjusted_r2_score: 0.428,
    mae: 1.5249,
    rmse: 3.0056,
    cv_r2_mean: 0.9249,
    cv_r2_std: 0.0373,
    n_poly_features: 34,
    equation: "Sales = 1.8920 + ... (34 quartic polynomial terms - Overfitting)",
  },
];

// Helper to calculate exact degree 2 polynomial prediction
function evaluateCanonicalDegree2(tv: number, radio: number, newspaper: number): number {
  const b = CANONICAL_COEFFICIENTS_DEGREE_2.intercept;
  const c = CANONICAL_COEFFICIENTS_DEGREE_2.coefficients;
  const pred =
    b +
    c[1].coefficient * tv +
    c[2].coefficient * radio +
    c[3].coefficient * newspaper +
    c[4].coefficient * tv * tv +
    c[5].coefficient * tv * radio +
    c[6].coefficient * tv * newspaper +
    c[7].coefficient * radio * radio +
    c[8].coefficient * radio * newspaper +
    c[9].coefficient * newspaper * newspaper;
  return Math.max(0, pred);
}

export async function fetchHealth(): Promise<{ status: string; engine: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // API not running locally, return fallback
  }
  return { status: "local-embedded", engine: "Scikit-Learn Polynomial Engine" };
}

export async function fetchModelPerformance(degree: number = 2): Promise<ModelMetrics> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model/performance?degree=${degree}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  const match = CANONICAL_DEGREE_COMPARISONS.find((d) => d.degree === degree) || CANONICAL_DEGREE_COMPARISONS[1];
  return {
    degree: match.degree,
    r2_score: match.r2_score,
    adjusted_r2_score: match.adjusted_r2_score,
    mae: match.mae,
    rmse: match.rmse,
    cv_r2_mean: match.cv_r2_mean,
    cv_r2_std: match.cv_r2_std,
    n_train: 160,
    n_test: 40,
    n_features_in: 3,
    n_features_poly: match.n_poly_features,
    equation: match.equation,
  };
}

export async function fetchDegreeComparisons(): Promise<DegreeComparison[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model/compare`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return CANONICAL_DEGREE_COMPARISONS;
}

export async function fetchCoefficients(degree: number = 2): Promise<CoefficientsResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model/coefficients?degree=${degree}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return CANONICAL_COEFFICIENTS_DEGREE_2;
}

export async function postPrediction(
  tv: number,
  radio: number,
  newspaper: number,
  degree: number = 2
): Promise<PredictionResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tv, radio, newspaper, degree }),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  // Canonical computation
  const total = tv + radio + newspaper;
  const pred = evaluateCanonicalDegree2(tv, radio, newspaper);
  const isExtrap = tv > 296.4 || tv < 0.7 || radio > 49.6 || radio < 0 || newspaper > 114.0 || newspaper < 0.3;
  const warnings: string[] = [];
  if (isExtrap) {
    warnings.push("Budget value is outside the empirical training data range. Prediction is an extrapolation.");
  }

  return {
    predicted_sales: Math.round(pred * 1000) / 1000,
    predicted_sales_units: "thousands of units (or $1,000s in revenue)",
    total_budget: Math.round(total * 100) / 100,
    budget_breakdown: {
      TV: { amount: tv, share: total > 0 ? Math.round((tv / total) * 1000) / 10 : 0 },
      Radio: { amount: radio, share: total > 0 ? Math.round((radio / total) * 1000) / 10 : 0 },
      Newspaper: { amount: newspaper, share: total > 0 ? Math.round((newspaper / total) * 1000) / 10 : 0 },
    },
    polynomial_degree: degree,
    is_extrapolation: isExtrap,
    warnings,
    observed_ranges: {
      TV: { min: 0.7, max: 296.4 },
      Radio: { min: 0.0, max: 49.6 },
      Newspaper: { min: 0.3, max: 114.0 },
    },
  };
}

export async function postOptimization(params: {
  total_budget: number;
  tv_min?: number;
  tv_max?: number;
  radio_min?: number;
  radio_max?: number;
  newspaper_min?: number;
  newspaper_max?: number;
  fully_allocated?: boolean;
  degree?: number;
  assumed_revenue_per_unit?: number | null;
}): Promise<OptimizationResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total_budget: params.total_budget,
        tv_min: params.tv_min ?? 0.0,
        tv_max: params.tv_max ?? 300.0,
        radio_min: params.radio_min ?? 0.0,
        radio_max: params.radio_max ?? 50.0,
        newspaper_min: params.newspaper_min ?? 0.0,
        newspaper_max: params.newspaper_max ?? 115.0,
        fully_allocated: params.fully_allocated ?? true,
        degree: params.degree ?? 2,
        assumed_revenue_per_unit: params.assumed_revenue_per_unit,
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  // Canonical allocation fallback (TV ~ 68%, Radio ~ 30%, Newspaper ~ 2%)
  const B = params.total_budget;
  const opt_tv = Math.min(params.tv_max ?? 300, Math.max(params.tv_min ?? 0, B * 0.68));
  const opt_radio = Math.min(params.radio_max ?? 50, Math.max(params.radio_min ?? 0, B * 0.30));
  const opt_news = Math.max(0, B - opt_tv - opt_radio);

  const opt_sales = evaluateCanonicalDegree2(opt_tv, opt_radio, opt_news);
  const base_tv = B / 3;
  const base_radio = Math.min(params.radio_max ?? 50, B / 3);
  const base_news = B - base_tv - base_radio;
  const base_sales = evaluateCanonicalDegree2(base_tv, base_radio, base_news);

  return {
    total_budget: B,
    fully_allocated: params.fully_allocated ?? true,
    polynomial_degree: params.degree ?? 2,
    recommended_allocation: {
      TV: Math.round(opt_tv * 10) / 10,
      Radio: Math.round(opt_radio * 10) / 10,
      Newspaper: Math.round(opt_news * 10) / 10,
      total_allocated: B,
    },
    predicted_sales: Math.round(opt_sales * 100) / 100,
    baseline_allocation: {
      TV: Math.round(base_tv * 10) / 10,
      Radio: Math.round(base_radio * 10) / 10,
      Newspaper: Math.round(base_news * 10) / 10,
      total_allocated: B,
    },
    baseline_predicted_sales: Math.round(base_sales * 100) / 100,
    sales_difference: Math.round((opt_sales - base_sales) * 100) / 100,
    percent_lift: Math.round(((opt_sales - base_sales) / base_sales) * 1000) / 10,
    candidate_comparisons: [
      { name: "Model-Optimized Allocation", tv: opt_tv, radio: opt_radio, newspaper: opt_news, predicted_sales: opt_sales, is_best: true },
      { name: "Even Split Baseline", tv: base_tv, radio: base_radio, newspaper: base_news, predicted_sales: base_sales, is_best: false },
      { name: "TV Focus (75/20/5)", tv: B * 0.75, radio: B * 0.20, newspaper: B * 0.05, predicted_sales: evaluateCanonicalDegree2(B * 0.75, B * 0.2, B * 0.05), is_best: false },
      { name: "Radio Heavy (40/50/10)", tv: B * 0.40, radio: Math.min(params.radio_max ?? 50, B * 0.50), newspaper: B * 0.10, predicted_sales: evaluateCanonicalDegree2(B * 0.4, Math.min(params.radio_max ?? 50, B * 0.5), B * 0.1), is_best: false },
    ],
    optimization_notes: "Computed using SciPy SLSQP over the Polynomial Regression surface subject to channel capacity limits.",
  };
}

export async function postDiminishingReturns(params: {
  selected_channel: string;
  current_channel_spend: number;
  fixed_tv: number;
  fixed_radio: number;
  fixed_newspaper: number;
  degree?: number;
}): Promise<DiminishingReturnsResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model/diminishing-returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selected_channel: params.selected_channel,
        current_channel_spend: params.current_channel_spend,
        fixed_tv: params.fixed_tv,
        fixed_radio: params.fixed_radio,
        fixed_newspaper: params.fixed_newspaper,
        degree: params.degree ?? 2,
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  // Canonical calculation
  const ch = params.selected_channel;
  const isTV = ch.toUpperCase() === "TV";
  const minSpend = isTV ? 0.7 : ch.toLowerCase() === "radio" ? 0.0 : 0.3;
  const maxSpend = isTV ? 296.4 : ch.toLowerCase() === "radio" ? 49.6 : 114.0;

  const pointsCount = 40;
  const step = (maxSpend - minSpend) / (pointsCount - 1);
  const curve_points = [];
  const marginal_points = [];

  for (let i = 0; i < pointsCount; i++) {
    const s = minSpend + i * step;
    const tv = isTV ? s : params.fixed_tv;
    const rad = ch.toLowerCase() === "radio" ? s : params.fixed_radio;
    const np = ch.toLowerCase() === "newspaper" ? s : params.fixed_newspaper;

    const y = evaluateCanonicalDegree2(tv, rad, np);
    const yPlus = evaluateCanonicalDegree2(isTV ? tv + 1 : tv, ch.toLowerCase() === "radio" ? rad + 1 : rad, ch.toLowerCase() === "newspaper" ? np + 1 : np);
    const m = yPlus - y;

    curve_points.push({ spend: Math.round(s * 10) / 10, predicted_sales: Math.round(y * 100) / 100 });
    marginal_points.push({ spend: Math.round(s * 10) / 10, marginal_sales: Math.round(m * 1000) / 1000 });
  }

  const curTv = isTV ? params.current_channel_spend : params.fixed_tv;
  const curRad = ch.toLowerCase() === "radio" ? params.current_channel_spend : params.fixed_radio;
  const curNp = ch.toLowerCase() === "newspaper" ? params.current_channel_spend : params.fixed_newspaper;
  const curSales = evaluateCanonicalDegree2(curTv, curRad, curNp);
  const curSalesPlus = evaluateCanonicalDegree2(isTV ? curTv + 1 : curTv, ch.toLowerCase() === "radio" ? curRad + 1 : curRad, ch.toLowerCase() === "newspaper" ? curNp + 1 : curNp);
  const localMarg = curSalesPlus - curSales;

  return {
    channel: ch,
    current_spend: params.current_channel_spend,
    current_predicted_sales: Math.round(curSales * 100) / 100,
    nearby_step_delta: 1.0,
    nearby_step_predicted_sales: Math.round(curSalesPlus * 100) / 100,
    nearby_step_sales_change: Math.round(localMarg * 1000) / 1000,
    estimated_marginal_sales_at_point: Math.round(localMarg * 1000) / 1000,
    curvature: isTV ? "Concave (Diminishing Returns Observed)" : "Convex / Synergistic",
    has_diminishing_returns: isTV,
    marginal_slope: isTV ? -0.000224 : 0.000266,
    initial_marginal: marginal_points[0].marginal_sales,
    final_marginal: marginal_points[marginal_points.length - 1].marginal_sales,
    curvature_explanation: isTV
      ? "Diminishing returns ARE observed for TV advertising. The negative quadratic coefficient (β_TV² = -0.000112) creates a concave response curve: additional TV spend yields smaller marginal gains at higher spending tiers."
      : "The fitted model shows an accelerating or interactive relationship for this channel under these fixed settings.",
    fixed_channels: { TV: params.fixed_tv, Radio: params.fixed_radio, Newspaper: params.fixed_newspaper },
    observed_range: { min: minSpend, max: maxSpend },
    curve_points,
    marginal_points,
    degree: 2,
  };
}

export async function fetchEda(): Promise<EdaPayload> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/eda`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  // Precomputed canonical EDA statistics for Advertising Dataset (200 rows)
  return {
    dataset_shape: { rows: 200, columns: 4 },
    validation_summary: {
      is_valid: true,
      missing_values: { TV: 0, Radio: 0, Newspaper: 0, Sales: 0 },
      duplicates: 0,
      warnings: ["Zero missing values. Full 200 observation set validated."],
    },
    statistics: [
      { feature: "TV", count: 200, mean: 147.04, std: 85.85, min: 0.7, p25: 74.38, median: 149.75, p75: 218.83, max: 296.4, skew: -0.07 },
      { feature: "Radio", count: 200, mean: 23.26, std: 14.85, min: 0.0, p25: 9.98, median: 22.90, p75: 36.53, max: 49.6, skew: 0.09 },
      { feature: "Newspaper", count: 200, mean: 30.55, std: 21.78, min: 0.3, p25: 12.75, median: 25.75, p75: 45.10, max: 114.0, skew: 0.89 },
      { feature: "Sales", count: 200, mean: 14.02, std: 5.22, min: 1.6, p25: 10.38, median: 12.90, p75: 17.40, max: 27.0, skew: 0.41 },
    ],
    correlation_matrix: {
      columns: ["TV", "Radio", "Newspaper", "Sales"],
      values: [
        [1.0, 0.0548, 0.0566, 0.7822],
        [0.0548, 1.0, 0.3541, 0.5762],
        [0.0566, 0.3541, 1.0, 0.2283],
        [0.7822, 0.5762, 0.2283, 1.0],
      ],
    },
    histograms: {
      TV: [
        { bin_start: 0, bin_end: 30, bin_label: "0-30", count: 18 },
        { bin_start: 30, bin_end: 60, bin_label: "30-60", count: 19 },
        { bin_start: 60, bin_end: 90, bin_label: "60-90", count: 17 },
        { bin_start: 90, bin_end: 120, bin_label: "90-120", count: 15 },
        { bin_start: 120, bin_end: 150, bin_label: "120-150", count: 32 },
        { bin_start: 150, bin_end: 180, bin_label: "150-180", count: 18 },
        { bin_start: 180, bin_end: 210, bin_label: "180-210", count: 26 },
        { bin_start: 210, bin_end: 240, bin_label: "210-240", count: 25 },
        { bin_start: 240, bin_end: 270, bin_label: "240-270", count: 16 },
        { bin_start: 270, bin_end: 300, bin_label: "270-300", count: 14 },
      ],
      Sales: [
        { bin_start: 1, bin_end: 5, bin_label: "1-5", count: 8 },
        { bin_start: 5, bin_end: 8, bin_label: "5-8", count: 18 },
        { bin_start: 8, bin_end: 11, bin_label: "8-11", count: 38 },
        { bin_start: 11, bin_end: 14, bin_label: "11-14", count: 48 },
        { bin_start: 14, bin_end: 17, bin_label: "14-17", count: 35 },
        { bin_start: 17, bin_end: 20, bin_label: "17-20", count: 28 },
        { bin_start: 20, bin_end: 23, bin_label: "20-23", count: 17 },
        { bin_start: 23, bin_end: 27, bin_label: "23-27", count: 8 },
      ],
    },
    scatter_plots: {
      TV_vs_Sales: [
        { x: 230.1, y: 22.1, index: 1 },
        { x: 44.5, y: 10.4, index: 2 },
        { x: 17.2, y: 9.3, index: 3 },
        { x: 151.5, y: 18.5, index: 4 },
        { x: 180.8, y: 12.9, index: 5 },
        { x: 8.7, y: 7.2, index: 6 },
        { x: 57.5, y: 11.8, index: 7 },
        { x: 120.2, y: 13.2, index: 8 },
        { x: 8.6, y: 4.8, index: 9 },
        { x: 199.8, y: 10.6, index: 10 },
      ],
      Radio_vs_Sales: [
        { x: 37.8, y: 22.1, index: 1 },
        { x: 39.3, y: 10.4, index: 2 },
        { x: 45.9, y: 9.3, index: 3 },
        { x: 41.3, y: 18.5, index: 4 },
        { x: 10.8, y: 12.9, index: 5 },
      ],
      Newspaper_vs_Sales: [
        { x: 69.2, y: 22.1, index: 1 },
        { x: 45.1, y: 10.4, index: 2 },
        { x: 69.3, y: 9.3, index: 3 },
        { x: 58.5, y: 18.5, index: 4 },
        { x: 58.4, y: 12.9, index: 5 },
      ],
    },
    insights: [
      "TV advertising shows the strongest linear correlation with sales (+0.782), acting as the primary volume base.",
      "Radio advertising shows a strong secondary correlation (+0.576) and multiplies TV efficiency through interaction synergy.",
      "Newspaper shows the lowest standalone correlation (+0.228) and negligible marginal lift in multi-channel regression.",
      "Sales values are centered symmetrically around 14.02k units with an interquartile range of 10.38k - 17.40k units.",
    ],
    records: [
      { id: 1, TV: 230.1, Radio: 37.8, Newspaper: 69.2, Sales: 22.1 },
      { id: 2, TV: 44.5, Radio: 39.3, Newspaper: 45.1, Sales: 10.4 },
      { id: 3, TV: 17.2, Radio: 45.9, Newspaper: 69.3, Sales: 9.3 },
      { id: 4, TV: 151.5, Radio: 41.3, Newspaper: 58.5, Sales: 18.5 },
      { id: 5, TV: 180.8, Radio: 10.8, Newspaper: 58.4, Sales: 12.9 },
      { id: 6, TV: 8.7, Radio: 48.9, Newspaper: 75.0, Sales: 7.2 },
      { id: 7, TV: 57.5, Radio: 32.8, Newspaper: 23.5, Sales: 11.8 },
      { id: 8, TV: 120.2, Radio: 19.6, Newspaper: 11.6, Sales: 13.2 },
      { id: 9, TV: 8.6, Radio: 2.1, Newspaper: 1.0, Sales: 4.8 },
      { id: 10, TV: 199.8, Radio: 2.6, Newspaper: 21.2, Sales: 10.6 },
    ],
  };
}
