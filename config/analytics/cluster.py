from pathlib import Path

import pandas as pd
import yfinance as yf
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression, LogisticRegression

from portfolio.models import Stock


NUMERIC_COLUMNS = ["current_price", "pe_ratio", "volume", "market_cap"]
KMEANS_FEATURES = ["current_price", "pe_ratio", "volume"]
REGRESSION_FEATURES = ["pe_ratio", "volume", "market_cap"]


def _to_number(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _get_market_data(ticker_symbol, stock_obj):
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info or {}

    history = ticker.history(period="5d")
    close_price = None
    if not history.empty and "Close" in history:
        close_price = _to_number(history["Close"].dropna().iloc[-1])

    current_price = (
        _to_number(info.get("currentPrice"))
        or _to_number(info.get("regularMarketPrice"))
        or _to_number(getattr(stock_obj, "current_price", None))
        or _to_number(getattr(stock_obj, "price", None))
        or close_price
    )
    pe_ratio = _to_number(info.get("trailingPE")) or _to_number(
        getattr(stock_obj, "pe_ratio", None)
    )
    volume = _to_number(info.get("volume")) or _to_number(
        getattr(stock_obj, "volume", None)
    )
    market_cap = _to_number(info.get("marketCap")) or _to_number(
        getattr(stock_obj, "market_cap", None)
    )

    return {
        "stock_id": ticker_symbol,
        "current_price": current_price,
        "pe_ratio": pe_ratio,
        "volume": volume,
        "market_cap": market_cap,
    }


def _prepare_numeric_data(df):
    prepared = df.copy()
    for col in NUMERIC_COLUMNS:
        prepared[col] = pd.to_numeric(prepared[col], errors="coerce")
        if prepared[col].isna().all():
            prepared[col] = prepared[col].fillna(0.0)
        else:
            prepared[col] = prepared[col].fillna(prepared[col].median())
    return prepared


def fetch_portfolio_stocks(portfolio_id):
    stocks = Stock.objects.filter(portfolio_id=portfolio_id)
    rows = [_get_market_data(stock.stock_id, stock) for stock in stocks]

    df = pd.DataFrame(
        rows,
        columns=["stock_id", "current_price", "pe_ratio", "volume", "market_cap"],
    )

    csv_path = Path.cwd() / f"portfolio_{portfolio_id}_stocks.csv"
    df.to_csv(csv_path, index=False)
    print(df.to_json(orient="records"))
    return df


def run_kmeans_clustering(df):
    updated_df = df.copy()
    if updated_df.empty:
        updated_df["cluster"] = pd.Series(dtype="int64")
        return updated_df

    work_df = _prepare_numeric_data(updated_df)
    n_samples = len(work_df)
    n_clusters = min(3, n_samples)

    if n_clusters < 1:
        updated_df["cluster"] = -1
        return updated_df

    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    updated_df["cluster"] = model.fit_predict(work_df[KMEANS_FEATURES])
    return updated_df


def train_linear_regression(df):
    updated_df = df.copy()
    if updated_df.empty:
        updated_df["predicted_price"] = pd.Series(dtype="float64")
        return updated_df

    work_df = _prepare_numeric_data(updated_df)
    x = work_df[REGRESSION_FEATURES]
    y = work_df["current_price"]

    model = LinearRegression()
    model.fit(x, y)
    updated_df["predicted_price"] = model.predict(x)
    return updated_df


def train_logistic_regression(df):
    updated_df = df.copy()
    if updated_df.empty:
        updated_df["growth"] = pd.Series(dtype="int64")
        updated_df["growth_prediction"] = pd.Series(dtype="int64")
        return updated_df

    work_df = _prepare_numeric_data(updated_df)
    predicted = pd.to_numeric(updated_df["predicted_price"], errors="coerce")
    current = pd.to_numeric(updated_df["current_price"], errors="coerce")
    work_df["growth"] = (predicted > current).astype(int)

    x = work_df[REGRESSION_FEATURES]
    y = work_df["growth"]

    if y.nunique() < 2:
        updated_df["growth"] = y
        updated_df["growth_prediction"] = y
        return updated_df

    model = LogisticRegression(max_iter=1000)
    model.fit(x, y)
    updated_df["growth"] = y
    updated_df["growth_prediction"] = model.predict(x)
    return updated_df


def run_portfolio_analytics(portfolio_id):
    df = fetch_portfolio_stocks(portfolio_id)
    df = run_kmeans_clustering(df)
    df = train_linear_regression(df)
    df = train_logistic_regression(df)
    return df

