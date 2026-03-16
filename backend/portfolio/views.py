from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Portfolio, Stock
from .serializers import (
    PortfolioDetailSerializer,
    PortfolioSerializer,
    StockCreateSerializer,
    StockSerializer,
)
from .services import (
    build_stock_history_payload,
    build_stock_metrics,
    fetch_search_results,
    get_crypto_forecast,
    get_dashboard_summary,
    get_metals_history,
    get_risk_cluster_data,
    get_top_discount_data,
    get_top_growth_data,
    normalize_range,
    summarize_portfolio,
    update_stock_snapshot,
)


DEFAULT_PORTFOLIO_SECTORS = [
    "Information Technology",
    "Banking",
    "Healthcare",
    "Finance",
    "Consumer",
    "Energy",
    "Industrial",
]


def _get_user_portfolio(user, portfolio_id):
    return get_object_or_404(Portfolio, pk=portfolio_id, owner=user)


def _get_user_stock(user, stock_id):
    return get_object_or_404(Stock, pk=stock_id, portfolio__owner=user)


def _serialize_portfolio_detail(portfolio):
    payload = PortfolioDetailSerializer(portfolio).data
    payload["summary"] = summarize_portfolio(portfolio)
    return payload


def _get_sector_choices(user):
    portfolio_sectors = Portfolio.objects.filter(owner=user).values_list("sector", flat=True)
    stock_sectors = Stock.objects.filter(portfolio__owner=user).values_list("sector", flat=True)
    choices = []

    for sector in [*DEFAULT_PORTFOLIO_SECTORS, *portfolio_sectors, *stock_sectors]:
        value = (sector or "").strip()
        if not value:
            continue
        if any(existing.lower() == value.lower() for existing in choices):
            continue
        choices.append(value)

    return choices


class DashboardSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_dashboard_summary(request.user))


class PortfolioListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolios = Portfolio.objects.filter(owner=request.user).order_by("name")
        serializer = PortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PortfolioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = serializer.save(owner=request.user)
        return Response(
            PortfolioSerializer(portfolio).data,
            status=status.HTTP_201_CREATED,
        )


class PortfolioSectorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_get_sector_choices(request.user))


class PortfolioDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, portfolio_id):
        portfolio = _get_user_portfolio(request.user, portfolio_id)
        for stock in portfolio.stocks.all():
            update_stock_snapshot(stock)
        portfolio.refresh_from_db()
        return Response(_serialize_portfolio_detail(portfolio))

    def delete(self, request, portfolio_id):
        portfolio = _get_user_portfolio(request.user, portfolio_id)
        portfolio.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PortfolioTopDiscountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, portfolio_id):
        portfolio = _get_user_portfolio(request.user, portfolio_id)
        return Response(
            {
                "portfolio_id": portfolio.id,
                "items": get_top_discount_data(portfolio),
            }
        )


class PortfolioTopGrowthAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, portfolio_id):
        portfolio = _get_user_portfolio(request.user, portfolio_id)
        range_key = normalize_range(request.GET.get("range", "1mo"), {
            "1w": {},
            "1mo": {},
            "3mo": {},
            "6mo": {},
            "1y": {},
            "3y": {},
        }, "1mo")
        return Response(
            {
                "portfolio_id": portfolio.id,
                "range": range_key,
                "items": get_top_growth_data(portfolio, range_key),
            }
        )


class PortfolioRiskClusterAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, portfolio_id):
        portfolio = _get_user_portfolio(request.user, portfolio_id)
        return Response(get_risk_cluster_data(portfolio))


class StockCollectionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stocks = Stock.objects.filter(portfolio__owner=request.user).select_related("portfolio")
        serializer = StockSerializer(stocks.order_by("name"), many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = _get_user_portfolio(request.user, serializer.validated_data["portfolio"])
        stock = _upsert_stock(portfolio, serializer.validated_data)
        return Response(StockSerializer(stock).data, status=status.HTTP_201_CREATED)


class StockByPortfolioAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, portfolio_id):
        portfolio = _get_user_portfolio(request.user, portfolio_id)
        for stock in portfolio.stocks.all():
            update_stock_snapshot(stock)
        serializer = StockSerializer(portfolio.stocks.order_by("name"), many=True)
        return Response(serializer.data)

    def post(self, request, portfolio_id):
        portfolio = _get_user_portfolio(request.user, portfolio_id)
        serializer = StockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stock = _upsert_stock(portfolio, serializer.validated_data)
        return Response(
            StockSerializer(stock).data,
            status=status.HTTP_201_CREATED,
        )


def _upsert_stock(portfolio, payload):
    symbol = payload["symbol"].upper()
    stock, _created = Stock.objects.get_or_create(
        portfolio=portfolio,
        stock_id=symbol,
        defaults={
            "name": payload["name"],
            "sector": payload.get("sector", ""),
        },
    )
    metrics = build_stock_metrics(
        symbol,
        fallback={
            "name": payload["name"],
            "sector": payload.get("sector", ""),
            "current_price": stock.current_price,
            "min_price": stock.min_price,
            "max_price": stock.max_price,
            "pe_ratio": stock.pe_ratio,
            "eps": stock.eps,
            "market_cap": stock.market_cap,
            "intrinsic_value": stock.intrinsic_value,
        },
    )
    stock.name = payload["name"]
    stock.sector = payload.get("sector", "") or metrics["sector"]
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


class StockHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, stock_id):
        stock = _get_user_stock(request.user, stock_id)
        update_stock_snapshot(stock)
        return Response(build_stock_history_payload(stock, request.GET.get("range", "1mo")))


class StockDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, portfolio_id, stock_id):
        stock = get_object_or_404(
            Stock,
            id=stock_id,
            portfolio_id=portfolio_id,
            portfolio__owner=request.user,
        )
        update_stock_snapshot(stock)
        return Response(build_stock_history_payload(stock, request.GET.get("range", "1mo")))

    def delete(self, request, portfolio_id, stock_id):
        stock = get_object_or_404(
            Stock,
            id=stock_id,
            portfolio_id=portfolio_id,
            portfolio__owner=request.user,
        )
        stock.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StockDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, stock_id):
        stock = _get_user_stock(request.user, stock_id)
        update_stock_snapshot(stock)
        return Response(build_stock_history_payload(stock, request.GET.get("range", "1mo")))

    def delete(self, request, stock_id):
        stock = _get_user_stock(request.user, stock_id)
        stock.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StockSuggestionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get("q", "").strip()
        return Response(fetch_search_results(query))


class MetalsAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_metals_history(request.GET.get("range", "3y")))


class CryptoForecastAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        model_name = request.GET.get("model", "linear")
        days = request.GET.get("days", 30)
        return Response(get_crypto_forecast(model_name, days))
