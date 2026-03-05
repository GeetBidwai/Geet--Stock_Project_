from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


User = get_user_model()


@api_view(['GET'])
def api_root(request):
    return Response({
        "message": "API is running",
        "endpoints": [
            "/api/portfolios/",     
            "/api/stocks/",
            "/api/login/",
            "/api/signup/",
            "/api/me/",
            "/api/logout/",
        ]
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    username = request.data.get("username")
    email = request.data.get("email", "")
    employee_id = request.data.get("employee_id")
    password = request.data.get("password")

    if not username or not employee_id or not password:
        return Response(
            {"detail": "username, employee_id and password are required."},
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
        email=email,
        employee_id=employee_id,
        password=password,
    )
    auth_login(request, user)
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "employee_id": user.employee_id,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    auth_login(request, user)
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "employee_id": user.employee_id,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    auth_logout(request)
    return Response({"detail": "Logged out successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "employee_id": request.user.employee_id,
        }
    )
