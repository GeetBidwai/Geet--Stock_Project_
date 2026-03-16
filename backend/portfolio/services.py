import base64
import io
from datetime import timedelta

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression
try:
    from sklearn.cluster import KMeans
except ImportError:  # pragma: no cover - optional dependency fallback
    KMeans = None

from .models import Portfolio, Stock

try:
    import matplotlib

    matplotlib.use("Agg")
    from matplotlib import pyplot as plt
except ImportError:  # pragma: no cover - optional dependency fallback
    matplotlib = None
    plt = None

try:
    from statsmodels.tsa.arima.model import ARIMA
except ImportError:  # pragma: no cover - optional dependency fallback
    ARIMA = None


PRICE_RANGE_MAP = {
    "1d": {"period": "1d", "interval": "5m", "label_format": "%H:%M"},
    "7d": {"period": "7d", "interval": "1h", "label_format": "%d %b"},
    "1mo": {"period": "1mo", "interval": "1d", "label_format": "%d %b"},
    "3mo": {"period": "3mo", "interval": "1d", "label_format": "%d %b"},
    "6mo": {"period": "6mo", "interval": "1d", "label_format": "%d %b"},
    "1y": {"period": "1y", "interval": "1wk", "label_format": "%d %b %y"},
    "3y": {"period": "3y", "interval": "1wk", "label_format": "%d %b %y"},
}

GROWTH_RANGE_MAP = {
    "1w": {"period": "7d", "interval": "1d"},
    "1mo": {"period": "1mo", "interval": "1d"},
    "3mo": {"period": "3mo", "interval": "1d"},
    "6mo": {"period": "6mo", "interval": "1d"},
    "1y": {"period": "1y", "interval": "1wk"},
    "3y": {"period": "3y", "interval": "1wk"},
}

METALS_RANGE_MAP = {
    "1mo": {"period": "1mo", "interval": "1d", "label_format": "%d %b"},
    "3mo": {"period": "3mo", "interval": "1d", "label_format": "%d %b"},
    "6mo": {"period": "6mo", "interval": "1d", "label_format": "%d %b"},
    "1y": {"period": "1y", "interval": "1wk", "label_format": "%d %b %y"},
    "3y": {"period": "3y", "interval": "1wk", "label_format": "%d %b %y"},
}

RISK_LABELS = ["Low Risk", "Medium Risk", "High Risk"]
RF_RATE = 0.06
INDIA_EQUITY_SUFFIXES = (".NS", ".BO")
INDIA_EQUITY_EXCHANGES = {"NSE", "BSE"}


def normalize_range(value, mapping, default_key):
    if not value:
        return default_key

    normalized = str(value).strip().lower()
    aliases = {
        "1m": "1mo",
        "1w": "1w",
        "1d": "1d",
        "7d": "7d",
        "3m": "3mo",
        "6m": "6mo",
        "1y": "1y",
        "3y": "3y",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in mapping else default_key


def safe_float(value):
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def safe_round(value, digits=2):
    number = safe_float(value)
    return round(number, digits) if number is not None else None


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def _empty_history():
    return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])


def fetch_ticker(symbol):
    return yf.Ticker(symbol)


def fetch_info(symbol):
    try:
        return fetch_ticker(symbol).info or {}
    except Exception:
        return {}


def fetch_history(symbol, period="1mo", interval="1d"):
    try:
        history = fetch_ticker(symbol).history(period=period, interval=interval)
    except Exception:
        return _empty_history()
    return history if isinstance(history, pd.DataFrame) else _empty_history()


def is_india_equity_symbol(symbol):
    normalized = (symbol or "").strip().upper()
    return normalized.endswith(INDIA_EQUITY_SUFFIXES)


def normalize_india_exchange(quote):
    exchange = (
        quote.get("exchDisp")
        or quote.get("exchange")
        or quote.get("fullExchangeName")
        or ""
    ).strip().upper()
    symbol = (quote.get("symbol") or "").strip().upper()

    if exchange in INDIA_EQUITY_EXCHANGES:
        return exchange
    if symbol.endswith(".NS"):
        return "NSE"
    if symbol.endswith(".BO"):
        return "BSE"
    return ""


