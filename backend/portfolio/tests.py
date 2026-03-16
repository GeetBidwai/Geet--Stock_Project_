from unittest.mock import patch

from django.contrib.auth import get_user_model
import pandas as pd
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Portfolio, Stock
from .services import build_stock_metrics


User = get_user_model()


class PortfolioApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner",
            employee_id="EMP100",
            password="SecurePass123!",
        )
        self.other_user = User.objects.create_user(
            username="other",
            employee_id="EMP101",
            password="SecurePass123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_portfolio_list_is_user_scoped(self):
        Portfolio.objects.create(owner=self.user, name="Owner Portfolio", sector="Tech")
        Portfolio.objects.create(owner=self.other_user, name="Other Portfolio", sector="Finance")

        response = self.client.get("/api/portfolios/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Owner Portfolio")

    def test_sector_list_returns_default_and_user_scoped_sectors(self):
        owner_portfolio = Portfolio.objects.create(owner=self.user, name="Owner Portfolio", sector="Tech")
        Portfolio.objects.create(owner=self.other_user, name="Other Portfolio", sector="Aerospace")
        Stock.objects.create(
            portfolio=owner_portfolio,
            stock_id="INFY",
            name="Infosys",
            sector="Software",
        )

        response = self.client.get("/api/portfolios/sectors/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Information Technology", response.data)
        self.assertIn("Tech", response.data)
        self.assertIn("Software", response.data)
        self.assertNotIn("Aerospace", response.data)

    @patch("portfolio.services.yf.Search")
    def test_stock_search_returns_only_indian_equities(self, mock_search):
        mock_search.return_value.quotes = [
            {
                "symbol": "RELIANCE.NS",
                "shortname": "Reliance Industries",
                "quoteType": "EQUITY",
                "exchDisp": "NSE",
            },
            {
                "symbol": "500209.BO",
                "shortname": "Infosys",
                "quoteType": "EQUITY",
                "exchDisp": "BSE",
            },
            {
                "symbol": "INFY",
                "shortname": "Infosys ADR",
                "quoteType": "EQUITY",
                "exchDisp": "NYSE",
            },
            {
                "symbol": "MSFT",
                "shortname": "Microsoft",
                "quoteType": "EQUITY",
                "exchDisp": "NASDAQ",
            },
        ]

        response = self.client.get("/api/stocks/search/", {"q": "in"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            [
                {
                    "symbol": "RELIANCE.NS",
                    "name": "Reliance Industries",
                    "sector": "",
                    "exchange": "NSE",
                },
                {
                    "symbol": "500209.BO",
                    "name": "Infosys",
                    "sector": "",
                    "exchange": "BSE",
                },
            ],
        )

    def test_add_stock_rejects_non_indian_equity_symbol(self):
        portfolio = Portfolio.objects.create(owner=self.user, name="Core", sector="Tech")

        response = self.client.post(
            f"/api/portfolios/{portfolio.id}/stocks/",
            {
                "symbol": "MSFT",
                "name": "Microsoft",
                "sector": "Technology",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("India equities only", response.data["symbol"][0])

    @patch("portfolio.views.update_stock_snapshot")
    @patch("portfolio.views.build_stock_history_payload")
    def test_stock_detail_by_id_endpoint_exists(self, mock_history_payload, mock_snapshot):
        portfolio = Portfolio.objects.create(owner=self.user, name="Core", sector="Tech")
        stock = Stock.objects.create(
            portfolio=portfolio,
            stock_id="AAPL",
            name="Apple",
        )
        mock_snapshot.return_value = stock
        mock_history_payload.return_value = {"id": stock.id, "symbol": "AAPL", "chart": []}

        response = self.client.get(f"/api/stocks/{stock.id}/", {"range": "1mo"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], stock.id)
        mock_snapshot.assert_called_once()
        mock_history_payload.assert_called_once()

    def test_stock_detail_by_id_respects_ownership(self):
        other_portfolio = Portfolio.objects.create(owner=self.other_user, name="Other", sector="Tech")
        stock = Stock.objects.create(
            portfolio=other_portfolio,
            stock_id="MSFT",
            name="Microsoft",
        )

        response = self.client.get(f"/api/stocks/{stock.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class StockMetricTests(APITestCase):
    @patch("portfolio.services.fetch_history")
    @patch("portfolio.services.fetch_info")
    def test_discount_uses_current_price_denominator_for_intrinsic_value(self, mock_fetch_info, mock_fetch_history):
        mock_fetch_info.return_value = {
            "currentPrice": 100,
            "trailingPE": 10,
            "trailingEps": 20,
        }
        mock_fetch_history.return_value = pd.DataFrame()

        metrics = build_stock_metrics("INFY.NS")

        self.assertEqual(metrics["intrinsic_value"], 200.0)
        self.assertEqual(metrics["discount_percentage"], 100.0)

    @patch("portfolio.services.fetch_history")
    @patch("portfolio.services.fetch_info")
    def test_discount_falls_back_to_52_week_high_when_intrinsic_value_too_low(self, mock_fetch_info, mock_fetch_history):
        mock_fetch_info.return_value = {
            "currentPrice": 100,
            "trailingPE": 10,
            "trailingEps": 4,
        }
        mock_fetch_history.return_value = pd.DataFrame()

        metrics = build_stock_metrics(
            "ITC.NS",
            fallback={
                "max_price": 150,
            },
        )

        self.assertEqual(metrics["intrinsic_value"], 40.0)
        self.assertEqual(metrics["discount_percentage"], 33.33)
