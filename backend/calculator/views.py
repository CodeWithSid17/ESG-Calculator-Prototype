

from django.db.models import Sum, Avg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Calculation, Company, EmissionFactor
from .serializer import CalculationSerializer, CompanySerializer, EmissionFactorSerializer
from .utils import convert_to_base_unit


class EmissionFactorListView(APIView):
    """
    GET /api/emission-factors/
    Returns the built-in emission factor library so the frontend can
    populate the "Category" dropdown and auto-fill Scope/Unit/Factor.
    """

    def get(self, request):
        factors = EmissionFactor.objects.all().order_by('scope', 'category')
        serializer = EmissionFactorSerializer(factors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CompanyListView(APIView):
    """
    GET /api/companies/
    Returns the seeded sample Indian companies (illustrative GHG data)
    used for the benchmarking view.
    """

    def get(self, request):
        companies = Company.objects.all().order_by('name')
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CalculateView(APIView):
    """
    POST /api/calculate/

    Expected input JSON:
    {
        "category_id": 1,            (id of an EmissionFactor - preferred way)
        "company_id": null,          (optional - attach to a seeded company)
        "activity_value": 1000,
        "input_unit": "kWh",         (must belong to the category's unit_type)
        "period_type": "Monthly",
        "period_year": 2026,
        "period_month": 7,
        "period_quarter": null
    }

    Logic:
        1. Look up the EmissionFactor (gives us scope, base_unit, factor_value)
        2. Convert activity_value from input_unit into the factor's base_unit
        3. result (kg CO2e) = converted_value * factor_value
        4. Save + return the result
    """

    def post(self, request):
        data = request.data

        category_id = data.get('category_id')
        activity_value = data.get('activity_value')
        input_unit = data.get('input_unit')

        # Step 1: basic validation
        if category_id is None or activity_value is None or input_unit is None:
            return Response(
                {'error': 'category_id, activity_value and input_unit are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            activity_value = float(activity_value)
        except (TypeError, ValueError):
            return Response({'error': 'activity_value must be a number'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: look up the emission factor the user selected
        try:
            factor = EmissionFactor.objects.get(id=category_id)
        except EmissionFactor.DoesNotExist:
            return Response({'error': 'Invalid category_id'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 3: convert the entered value into the factor's base unit
        # e.g. if factor is defined per Litre, but user entered Kilolitres,
        # this turns 5 KL into 5000 Litres.
        converted_value = convert_to_base_unit(activity_value, input_unit)

        # Step 4: apply the formula -> result in kg CO2e
        result_kg = converted_value * factor.factor_value
        result_tonnes = result_kg / 1000

        # Step 5: figure out the reporting period fields
        period_type = data.get('period_type', 'Monthly')
        period_year = data.get('period_year')
        period_month = data.get('period_month')
        period_quarter = data.get('period_quarter')

        if not period_year:
            return Response({'error': 'period_year is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 6: optional company link (for benchmarking against seeded companies)
        company_id = data.get('company_id')
        company = None
        if company_id:
            company = Company.objects.filter(id=company_id).first()

        # Step 7: save the calculation
        calculation = Calculation.objects.create(
            company=company,
            emission_factor_ref=factor,
            calculator_type=factor.category,
            scope=factor.scope,
            activity_value=activity_value,
            input_unit=input_unit,
            emission_factor=factor.factor_value,
            result=result_kg,
            result_tonnes=result_tonnes,
            unit='kg CO2e',
            period_type=period_type,
            period_year=period_year,
            period_month=period_month,
            period_quarter=period_quarter,
        )

        # Step 8: return the result plus useful context
        return Response({
            'result': calculation.result,
            'result_tonnes': calculation.result_tonnes,
            'unit': calculation.unit,
            'scope': calculation.scope,
            'converted_value': converted_value,
            'base_unit': factor.base_unit,
        }, status=status.HTTP_201_CREATED)


class HistoryView(APIView):
    """
    GET /api/history/
    Returns every calculation ever made, most recent first.
    """

    def get(self, request):
        calculations = Calculation.objects.all().order_by('-created_at')
        serializer = CalculationSerializer(calculations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


from django.db.models import Sum, Avg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Calculation, Company


class DashboardView(APIView):
    """
    GET /api/dashboard/

    Optional Query Params
    ---------------------
    company_id : int
    year       : int

    Examples
    --------
    /api/dashboard/
    /api/dashboard/?company_id=1
    /api/dashboard/?company_id=1&year=2026

    Returns
    -------
    Dashboard data for a selected company.
    If company_id is not provided, data from all companies is shown.
    """

    def get(self, request):

        # -----------------------------
        # Read query parameters
        # -----------------------------
        company_id = request.query_params.get("company_id")
        year_param = request.query_params.get("year")

        # -----------------------------
        # Base queryset
        # -----------------------------
        calculations = Calculation.objects.all()

        selected_company = None

        # Filter by company if provided
        if company_id:
            calculations = calculations.filter(company_id=company_id)
            selected_company = Company.objects.filter(id=company_id).first()

        # -----------------------------
        # Determine selected year
        # -----------------------------
        if year_param:
            selected_year = int(year_param)
        else:
            latest = calculations.order_by("-period_year").first()
            selected_year = latest.period_year if latest else None

        # -----------------------------
        # Scope Breakdown
        # -----------------------------
        scope_breakdown = list(
            calculations.values("scope")
            .annotate(
                total_tco2e=Sum("result_tonnes")
            )
            .order_by("scope")
        )

        # -----------------------------
        # Yearly Trend
        # -----------------------------
        yearly = list(
            calculations.values("period_year")
            .annotate(
                total_tco2e=Sum("result_tonnes"),
                average_tco2e=Avg("result_tonnes")
            )
            .order_by("period_year")
        )

        # -----------------------------
        # Monthly Trend
        # -----------------------------
        monthly = []

        if selected_year:
            monthly = list(
                calculations.filter(
                    period_year=selected_year,
                    period_month__isnull=False
                )
                .values("period_month")
                .annotate(
                    total_tco2e=Sum("result_tonnes")
                )
                .order_by("period_month")
            )

        # -----------------------------
        # Quarterly Trend
        # -----------------------------
        quarterly = []

        if selected_year:
            quarterly = list(
                calculations.filter(
                    period_year=selected_year,
                    period_quarter__isnull=False
                )
                .values("period_quarter")
                .annotate(
                    total_tco2e=Sum("result_tonnes")
                )
                .order_by("period_quarter")
            )

        # -----------------------------
        # Company Summary
        # -----------------------------
        company = None

        if selected_company:
            company = {
                "id": selected_company.id,
                "name": selected_company.name,
                "sector": selected_company.sector,
                "reporting_year": selected_company.reporting_year,
            }

        # -----------------------------
        # Response
        # -----------------------------
        return Response(
            {
                "company": company,
                "selected_year": selected_year,
                "scope_breakdown": scope_breakdown,
                "yearly": yearly,
                "monthly": monthly,
                "quarterly": quarterly,
            },
            status=status.HTTP_200_OK,
        )