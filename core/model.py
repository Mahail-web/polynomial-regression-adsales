"""
Polynomial Regression Modeling Module for AdSales Intelligence.
Builds, evaluates, and persists Polynomial Regression models for Advertising Sales prediction.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures

from core.data_loader import load_and_validate_dataset


@dataclass
class ModelMetrics:
    degree: int
    r2_score: float
    adjusted_r2_score: float
    mae: float
    rmse: float
    cv_r2_mean: float
    cv_r2_std: float
    n_train: int
    n_test: int
    n_features_in: int
    n_features_poly: int


@dataclass
class CoefficientTerm:
    name: str
    pretty_name: str
    term_type: str  # 'intercept', 'linear', 'squared', 'interaction'
    coefficient: float
    channels_involved: List[str]


@dataclass
class ModelTrainedArtifact:
    metrics: ModelMetrics
    coefficients: List[CoefficientTerm]
    intercept: float
    equation_string: str
    test_actuals: List[float]
    test_predictions: List[float]
    test_residuals: List[float]


class AdSalesPolynomialModel:
    """
    Scikit-learn based Polynomial Regression Pipeline for Advertising Sales.
    Strictly follows ML best practices:
    - 80:20 Train-Test split before feature engineering
    - Preprocessing (PolynomialFeatures) fitted ONLY on training data via Pipeline
    - Tested on held-out test data
    - 5-fold Cross-Validation on training data
    """

    def __init__(
        self,
        degree: int = 2,
        test_size: float = 0.2,
        random_state: int = 42,
        dataset_path: Optional[str] = None,
    ):
        if degree < 1 or degree > 4:
            raise ValueError(f"Degree must be between 1 and 4. Got {degree}.")

        self.degree = degree
        self.test_size = test_size
        self.random_state = random_state
        self.dataset_path = dataset_path

        self.df: Optional[pd.DataFrame] = None
        self.pipeline: Optional[Pipeline] = None
        self.X_train: Optional[pd.DataFrame] = None
        self.X_test: Optional[pd.DataFrame] = None
        self.y_train: Optional[pd.Series] = None
        self.y_test: Optional[pd.Series] = None
        self.feature_names_poly: List[str] = []
        self.artifact: Optional[ModelTrainedArtifact] = None

    def fit(self) -> ModelTrainedArtifact:
        df, report = load_and_validate_dataset(self.dataset_path)
        if not report.is_valid:
            raise ValueError(f"Dataset validation failed: {report.errors}")

        self.df = df
        X = df[["TV", "Radio", "Newspaper"]]
        y = df["Sales"]

        # 80:20 train-test split with fixed random seed
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.test_size, random_state=self.random_state
        )

        self.X_train = X_train
        self.X_test = X_test
        self.y_train = y_train
        self.y_test = y_test

        # Pipeline: PolynomialFeatures -> LinearRegression (no data leakage)
        # include_bias=False so LinearRegression fits intercept directly
        pipe = Pipeline([
            ("poly", PolynomialFeatures(degree=self.degree, include_bias=False)),
            ("linear", LinearRegression(fit_intercept=True)),
        ])

        # Cross-validation on train split (5-fold)
        kf = KFold(n_splits=5, shuffle=True, random_state=self.random_state)
        cv_scores = cross_val_score(pipe, X_train, y_train, cv=kf, scoring="r2")
        cv_mean = float(np.mean(cv_scores))
        cv_std = float(np.std(cv_scores))

        # Fit model on entire train set
        pipe.fit(X_train, y_train)
        self.pipeline = pipe

        # Predictions on held-out test data
        y_pred = pipe.predict(X_test)
        residuals = y_test.values - y_pred

        r2 = float(r2_score(y_test, y_pred))
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))

        # Calculate Adjusted R2
        n = len(y_test)
        p = pipe.named_steps["poly"].n_output_features_
        if n - p - 1 > 0:
            adj_r2 = float(1.0 - (1.0 - r2) * (n - 1) / (n - p - 1))
        else:
            adj_r2 = float(r2)

        # Extract features and coefficients
        poly_step = pipe.named_steps["poly"]
        linear_step = pipe.named_steps["linear"]
        raw_feature_names = list(poly_step.get_feature_names_out(X.columns))
        self.feature_names_poly = raw_feature_names
        raw_coefs = linear_step.coef_
        intercept = float(linear_step.intercept_)

        coefficients: List[CoefficientTerm] = [
            CoefficientTerm(
                name="Intercept",
                pretty_name="Intercept (β₀)",
                term_type="intercept",
                coefficient=intercept,
                channels_involved=[],
            )
        ]

        for name, coef in zip(raw_feature_names, raw_coefs):
            term_type, pretty, channels = self._classify_feature_term(name)
            coefficients.append(
                CoefficientTerm(
                    name=name,
                    pretty_name=pretty,
                    term_type=term_type,
                    coefficient=float(coef),
                    channels_involved=channels,
                )
            )

        equation = self._build_equation_string(intercept, raw_feature_names, raw_coefs)

        metrics = ModelMetrics(
            degree=self.degree,
            r2_score=r2,
            adjusted_r2_score=adj_r2,
            mae=mae,
            rmse=rmse,
            cv_r2_mean=cv_mean,
            cv_r2_std=cv_std,
            n_train=len(X_train),
            n_test=len(X_test),
            n_features_in=X.shape[1],
            n_features_poly=p,
        )

        self.artifact = ModelTrainedArtifact(
            metrics=metrics,
            coefficients=coefficients,
            intercept=intercept,
            equation_string=equation,
            test_actuals=[float(v) for v in y_test.values],
            test_predictions=[float(v) for v in y_pred],
            test_residuals=[float(v) for v in residuals],
        )

        return self.artifact

    def predict(
        self,
        tv: float,
        radio: float,
        newspaper: float,
    ) -> Dict[str, Any]:
        """
        Predict sales for given TV, Radio, Newspaper expenditures.
        Validates ranges and flags extrapolations.
        """
        if self.pipeline is None:
            self.fit()

        for val, name in [(tv, "TV"), (radio, "Radio"), (newspaper, "Newspaper")]:
            if not np.isfinite(val):
                raise ValueError(f"Expenditure for {name} must be finite.")
            if val < 0:
                raise ValueError(f"Expenditure for {name} must be non-negative. Got {val}.")

        # Check observed training data bounds
        train_min = self.X_train.min()
        train_max = self.X_train.max()

        warnings = []
        is_extrapolation = False
        inputs = {"TV": tv, "Radio": radio, "Newspaper": newspaper}
        for ch, val in inputs.items():
            if val < train_min[ch] or val > train_max[ch]:
                is_extrapolation = True
                warnings.append(
                    f"{ch} budget ${val:.1f}k is outside the observed training range "
                    f"(${train_min[ch]:.1f}k - ${train_max[ch]:.1f}k). Prediction is an extrapolation."
                )

        input_df = pd.DataFrame([[tv, radio, newspaper]], columns=["TV", "Radio", "Newspaper"])
        pred_sales = float(self.pipeline.predict(input_df)[0])

        total_budget = tv + radio + newspaper
        breakdown = {
            "TV": {"amount": tv, "share": round((tv / total_budget) * 100, 1) if total_budget > 0 else 0},
            "Radio": {"amount": radio, "share": round((radio / total_budget) * 100, 1) if total_budget > 0 else 0},
            "Newspaper": {"amount": newspaper, "share": round((newspaper / total_budget) * 100, 1) if total_budget > 0 else 0},
        }

        return {
            "predicted_sales": round(pred_sales, 3),
            "predicted_sales_units": "thousands of units (or $1,000s in revenue)",
            "total_budget": round(total_budget, 2),
            "budget_breakdown": breakdown,
            "polynomial_degree": self.degree,
            "is_extrapolation": is_extrapolation,
            "warnings": warnings,
            "observed_ranges": {
                ch: {"min": float(train_min[ch]), "max": float(train_max[ch])}
                for ch in ["TV", "Radio", "Newspaper"]
            },
        }

    @staticmethod
    def _classify_feature_term(raw_name: str) -> Tuple[str, str, List[str]]:
        """Classify a polynomial feature into linear, squared, interaction, or higher degree."""
        # raw_name examples: 'TV', 'Radio', 'TV^2', 'TV Radio', 'TV Radio Newspaper'
        tokens = raw_name.replace("^", " ").split()
        unique_channels = list(set([t for t in tokens if t in ["TV", "Radio", "Newspaper"]]))

        if "^2" in raw_name or (len(tokens) == 2 and tokens[0] == tokens[1]):
            channel = tokens[0]
            return "squared", f"{channel}²", [channel]
        elif "^3" in raw_name:
            channel = tokens[0]
            return "cubic", f"{channel}³", [channel]
        elif "^4" in raw_name:
            channel = tokens[0]
            return "quartic", f"{channel}⁴", [channel]
        elif " " in raw_name:
            # Interaction
            parts = raw_name.split(" ")
            pretty = " × ".join(parts)
            return "interaction", pretty, unique_channels
        else:
            return "linear", raw_name, unique_channels

    @staticmethod
    def _build_equation_string(intercept: float, names: List[str], coefs: np.ndarray) -> str:
        parts = [f"{intercept:.4f}"]
        for name, coef in zip(names, coefs):
            sign = "+" if coef >= 0 else "-"
            pretty_name = name.replace(" ", " × ").replace("^2", "²").replace("^3", "³")
            parts.append(f"{sign} {abs(coef):.6f}·({pretty_name})")
        return "Sales = " + " ".join(parts)


def compare_all_degrees(
    max_degree: int = 4,
    dataset_path: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Train and compare models from degree 1 to max_degree.
    Evaluates test set R2, MAE, RMSE, and 5-fold CV R2 for consistent comparison.
    """
    results = []
    for deg in range(1, max_degree + 1):
        m = AdSalesPolynomialModel(degree=deg, dataset_path=dataset_path)
        artifact = m.fit()
        results.append({
            "degree": deg,
            "label": "Linear (Degree 1)" if deg == 1 else f"Degree {deg} Polynomial",
            "r2_score": round(artifact.metrics.r2_score, 4),
            "adjusted_r2_score": round(artifact.metrics.adjusted_r2_score, 4),
            "mae": round(artifact.metrics.mae, 4),
            "rmse": round(artifact.metrics.rmse, 4),
            "cv_r2_mean": round(artifact.metrics.cv_r2_mean, 4),
            "cv_r2_std": round(artifact.metrics.cv_r2_std, 4),
            "n_poly_features": artifact.metrics.n_features_poly,
            "equation": artifact.equation_string,
        })
    return results


# Cached singleton dictionary for models across degrees to avoid repeated training
_MODEL_CACHE: Dict[int, AdSalesPolynomialModel] = {}


def get_trained_model(degree: int = 2, dataset_path: Optional[str] = None) -> AdSalesPolynomialModel:
    """Retrieve or fit cached model instance for the given degree."""
    if degree not in _MODEL_CACHE:
        model = AdSalesPolynomialModel(degree=degree, dataset_path=dataset_path)
        model.fit()
        _MODEL_CACHE[degree] = model
    return _MODEL_CACHE[degree]
