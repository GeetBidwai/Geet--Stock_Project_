from django.urls import path
from .views import (
    MetalsAnalyticsAPIView,
    PortfolioDetailAPIView,
    PortfolioListAPIView,
    StockDetailAPIView,
    StockByPortfolioAPIView,
    StockSuggestionAPIView,
)

urlpatterns = [
    path('portfolios/', PortfolioListAPIView.as_view()),
    path('portfolios/<int:portfolio_id>/', PortfolioDetailAPIView.as_view()),
    path('portfolios/<int:portfolio_id>/stocks/', StockByPortfolioAPIView.as_view()),
    path('portfolios/<int:portfolio_id>/stocks/<int:stock_id>/', StockDetailAPIView.as_view()),
    path('stocks/suggest/', StockSuggestionAPIView.as_view()),
    path('metals/analytics/', MetalsAnalyticsAPIView.as_view()),
]
