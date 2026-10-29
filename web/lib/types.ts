export interface ModelMetrics {
  degree: number;
  r2_score: number;
  adjusted_r2_score: number;
  mae: number;
  rmse: number;
  cv_r2_mean: number;
  cv_r2_std: number;
  n_train: number;
  n_test: number;
  n_features_in: number;
  n_features_poly: number;
  equation?: string;
  test_actuals?: number[];
  test_predictions?: number[];
  test_residuals?: number[];
}

export interface CoefficientTerm {
  name: string;
  pretty_name: string;
  term_type: "intercept" | "linear" | "squared" | "cubic" | "quartic" | "interaction";
  coefficient: number;
  channels_involved: string[];
}

export interface CoefficientsResponse {
  degree: number;
  intercept: number;
  equation: string;
  coefficients: CoefficientTerm[];
}

export interface DegreeComparison {
  degree: number;
  label: string;
  r2_score: number;
  adjusted_r2_score: number;
  mae: number;
  rmse: number;
  cv_r2_mean: number;
  cv_r2_std: number;
  n_poly_features: number;
  equation: string;
}

export interface ChannelBudgetBreakdown {
  amount: number;
  share: number;
}

export interface PredictionResult {
  predicted_sales: number;
  predicted_sales_units: string;
  total_budget: number;
  budget_breakdown: {
    TV: ChannelBudgetBreakdown;
    Radio: ChannelBudgetBreakdown;
    Newspaper: ChannelBudgetBreakdown;
  };
  polynomial_degree: number;
  is_extrapolation: boolean;
  warnings: string[];
  observed_ranges: {
    [key: string]: { min: number; max: number };
  };
}

export interface CandidateAllocation {
  name: string;
  tv: number;
  radio: number;
  newspaper: number;
  predicted_sales: number;
  is_best: boolean;
}

export interface FinancialScenario {
  assumed_revenue_per_sales_unit: number;
  optimized_gross_revenue: number;
  baseline_gross_revenue: number;
  optimized_est_roi_pct: number;
  baseline_est_roi_pct: number;
  disclaimer: string;
}

export interface OptimizationResult {
  total_budget: number;
  fully_allocated: boolean;
  polynomial_degree: number;
  recommended_allocation: {
    TV: number;
    Radio: number;
    Newspaper: number;
    total_allocated: number;
  };
  predicted_sales: number;
  baseline_allocation: {
    TV: number;
    Radio: number;
    Newspaper: number;
    total_allocated: number;
  };
  baseline_predicted_sales: number;
  sales_difference: number;
  percent_lift: number;
  candidate_comparisons: CandidateAllocation[];
  financial_scenario?: FinancialScenario | null;
  optimization_notes: string;
}

export interface DiminishingReturnsPoint {
  spend: number;
  predicted_sales: number;
}

export interface MarginalPoint {
  spend: number;
  marginal_sales: number;
}

export interface DiminishingReturnsResult {
  channel: string;
  current_spend: number;
  current_predicted_sales: number;
  nearby_step_delta: number;
  nearby_step_predicted_sales: number;
  nearby_step_sales_change: number;
  estimated_marginal_sales_at_point: number;
  curvature: string;
  has_diminishing_returns: boolean;
  marginal_slope: number;
  initial_marginal: number;
  final_marginal: number;
  curvature_explanation: string;
  fixed_channels: { [key: string]: number };
  observed_range: { min: number; max: number };
  curve_points: DiminishingReturnsPoint[];
  marginal_points: MarginalPoint[];
  degree: number;
}

export interface DataRecord {
  id: number;
  TV: number;
  Radio: number;
  Newspaper: number;
  Sales: number;
}

export interface FeatureStat {
  feature: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  skew: number;
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  bin_label: string;
  count: number;
}

export interface EdaPayload {
  dataset_shape: { rows: number; columns: number };
  validation_summary: {
    is_valid: boolean;
    missing_values: { [key: string]: number };
    duplicates: number;
    warnings: string[];
  };
  statistics: FeatureStat[];
  correlation_matrix: {
    columns: string[];
    values: number[][];
  };
  histograms: {
    [key: string]: HistogramBin[];
  };
  scatter_plots: {
    TV_vs_Sales: { x: number; y: number; index: number }[];
    Radio_vs_Sales: { x: number; y: number; index: number }[];
    Newspaper_vs_Sales: { x: number; y: number; index: number }[];
  };
  insights: string[];
  records: DataRecord[];
}
