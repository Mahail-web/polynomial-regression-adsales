# AdSales Intelligence: Advertising Sales Predictor

A production-quality machine learning and marketing intelligence project evaluating non-linear multi-channel advertising response, media synergies, and diminishing returns using **Polynomial Regression**.

Built with:
- **Next.js 14 App Router + TypeScript + Tailwind CSS + Recharts** as the primary, visually rich analytics dashboard.
- **Streamlit + Plotly + Scikit-Learn** as an independent, fully functional application ready for deployment on **Streamlit Community Cloud**.
- **FastAPI backend** exposing REST prediction, evaluation, and numerical optimization endpoints.
- **Scikit-learn Pipeline** enforcing strict featurization ordering (PolynomialFeatures fitted strictly on training data) with zero data leakage.

---

## 1. Project Objectives

1. **Predict Sales from Multi-Channel Budgets:** Estimate expected product sales given advertising expenditures across **TV**, **Radio**, and **Newspaper**.
2. **Model Non-Linear Media Synergies:** Capture super-additive channel effects (e.g. TV × Radio synergy) using genuine polynomial feature engineering.
3. **Investigate Diminishing Returns Honestly:** Calculate marginal response rates ($\frac{\partial \text{Sales}}{\partial \text{Spend}}$) numerically across observed budget ranges to verify whether and where concavity occurs.
4. **Constrained Budget Optimization:** Maximize model-predicted sales under total budget constraints and channel capacity bounds via SciPy Sequential Least Squares Programming (SLSQP).
5. **Educational Interpretability:** Analyze learned coefficients, diagnostic residuals, and complexity trade-offs from Degree 1 to Degree 4.

---

## 2. Dataset & Unit Specifications

