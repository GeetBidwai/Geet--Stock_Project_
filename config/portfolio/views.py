import yfinance as yf
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Portfolio, Stock
from .serializers import (
    PortfolioDetailSerializer,
    PortfolioSerializer,
    StockCreateSerializer,
    StockSerializer,
)


def _safe_round(value):
    return round(value, 2) if value is not None else None


def _clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


RANGE_MAP = {
    "1d": {"period": "1d", "interval": "5m", "label_format": "%H:%M"},
    "7d": {"period": "7d", "interval": "1h", "label_format": "%d %b"},
    "1mo": {"period": "1mo", "interval": "1d", "label_format": "%d %b"},
    "3mo": {"period": "3mo", "interval": "1d", "label_format": "%d %b"},
    "6mo": {"period": "6mo", "interval": "1d", "label_format": "%d %b"},
    "1y": {"period": "1y", "interval": "1wk", "label_format": "%d %b %y"},
    "3y": {"period": "3y", "interval": "1wk", "label_format": "%d %b %y"},
}

METAL_RANGE_MAP = {
    "1mo": {"period": "1mo", "interval": "1d", "label_format": "%d %b"},
    "3mo": {"period": "3mo", "interval": "1d", "label_format": "%d %b"},
    "6mo": {"period": "6mo", "interval": "1d", "label_format": "%d %b"},
    "1y": {"period": "1y", "interval": "1wk", "label_format": "%d %b %y"},
    "3y": {"period": "3y", "interval": "1wk", "label_format": "%d %b %y"},
}


def _to_float(value):
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _get_stock_metrics(symbol):
    ticker = yf.Ticker(symbol)
    info = ticker.info or {}
    history = ticker.history(period="1y")

    current_price = info.get("currentPrice") or info.get("regularMarketPrice")
    if current_price is None and not history.empty:
        current_price = float(history["Close"].iloc[-1])

    min_price = float(history["Low"].min()) if not history.empty else None
    max_price = float(history["High"].max()) if not history.empty else None

    discount_percentage = None
    if max_price and current_price:
        discount_percentage = ((max_price - float(current_price)) / max_price) * 100
        discount_percentage = _clamp(discount_percentage)

    pe_ratio = info.get("trailingPE")
    pe_score = 50
    if pe_ratio and pe_ratio > 0:
        pe_score = _clamp(((30 - float(pe_ratio)) / 30) * 100)

    discount_score = discount_percentage if discount_percentage is not None else 0
    opportunity_score = (discount_score * 0.7) + (pe_score * 0.3)

    return {
        "current_price": _safe_round(float(current_price)) if current_price else None,
        "pe_ratio": _safe_round(float(pe_ratio)) if pe_ratio else None,
        "min_price": _safe_round(min_price),
        "max_price": _safe_round(max_price),
        "discount_percentage": _safe_round(discount_percentage),
        "opportunity_score": _safe_round(opportunity_score),
    }


def _build_price_series(history, label_format):
    points = []
    if history.empty:
        return points

    for index, row in history.iterrows():
        close_price = _to_float(row.get("Close"))
        if close_price is None:
            continue
        timestamp = index.to_pydatetime()
        points.append(
            {
                "time": timestamp.strftime(label_format),
                "timestamp": timestamp.isoformat(),
                "price": _safe_round(close_price),
            }
        )
    return points


def _correlation_label(value):
    if value is None:
        return "Insufficient Data"
    if value >= 0.8:
        return "Highly Correlated"
    if value >= 0.5:
        return "Moderately Correlated"
    if value >= 0.2:
        return "Weakly Correlated"
    if value > -0.2:
        return "Not Correlated"
    if value > -0.5:
        return "Weakly Inverse Correlated"
    return "Highly Inverse Correlated"


class PortfolioListAPIView(APIView):
    def get(self, request):
        portfolios = Portfolio.objects.all().order_by("name")
        serializer = PortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PortfolioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = serializer.save()
        return Response(
            PortfolioSerializer(portfolio).data,
            status=status.HTTP_201_CREATED,
        )


class PortfolioDetailAPIView(APIView):
    def get(self, request, portfolio_id):
        portfolio = get_object_or_404(Portfolio, pk=portfolio_id)
        serializer = PortfolioDetailSerializer(portfolio)
        return Response(serializer.data)


