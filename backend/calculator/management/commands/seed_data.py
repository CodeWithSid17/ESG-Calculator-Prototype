"""
seed_data.py

Custom Django management command.

Run with:
    python manage.py seed_data

What it does:
1. Loads the built-in emission factor library from emission_factors.json
2. Loads sample Indian companies from companies.json
3. Generates sample calculation history for every company.
"""

import json
import random
from pathlib import Path

from django.core.management.base import BaseCommand

from calculator.models import Company, EmissionFactor, Calculation
from calculator.utils import convert_to_base_unit

SEED_DIR = Path(__file__).resolve().parent.parent.parent / "seed_data"


class Command(BaseCommand):
    help = (
        "Loads seed data: emission factors, sample companies, "
        "and sample calculation history."
    )

    def handle(self, *args, **options):
        self.load_emission_factors()
        self.load_companies()
        self.generate_sample_history()
        self.stdout.write(
            self.style.SUCCESS("Seed data loaded successfully.")
        )

    def load_emission_factors(self):
        file_path = SEED_DIR / "emission_factors.json"

        with open(file_path, "r", encoding="utf-8") as f:
            factors = json.load(f)

        for item in factors:
            EmissionFactor.objects.update_or_create(
                category=item["category"],
                defaults={
                    "scope": item["scope"],
                    "unit_type": item["unit_type"],
                    "base_unit": item["base_unit"],
                    "factor_value": item["factor_value"],
                    "note": item["note"],
                },
            )

        self.stdout.write(f"Loaded {len(factors)} emission factors.")

    def load_companies(self):
        file_path = SEED_DIR / "companies.json"

        with open(file_path, "r", encoding="utf-8") as f:
            companies = json.load(f)

        for item in companies:
            Company.objects.update_or_create(
                name=item["name"],
                reporting_year=item["reporting_year"],
                defaults={
                    "sector": item["sector"],
                    "scope1_tco2e": item["scope1_tco2e"],
                    "scope2_tco2e": item["scope2_tco2e"],
                    "scope3_tco2e": item.get("scope3_tco2e"),
                    "note": item["note"],
                },
            )

        self.stdout.write(f"Loaded {len(companies)} companies.")

    def generate_sample_history(self):
        """
        Creates sample dashboard history for every company.
        """

        if Calculation.objects.exists():
            self.stdout.write(
                "Calculation history already exists - skipping sample generation."
            )
            return

        electricity = EmissionFactor.objects.filter(
            category="Grid Electricity (India Avg)"
        ).first()

        diesel = EmissionFactor.objects.filter(
            category="Diesel"
        ).first()

        if not electricity or not diesel:
            self.stdout.write(
                self.style.WARNING(
                    "Required emission factors missing - skipping sample generation."
                )
            )
            return

        random.seed(42)

        rows_created = 0

        companies = Company.objects.all()

        for company in companies:

            # Full year 2025
            for month in range(1, 13):
                self._create_sample_row(
                    company,
                    electricity,
                    "kWh",
                    month,
                    2025,
                )

                self._create_sample_row(
                    company,
                    diesel,
                    "Litres",
                    month,
                    2025,
                )

                rows_created += 2

            # First six months of 2026
            for month in range(1, 7):
                self._create_sample_row(
                    company,
                    electricity,
                    "kWh",
                    month,
                    2026,
                )

                self._create_sample_row(
                    company,
                    diesel,
                    "Litres",
                    month,
                    2026,
                )

                rows_created += 2

        self.stdout.write(
            self.style.SUCCESS(
                f"Generated {rows_created} sample calculation rows."
            )
        )

    def _create_sample_row(
        self,
        company,
        factor,
        unit,
        month,
        year,
    ):
        activity_value = round(random.uniform(500, 5000), 2)

        converted_value = convert_to_base_unit(
            activity_value,
            unit,
        )

        result_kg = converted_value * factor.factor_value
        result_tonnes = result_kg / 1000

        quarter = ((month - 1) // 3) + 1

        Calculation.objects.create(
            company=company,
            emission_factor_ref=factor,
            calculator_type=factor.category,
            scope=factor.scope,
            activity_value=activity_value,
            input_unit=unit,
            emission_factor=factor.factor_value,
            result=result_kg,
            result_tonnes=result_tonnes,
            unit="kg CO2e",
            period_type="Monthly",
            period_year=year,
            period_month=month,
            period_quarter=quarter,
        )