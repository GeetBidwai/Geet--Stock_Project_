from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthApiTests(APITestCase):
    def test_signup_returns_token_and_user(self):
        payload = {
            "username": "alice",
            "email": "alice@example.com",
            "employee_id": "EMP001",
            "password": "SecurePass123!",
        }

        response = self.client.post("/api/auth/signup/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "alice")
        self.assertTrue(User.objects.filter(username="alice").exists())

    def test_login_requires_valid_credentials(self):
        User.objects.create_user(
            username="bob",
            employee_id="EMP002",
            password="SecurePass123!",
        )

        response = self.client.post(
            "/api/auth/login/",
            {"username": "bob", "password": "wrong-pass"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
