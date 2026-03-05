from django.urls import path, include
from .views import api_root, login, logout, me, signup

urlpatterns = [
    path('', api_root),
    path('signup/', signup),
    path('login/', login),
    path('logout/', logout),
    path('me/', me),
    path('', include('portfolio.urls')),
]
