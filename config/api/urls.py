from django.urls import path, include
from .views import api_root

urlpatterns = [
    path('', api_root),
    path('', include('portfolio.urls')),
]