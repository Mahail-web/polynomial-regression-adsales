"""
AdSales Intelligence: Advertising Sales Predictor
Streamlit Application using Scikit-Learn Polynomial Regression and Plotly.
Standalone, interactive, and deployable to Streamlit Community Cloud.
"""

import sys
from pathlib import Path

# Add project root to path for local and cloud imports
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from core.data_loader import load_and_validate_dataset
from core.diminishing_returns import analyze_diminishing_returns
from core.explorer import get_eda_payload
from core.model import (
    AdSalesPolynomialModel,
    compare_all_degrees,
    get_trained_model,
)
from core.optimizer import optimize_budget


# Streamlit Page Configuration
st.set_page_config(
    page_title="AdSales Intelligence | Polynomial Regression",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for refined aesthetics
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.1rem;
        font-weight: 700;
        color: #0F172A;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #475569;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
    }
    .metric-title {
        font-size: 0.85rem;
        color: #64748B;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #0F172A;
        margin-top: 4px;
    }
    .metric-sub {
        font-size: 0.8rem;
        color: #0D9488;
        margin-top: 2px;
    }
    .info-callout {
        background-color: #F0FDFA;
        border-left: 4px solid #0D9488;
        padding: 12px 16px;
        border-radius: 4px;
        margin: 12px 0;
        font-size: 0.92rem;
        color: #134E4A;
    }
    .warning-callout {
        background-color: #FFFBEB;
        border-left: 4px solid #F59E0B;
        padding: 12px 16px;
        border-radius: 4px;
        margin: 12px 0;
        font-size: 0.92rem;
        color: #92400E;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data
def load_data():
    df, report = load_and_validate_dataset()
    return df, report


@st.cache_data
def load_eda():
    return get_eda_payload()


@st.cache_resource
def get_cached_model(deg: int):
    return get_trained_model(degree=deg)


# Sidebar Navigation
with st.sidebar:
    st.image(
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
        use_container_width=True,
    )
    st.title("AdSales Intelligence")
    st.caption("Polynomial Regression Marketing Analytics")

    selected_section = st.radio(
        "Navigation",
        [
            "Overview",
            "Sales Predictor",
            "Budget Optimizer",
            "Diminishing Returns",
            "Model Performance",
            "Data Explorer",
            "About the Model",
        ],
        index=0,
    )

    st.markdown("---")
    st.markdown("**Model Configuration**")
    global_degree = st.selectbox(
        "Default Polynomial Degree",
        [1, 2, 3, 4],
        index=1,
        help="Degree 1: Multiple Linear Regression\nDegree 2: Quadratic with interactions (Recommended)\nDegree 3+: Higher complexity risk of overfitting",
    )
    st.caption("Units: Budgets in $1,000s USD; Sales in 1,000 units.")


# SECTION 1: OVERVIEW
if selected_section == "Overview":
    st.markdown('<div class="main-header">AdSales Intelligence: Advertising Sales Predictor</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Evaluating non-linear media synergies and diminishing returns using Polynomial Regression.</div>',
        unsafe_allow_html=True,
    )

    df, report = load_data()
    model = get_cached_model(global_degree)
    artifact = model.artifact

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Observations</div>
                <div class="metric-value">{report.row_count}</div>
                <div class="metric-sub">Kaggle Advertising Data</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Polynomial Degree</div>
                <div class="metric-value">{global_degree}</div>
                <div class="metric-sub">{artifact.metrics.n_features_poly} terms</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Test Set R²</div>
                <div class="metric-value">{artifact.metrics.r2_score:.3f}</div>
                <div class="metric-sub">Held-out (80:20 split)</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col4:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Test MAE</div>
                <div class="metric-value">{artifact.metrics.mae:.2f}</div>
                <div class="metric-sub">Thousand units</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col5:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Test RMSE</div>
                <div class="metric-value">{artifact.metrics.rmse:.2f}</div>
                <div class="metric-sub">Thousand units</div>
            </div>""",
            unsafe_allow_html=True,
        )

    st.markdown("### Advertising Spend vs. Product Sales Overview")
    c1, c2 = st.columns([2, 1])
    with c1:
        fig = px.scatter(
            df,
            x="TV",
            y="Sales",
            size="Radio",
            color="Newspaper",
            color_continuous_scale="Viridis",
            labels={
                "TV": "TV Advertising Spend ($1,000s)",
                "Sales": "Product Sales (1,000 units)",
                "Radio": "Radio Spend ($1,000s)",
                "Newspaper": "Newspaper Spend ($1,000s)",
            },
            title="Multi-channel Advertising Spend vs. Sales (Bubble Size = Radio, Color = Newspaper)",
        )
        fig.update_layout(height=420, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)

    with c2:
        st.markdown("#### Key Model Findings")
        st.markdown(
            """
            - **TV is the Anchor**: TV accounts for the strongest monotonic relationship with sales.
            - **Synergy (TV × Radio)**: The fitted Degree 2 model demonstrates a significant positive interaction term (`+0.001111 TV·Radio`). Combining TV and Radio yields super-additive sales.
            - **TV Diminishing Returns**: The quadratic TV term is negative (`-0.000112 TV²`), indicating concavity and tapering marginal returns at high spending levels.
            - **Newspaper Effect**: Newspaper shows weak standalone predictive power after controlling for TV and Radio.
            """
        )
        st.markdown(
            f'<div class="info-callout">Model Status: <b>Trained & Validated</b> ({artifact.metrics.n_train} train / {artifact.metrics.n_test} test).</div>',
            unsafe_allow_html=True,
        )


# SECTION 2: SALES PREDICTOR
elif selected_section == "Sales Predictor":
    st.markdown('<div class="main-header">Interactive Sales Predictor</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Estimate product sales for custom multi-channel advertising budget allocations.</div>',
        unsafe_allow_html=True,
    )

    df, report = load_data()
    ranges = report.channel_ranges

    col_inputs, col_results = st.columns([1, 1])

    with col_inputs:
        st.markdown("#### Input Channel Budgets")
        tv_input = st.slider(
            "TV Budget ($1,000s)",
            min_value=0.0,
            max_value=350.0,
            value=150.0,
            step=1.0,
            help=f"Observed training range: ${ranges['TV'][0]:.1f}k - ${ranges['TV'][1]:.1f}k",
        )
        radio_input = st.slider(
            "Radio Budget ($1,000s)",
            min_value=0.0,
            max_value=70.0,
            value=25.0,
            step=0.5,
            help=f"Observed training range: ${ranges['Radio'][0]:.1f}k - ${ranges['Radio'][1]:.1f}k",
        )
        newspaper_input = st.slider(
            "Newspaper Budget ($1,000s)",
            min_value=0.0,
            max_value=140.0,
            value=20.0,
            step=1.0,
            help=f"Observed training range: ${ranges['Newspaper'][0]:.1f}k - ${ranges['Newspaper'][1]:.1f}k",
        )

        pred_degree = st.selectbox("Polynomial Degree for Prediction", [1, 2, 3, 4], index=1)

    model = get_cached_model(pred_degree)
    res = model.predict(tv=tv_input, radio=radio_input, newspaper=newspaper_input)

    with col_results:
        st.markdown("#### Prediction Output")
        total_b = res["total_budget"]
        pred_sales = res["predicted_sales"]

        st.markdown(
            f"""
            <div style="background:#F0FDFA; border:1px solid #CCFBF1; border-radius:12px; padding:24px; text-align:center;">
                <div style="color:#0F766E; font-size:0.9rem; font-weight:600; text-transform:uppercase;">Predicted Sales</div>
                <div style="color:#0F172A; font-size:3rem; font-weight:800; margin:8px 0;">{pred_sales:.2f} <span style="font-size:1.2rem; color:#64748B;">thousand units</span></div>
                <div style="color:#64748B; font-size:0.9rem;">Total Advertising Budget: <b>${total_b:.1f}k</b></div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if res["is_extrapolation"]:
            st.markdown(
                f"""<div class="warning-callout">
                    ⚠️ <b>Extrapolation Warning:</b> One or more input budgets lie outside the empirical training data range.
                    Predictions beyond observed ranges rely on polynomial curve continuation and must be treated with caution.
                </div>""",
                unsafe_allow_html=True,
            )

        # Budget breakdown chart
        breakdown_df = pd.DataFrame([
            {"Channel": "TV", "Budget": tv_input, "Share": res["budget_breakdown"]["TV"]["share"]},
            {"Channel": "Radio", "Budget": radio_input, "Share": res["budget_breakdown"]["Radio"]["share"]},
            {"Channel": "Newspaper", "Budget": newspaper_input, "Share": res["budget_breakdown"]["Newspaper"]["share"]},
        ])
        fig_bar = px.bar(
            breakdown_df,
            x="Channel",
            y="Budget",
            text="Budget",
            color="Channel",
            color_discrete_map={"TV": "#0D9488", "Radio": "#3B82F6", "Newspaper": "#F59E0B"},
            title="Budget Allocation Breakdown ($1,000s)",
        )
        fig_bar.update_layout(height=260, template="plotly_white", showlegend=False)
        st.plotly_chart(fig_bar, use_container_width=True)


# SECTION 3: BUDGET OPTIMIZER
elif selected_section == "Budget Optimizer":
    st.markdown('<div class="main-header">Advertising Budget Optimizer</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Maximize predicted sales under bounded channel constraints using SciPy SLSQP numerical optimization.</div>',
        unsafe_allow_html=True,
    )

    opt_col1, opt_col2 = st.columns([1, 2])
    with opt_col1:
        st.markdown("#### Optimization Parameters")
        target_budget = st.number_input("Total Advertising Budget ($1,000s)", min_value=10.0, max_value=400.0, value=150.0, step=5.0)

        st.markdown("**Channel Capacity Bounds ($1,000s)**")
        tv_max = st.slider("TV Max Capacity", 10.0, 300.0, 250.0)
        radio_max = st.slider("Radio Max Capacity", 5.0, 50.0, 45.0)
        news_max = st.slider("Newspaper Max Capacity", 0.0, 115.0, 50.0)

        fully_alloc = st.checkbox("Require 100% Budget Allocation (Sum = Total)", value=True)
        opt_degree = st.selectbox("Model Degree for Optimization", [1, 2, 3, 4], index=1)

        st.markdown("---")
        st.markdown("**Illustrative Scenario Pricing**")
        unit_rev = st.number_input("Assumed Revenue per Sales Unit ($)", min_value=0.0, value=15.0, step=1.0)

    opt_res = optimize_budget(
        total_budget=target_budget,
        tv_bounds=(0.0, tv_max),
        radio_bounds=(0.0, radio_max),
        newspaper_bounds=(0.0, news_max),
        fully_allocated=fully_alloc,
        degree=opt_degree,
        assumed_revenue_per_unit=unit_rev if unit_rev > 0 else None,
    )

    with opt_col2:
        st.markdown("#### Recommended Optimal Allocation")
        rec = opt_res["recommended_allocation"]
        base = opt_res["baseline_allocation"]

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Recommended TV", f"${rec['TV']:.1f}k")
        m2.metric("Recommended Radio", f"${rec['Radio']:.1f}k")
        m3.metric("Recommended Newspaper", f"${rec['Newspaper']:.1f}k")
        m4.metric("Optimal Sales", f"{opt_res['predicted_sales']:.2f}k", delta=f"+{opt_res['sales_difference']:.2f}k vs Equal")

        # Candidate comparisons table
        cand_df = pd.DataFrame(opt_res["candidate_comparisons"])
        st.markdown("##### Candidate Allocation Comparisons")
        st.dataframe(cand_df, use_container_width=True)

        fig_comp = go.Figure(data=[
            go.Bar(name="TV", x=cand_df["name"], y=cand_df["tv"], marker_color="#0D9488"),
            go.Bar(name="Radio", x=cand_df["name"], y=cand_df["radio"], marker_color="#3B82F6"),
            go.Bar(name="Newspaper", x=cand_df["name"], y=cand_df["newspaper"], marker_color="#F59E0B"),
        ])
        fig_comp.update_layout(barmode="stack", title="Channel Spending Across Strategies", height=320, template="plotly_white")
        st.plotly_chart(fig_comp, use_container_width=True)

        if opt_res["financial_scenario"]:
            f = opt_res["financial_scenario"]
            st.markdown(
                f"""<div class="info-callout">
                    <b>Scenario Analysis (Assumed Revenue ${f['assumed_revenue_per_sales_unit']:.2f}/unit):</b><br/>
                    Optimized Projected Revenue: <b>${f['optimized_gross_revenue']:.1f}k</b> (Estimated ROI: {f['optimized_est_roi_pct']:.1f}%)<br/>
                    Baseline Equal Split Revenue: <b>${f['baseline_gross_revenue']:.1f}k</b> (Estimated ROI: {f['baseline_est_roi_pct']:.1f}%)<br/>
                    <small><i>{f['disclaimer']}</i></small>
                </div>""",
                unsafe_allow_html=True,
            )


# SECTION 4: DIMINISHING RETURNS
elif selected_section == "Diminishing Returns":
    st.markdown('<div class="main-header">Diminishing Returns & Response Curve Analysis</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Evaluating empirical marginal sales response (numerical derivatives) and concavity across spending ranges.</div>',
        unsafe_allow_html=True,
    )

    d_col1, d_col2 = st.columns([1, 2])
    with d_col1:
        st.markdown("#### Channel Selection")
        selected_ch = st.selectbox("Focal Channel to Analyze", ["TV", "Radio", "Newspaper"])

        st.markdown("#### Fixed Baseline Values for Other Channels")
        fix_tv = st.number_input("Fixed TV Spend ($1,000s)", value=150.0, step=5.0)
        fix_radio = st.number_input("Fixed Radio Spend ($1,000s)", value=25.0, step=2.5)
        fix_news = st.number_input("Fixed Newspaper Spend ($1,000s)", value=20.0, step=2.5)

        current_val = fix_tv if selected_ch == "TV" else (fix_radio if selected_ch == "Radio" else fix_news)
        investigate_spend = st.slider(f"Active Evaluation Point for {selected_ch} ($1,000s)", 0.0, 300.0, float(current_val), step=2.0)

    dim_res = analyze_diminishing_returns(
        selected_channel=selected_ch,
        current_channel_spend=investigate_spend,
        fixed_tv=fix_tv,
        fixed_radio=fix_radio,
        fixed_newspaper=fix_news,
        degree=2,
    )

    with d_col2:
        st.markdown(f"#### Curvature Assessment: **{dim_res['curvature']}**")
        st.markdown(
            f"""<div class="info-callout">{dim_res['curvature_explanation']}</div>""",
            unsafe_allow_html=True,
        )

        p1, p2, p3 = st.columns(3)
        p1.metric(f"Current {selected_ch} Spend", f"${dim_res['current_spend']:.1f}k")
        p2.metric("Predicted Sales", f"{dim_res['current_predicted_sales']:.2f}k units")
        p3.metric("Local Marginal Return", f"{dim_res['estimated_marginal_sales_at_point']:.4f} units / $1k")

        # Plot Response Curve
        pts = pd.DataFrame(dim_res["curve_points"])
        fig_curve = px.line(
            pts,
            x="spend",
            y="predicted_sales",
            title=f"Predicted Sales Response Curve vs. {selected_ch} Spend",
            labels={"spend": f"{selected_ch} Spend ($1,000s)", "predicted_sales": "Predicted Sales (1,000 units)"},
        )
        fig_curve.add_trace(
            go.Scatter(
                x=[dim_res["current_spend"]],
                y=[dim_res["current_predicted_sales"]],
                mode="markers",
                marker=dict(size=12, color="red"),
                name="Current Point",
            )
        )
        fig_curve.update_layout(height=320, template="plotly_white")
        st.plotly_chart(fig_curve, use_container_width=True)

        # Plot Marginal Effect Curve
        m_pts = pd.DataFrame(dim_res["marginal_points"])
        fig_marg = px.line(
            m_pts,
            x="spend",
            y="marginal_sales",
            title=f"Marginal Sales Rate (dSales / dSpend) across {selected_ch} Spend",
            labels={"spend": f"{selected_ch} Spend ($1,000s)", "marginal_sales": "Marginal Sales (Units per $1k)"},
            color_discrete_sequence=["#0D9488"],
        )
        fig_marg.update_layout(height=260, template="plotly_white")
        st.plotly_chart(fig_marg, use_container_width=True)


# SECTION 5: MODEL PERFORMANCE
elif selected_section == "Model Performance":
    st.markdown('<div class="main-header">Model Performance & Residual Diagnostics</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Evaluating predictive accuracy, out-of-sample error, and complexity trade-offs across degrees.</div>',
        unsafe_allow_html=True,
    )

    perf_deg = st.selectbox("Select Polynomial Degree for Evaluation", [1, 2, 3, 4], index=1)
    model = get_cached_model(perf_deg)
    artifact = model.artifact

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Held-Out Test R²", f"{artifact.metrics.r2_score:.4f}")
    m2.metric("Adjusted R²", f"{artifact.metrics.adjusted_r2_score:.4f}")
    m3.metric("Test MAE", f"{artifact.metrics.mae:.4f}")
    m4.metric("Test RMSE", f"{artifact.metrics.rmse:.4f}")

    c1, c2 = st.columns(2)
    with c1:
        # Actual vs Predicted Scatter
        test_df = pd.DataFrame({
            "Actual": artifact.test_actuals,
            "Predicted": artifact.test_predictions,
            "Residual": artifact.test_residuals,
        })
        fig_diag = px.scatter(
            test_df,
            x="Actual",
            y="Predicted",
            title="Actual vs. Predicted Sales (Held-out Test Set)",
            labels={"Actual": "Observed Sales (1,000 units)", "Predicted": "Model Predicted Sales"},
        )
        # Add 45-degree reference line
        min_v = min(test_df["Actual"].min(), test_df["Predicted"].min())
        max_v = max(test_df["Actual"].max(), test_df["Predicted"].max())
        fig_diag.add_trace(
            go.Scatter(x=[min_v, max_v], y=[min_v, max_v], mode="lines", line=dict(dash="dash", color="gray"), name="Perfect Fit")
        )
        fig_diag.update_layout(height=350, template="plotly_white")
        st.plotly_chart(fig_diag, use_container_width=True)

    with c2:
        # Residuals vs Predicted
        fig_res = px.scatter(
            test_df,
            x="Predicted",
            y="Residual",
            title="Residuals vs. Predicted Values",
            labels={"Predicted": "Fitted Values", "Residual": "Residual (Actual - Predicted)"},
            color_discrete_sequence=["#EF4444"],
        )
        fig_res.add_hline(y=0, line_dash="dash", line_color="gray")
        fig_res.update_layout(height=350, template="plotly_white")
        st.plotly_chart(fig_res, use_container_width=True)

    st.markdown("### Complexity vs. Overfitting: Degrees 1 to 4 Comparison")
    comp_df = pd.DataFrame(compare_all_degrees(max_degree=4))
    st.dataframe(comp_df[["degree", "label", "r2_score", "mae", "rmse", "cv_r2_mean", "n_poly_features"]], use_container_width=True)

    fig_comp_line = go.Figure()
    fig_comp_line.add_trace(go.Scatter(x=comp_df["degree"], y=comp_df["r2_score"], mode="lines+markers", name="Test R²", line=dict(color="#0D9488", width=3)))
    fig_comp_line.add_trace(go.Scatter(x=comp_df["degree"], y=comp_df["cv_r2_mean"], mode="lines+markers", name="5-Fold CV Train R²", line=dict(color="#3B82F6", dash="dot")))
    fig_comp_line.update_layout(title="Test R² vs. CV R² by Degree", xaxis_title="Polynomial Degree", yaxis_title="R² Score", height=300, template="plotly_white")
    st.plotly_chart(fig_comp_line, use_container_width=True)


# SECTION 6: DATA EXPLORER
elif selected_section == "Data Explorer":
    st.markdown('<div class="main-header">Exploratory Data Analysis</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Inspection of raw observations, statistical distributions, and correlation structure.</div>',
        unsafe_allow_html=True,
    )

    eda = load_eda()

    tab1, tab2, tab3 = st.tabs(["Dataset Table", "Distributions & Stats", "Correlations"])

    with tab1:
        st.markdown("#### Advertising Dataset Records (200 rows)")
        raw_df = pd.DataFrame(eda["records"])
        st.dataframe(raw_df, use_container_width=True, height=400)

        # Download CSV
        csv_bytes = raw_df.to_csv(index=False).encode("utf-8")
        st.download_button("Download Dataset as CSV", data=csv_bytes, file_name="advertising_validated.csv", mime="text/csv")

    with tab2:
        st.markdown("#### Summary Statistics")
        stats_df = pd.DataFrame(eda["statistics"])
        st.dataframe(stats_df, use_container_width=True)

        st.markdown("#### Feature Distributions")
        f_col1, f_col2 = st.columns(2)
        with f_col1:
            tv_bins = pd.DataFrame(eda["histograms"]["TV"])
            fig_tv = px.bar(tv_bins, x="bin_label", y="count", title="TV Spend Distribution", labels={"bin_label": "Spend Range ($1,000s)", "count": "Frequency"})
            fig_tv.update_layout(height=280, template="plotly_white")
            st.plotly_chart(fig_tv, use_container_width=True)
        with f_col2:
            sales_bins = pd.DataFrame(eda["histograms"]["Sales"])
            fig_sales = px.bar(sales_bins, x="bin_label", y="count", title="Sales Distribution", labels={"bin_label": "Sales Range (1,000 units)", "count": "Frequency"}, color_discrete_sequence=["#0D9488"])
            fig_sales.update_layout(height=280, template="plotly_white")
            st.plotly_chart(fig_sales, use_container_width=True)

    with tab3:
        st.markdown("#### Correlation Heatmap")
        corr_matrix = eda["correlation_matrix"]
        fig_corr = px.imshow(
            corr_matrix["values"],
            x=corr_matrix["columns"],
            y=corr_matrix["columns"],
            color_continuous_scale="Blues",
            text_auto=True,
            title="Pearson Correlation Matrix",
        )
        fig_corr.update_layout(height=380, template="plotly_white")
        st.plotly_chart(fig_corr, use_container_width=True)

        st.markdown("#### Key Statistical Insights")
        for ins in eda["insights"]:
            st.markdown(f"- {ins}")


# SECTION 7: ABOUT THE MODEL
elif selected_section == "About the Model":
    st.markdown('<div class="main-header">About Polynomial Regression & Feature Engineering</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Educational overview of polynomial transformations, coefficients, and mathematical formulation.</div>',
        unsafe_allow_html=True,
    )

    model = get_cached_model(2)
    artifact = model.artifact

    st.markdown("### The Mathematical Formulation")
    st.markdown(
        """
        Polynomial regression extends multiple linear regression by creating powers and cross-product interactions of original features:
        $$\\text{Sales} = \\beta_0 + \\beta_1 \\text{TV} + \\beta_2 \\text{Radio} + \\beta_3 \\text{Newspaper} + \\beta_4 \\text{TV}^2 + \\beta_5 \\text{Radio}^2 + \\beta_6 \\text{Newspaper}^2 + \\beta_7 (\\text{TV} \\times \\text{Radio}) + \\beta_8 (\\text{TV} \\times \\text{Newspaper}) + \\beta_9 (\\text{Radio} \\times \\text{Newspaper})$$
        """
    )

    st.markdown("#### Learned Model Equation (Degree 2)")
    st.code(artifact.equation_string, language="text")

    st.markdown("#### Coefficient Analysis Table")
    coef_df = pd.DataFrame([
        {
            "Term": c.pretty_name,
            "Type": c.term_type.capitalize(),
            "Coefficient": c.coefficient,
            "Channels": ", ".join(c.channels_involved) if c.channels_involved else "None",
        }
        for c in artifact.coefficients
    ])
    st.dataframe(coef_df, use_container_width=True)

    # Coefficient Bar Chart
    coef_plot_df = coef_df[coef_df["Type"] != "Intercept"].copy()
    fig_coef = px.bar(
        coef_plot_df,
        x="Term",
        y="Coefficient",
        color="Type",
        title="Fitted Polynomial Coefficients (Degree 2)",
    )
    fig_coef.update_layout(height=350, template="plotly_white")
    st.plotly_chart(fig_coef, use_container_width=True)

    st.markdown(
        """
        <div class="info-callout">
            <b>Interpretability Notice:</b> Individual polynomial coefficients cannot be evaluated as isolated direct causal effects.
            Because TV² and TV × Radio both contain TV, the marginal effect of TV is a function of both TV and Radio spend levels:
            <br/>
            <code>dSales/dTV = β₁ + 2·β₄·TV + β₇·Radio + β₈·Newspaper</code>
        </div>
        """,
        unsafe_allow_html=True,
    )
