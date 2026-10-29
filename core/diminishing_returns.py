"""
Diminishing Returns Analysis Module for AdSales Intelligence.
Analyzes response curves, marginal sales effects (derivatives), and concavity/convexity
across advertising channels holding other channels fixed.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from core.model import get_trained_model, AdSalesPolynomialModel


def analyze_diminishing_returns(
    selected_channel: str,
    current_channel_spend: float,
    fixed_tv: float,
    fixed_radio: float,
    fixed_newspaper: float,
    degree: int = 2,
    num_points: int = 50,
    dataset_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Computes predicted sales curves, marginal effects (numerical derivatives),
    and curvature classification for the selected channel holding others fixed.
    """
    norm = selected_channel.strip().lower()
    if norm == "tv":
        channel_key = "TV"
    elif norm == "radio":
        channel_key = "Radio"
    elif norm == "newspaper":
        channel_key = "Newspaper"
    else:
        raise ValueError(f"Invalid channel '{selected_channel}'. Must be TV, Radio, or Newspaper.")

    model = get_trained_model(degree=degree, dataset_path=dataset_path)
    train_min = model.X_train.min()
    train_max = model.X_train.max()

    min_val = float(train_min[channel_key])
    max_val = float(train_max[channel_key])

    # Generate budget points across observed range
    spend_points = np.linspace(min_val, max_val, num_points)

    curve_data = []
    marginal_data = []
    delta = 1.0  # $1,000 budget step for finite difference approximation

    fixed_budgets = {
        "TV": fixed_tv,
        "Radio": fixed_radio,
        "Newspaper": fixed_newspaper,
    }

    # Evaluate predicted sales along the channel
    batch_rows = []
    batch_rows_plus = []
    for s in spend_points:
        row = dict(fixed_budgets)
        row[channel_key] = s
        batch_rows.append(row)

        row_plus = dict(fixed_budgets)
        row_plus[channel_key] = s + delta
        batch_rows_plus.append(row_plus)

    df_batch = pd.DataFrame(batch_rows)
    df_batch_plus = pd.DataFrame(batch_rows_plus)

    preds = model.pipeline.predict(df_batch)
    preds_plus = model.pipeline.predict(df_batch_plus)
    marginals = (preds_plus - preds) / delta

    for s, pred, marg in zip(spend_points, preds, marginals):
        curve_data.append({
            "spend": round(float(s), 2),
            "predicted_sales": round(float(pred), 3),
        })
        marginal_data.append({
            "spend": round(float(s), 2),
            "marginal_sales": round(float(marg), 4),
        })

    # Evaluate current user point
    current_row = dict(fixed_budgets)
    current_row[channel_key] = current_channel_spend
    current_pred = float(model.pipeline.predict(pd.DataFrame([current_row]))[0])

    # Evaluate point + delta for local marginal calculation
    current_row_plus = dict(fixed_budgets)
    current_row_plus[channel_key] = current_channel_spend + delta
    current_pred_plus = float(model.pipeline.predict(pd.DataFrame([current_row_plus]))[0])
    local_marginal = (current_pred_plus - current_pred) / delta
    local_sales_gain = current_pred_plus - current_pred

    # Second derivative / curvature analysis across the curve
    # Concave <=> marginal sales decreases as spend increases (d²Sales/dSpend² < 0)
    # Convex <=> marginal sales increases as spend increases (d²Sales/dSpend² > 0)
    # Linear <=> marginal sales is essentially constant
    initial_marginal = marginals[0]
    final_marginal = marginals[-1]
    marginal_slope = (final_marginal - initial_marginal) / (max_val - min_val)

    if abs(marginal_slope) < 1e-4:
        curvature = "Approximately Linear"
        has_diminishing_returns = False
        curvature_explanation = (
            f"Over the observed range (${min_val:.1f}k to ${max_val:.1f}k), the marginal impact of {channel_key} "
            f"is nearly constant ({initial_marginal:.4f} sales units per $1k spend). "
            f"Holding {', '.join([k for k in fixed_budgets if k != channel_key])} constant, "
            "the relationship does not exhibit strong non-linear curvature."
        )
    elif marginal_slope < 0:
        curvature = "Concave (Diminishing Returns Observed)"
        has_diminishing_returns = True
        curvature_explanation = (
            f"Diminishing returns ARE observed for {channel_key} holding other channels fixed. "
            f"At low spending (${min_val:.1f}k), an additional $1k spend yields ~{initial_marginal:.4f} extra sales units, "
            f"whereas at high spending (${max_val:.1f}k), an additional $1k spend yields only ~{final_marginal:.4f} extra sales units. "
            "The marginal return decreases as investment grows."
        )
    else:
        curvature = "Convex (Accelerating Returns Observed)"
        has_diminishing_returns = False
        curvature_explanation = (
            f"The fitted model shows an accelerating (convex) relationship for {channel_key} under these fixed channel budgets. "
            f"Marginal returns rise from {initial_marginal:.4f} to {final_marginal:.4f} per $1k spend. "
            "Note: In practice, interaction terms with other active channels or quadratic coefficients can create increasing returns "
            "over specific observed slices; this does not imply indefinite exponential growth."
        )

    # Channel coefficients for context
    poly_terms = model.artifact.coefficients if model.artifact else []
    channel_relevant_terms = [
        {"name": t.pretty_name, "coefficient": t.coefficient, "type": t.term_type}
        for t in poly_terms
        if channel_key in t.channels_involved
    ]

    return {
        "channel": channel_key,
        "current_spend": float(current_channel_spend),
        "current_predicted_sales": round(current_pred, 3),
        "nearby_step_delta": delta,
        "nearby_step_predicted_sales": round(current_pred_plus, 3),
        "nearby_step_sales_change": round(local_sales_gain, 4),
        "estimated_marginal_sales_at_point": round(local_marginal, 4),
        "curvature": curvature,
        "has_diminishing_returns": has_diminishing_returns,
        "marginal_slope": round(float(marginal_slope), 6),
        "initial_marginal": round(float(initial_marginal), 4),
        "final_marginal": round(float(final_marginal), 4),
        "curvature_explanation": curvature_explanation,
        "fixed_channels": {k: v for k, v in fixed_budgets.items() if k != channel_key},
        "observed_range": {"min": min_val, "max": max_val},
        "curve_points": curve_data,
        "marginal_points": marginal_data,
        "channel_relevant_coefficients": channel_relevant_terms,
        "degree": degree,
    }
