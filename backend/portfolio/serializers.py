from rest_framework import serializers
from .models import Portfolio, Stock


class PortfolioSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Portfolio
        fields = ["id", "name", "sector", "owner", "created_at"]


class StockSerializer(serializers.ModelSerializer):
    ticker = serializers.ReadOnlyField(source="stock_id")
    symbol = serializers.ReadOnlyField(source="stock_id")
    discount_percent = serializers.ReadOnlyField(source="discount_percentage")

    class Meta:
        model = Stock
        fields = [
            "id",
            "portfolio",
            "stock_id",
            "ticker",
            "symbol",
            "name",
            "sector",
            "current_price",
            "min_price",
            "max_price",
            "pe_ratio",
            "eps",
            "market_cap",
            "intrinsic_value",
            "discount_percentage",
            "discount_percent",
            "opportunity_score",
            "discount_level",
            "created_at",
        ]


class PortfolioDetailSerializer(serializers.ModelSerializer):
    stocks = StockSerializer(many=True, read_only=True)
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Portfolio
        fields = ["id", "name", "sector", "owner", "created_at", "stocks"]


class StockCreateSerializer(serializers.Serializer):
    portfolio = serializers.IntegerField(required=False)
    symbol = serializers.CharField(max_length=25)
    name = serializers.CharField(max_length=100)
    sector = serializers.CharField(max_length=100, required=False, allow_blank=True)