def fetch_search_results(query, limit=10):
    if len(query.strip()) < 2:
        return []

    try:
        search = yf.Search(query, max_results=limit)
        quotes = getattr(search, "quotes", []) or []
    except Exception:
        return []

    results = []
    for quote in quotes:
        if quote.get("quoteType") not in {None, "EQUITY"}:
            continue
        symbol = quote.get("symbol")
        name = quote.get("shortname") or quote.get("longname")
        exchange = normalize_india_exchange(quote)
        if not symbol or not name or not is_india_equity_symbol(symbol) or not exchange:
            continue
        results.append(
            {
                "symbol": symbol.upper(),
                "name": name,
                "sector": quote.get("sectorDisp") or quote.get("sector", ""),
                "exchange": exchange,
            }
        )
    return results


def calculate_intrinsic_value(eps, pe_ratio):
    eps_value = safe_float(eps)
    pe_value = safe_float(pe_ratio)
    if eps_value is None or eps_value <= 0:
        return None
    target_multiple = 15.0
    if pe_value is not None and pe_value > 0:
        target_multiple = min(max(pe_value, 10.0), 18.0)
    return eps_value * target_multiple


def build_stock_metrics(symbol, fallback=None):
    fallback = fallback or {}
    info = fetch_info(symbol)
    history_1y = fetch_history(symbol, period="1y", interval="1d")

    current_price = (
        safe_float(info.get("currentPrice"))
        or safe_float(info.get("regularMarketPrice"))
        or (
            safe_float(history_1y["Close"].dropna().iloc[-1])
            if not history_1y.empty and "Close" in history_1y
            else None
        )
        or safe_float(fallback.get("current_price"))
    )
    min_price = (
        safe_float(history_1y["Low"].min())
        if not history_1y.empty and "Low" in history_1y
        else safe_float(fallback.get("min_price"))
    )
    max_price = (
        safe_float(history_1y["High"].max())
        if not history_1y.empty and "High" in history_1y
        else safe_float(fallback.get("max_price"))
    )
    pe_ratio = safe_float(info.get("trailingPE")) or safe_float(fallback.get("pe_ratio"))
    eps = safe_float(info.get("trailingEps")) or safe_float(
        info.get("epsTrailingTwelveMonths")
    ) or safe_float(fallback.get("eps"))
    market_cap = safe_float(info.get("marketCap")) or safe_float(
        fallback.get("market_cap")
    )
    intrinsic_value = calculate_intrinsic_value(eps, pe_ratio) or safe_float(
        fallback.get("intrinsic_value")
    )

    discount_percent = None
    if intrinsic_value and current_price and intrinsic_value > current_price * 0.5:
        discount_percent = ((intrinsic_value - current_price) / current_price) * 100
    elif max_price and current_price and max_price > 0:
        discount_percent = ((max_price - current_price) / max_price) * 100

    if discount_percent is not None:
        discount_percent = clamp(discount_percent, -100, 100)

    pe_score = 50
    if pe_ratio and pe_ratio > 0:
        pe_score = clamp(((25 - pe_ratio) / 25) * 100)
    intrinsic_score = clamp(discount_percent or 0, 0, 100)
    momentum_score = 0
    if max_price and current_price and max_price > 0:
        momentum_score = clamp(((max_price - current_price) / max_price) * 100)
    opportunity_score = (intrinsic_score * 0.55) + (pe_score * 0.25) + (momentum_score * 0.2)

    return {
        "name": info.get("shortName") or info.get("longName") or fallback.get("name", symbol),
        "sector": info.get("sector") or fallback.get("sector", ""),
        "current_price": safe_round(current_price),
        "min_price": safe_round(min_price),
        "max_price": safe_round(max_price),
        "pe_ratio": safe_round(pe_ratio),
        "eps": safe_round(eps),
        "market_cap": market_cap,
        "intrinsic_value": safe_round(intrinsic_value),
        "discount_percentage": safe_round(discount_percent),
        "opportunity_score": safe_round(opportunity_score),
    }


def update_stock_snapshot(stock):
    metrics = build_stock_metrics(
        stock.stock_id,
        fallback={
            "name": stock.name,
            "sector": stock.sector,
            "current_price": stock.current_price,
            "min_price": stock.min_price,
            "max_price": stock.max_price,
            "pe_ratio": stock.pe_ratio,
            "eps": stock.eps,
            "market_cap": stock.market_cap,
            "intrinsic_value": stock.intrinsic_value,
        },
    )
    stock.name = metrics["name"]
    stock.sector = metrics["sector"]
    stock.current_price = metrics["current_price"]
    stock.min_price = metrics["min_price"]
    stock.max_price = metrics["max_price"]
    stock.pe_ratio = metrics["pe_ratio"]
    stock.eps = metrics["eps"]
    stock.market_cap = metrics["market_cap"]
    stock.intrinsic_value = metrics["intrinsic_value"]
    stock.discount_percentage = metrics["discount_percentage"]
    stock.discount_level = metrics["discount_percentage"]
    stock.opportunity_score = metrics["opportunity_score"]
    stock.save()
    return stock


