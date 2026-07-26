"""
serializer.py

One serializer per model, kept simple (ModelSerializer).
"""

from rest_framework import serializers
from .models import Calculation, Company, EmissionFactor


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'sector', 'reporting_year',
            'scope1_tco2e', 'scope2_tco2e', 'scope3_tco2e', 'note',
        ]


class EmissionFactorSerializer(serializers.ModelSerializer):
    # Extra read-only field: which units are valid alternatives for this
    # factor's unit_type (e.g. energy -> kWh/MWh/GJ). The frontend uses
    # this to build the "Unit" dropdown after a category is selected.
    compatible_units = serializers.SerializerMethodField()

    class Meta:
        model = EmissionFactor
        fields = [
            'id', 'category', 'scope', 'unit_type',
            'base_unit', 'factor_value', 'note', 'compatible_units',
        ]

    def get_compatible_units(self, obj):
        from .utils import UNIT_TYPE_GROUPS
        return UNIT_TYPE_GROUPS.get(obj.unit_type, [obj.base_unit])


class CalculationSerializer(serializers.ModelSerializer):
    # Show the company name (not just its id) in history/dashboard responses
    company_name = serializers.CharField(source='company.name', read_only=True, default=None)

    class Meta:
        model = Calculation
        fields = [
            'id', 'company', 'company_name', 'emission_factor_ref',
            'calculator_type', 'scope',
            'activity_value', 'input_unit', 'emission_factor',
            'result', 'result_tonnes', 'unit',
            'period_type', 'period_year', 'period_month', 'period_quarter',
            'created_at',
        ]
        read_only_fields = ['result', 'result_tonnes', 'created_at']
