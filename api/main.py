"""
FastAPI Backend Application for AdSales Intelligence.
Serves Polynomial Regression predictions, evaluations, optimization, and dataset analysis.
"""

from typing import Dict, List, Optional, Tuple, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.data_loader import load_and_validate_dataset
from core.model import AdSalesPolynomialModel, compare_all_degrees, get_trained_model
from core.optimizer import optimize_budget
from core.diminishing_returns import analyze_diminishing_returns
from core.explorer import get_eda_payload


app = FastAPI(
    title="AdSales Intelligence API",
    description="Polynomial Regression Machine Learning API for Advertising Sales Prediction",
    version="1.0.0",
)

# Enable CORS for Next.js frontend (default localhost:3000 and custom ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Request Models
class PredictRequest(BaseModel):
    tv: float = Field(..., ge=0.0, description="TV advertising budget in thousands of dollars")
    radio: float = Field(..., ge=0.0, description="Radio advertising budget in thousands of dollars")
    newspaper: float = Field(..., ge=0.0, description="Newspaper advertising budget in thousands of dollars")
    degree: int = Field(default=2, ge=1, le=4, description="Polynomial degree (1 to 4)")


class OptimizeRequest(BaseModel):
    total_budget: float = Field(..., gt=0.0, description="Total budget in thousands of dollars")
    tv_min: float = Field(default=0.0, ge=0.0)
    tv_max: float = Field(default=300.0, gt=0.0)
    radio_min: float = Field(default=0.0, ge=0.0)
    radio_max: float = Field(default=50.0, gt=0.0)
    newspaper_min: float = Field(default=0.0, ge=0.0)
    newspaper_max: float = Field(default=115.0, gt=0.0)
    fully_allocated: bool = Field(default=True)
    degree: int = Field(default=2, ge=1, le=4)
    assumed_revenue_per_unit: Optional[float] = Field(default=None, ge=0.0)


class DiminishingReturnsRequest(BaseModel):
    selected_channel: str = Field(..., description="Target channel: 'TV', 'Radio', or 'Newspaper'")
    current_channel_spend: float = Field(..., ge=0.0)
    fixed_tv: float = Field(default=150.0, ge=0.0)
    fixed_radio: float = Field(default=25.0, ge=0.0)
    fixed_newspaper: float = Field(default=25.0, ge=0.0)
    degree: int = Field(default=2, ge=1, le=4)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AdSales Intelligence API",
        "version": "1.0.0",
        "engine": "Scikit-learn Polynomial Regression",
    }


@app.get("/api/dataset/summary")
def get_dataset_summary():
    try:
        _, report = load_and_validate_dataset()
        return {
            "is_valid": report.is_valid,
            "row_count": report.row_count,
            "column_count": report.column_count,
            "columns": report.columns,
            "missing_values": report.missing_values,
            "duplicate_rows": report.duplicate_rows,
            "channel_ranges": report.channel_ranges,
            "summary_stats": report.summary_stats,
            "warnings": report.warnings,
            "errors": report.errors,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model/performance")
def get_model_performance(degree: int = Query(default=2, ge=1, le=4)):
    try:
        model = get_trained_model(degree=degree)
        artifact = model.artifact
        if artifact is None:
            artifact = model.fit()

        return {
            "degree": artifact.metrics.degree,
            "r2_score": round(artifact.metrics.r2_score, 4),
            "adjusted_r2_score": round(artifact.metrics.adjusted_r2_score, 4),
            "mae": round(artifact.metrics.mae, 4),
            "rmse": round(artifact.metrics.rmse, 4),
            "cv_r2_mean": round(artifact.metrics.cv_r2_mean, 4),
            "cv_r2_std": round(artifact.metrics.cv_r2_std, 4),
            "n_train": artifact.metrics.n_train,
            "n_test": artifact.metrics.n_test,
            "n_poly_features": artifact.metrics.n_features_poly,
            "equation": artifact.equation_string,
            "test_actuals": artifact.test_actuals,
            "test_predictions": artifact.test_predictions,
            "test_residuals": artifact.test_residuals,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model/coefficients")
def get_model_coefficients(degree: int = Query(default=2, ge=1, le=4)):
    try:
        model = get_trained_model(degree=degree)
        artifact = model.artifact or model.fit()
        return {
            "degree": degree,
            "intercept": artifact.intercept,
            "equation": artifact.equation_string,
            "coefficients": [
                {
                    "name": t.name,
                    "pretty_name": t.pretty_name,
                    "term_type": t.term_type,
                    "coefficient": round(t.coefficient, 6),
                    "channels_involved": t.channels_involved,
                }
                for t in artifact.coefficients
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model/compare")
def compare_degrees():
    try:
        return compare_all_degrees(max_degree=4)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/model/predict")
def predict_sales(req: PredictRequest):
    try:
        model = get_trained_model(degree=req.degree)
        res = model.predict(tv=req.tv, radio=req.radio, newspaper=req.newspaper)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/model/optimize")
def optimize(req: OptimizeRequest):
    try:
        res = optimize_budget(
            total_budget=req.total_budget,
            tv_bounds=(req.tv_min, req.tv_max),
            radio_bounds=(req.radio_min, req.radio_max),
            newspaper_bounds=(req.newspaper_min, req.newspaper_max),
            fully_allocated=req.fully_allocated,
            degree=req.degree,
            assumed_revenue_per_unit=req.assumed_revenue_per_unit,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/model/diminishing-returns")
def diminishing_returns(req: DiminishingReturnsRequest):
    try:
        res = analyze_diminishing_returns(
            selected_channel=req.selected_channel,
            current_channel_spend=req.current_channel_spend,
            fixed_tv=req.fixed_tv,
            fixed_radio=req.fixed_radio,
            fixed_newspaper=req.fixed_newspaper,
            degree=req.degree,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/eda")
def get_eda():
    try:
        return get_eda_payload()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
