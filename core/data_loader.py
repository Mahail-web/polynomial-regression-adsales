"""
Data Loader and Validation Module for AdSales Intelligence.
Loads, validates, and cleans the Advertising dataset.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd


REQUIRED_COLUMNS = ["tv", "radio", "newspaper", "sales"]
STANDARD_COLUMN_NAMES = {
    "tv": "TV",
    "radio": "Radio",
    "newspaper": "Newspaper",
    "sales": "Sales",
}


@dataclass
class ValidationReport:
    """Detailed validation report for dataset verification."""
    is_valid: bool
    row_count: int
    column_count: int
    columns: List[str]
    missing_values: Dict[str, int]
    duplicate_rows: int
    negative_values_found: Dict[str, int]
    infinite_values_found: Dict[str, int]
    non_numeric_columns: List[str]
    column_types: Dict[str, str]
    summary_stats: Dict[str, Dict[str, float]]
    channel_ranges: Dict[str, Tuple[float, float]]
    warnings: List[str]
    errors: List[str]


def resolve_data_path(file_path: Optional[str] = None) -> Path:
    """Resolve advertising.csv path, searching standard locations."""
    if file_path:
        p = Path(file_path)
        if p.exists():
            return p

    candidates = [
        Path("data/advertising.csv"),
        Path("data/Advertising.csv"),
        Path("../data/advertising.csv"),
        Path("../data/Advertising.csv"),
        Path(__file__).resolve().parent.parent / "data" / "advertising.csv",
        Path(__file__).resolve().parent.parent / "data" / "Advertising.csv",
    ]
    for c in candidates:
        if c.exists():
            return c

    raise FileNotFoundError(
        "Could not locate advertising.csv. Please place the dataset in the 'data/' directory. "
        "Expected path: data/advertising.csv"
    )


def load_and_validate_dataset(
    file_path: Optional[str] = None,
) -> Tuple[pd.DataFrame, ValidationReport]:
    """
    Load advertising.csv, standardize column names, validate types and constraints.
    Returns cleaned DataFrame and ValidationReport.
    """
    path = resolve_data_path(file_path)
    df = pd.read_csv(path)

    warnings: List[str] = []
    errors: List[str] = []

    # Drop unnamed index columns if present (e.g. 'Unnamed: 0' from R/ISLR CSVs)
    unnamed_cols = [c for c in df.columns if str(c).lower().startswith("unnamed") or c == ""]
    if unnamed_cols:
        df = df.drop(columns=unnamed_cols)
        warnings.append(f"Dropped redundant index column(s): {unnamed_cols}")

    if df.empty:
        errors.append("Dataset is empty.")
        return df, ValidationReport(
            is_valid=False,
            row_count=0,
            column_count=0,
            columns=[],
            missing_values={},
            duplicate_rows=0,
            negative_values_found={},
            infinite_values_found={},
            non_numeric_columns=[],
            column_types={},
            summary_stats={},
            channel_ranges={},
            warnings=warnings,
            errors=errors,
        )

    # Standardize column naming to lowercase for matching, then map to canonical names
    orig_cols = list(df.columns)
    col_mapping = {}
    for col in orig_cols:
        clean = str(col).strip().lower()
        if clean in STANDARD_COLUMN_NAMES:
            col_mapping[col] = STANDARD_COLUMN_NAMES[clean]

    df = df.rename(columns=col_mapping)

    # Check for required columns
    missing_required = [
        STANDARD_COLUMN_NAMES[c]
        for c in REQUIRED_COLUMNS
        if STANDARD_COLUMN_NAMES[c] not in df.columns
    ]
    if missing_required:
        errors.append(f"Missing required column(s): {missing_required}. Present: {list(df.columns)}")

    # Check non-numeric columns
    non_numeric = []
    for col in df.columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            non_numeric.append(col)
            # Try converting to numeric
            converted = pd.to_numeric(df[col], errors="coerce")
            if converted.notna().sum() > 0:
                df[col] = converted
                warnings.append(f"Converted column '{col}' to numeric (coerced unparseable values to NaN).")
            else:
                errors.append(f"Column '{col}' is non-numeric and cannot be converted.")

    # Check missing values
    missing_counts = {col: int(df[col].isna().sum()) for col in df.columns}
    total_missing = sum(missing_counts.values())
    if total_missing > 0:
        warnings.append(
            f"Found {total_missing} missing value(s). Strategy: Median imputation preserving valid observations."
        )
        for col in df.columns:
            if missing_counts[col] > 0:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)

    # Check duplicates
    duplicate_count = int(df.duplicated().sum())
    if duplicate_count > 0:
        warnings.append(f"Found {duplicate_count} duplicate row(s).")

    # Check infinite values
    infinite_counts = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        inf_mask = np.isinf(df[col])
        count = int(inf_mask.sum())
        if count > 0:
            infinite_counts[col] = count
            errors.append(f"Found {count} infinite values in column '{col}'.")

    # Check negative values (advertising expenditures and sales cannot be negative)
    negative_counts = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        neg_mask = df[col] < 0
        count = int(neg_mask.sum())
        if count > 0:
            negative_counts[col] = count
            errors.append(f"Found {count} negative values in '{col}'. Expenditures and sales must be >= 0.")

    # Ensure canonical column order
    canon_cols = ["TV", "Radio", "Newspaper", "Sales"]
    available_canon = [c for c in canon_cols if c in df.columns]
    other_cols = [c for c in df.columns if c not in canon_cols]
    df = df[available_canon + other_cols]

    # Compute summary stats and channel ranges
    summary_stats = {}
    channel_ranges = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        series = df[col]
        summary_stats[col] = {
            "count": float(series.count()),
            "mean": float(series.mean()),
            "std": float(series.std()),
            "min": float(series.min()),
            "q25": float(series.quantile(0.25)),
            "median": float(series.median()),
            "q75": float(series.quantile(0.75)),
            "max": float(series.max()),
        }
        channel_ranges[col] = (float(series.min()), float(series.max()))

    is_valid = len(errors) == 0

    report = ValidationReport(
        is_valid=is_valid,
        row_count=len(df),
        column_count=len(df.columns),
        columns=list(df.columns),
        missing_values=missing_counts,
        duplicate_rows=duplicate_count,
        negative_values_found=negative_counts,
        infinite_values_found=infinite_counts,
        non_numeric_columns=non_numeric,
        column_types={col: str(dtype) for col, dtype in df.dtypes.items()},
        summary_stats=summary_stats,
        channel_ranges=channel_ranges,
        warnings=warnings,
        errors=errors,
    )

    return df, report
