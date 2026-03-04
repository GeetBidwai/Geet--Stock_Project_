from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "API is running",
        "endpoints": [
            "/api/signup/",
            "/api/me/",
            "/api/portfolios/",
            "/api/portfolios/<id>/",
            "/api/portfolios/<id>/stocks/",
            "/api/portfolios/<id>/stocks/<stock_id>/",
            "/api/portfolios/<id>/stocks/<stock_id>/?range=1mo",
            "/api/stocks/suggest/?q=tata",
            "/api/metals/analytics/?range=1mo",
            "/api/login/"
        ]
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    email = request.data.get("email", "").strip()
    employee_id = request.data.get("employee_id", "").strip()

    if not username or not password or not employee_id:
        return Response(
            {
                "detail": "username, password and employee_id are required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(employee_id=employee_id).exists():
        return Response(
            {"detail": "Employee ID already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        employee_id=employee_id,
    )
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "employee_id": user.employee_id,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "employee_id": user.employee_id,
        }
    )