def build_price_series(history, label_format, include_ohlc=False):
    points = []
    if history.empty:
        return points

    for index, row in history.iterrows():
        close_price = safe_float(row.get("Close"))
        if close_price is None:
            continue
        timestamp = index.to_pydatetime()
        point = {
            "time": timestamp.strftime(label_format),
            "timestamp": timestamp.isoformat(),
            "price": safe_round(close_price),
        }
        if include_ohlc:
            point.update(
                {
                    "open": safe_round(row.get("Open")),
                    "high": safe_round(row.get("High")),
                    "low": safe_round(row.get("Low")),
                    "close": safe_round(close_price),
                    "volume": safe_float(row.get("Volume")),
                }
            )
        points.append(point)
    return points


def build_stock_history_payload(stock, range_key):
    normalized_range = normalize_range(range_key, PRICE_RANGE_MAP, "1mo")
    config = PRICE_RANGE_MAP[normalized_range]
    info = fetch_info(stock.stock_id)
    history = fetch_history(stock.stock_id, config["period"], config["interval"])
    points = build_price_series(history, config["label_format"], include_ohlc=True)

    if not points:
        first_price = stock.current_price
        latest_price = stock.current_price
    else:
        first_price = points[0]["close"]
        latest_price = points[-1]["close"]

    change_percent = None
    if first_price and latest_price:
        change_percent = ((latest_price - first_price) / first_price) * 100

    return {
        "id": stock.id,
        "portfolio": stock.portfolio_id,
        "symbol": stock.stock_id,
        "ticker": stock.stock_id,
        "name": stock.name,
        "sector": stock.sector,
        "exchange": info.get("exchange", ""),
        "currency": info.get("currency", ""),
        "range": normalized_range,
        "chart": points,
        "cards": {
            "current_price": safe_round(
                safe_float(info.get("currentPrice")) or stock.current_price
            ),
            "day_high": safe_round(info.get("dayHigh")),
            "day_low": safe_round(info.get("dayLow")),
            "volume": safe_float(info.get("volume")),
            "market_cap": safe_float(info.get("marketCap")) or stock.market_cap,
            "pe_ratio": safe_round(safe_float(info.get("trailingPE")) or stock.pe_ratio),
            "eps": safe_round(
                safe_float(info.get("trailingEps"))
                or safe_float(info.get("epsTrailingTwelveMonths"))
                or stock.eps
            ),
            "intrinsic_value": stock.intrinsic_value,
            "fifty_two_week_high": safe_round(info.get("fiftyTwoWeekHigh")),
            "fifty_two_week_low": safe_round(info.get("fiftyTwoWeekLow")),
            "change_percent": safe_round(change_percent),
            "opportunity_score": stock.opportunity_score,
            "discount_percentage": stock.discount_percentage,
            "discount_percent": stock.discount_percentage,
        },
    }


def summarize_portfolio(portfolio):
    stocks = list(portfolio.stocks.all())
    holdings_count = len(stocks)
    if not stocks:
        return {
            "holdings_count": 0,
            "average_discount": 0,
            "undervalued_count": 0,
            "average_opportunity_score": 0,
            "top_pick": None,
        }

    discounts = [stock.discount_percentage for stock in stocks if stock.discount_percentage is not None]
    opportunities = [stock.opportunity_score for stock in stocks if stock.opportunity_score is not None]
    undervalued = [
        stock for stock in stocks if (stock.discount_percentage or 0) > 0
    ]
    top_pick = max(
        stocks,
        key=lambda stock: stock.opportunity_score if stock.opportunity_score is not None else -1,
    )
    return {
        "holdings_count": holdings_count,
        "average_discount": safe_round(np.mean(discounts) if discounts else 0),
        "undervalued_count": len(undervalued),
        "average_opportunity_score": safe_round(np.mean(opportunities) if opportunities else 0),
        "top_pick": {
            "id": top_pick.id,
            "name": top_pick.name,
            "ticker": top_pick.stock_id,
            "opportunity_score": top_pick.opportunity_score,
        }
        if top_pick
        else None,
    }