- **Source:** Canonical Advertising Dataset from Kaggle / ISLR (*An Introduction to Statistical Learning* by Gareth James, Daniela Witten, Trevor Hastie, Robert Tibshirani).
  [https://www.kaggle.com/datasets/ashydv/advertising-dataset](https://www.kaggle.com/datasets/ashydv/advertising-dataset)
- **Observations:** 200 records.
- **Features & Standard Units:**
  - `TV`: TV advertising expenditure in **thousands of dollars ($1,000s USD)** (Observed range: $0.7k – $296.4k).
  - `Radio`: Radio advertising expenditure in **thousands of dollars ($1,000s USD)** (Observed range: $0.0k – $49.6k).
  - `Newspaper`: Newspaper advertising expenditure in **thousands of dollars ($1,000s USD)** (Observed range: $0.3k – $114.0k).
  - `Sales`: Product sales volume in **thousands of units** (or $1,000s in revenue) (Observed range: 1.6k – 27.0k units).
- **Data Location:** `data/advertising.csv`.

---

## 3. Machine Learning Methodology

### Modeling Pipeline
The project follows strict ML best practices:
1. **Train/Test Split:** 80:20 split (160 training rows, 40 held-out test rows) using a fixed random seed (`random_state=42`).
2. **Pipeline Construction:**
   $$\text{PolynomialFeatures}(\text{degree}=d, \text{include\_bias}=\text{False}) \longrightarrow \text{LinearRegression}(\text{fit\_intercept}=\text{True})$$
   Preprocessing transformations are fitted strictly on training data to prevent data leakage.
3. **Cross-Validation:** 5-fold cross-validation on the training split to guide degree selection.

### Degree 2 Formulation & Learned Parameters
For degree 2, 9 polynomial terms are generated from the 3 channels:
$$\text{Sales} = \beta_0 + \beta_1 \text{TV} + \beta_2 \text{Radio} + \beta_3 \text{Newspaper} + \beta_4 \text{TV}^2 + \beta_5 \text{Radio}^2 + \beta_6 \text{Newspaper}^2 + \beta_7 (\text{TV} \times \text{Radio}) + \beta_8 (\text{TV} \times \text{Newspaper}) + \beta_9 (\text{Radio} \times \text{Newspaper})$$

**Learned Empirical Coefficients:**
- $\beta_0$ (Intercept): `+4.939015`
- $\beta_1$ (TV): `+0.053236`
- $\beta_2$ (Radio): `+0.017098`
- $\beta_3$ (Newspaper): `+0.010581`
- $\beta_4$ ($\text{TV}^2$): **`-0.000112`** *(Negative quadratic term confirming concave diminishing returns for TV)*
- $\beta_7$ ($\text{TV} \times \text{Radio}$): **`+0.001111`** *(Strong positive interaction confirming media synergy)*
- $\beta_8$ ($\text{TV} \times \text{Newspaper}$): `-0.000074`
- $\beta_5$ ($\text{Radio}^2$): `+0.000133`
- $\beta_9$ ($\text{Radio} \times \text{Newspaper}$): `+0.000125`
- $\beta_6$ ($\text{Newspaper}^2$): `+0.000028`

### Empirical Diminishing Returns Analysis
- **TV:** Demonstrates clear diminishing returns. Because $\beta_{\text{TV}^2} < 0$, the marginal sales gain ($\frac{\partial \text{Sales}}{\partial \text{TV}}$) declines steadily from ~`0.081` units/$1k at low spend down to ~`0.015` units/$1k near $300k spend.
- **Radio & Newspaper:** Under typical allocations, Radio exhibits strong synergy when paired with TV. Newspaper shows negligible marginal lift.

---

## 4. Model Evaluation Summary

| Degree | Model Description | Features | Test $R^2$ | 5-Fold Train CV $R^2$ | Test MAE | Test RMSE | Diagnosis |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | Multiple Linear Regression | 3 | `0.8994` | `0.8595 ± 0.08` | `1.4608k` | `1.7816k` | Underfitting (misses cross-term synergy) |
| **2** | Quadratic Polynomial (Default) | 9 | **`0.9869`** | **`0.9772 ± 0.02`** | **`0.5262k`** | **`0.6426k`** | **Optimal Bias-Variance Balance** |
| **3** | Cubic Polynomial | 19 | `0.9812` | `0.9537 ± 0.02` | `0.6155k` | `0.7696k` | Mild overparameterization |
| **4** | Quartic Polynomial | 34 | `0.7138` | `0.9249 ± 0.04` | `1.5249k` | `3.0056k` | **Severe Overfitting** |

---

## 5. Repository Architecture

```
adsales-intelligence/
├── core/                         # Reusable Canonical Python ML Engine
│   ├── data_loader.py            # Dataset loading, validation, and cleaning
│   ├── model.py                  # Scikit-learn Polynomial Regression Pipeline
│   ├── optimizer.py              # SciPy SLSQP constrained budget optimizer
│   ├── diminishing_returns.py    # Numerical derivatives and curvature analysis
│   └── explorer.py               # Statistical distributions and correlation engine
├── api/                          # FastAPI REST API Backend
│   └── main.py                   # API routes with Pydantic request/response validation
├── streamlit_app/                # Standalone Streamlit Application
│   ├── app.py                    # Multi-tab Streamlit dashboard with Plotly
│   └── requirements.txt          # Streamlit subfolder requirements
├── streamlit_app.py              # Root entry point for Streamlit Community Cloud
├── web/                          # Primary Next.js Web Application
│   ├── app/                      # Next.js App Router (Overview, Predictor, Optimizer, etc.)
│   ├── components/               # UI Components (Sidebar, Header, MetricCard)
│   ├── lib/                      # Types, API client, and utility formatters
│   ├── package.json              # Web dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   └── tailwind.config.js        # Tailwind CSS configuration
├── data/
│   └── advertising.csv           # Canonical Kaggle/ISLR Advertising Dataset
├── tests/
│   └── test_pipeline.py          # 18 automated unit and integration tests
├── requirements.txt              # Root Python dependencies
├── pytest.ini                    # Pytest configuration
├── .gitignore                    # Git ignore specifications
└── README.md                     # Documentation
```

---

## 6. Local Setup and Development

### Prerequisites
- Python 3.10+ (Python 3.11 recommended)
- Node.js 18+ (Node.js 20+ recommended) and npm

### 1. Python Environment Setup
```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Running Automated Tests
```bash
pytest -v
```
All 18 tests will execute, validating:
- Dataset integrity, zero missing values, and column schema
- Degree 1–4 fitting, metrics calculation, and overfitting diagnosis
- Prediction finiteness and extrapolation warnings
- SLSQP budget conservation ($\sum \text{Allocated} = \text{Total}$)
- Diminishing returns numerical derivatives and curvature detection
- FastAPI endpoint schemas

### 3. Running the Python API Backend (FastAPI)
```bash
uvicorn api.main:app --reload --port 8000
```
Interactive API docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Running the Next.js Web Application
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note on Standalone Web Execution:** The Next.js application connects to `http://localhost:8000` when the FastAPI server is running. If the Python API is offline, the Next.js app automatically falls back to an embedded canonical Scikit-learn evaluation engine so all pages remain 100% functional!

### 5. Running the Streamlit Application
From the repository root:
```bash
streamlit run streamlit_app.py
```
Open [http://localhost:8501](http://localhost:8501) in your browser.

---

## 7. Deployment Instructions

### Streamlit Community Cloud Deployment
1. Commit the repository and push to your GitHub account:
   ```bash
   git add .
   git commit -m "Initial commit of AdSales Intelligence"
   git push origin main
   ```
2. Navigate to [share.streamlit.io](https://share.streamlit.io) and sign in with GitHub.
3. Click **"New app"**.
4. Select your repository and branch (`main`).
5. Set the **Main file path** to: `streamlit_app.py`.
6. Click **"Deploy"**. Streamlit Community Cloud will automatically detect `requirements.txt` and launch the app.
   *(Official documentation: [https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app))*

### Next.js Deployment (Vercel)
1. Push the repository to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `web`.
3. Set `NEXT_PUBLIC_API_URL` environment variable if hosting the FastAPI backend on a service like Render, Railway, or Google Cloud Run.
4. Deploy.

---

## 8. Critical Analytical Disclaimers

1. **Observational Nature:** This model is trained on observational market data. Polynomial associations and interaction terms do not constitute proven causal mechanisms.
2. **Extrapolation Limits:** Predictions generated outside the training bounds (e.g. TV > $296.4k, Radio > $49.6k) are mathematically extrapolations and are explicitly flagged in the UI.
3. **Sales vs. Profit:** The dataset records product sales volume, not profit margins. Budget optimization maximizes predicted unit volume; financial ROI figures provided in the app are user-configured hypothetical scenarios.
