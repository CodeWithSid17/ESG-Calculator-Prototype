"""
models.py

Three models now:

1. Company          -> seeded sample Indian companies with example GHG numbers
                        (used for the "benchmark" comparison view)
2. EmissionFactor    -> a built-in library of emission factors, like a real
                        ESG tool would ship with (Diesel, Electricity, etc.)
3. Calculation       -> every calculation a user runs through the calculator,
                        now with Scope, Company, and time-period tracking
                        so the dashboard can chart it.
"""

from django.db import models


class Company(models.Model):
    """
    Sample/seed data representing well-known Indian companies.

    NOTE: The emission figures here are ILLUSTRATIVE SAMPLE DATA created
    only to demonstrate dashboard charts and benchmarking. They are NOT
    verified official disclosures - do not use for real reporting.
    """

    name = models.CharField(max_length=150)
    sector = models.CharField(max_length=100)
    reporting_year = models.IntegerField()

    # All figures stored in tonnes CO2e (tCO2e), the standard GHG reporting unit
    scope1_tco2e = models.FloatField(help_text="Direct emissions (owned/controlled sources)")
    scope2_tco2e = models.FloatField(help_text="Indirect emissions from purchased energy")
    scope3_tco2e = models.FloatField(null=True, blank=True, help_text="Other indirect value-chain emissions")

    note = models.CharField(
        max_length=200,
        default="Illustrative sample data for demo purposes only, not an official disclosure."
    )

    def __str__(self):
        return f"{self.name} ({self.reporting_year})"


class EmissionFactor(models.Model):
    """
    A built-in library of emission factors - the same idea real ESG
    software ships with, so users don't have to know factor values
    by heart. Selecting a category auto-fills scope, unit, and factor.
    """

    SCOPE_CHOICES = [
        ('Scope 1', 'Scope 1 - Direct emissions'),
        ('Scope 2', 'Scope 2 - Purchased energy'),
        ('Scope 3', 'Scope 3 - Value chain'),
    ]

    UNIT_TYPE_CHOICES = [
        ('energy', 'Energy'),
        ('volume', 'Volume'),
        ('mass', 'Mass'),
        ('count', 'Count'),
    ]

    category = models.CharField(max_length=100, unique=True)  # e.g. "Diesel", "Grid Electricity (India Avg)"
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    unit_type = models.CharField(max_length=10, choices=UNIT_TYPE_CHOICES)

    # The unit the factor_value is defined against, e.g. "Litres" for Diesel
    base_unit = models.CharField(max_length=20)

    # kg CO2e produced per 1 base_unit of activity
    factor_value = models.FloatField()

    note = models.CharField(max_length=200, blank=True, default="Illustrative factor for demo purposes.")

    def __str__(self):
        return f"{self.category} ({self.factor_value} kgCO2e/{self.base_unit})"


class Calculation(models.Model):
    """
    One row per calculation performed in the calculator.
    Extra fields (scope, company, period) exist so the dashboard
    can group and chart the history meaningfully.
    """

    SCOPE_CHOICES = EmissionFactor.SCOPE_CHOICES

    PERIOD_TYPE_CHOICES = [
        ('Monthly', 'Monthly'),
        ('Quarterly', 'Quarterly'),
        ('Yearly', 'Yearly'),
    ]

    # Optional link to a seeded company (lets a user "attach" a calculation
    # to a company for benchmarking - optional for a quick calculation)
    company = models.ForeignKey(
        Company, null=True, blank=True, on_delete=models.SET_NULL, related_name='calculations'
    )

    # Optional link to the emission factor library entry that was used
    emission_factor_ref = models.ForeignKey(
        EmissionFactor, null=True, blank=True, on_delete=models.SET_NULL
    )

    calculator_type = models.CharField(max_length=50)  # free text category label, e.g. "Diesel"
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='Scope 1')

    activity_value = models.FloatField(help_text="Raw value entered by the user")
    input_unit = models.CharField(max_length=20, help_text="Unit the user entered activity_value in")

    emission_factor = models.FloatField(help_text="kg CO2e per base unit, used for this calculation")

    result = models.FloatField(help_text="Result in kg CO2e")
    result_tonnes = models.FloatField(help_text="Result in tonnes CO2e (result / 1000)")
    unit = models.CharField(max_length=50, default="kg CO2e")

    # Time-period tagging, used by the dashboard for monthly/quarterly/yearly charts
    period_type = models.CharField(max_length=10, choices=PERIOD_TYPE_CHOICES, default='Monthly')
    period_year = models.IntegerField()
    period_month = models.IntegerField(null=True, blank=True, help_text="1-12, used when period_type=Monthly")
    period_quarter = models.IntegerField(null=True, blank=True, help_text="1-4, used when period_type=Quarterly")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.calculator_type} - {self.result_tonnes} tCO2e"