def get_top_discount_data(portfolio):
    stocks = portfolio.stocks.order_by("-discount_percentage", "-opportunity_score")[:10]
    return [
        {
            "id": stock.id,
            "ticker": stock.stock_id,
            "name": stock.name,
            "discount_percent": safe_round(stock.discount_percentage),
            "opportunity_score": safe_round(stock.opportunity_score),
        }
        for stock in stocks
    ]


def compute_growth_percent(symbol, range_key):
    normalized = normalize_range(range_key, GROWTH_RANGE_MAP, "1mo")
    config = GROWTH_RANGE_MAP[normalized]
    history = fetch_history(symbol, config["period"], config["interval"])
    if history.empty or "Close" not in history:
        return None
    closes = history["Close"].dropna()
    if len(closes) < 2:
        return None
    first_price = safe_float(closes.iloc[0])
    latest_price = safe_float(closes.iloc[-1])
    if not first_price or latest_price is None:
        return None
    return ((latest_price - first_price) / first_price) * 100


def get_top_growth_data(portfolio, range_key):
    rows = []
    normalized = normalize_range(range_key, GROWTH_RANGE_MAP, "1mo")
    for stock in portfolio.stocks.all():
        growth_percent = compute_growth_percent(stock.stock_id, normalized)
        rows.append(
            {
                "id": stock.id,
                "ticker": stock.stock_id,
                "name": stock.name,
                "growth_percent": safe_round(growth_percent),
                "range": normalized,
            }
        )
    rows.sort(key=lambda item: item["growth_percent"] if item["growth_percent"] is not None else -9999, reverse=True)
    return rows[:10]


def _annualized_volatility(returns):
    if returns.empty:
        return None
    return returns.std() * np.sqrt(252) * 100


def _sharpe_ratio(returns):
    if returns.empty:
        return None
    std = returns.std()
    if not std:
        return None
    daily_rf = (1 + RF_RATE) ** (1 / 252) - 1
    return ((returns.mean() - daily_rf) / std) * np.sqrt(252)


def _max_drawdown(series):
    if series.empty:
        return None
    cumulative = (1 + series.pct_change().fillna(0)).cumprod()
    drawdown = (cumulative / cumulative.cummax()) - 1
    return drawdown.min() * 100


def _cagr(close_series):
    if close_series.empty or len(close_series) < 2:
        return None
    first_price = safe_float(close_series.iloc[0])
    last_price = safe_float(close_series.iloc[-1])
    if not first_price or last_price is None or first_price <= 0:
        return None
    days = max((close_series.index[-1] - close_series.index[0]).days, 1)
    years = days / 365.25
    if years <= 0:
        return None
    return (((last_price / first_price) ** (1 / years)) - 1) * 100


def _risk_features_for_stock(stock):
    history = fetch_history(stock.stock_id, period="3y", interval="1d")
    closes = history["Close"].dropna() if not history.empty and "Close" in history else pd.Series(dtype="float64")
    returns = closes.pct_change().dropna()
    return {
        "id": stock.id,
        "ticker": stock.stock_id,
        "name": stock.name,
        "volatility": safe_round(_annualized_volatility(returns)),
        "sharpe_ratio": safe_round(_sharpe_ratio(returns)),
        "max_drawdown": safe_round(_max_drawdown(closes)),
        "cagr": safe_round(_cagr(closes)),
    }


