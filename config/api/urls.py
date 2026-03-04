from django.urls import path, include
from .views import api_root, me, signup

urlpatterns = [
    path('', api_root),
    path('signup/', signup),
    path('me/', me),
    path('', include('portfolio.urls')),
]
