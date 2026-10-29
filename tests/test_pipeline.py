"""
Unit and Integration Tests for AdSales Intelligence ML Pipeline and API.
Tests data validation, model fitting, metric calculation, prediction, budget optimization,
diminishing returns, and FastAPI endpoints.
"""

import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from core.data_loader import load_and_validate_dataset, resolve_data_path
from core.model import AdSalesPolynomialModel, compare_all_degrees, get_trained_model
from core.optimizer import optimize_budget
from core.diminishing_returns import analyze_diminishing_returns
from core.explorer import get_eda_payload
from api.main import app


# 1. Dataset Loading and Validation Tests
def test_data_path_resolution():
    p = resolve_data_path()
    assert p.exists(), f"Path {p} does not exist"
    assert p.name.lower() == "advertising.csv"


def test_data_loader_structure():
    df, report = load_and_validate_dataset()
    assert report.is_valid is True
    assert report.row_count == 200
    assert report.column_count == 4
    for col in ["TV", "Radio", "Newspaper", "Sales"]:
        assert col in df.columns
        assert col in report.summary_stats
    assert df["Sales"].min() > 0
    assert df["TV"].min() >= 0


def test_data_loader_missing_values_and_clean():
    df, report = load_and_validate_dataset()
    assert sum(report.missing_values.values()) == 0
    assert len(report.errors) == 0


# 2. Model Fitting and Pipeline Tests
def test_polynomial_model_fit_degree_2():
    model = AdSalesPolynomialModel(degree=2, random_state=42)
    artifact = model.fit()

    assert artifact.metrics.degree == 2
    assert artifact.metrics.n_train == 160
    assert artifact.metrics.n_test == 40
    # Degree 2 with 3 features: 3 linear + 3 squared + 3 interaction = 9 poly features
    assert artifact.metrics.n_features_poly == 9
    assert artifact.metrics.r2_score > 0.95
    assert artifact.metrics.mae < 1.0
    assert artifact.metrics.rmse < 1.0
    assert artifact.metrics.cv_r2_mean > 0.90
    assert len(artifact.coefficients) == 10  # Intercept + 9 terms


def test_polynomial_degree_comparison():
    comparisons = compare_all_degrees(max_degree=4)
    assert len(comparisons) == 4
    deg1 = comparisons[0]
    deg2 = comparisons[1]
    deg4 = comparisons[3]

    assert deg1["degree"] == 1
    assert deg2["degree"] == 2
    # Degree 2 should outperform linear degree 1 on R2
    assert deg2["r2_score"] > deg1["r2_score"]
    # Degree 4 should demonstrate overfitting (lower test R2 than degree 2)
    assert deg4["r2_score"] < deg2["r2_score"]


# 3. Prediction and Input Validation Tests
def test_model_predict_valid():
    model = get_trained_model(degree=2)
    pred = model.predict(tv=150.0, radio=25.0, newspaper=20.0)

    assert "predicted_sales" in pred
    assert np.isfinite(pred["predicted_sales"])
    assert pred["predicted_sales"] > 0
    assert pred["is_extrapolation"] is False
    assert pred["total_budget"] == 195.0


def test_model_predict_extrapolation_warning():
    model = get_trained_model(degree=2)
    # 500 TV is well beyond max observed ~296.4
    pred = model.predict(tv=500.0, radio=25.0, newspaper=20.0)
    assert pred["is_extrapolation"] is True
    assert len(pred["warnings"]) > 0


def test_model_predict_negative_budget_raises():
    model = get_trained_model(degree=2)
    with pytest.raises(ValueError):
        model.predict(tv=-10.0, radio=20.0, newspaper=15.0)


# 4. Budget Optimizer Tests
def test_budget_optimizer_conservation():
    total_budget = 100.0
    res = optimize_budget(
        total_budget=total_budget,
        tv_bounds=(0.0, 300.0),
        radio_bounds=(0.0, 50.0),
        newspaper_bounds=(0.0, 115.0),
        fully_allocated=True,
        degree=2,
    )

    rec = res["recommended_allocation"]
    total_alloc = rec["TV"] + rec["Radio"] + rec["Newspaper"]
    # Verify sum of allocated budget equals total_budget
    assert np.isclose(total_alloc, total_budget, atol=0.2)
    # Check bounds
    assert 0.0 <= rec["TV"] <= 300.0
    assert 0.0 <= rec["Radio"] <= 50.0
    assert 0.0 <= rec["Newspaper"] <= 115.0
    # Check predicted sales is valid
    assert res["predicted_sales"] > 0
    # Check candidate comparisons exist
    assert len(res["candidate_comparisons"]) >= 2


def test_budget_optimizer_financial_scenario():
    res = optimize_budget(
        total_budget=100.0,
        fully_allocated=True,
        degree=2,
        assumed_revenue_per_unit=12.5,
    )
    assert res["financial_scenario"] is not None
    assert "optimized_est_roi_pct" in res["financial_scenario"]
    assert "disclaimer" in res["financial_scenario"]


# 5. Diminishing Returns Analysis Tests
def test_diminishing_returns_tv():
    res = analyze_diminishing_returns(
        selected_channel="TV",
        current_channel_spend=150.0,
        fixed_tv=150.0,
        fixed_radio=25.0,
        fixed_newspaper=25.0,
        degree=2,
        num_points=30,
    )
    assert res["channel"] == "TV"
    assert len(res["curve_points"]) == 30
    assert len(res["marginal_points"]) == 30
    assert "curvature" in res
    assert np.isfinite(res["estimated_marginal_sales_at_point"])
    # TV in Advertising dataset has negative quadratic term and shows diminishing returns
    assert res["has_diminishing_returns"] is True


def test_diminishing_returns_invalid_channel():
    with pytest.raises(ValueError):
        analyze_diminishing_returns(
            selected_channel="Billboard",
            current_channel_spend=50.0,
            fixed_tv=100.0,
            fixed_radio=20.0,
            fixed_newspaper=10.0,
        )


# 6. Exploratory Data Analysis Tests
def test_eda_payload():
    eda = get_eda_payload()
    assert eda["dataset_shape"]["rows"] == 200
    assert len(eda["statistics"]) == 4
    assert len(eda["correlation_matrix"]["columns"]) == 4
    assert len(eda["scatter_plots"]["TV_vs_Sales"]) == 200
    assert len(eda["insights"]) > 0


# 7. FastAPI Endpoints Tests
@pytest.fixture
def client():
    return TestClient(app)


def test_api_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_api_dataset_summary(client):
    r = client.get("/api/dataset/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["row_count"] == 200
    assert data["is_valid"] is True


def test_api_performance(client):
    r = client.get("/api/model/performance?degree=2")
    assert r.status_code == 200
    data = r.json()
    assert data["degree"] == 2
    assert data["r2_score"] > 0.95
    assert len(data["test_actuals"]) == 40


def test_api_predict(client):
    r = client.post(
        "/api/model/predict",
        json={"tv": 100.0, "radio": 20.0, "newspaper": 10.0, "degree": 2},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["predicted_sales"] > 0
    assert data["total_budget"] == 130.0


def test_api_optimize(client):
    r = client.post(
        "/api/model/optimize",
        json={
            "total_budget": 120.0,
            "tv_min": 10.0,
            "tv_max": 250.0,
            "radio_min": 5.0,
            "radio_max": 45.0,
            "newspaper_min": 0.0,
            "newspaper_max": 80.0,
            "fully_allocated": True,
            "degree": 2,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "recommended_allocation" in data
    assert "predicted_sales" in data