def _scatter_image(points):
    if not points or plt is None:
        return ""

    x = [point["x"] for point in points]
    y = [point["y"] for point in points]
    colors = {
        "Low Risk": "#0f766e",
        "Medium Risk": "#d97706",
        "High Risk": "#b91c1c",
    }

    fig, ax = plt.subplots(figsize=(6.5, 4.25))
    for point in points:
        ax.scatter(point["x"], point["y"], color=colors.get(point["risk_label"], "#475569"), s=60)
        ax.text(point["x"] + 0.02, point["y"] + 0.02, point["ticker"], fontsize=8)

    ax.set_title("Risk Clusters (PCA)")
    ax.set_xlabel("Principal Component 1")
    ax.set_ylabel("Principal Component 2")
    ax.grid(alpha=0.25)
    fig.tight_layout()

    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", dpi=140)
    plt.close(fig)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def get_risk_cluster_data(portfolio):
    rows = [_risk_features_for_stock(stock) for stock in portfolio.stocks.all()]
    if not rows:
        return {"clusters": [], "scatter_image": ""}

    frame = pd.DataFrame(rows)
    feature_columns = ["volatility", "sharpe_ratio", "max_drawdown", "cagr"]
    feature_frame = frame[feature_columns].apply(pd.to_numeric, errors="coerce")
    feature_frame = feature_frame.replace([np.inf, -np.inf], np.nan)
    feature_frame = feature_frame.fillna(feature_frame.median(numeric_only=True)).fillna(0)

    def _normalize(series):
        values = series.to_numpy(dtype=float)
        min_value = np.nanmin(values) if len(values) else 0.0
        max_value = np.nanmax(values) if len(values) else 1.0
        if max_value == min_value:
            return pd.Series([0.5] * len(series), index=series.index)
        return (series - min_value) / (max_value - min_value)

    vol_norm = _normalize(feature_frame["volatility"])
    drawdown_norm = _normalize(feature_frame["max_drawdown"])
    sharpe_norm = 1 - _normalize(feature_frame["sharpe_ratio"])
    cagr_norm = 1 - _normalize(feature_frame["cagr"])

    frame["risk_score"] = (
        0.45 * vol_norm
        + 0.35 * drawdown_norm
        + 0.15 * sharpe_norm
        + 0.05 * cagr_norm
    )

    if len(frame) >= 3 and KMeans is not None:
        n_clusters = min(3, len(frame))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        frame["cluster_raw"] = kmeans.fit_predict(feature_frame)

        ranked_clusters = (
            frame.groupby("cluster_raw")["risk_score"].mean().sort_values().index.tolist()
        )
        if n_clusters == 3:
            label_map = {
                ranked_clusters[0]: "Low Risk",
                ranked_clusters[1]: "Medium Risk",
                ranked_clusters[2]: "High Risk",
            }
        elif n_clusters == 2:
            label_map = {
                ranked_clusters[0]: "Low Risk",
                ranked_clusters[1]: "High Risk",
            }
        else:
            label_map = {ranked_clusters[0]: "Medium Risk"}
        frame["risk_label"] = frame["cluster_raw"].map(label_map)
    elif len(frame) >= 3:
        q_low = frame["risk_score"].quantile(0.33)
        q_high = frame["risk_score"].quantile(0.66)
        frame["risk_label"] = pd.cut(
            frame["risk_score"],
            bins=[-np.inf, q_low, q_high, np.inf],
            labels=RISK_LABELS,
        )
    elif len(frame) == 2:
        sorted_idx = frame["risk_score"].sort_values().index.tolist()
        labels = {sorted_idx[0]: "Low Risk", sorted_idx[1]: "High Risk"}
        frame["risk_label"] = frame.index.map(labels)
    else:
        frame["risk_label"] = "Medium Risk"

    label_to_cluster = {label: index for index, label in enumerate(RISK_LABELS)}
    frame["cluster"] = frame["risk_label"].map(label_to_cluster).fillna(1).astype(int)

    if len(frame) >= 2:
        pca = PCA(n_components=2)
        transformed = pca.fit_transform(feature_frame)
        frame["x"] = transformed[:, 0]
        frame["y"] = transformed[:, 1]
    else:
        frame["x"] = 0.0
        frame["y"] = 0.0

    clusters = []
    for row in frame.to_dict(orient="records"):
        clusters.append(
            {
                "id": row["id"],
                "ticker": row["ticker"],
                "name": row["name"],
                "volatility": safe_round(row["volatility"]),
                "sharpe_ratio": safe_round(row["sharpe_ratio"]),
                "max_drawdown": safe_round(row["max_drawdown"]),
                "cagr": safe_round(row["cagr"]),
                "risk_label": row["risk_label"],
                "x": safe_round(row["x"], 4),
                "y": safe_round(row["y"], 4),
            }
        )

    return {
        "clusters": clusters,
        "scatter_image": _scatter_image(clusters),
    }


