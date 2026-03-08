from django.urls import path
from .views import login, logout, me, signup

urlpatterns = [
    path('signup/', signup),
    path('login/', login),
    path('logout/', logout),
    path('me/', me),
]
