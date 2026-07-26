"""
utils.py

Small helper module for unit conversion.

Emission factors are always defined against a "base unit"
(e.g. Diesel factor is per Litre). But a user might enter their
activity data in a different but compatible unit (e.g. Kilolitres).
This file converts whatever the user typed into the base unit
before the emission factor is applied.

Units are grouped into "unit types":
  - energy  -> base unit: kWh
  - volume  -> base unit: Litres
  - mass    -> base unit: kg
  - count   -> base unit: unit (no conversion, e.g. generic count)
"""

# Each entry: unit_name -> how many BASE units it is equal to
UNIT_CONVERSIONS = {
    # Energy units -> base unit is kWh
    'kWh': 1,
    'MWh': 1000,
    'GJ': 277.778,

    # Volume units -> base unit is Litres
    'Litres': 1,
    'KL': 1000,
    'm3': 1000,

    # Mass units -> base unit is kg
    'kg': 1,
    'tonnes': 1000,

    # Count -> no real conversion, 1-to-1
    'unit': 1,
}

# Which units belong to which "unit type" (used to build dropdowns on the frontend)
UNIT_TYPE_GROUPS = {
    'energy': ['kWh', 'MWh', 'GJ'],
    'volume': ['Litres', 'KL', 'm3'],
    'mass': ['kg', 'tonnes'],
    'count': ['unit'],
}


def convert_to_base_unit(value, from_unit):
    """
    Converts `value` (given in `from_unit`) into the base unit
    for that unit family.

    Example: convert_to_base_unit(5, 'MWh') -> 5000 (kWh)
    """
    factor = UNIT_CONVERSIONS.get(from_unit, 1)
    return value * factor