def get_dashboard_summary(user):
    portfolios = list(Portfolio.objects.filter(owner=user).prefetch_related("stocks"))
    stocks = [stock for portfolio in portfolios for stock in portfolio.stocks.all()]

    portfolio_count = len(portfolios)
    total_holdings = len(stocks)
    undervalued_stocks = len([stock for stock in stocks if (stock.discount_percentage or 0) > 0])
    opportunity_values = [stock.opportunity_score for stock in stocks if stock.opportunity_score is not None]
    average_opportunity_score = safe_round(
        np.mean(opportunity_values) if opportunity_values else 0
    )

    discount_rows = sorted(
        [
            {
                "ticker": stock.stock_id,
                "name": stock.name,
                "discount_percent": safe_round(stock.discount_percentage),
            }
            for stock in stocks
        ],
        key=lambda item: item["discount_percent"] if item["discount_percent"] is not None else -9999,
        reverse=True,
    )[:8]

    growth_rows = []
    for stock in stocks:
        growth_rows.append(
            {
                "ticker": stock.stock_id,
                "name": stock.name,
                "growth_percent": safe_round(compute_growth_percent(stock.stock_id, "6mo")),
            }
        )
    growth_rows.sort(
        key=lambda item: item["growth_percent"] if item["growth_percent"] is not None else -9999,
        reverse=True,
    )

    return {
        "portfolio_count": portfolio_count,
        "total_holdings": total_holdings,
        "undervalued_stocks": undervalued_stocks,
        "average_opportunity_score": average_opportunity_score,
        "top_discount": discount_rows,
        "top_growth": growth_rows[:8],
    }


def _regression_slope(x_values, y_values):
    if len(x_values) < 2 or len(y_values) < 2:
        return None
    slope = np.polyfit(x_values, y_values, 1)[0]
    return safe_round(slope, 6)


def _series_return(points):
    if len(points) < 2:
        return None
    first_price = points[0]["price"]
    last_price = points[-1]["price"]
    if not first_price:
        return None
    return safe_round(((last_price - first_price) / first_price) * 100)


def get_metals_history(range_key):
    normalized = normalize_range(range_key, METALS_RANGE_MAP, "3y")
    config = METALS_RANGE_MAP[normalized]

    gold_history = fetch_history("GC=F", config["period"], config["interval"])
    silver_history = fetch_history("SI=F", config["period"], config["interval"])
    gold_chart = build_price_series(gold_history, config["label_format"], include_ohlc=True)
    silver_chart = build_price_series(silver_history, config["label_format"], include_ohlc=True)

    merged = pd.DataFrame()
    if not gold_history.empty and not silver_history.empty:
        merged = gold_history[["Close"]].join(
            silver_history[["Close"]],
            how="inner",
            lsuffix="_gold",
            rsuffix="_silver",
        ).dropna()

    return_gap = []
    correlation = None
    regression_slope = None
    if not merged.empty:
        correlation = safe_float(merged["Close_gold"].corr(merged["Close_silver"]))
        regression_slope = _regression_slope(
            merged["Close_gold"].to_numpy(),
            merged["Close_silver"].to_numpy(),
        )
        gold_returns = merged["Close_gold"].pct_change().fillna(0)
        silver_returns = merged["Close_silver"].pct_change().fillna(0)
        for index, gold_return, silver_return in zip(
            merged.index,
            gold_returns,
            silver_returns,
        ):
            return_gap.append(
                {
                    "time": index.to_pydatetime().strftime(config["label_format"]),
                    "gap": safe_round((silver_return - gold_return) * 100, 4),
                }
            )

    three_month_config = METALS_RANGE_MAP["3mo"]
    gold_3m = build_price_series(
        fetch_history("GC=F", three_month_config["period"], three_month_config["interval"]),
        three_month_config["label_format"],
    )
    silver_3m = build_price_series(
        fetch_history("SI=F", three_month_config["period"], three_month_config["interval"]),
        three_month_config["label_format"],
    )

    return {
        "range": normalized,
        "gold_chart": gold_chart,
        "silver_chart": silver_chart,
        "return_gap": return_gap,
        "metrics": {
            "gold_3m_return": _series_return(gold_3m),
            "silver_3m_return": _series_return(silver_3m),
            "correlation": safe_round(correlation, 4),
            "regression_slope": regression_slope,
        },
        "correlation": {
            "period": "3y",
            "pearson_value": safe_round(correlation, 4),
            "label": correlation_label(correlation),
            "points": [
                {
                    "time": index.to_pydatetime().strftime("%d %b %y"),
                    "gold_price": safe_round(row["Close_gold"]),
                    "silver_price": safe_round(row["Close_silver"]),
                }
                for index, row in merged.iterrows()
            ],
        },
    }


