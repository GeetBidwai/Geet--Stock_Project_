from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Portfolio, Stock


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
