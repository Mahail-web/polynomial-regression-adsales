"""
Budget Optimizer Module for AdSales Intelligence.
Performs constrained numerical optimization to maximize predicted sales given channel bounds
and total budget constraints using Scikit-learn Polynomial Regression and SciPy SLSQP.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from scipy.optimize import minimize

from core.model import get_trained_model


def optimize_budget(
    total_budget: float,
    tv_bounds: Tuple[float, float] = (0.0, 300.0),
    radio_bounds: Tuple[float, float] = (0.0, 50.0),
    newspaper_bounds: Tuple[float, float] = (0.0, 115.0),
    fully_allocated: bool = True,
    degree: int = 2,
    assumed_revenue_per_unit: Optional[float] = None,
    dataset_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Find the advertising allocation (TV, Radio, Newspaper) that maximizes model-predicted sales
    subject to channel bounds and total budget constraints.
    """
    model = get_trained_model(degree=degree, dataset_path=dataset_path)

    # Validate budget
    if total_budget <= 0:
        raise ValueError(f"Total budget must be positive. Got {total_budget}.")

    min_sum = tv_bounds[0] + radio_bounds[0] + newspaper_bounds[0]
    max_sum = tv_bounds[1] + radio_bounds[1] + newspaper_bounds[1]

    if fully_allocated and total_budget < min_sum:
        raise ValueError(
            f"Total budget (${total_budget:.1f}k) is less than sum of minimum channel requirements (${min_sum:.1f}k)."
        )
    if fully_allocated and total_budget > max_sum:
        raise ValueError(
            f"Total budget (${total_budget:.1f}k) exceeds sum of maximum channel capacities (${max_sum:.1f}k)."
        )

    # Objective function: minimize negative predicted sales
    def objective(x: np.ndarray) -> float:
        df_in = pd.DataFrame([x], columns=["TV", "Radio", "Newspaper"])
        pred = model.pipeline.predict(df_in)[0]
        return -float(pred)

    bounds = [tv_bounds, radio_bounds, newspaper_bounds]

    # Constraints
    if fully_allocated:
        constraints = [{"type": "eq", "fun": lambda x: np.sum(x) - total_budget}]
    else:
        constraints = [{"type": "ineq", "fun": lambda x: total_budget - np.sum(x)}]

    # Multi-start initial guesses to avoid local extrema on polynomial surfaces
    starts = []
    # 1. Equal split projected into bounds
    eq_val = total_budget / 3.0
    starts.append(np.array([
        np.clip(eq_val, tv_bounds[0], tv_bounds[1]),
        np.clip(eq_val, radio_bounds[0], radio_bounds[1]),
        np.clip(eq_val, newspaper_bounds[0], newspaper_bounds[1]),
    ]))

    # 2. TV-heavy
    tv_max_alloc = min(tv_bounds[1], total_budget - radio_bounds[0] - newspaper_bounds[0])
    rem_tv = max(0.0, total_budget - tv_max_alloc)
    starts.append(np.array([
        tv_max_alloc,
        min(radio_bounds[1], radio_bounds[0] + rem_tv / 2),
        min(newspaper_bounds[1], newspaper_bounds[0] + rem_tv / 2),
    ]))

    # 3. Radio-heavy
    rad_max_alloc = min(radio_bounds[1], total_budget - tv_bounds[0] - newspaper_bounds[0])
    rem_rad = max(0.0, total_budget - rad_max_alloc)
    starts.append(np.array([
        min(tv_bounds[1], tv_bounds[0] + rem_rad * 0.8),
        rad_max_alloc,
        min(newspaper_bounds[1], newspaper_bounds[0] + rem_rad * 0.2),
    ]))

    best_res = None
    best_sales = -float("inf")

    for x0 in starts:
        # Normalize starting guess to sum to total_budget if fully_allocated
        if fully_allocated:
            current_sum = np.sum(x0)
            if current_sum > 0:
                x0 = x0 * (total_budget / current_sum)
                # Clip back into bounds
                x0 = np.array([
                    np.clip(x0[i], bounds[i][0], bounds[i][1]) for i in range(3)
                ])

        res = minimize(
            objective,
            x0,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
            options={"maxiter": 200, "ftol": 1e-7},
        )

        pred_sales = -res.fun
        if res.success and pred_sales > best_sales:
            best_sales = pred_sales
            best_res = res

    # Fallback to best starting guess if optimization had issues
    if best_res is None or not best_res.success:
        res = minimize(
            objective,
            starts[0],
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
        )
        best_res = res

    opt_tv, opt_radio, opt_news = [max(0.0, float(v)) for v in best_res.x]
    # Small numerical clean up if fully_allocated
    if fully_allocated:
        diff = total_budget - (opt_tv + opt_radio + opt_news)
        if abs(diff) < 0.1:
            opt_tv += diff

    opt_pred_sales = float(model.pipeline.predict(
        pd.DataFrame([[opt_tv, opt_radio, opt_news]], columns=["TV", "Radio", "Newspaper"])
    )[0])

    # Baseline: Even allocation (or proportional within bounds)
    base_tv = min(tv_bounds[1], max(tv_bounds[0], total_budget / 3.0))
    base_radio = min(radio_bounds[1], max(radio_bounds[0], total_budget / 3.0))
    base_news = min(newspaper_bounds[1], max(newspaper_bounds[0], total_budget - base_tv - base_radio))
    base_pred_sales = float(model.pipeline.predict(
        pd.DataFrame([[base_tv, base_radio, base_news]], columns=["TV", "Radio", "Newspaper"])
    )[0])

    sales_diff = opt_pred_sales - base_pred_sales
    pct_lift = (sales_diff / base_pred_sales * 100.0) if base_pred_sales > 0 else 0.0

    # Generate Candidate Comparison Scenarios
    candidates = [
        {
            "name": "Model-Optimized Allocation",
            "tv": round(opt_tv, 2),
            "radio": round(opt_radio, 2),
            "newspaper": round(opt_news, 2),
            "predicted_sales": round(opt_pred_sales, 3),
            "is_best": True,
        },
        {
            "name": "Even Split Baseline",
            "tv": round(base_tv, 2),
            "radio": round(base_radio, 2),
            "newspaper": round(base_news, 2),
            "predicted_sales": round(base_pred_sales, 3),
            "is_best": False,
        },
    ]

    # Additional standard allocation strategies for comparison
    # TV Emphasis (65% TV, 25% Radio, 10% Newspaper)
    tv_emp = min(tv_bounds[1], max(tv_bounds[0], total_budget * 0.65))
    rad_emp = min(radio_bounds[1], max(radio_bounds[0], total_budget * 0.25))
    news_emp = min(newspaper_bounds[1], max(newspaper_bounds[0], total_budget - tv_emp - rad_emp))
    c3_sales = float(model.pipeline.predict(pd.DataFrame([[tv_emp, rad_emp, news_emp]], columns=["TV", "Radio", "Newspaper"]))[0])
    candidates.append({
        "name": "TV Focus Allocation (65/25/10)",
        "tv": round(tv_emp, 2),
        "radio": round(rad_emp, 2),
        "newspaper": round(news_emp, 2),
        "predicted_sales": round(c3_sales, 3),
        "is_best": False,
    })

    # Radio Emphasis (35% TV, 50% Radio, 15% Newspaper)
    rad_hi = min(radio_bounds[1], max(radio_bounds[0], total_budget * 0.50))
    tv_hi = min(tv_bounds[1], max(tv_bounds[0], total_budget * 0.35))
    news_hi = min(newspaper_bounds[1], max(newspaper_bounds[0], total_budget - rad_hi - tv_hi))
    c4_sales = float(model.pipeline.predict(pd.DataFrame([[tv_hi, rad_hi, news_hi]], columns=["TV", "Radio", "Newspaper"]))[0])
    candidates.append({
        "name": "Radio Focus Allocation (35/50/15)",
        "tv": round(tv_hi, 2),
        "radio": round(rad_hi, 2),
        "newspaper": round(news_hi, 2),
        "predicted_sales": round(c4_sales, 3),
        "is_best": False,
    })

    # Optional ROI scenario analysis
    financial_scenario = None
    if assumed_revenue_per_unit is not None and assumed_revenue_per_unit > 0:
        opt_revenue = opt_pred_sales * assumed_revenue_per_unit
        base_revenue = base_pred_sales * assumed_revenue_per_unit
        opt_roi = ((opt_revenue - total_budget) / total_budget) * 100.0 if total_budget > 0 else 0.0
        base_roi = ((base_revenue - total_budget) / total_budget) * 100.0 if total_budget > 0 else 0.0

        financial_scenario = {
            "assumed_revenue_per_sales_unit": assumed_revenue_per_unit,
            "optimized_gross_revenue": round(opt_revenue, 2),
            "baseline_gross_revenue": round(base_revenue, 2),
            "optimized_est_roi_pct": round(opt_roi, 1),
            "baseline_est_roi_pct": round(base_roi, 1),
            "disclaimer": (
                "IMPORTANT: This is an illustrative simulation based on user-supplied revenue assumptions. "
                "The original Kaggle dataset does not record product unit pricing or marginal cost structures. "
                "Maximizing predicted sales volume is not equivalent to guaranteed net profit maximization."
            ),
        }

    return {
        "total_budget": round(total_budget, 2),
        "fully_allocated": fully_allocated,
        "polynomial_degree": degree,
        "recommended_allocation": {
            "TV": round(opt_tv, 2),
            "Radio": round(opt_radio, 2),
            "Newspaper": round(opt_news, 2),
            "total_allocated": round(opt_tv + opt_radio + opt_news, 2),
        },
        "predicted_sales": round(opt_pred_sales, 3),
        "baseline_allocation": {
            "TV": round(base_tv, 2),
            "Radio": round(base_radio, 2),
            "Newspaper": round(base_news, 2),
            "total_allocated": round(base_tv + base_radio + base_news, 2),
        },
        "baseline_predicted_sales": round(base_pred_sales, 3),
        "sales_difference": round(sales_diff, 3),
        "percent_lift": round(pct_lift, 2),
        "candidate_comparisons": candidates,
        "financial_scenario": financial_scenario,
        "optimization_notes": (
            "Optimized via SciPy Sequential Least Squares Programming (SLSQP) across the "
            f"Degree {degree} Polynomial Regression response surface, subject to channel capacity limits "
            "and total budget conservation."
        ),
    }