def correlation_label(value):
    if value is None:
        return "Insufficient Data"
    if value >= 0.8:
        return "Highly Correlated"
    if value >= 0.5:
        return "Moderately Correlated"
    if value >= 0.2:
        return "Weakly Correlated"
    if value > -0.2:
        return "Low Correlation"
    if value > -0.5:
        return "Inverse Correlated"
    return "Highly Inverse Correlated"


def _linear_forecast(series, days):
    x = np.arange(len(series)).reshape(-1, 1)
    model = LinearRegression()
    model.fit(x, series)
    future_x = np.arange(len(series), len(series) + days).reshape(-1, 1)
    return model.predict(future_x)


def _arima_forecast(series, days):
    if ARIMA is None:
        raise RuntimeError("ARIMA is unavailable")
    model = ARIMA(series, order=(5, 1, 0))
    fitted = model.fit()
    return np.asarray(fitted.forecast(steps=days))


def _rnn_forecast(series, days):
    array = np.asarray(series, dtype=float)
    mean = array.mean()
    std = array.std() or 1.0
    normalized = (array - mean) / std

    hidden_size = 8
    w_input = np.linspace(0.15, 0.45, hidden_size)
    w_hidden = np.eye(hidden_size) * 0.55

    states = []
    hidden = np.zeros(hidden_size)
    for value in normalized[:-1]:
        hidden = np.tanh(w_input * value + w_hidden @ hidden)
        states.append(hidden.copy())

    if not states:
        return _linear_forecast(series, days)

    x_matrix = np.vstack(states)
    y_vector = normalized[1:]
    output_weights = np.linalg.pinv(x_matrix) @ y_vector

    hidden = np.zeros(hidden_size)
    for value in normalized:
        hidden = np.tanh(w_input * value + w_hidden @ hidden)

    forecasts = []
    last_value = normalized[-1]
    for _ in range(days):
        hidden = np.tanh(w_input * last_value + w_hidden @ hidden)
        next_normalized = float(hidden @ output_weights)
        next_value = (next_normalized * std) + mean
        forecasts.append(max(next_value, 0.0))
        last_value = next_normalized
    return np.asarray(forecasts)


def get_crypto_forecast(model_name, days):
    model_key = (model_name or "linear").strip().lower()
    if model_key not in {"linear", "arima", "rnn"}:
        model_key = "linear"

    day_count = max(7, min(120, int(days or 30)))
    history = fetch_history("BTC-USD", period="2y", interval="1d")
    closes = history["Close"].dropna() if not history.empty and "Close" in history else pd.Series(dtype="float64")

    if closes.empty:
        return {
            "model": model_key,
            "days": day_count,
            "historical": [],
            "forecast": [],
            "summary": {
                "expected_return": None,
                "trend": "unavailable",
            },
        }

    try:
        if model_key == "arima":
            forecast_values = _arima_forecast(closes.to_numpy(), day_count)
        elif model_key == "rnn":
            forecast_values = _rnn_forecast(closes.to_numpy(), day_count)
        else:
            forecast_values = _linear_forecast(closes.to_numpy(), day_count)
    except Exception:
        forecast_values = _linear_forecast(closes.to_numpy(), day_count)
        model_key = "linear"

    recent_history = closes.tail(180)
    historical = [
        {
            "time": index.to_pydatetime().strftime("%d %b %y"),
            "timestamp": index.to_pydatetime().isoformat(),
            "price": safe_round(value),
        }
        for index, value in recent_history.items()
    ]

    last_timestamp = closes.index[-1].to_pydatetime()
    forecast = []
    for offset, value in enumerate(forecast_values, start=1):
        timestamp = last_timestamp + timedelta(days=offset)
        forecast.append(
            {
                "time": timestamp.strftime("%d %b %y"),
                "timestamp": timestamp.isoformat(),
                "price": safe_round(value),
            }
        )

    latest_price = safe_float(closes.iloc[-1])
    expected_return = None
    if latest_price and len(forecast):
        expected_return = ((forecast[-1]["price"] - latest_price) / latest_price) * 100

    trend = "sideways"
    if expected_return is not None:
        if expected_return > 2:
            trend = "bullish"
        elif expected_return < -2:
            trend = "bearish"

    return {
        "model": model_key,
        "days": day_count,
        "historical": historical,
        "forecast": forecast,
        "summary": {
            "expected_return": safe_round(expected_return),
            "trend": trend,
        },
    }
