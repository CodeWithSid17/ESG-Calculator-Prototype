"""
Root URL configuration.

This simply hands off all "/api/" requests to the calculator app's
own urls.py file, where the real endpoints are defined.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Any URL starting with /api/ is handled by calculator/urls.py
    path('api/', include('calculator.urls')),
]
