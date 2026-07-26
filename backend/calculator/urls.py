"""
urls.py
Maps URL paths to views.
"""

from django.urls import path
from .views import (
    CalculateView,
    HistoryView,
    EmissionFactorListView,
    CompanyListView,
    DashboardView,
)

urlpatterns = [
    path('calculate/', CalculateView.as_view(), name='calculate'),
    path('history/', HistoryView.as_view(), name='history'),
    path('emission-factors/', EmissionFactorListView.as_view(), name='emission-factors'),
    path('companies/', CompanyListView.as_view(), name='companies'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