class StockByPortfolioAPIView(APIView):
    def get(self, request, portfolio_id):
        portfolio = get_object_or_404(Portfolio, pk=portfolio_id)
        stocks = portfolio.stocks.all().order_by("name")
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data)

    def post(self, request, portfolio_id):
        portfolio = get_object_or_404(Portfolio, pk=portfolio_id)
        serializer = StockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data
        symbol = payload["symbol"].upper()

        stock, created = Stock.objects.get_or_create(
            portfolio=portfolio,
            stock_id=symbol,
            defaults={
                "name": payload["name"],
                "sector": payload.get("sector", ""),
            },
        )

        metrics = _get_stock_metrics(symbol)
        stock.name = payload["name"]
        stock.sector = payload.get("sector", "")
        stock.current_price = metrics["current_price"]
        stock.pe_ratio = metrics["pe_ratio"]
        stock.min_price = metrics["min_price"]
        stock.max_price = metrics["max_price"]
        stock.discount_percentage = metrics["discount_percentage"]
        stock.discount_level = metrics["discount_percentage"]
        stock.opportunity_score = metrics["opportunity_score"]
        stock.save()

        return Response(
            StockSerializer(stock).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class StockDetailAPIView(APIView):
    def get(self, request, portfolio_id, stock_id):
        stock = get_object_or_404(
            Stock,
            id=stock_id,
            portfolio_id=portfolio_id,
        )
        range_key = request.GET.get("range", "1mo")
        config = RANGE_MAP.get(range_key, RANGE_MAP["1mo"])

        ticker = yf.Ticker(stock.stock_id)
        info = ticker.info or {}
        history = ticker.history(
            period=config["period"],
            interval=config["interval"],
        )

        points = []
        if not history.empty:
            for index, row in history.iterrows():
                close_price = _to_float(row.get("Close"))
                if close_price is None:
                    continue
                timestamp = index.to_pydatetime()
                points.append(
                    {
                        "time": timestamp.strftime(config["label_format"]),
                        "timestamp": timestamp.isoformat(),
                        "price": _safe_round(close_price),
                    }
                )

        first_price = points[0]["price"] if points else None
        latest_price = points[-1]["price"] if points else _to_float(
            info.get("currentPrice")
        )
        change_percent = None
        if first_price and latest_price:
            change_percent = ((latest_price - first_price) / first_price) * 100

        result = {
            "id": stock.id,
            "portfolio": stock.portfolio_id,
            "symbol": stock.stock_id,
            "name": stock.name,
            "sector": stock.sector,
            "exchange": info.get("exchange", ""),
            "currency": info.get("currency", ""),
            "range": range_key if range_key in RANGE_MAP else "1mo",
            "chart": points,
            "cards": {
                "current_price": _safe_round(_to_float(info.get("currentPrice")))
                or stock.current_price,
                "day_high": _safe_round(_to_float(info.get("dayHigh"))),
                "day_low": _safe_round(_to_float(info.get("dayLow"))),
                "volume": info.get("volume"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": _safe_round(_to_float(info.get("trailingPE")))
                or stock.pe_ratio,
                "fifty_two_week_high": _safe_round(
                    _to_float(info.get("fiftyTwoWeekHigh"))
                ),
                "fifty_two_week_low": _safe_round(
                    _to_float(info.get("fiftyTwoWeekLow"))
                ),
                "change_percent": _safe_round(change_percent),
                "opportunity_score": stock.opportunity_score,
                "discount_percentage": stock.discount_percentage,
            },
        }
        return Response(result)

    def delete(self, request, portfolio_id, stock_id):
        stock = get_object_or_404(
            Stock,
            id=stock_id,
            portfolio_id=portfolio_id,
        )
        stock.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StockSuggestionAPIView(APIView):
    def get(self, request):
        query = request.GET.get("q", "").strip()
        if len(query) < 2:
            return Response([])

        search = yf.Search(query, max_results=10)
        results = []
        for quote in search.quotes:
            if quote.get("quoteType") != "EQUITY":
                continue

            symbol = quote.get("symbol")
            name = quote.get("shortname") or quote.get("longname")
            if not symbol or not name:
                continue

            results.append(
                {
                    "symbol": symbol,
                    "name": name,
                    "sector": quote.get("sectorDisp") or quote.get("sector", ""),
                    "exchange": quote.get("exchDisp", ""),
                }
            )

        return Response(results)


class MetalsAnalyticsAPIView(APIView):
    def get(self, request):
        range_key = request.GET.get("range", "1mo")
        range_config = METAL_RANGE_MAP.get(range_key, METAL_RANGE_MAP["1mo"])

        gold_ticker = yf.Ticker("GC=F")
        silver_ticker = yf.Ticker("SI=F")

        gold_history = gold_ticker.history(
            period=range_config["period"],
            interval=range_config["interval"],
        )
        silver_history = silver_ticker.history(
            period=range_config["period"],
            interval=range_config["interval"],
        )

        gold_chart = _build_price_series(gold_history, range_config["label_format"])
        silver_chart = _build_price_series(
            silver_history,
            range_config["label_format"],
        )

        corr_gold = gold_ticker.history(period="3y", interval="1wk")
        corr_silver = silver_ticker.history(period="3y", interval="1wk")
        correlation_points = []
        pearson_value = None

        if not corr_gold.empty and not corr_silver.empty:
            merged = corr_gold[["Close"]].join(
                corr_silver[["Close"]],
                how="inner",
                lsuffix="_gold",
                rsuffix="_silver",
            )
            merged = merged.dropna()

            if not merged.empty:
                pearson_value = _to_float(
                    merged["Close_gold"].corr(merged["Close_silver"])
                )
                for index, row in merged.iterrows():
                    gold_price = _to_float(row.get("Close_gold"))
                    silver_price = _to_float(row.get("Close_silver"))
                    if gold_price is None or silver_price is None:
                        continue
                    correlation_points.append(
                        {
                            "time": index.to_pydatetime().strftime("%d %b %y"),
                            "gold_price": _safe_round(gold_price),
                            "silver_price": _safe_round(silver_price),
                        }
                    )

        payload = {
            "range": range_key if range_key in METAL_RANGE_MAP else "1mo",
            "gold_chart": gold_chart,
            "silver_chart": silver_chart,
            "correlation": {
                "period": "3y",
                "pearson_value": _safe_round(pearson_value),
                "label": _correlation_label(pearson_value),
                "points": correlation_points,
            },
        }
        return Response(payload)
