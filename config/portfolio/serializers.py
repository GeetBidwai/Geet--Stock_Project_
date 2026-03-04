from rest_framework import serializers
from .models import Portfolio, Stock


class PortfolioSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Portfolio
        fields = ["id", "name", "sector", "owner"]


class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'


class PortfolioDetailSerializer(serializers.ModelSerializer):
    stocks = StockSerializer(many=True, read_only=True)
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Portfolio
        fields = ["id", "name", "sector", "owner", "stocks"]


class StockCreateSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=25)
    name = serializers.CharField(max_length=100)
    sector = serializers.CharField(max_length=100, required=False, allow_blank=True)
