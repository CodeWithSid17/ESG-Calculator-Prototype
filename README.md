# ESG Calculator Prototype (v2 - Dashboard Edition)

A demonstration of how ESG software calculates and visualizes environmental
metrics: a Scope 1/2/3 emissions calculator with a built-in emission factor
library, unit conversion, seeded sample Indian company benchmark data, and
a dashboard with monthly/quarterly/yearly charts.

**This is a prototype for demonstration only — not production code, and the
seeded emission figures are illustrative sample data, not verified
disclosures.**

## Tech Stack

- Backend: Django + Django REST Framework + SQLite
- Frontend: React + Axios + Tailwind CSS + Recharts

## What's New vs the Basic Version

| Feature | Basic version | This version |
|---|---|---|
| Emission factors | Manually typed by user | Built-in library (`EmissionFactor` model), auto-fills Scope + factor |
| Units | Single fixed unit | Multiple units per category (e.g. kWh/MWh/GJ) with automatic conversion |
| Scope | Not tracked | Scope 1 / Scope 2 / Scope 3 tagged on every calculation |
| Company data | None | Seeded sample Indian companies with Scope 1/2/3 figures |
| History | Flat table | Table + Dashboard with charts |
| Dashboard | None | Pie chart (scope split), line chart (monthly trend), bar charts (quarterly, yearly average) |
| Time period | None | Monthly / Quarterly / Yearly tagging on every calculation |

## Folder Structure

```
esg-calculator/
  backend/
    manage.py
    core/                        (project settings/urls)
    calculator/
      models.py                  (Company, EmissionFactor, Calculation)
      serializer.py
      views.py
      urls.py
      utils.py                   (unit conversion helper)
      seed_data/
        companies.json           (sample Indian company GHG data)
        emission_factors.json    (built-in emission factor library)
      management/commands/
        seed_data.py             (loads the JSON seed files + sample history)
  frontend/
    src/
      components/
        Calculator.jsx
        Dashboard.jsx
        CompanyBenchmark.jsx
      App.jsx                    (tab navigation)
      api.js
```

---

## 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py makemigrations calculator
python manage.py migrate

# Loads the emission factor library, sample companies, and generates
# ~3 years of sample calculation history so the dashboard has data to show
python manage.py seed_data

python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000/`.

---

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173/` (backend must also be running).

The app has three tabs: **Calculator**, **Dashboard**, and **Company Benchmark**.

---

## 3. Data Model / SQL Tables

```sql
-- Built-in emission factor library
CREATE TABLE "calculator_emissionfactor" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" varchar(100) NOT NULL UNIQUE,
    "scope" varchar(10) NOT NULL,
    "unit_type" varchar(10) NOT NULL,
    "base_unit" varchar(20) NOT NULL,
    "factor_value" real NOT NULL,
    "note" varchar(200) NOT NULL
);

-- Seeded sample Indian companies
CREATE TABLE "calculator_company" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(150) NOT NULL,
    "sector" varchar(100) NOT NULL,
    "reporting_year" integer NOT NULL,
    "scope1_tco2e" real NOT NULL,
    "scope2_tco2e" real NOT NULL,
    "scope3_tco2e" real NULL,
    "note" varchar(200) NOT NULL
);

-- Every calculation run through the calculator
CREATE TABLE "calculator_calculation" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_id" integer NULL REFERENCES "calculator_company" ("id"),
    "emission_factor_ref_id" integer NULL REFERENCES "calculator_emissionfactor" ("id"),
    "calculator_type" varchar(50) NOT NULL,
    "scope" varchar(10) NOT NULL,
    "activity_value" real NOT NULL,
    "input_unit" varchar(20) NOT NULL,
    "emission_factor" real NOT NULL,
    "result" real NOT NULL,
    "result_tonnes" real NOT NULL,
    "unit" varchar(50) NOT NULL,
    "period_type" varchar(10) NOT NULL,
    "period_year" integer NOT NULL,
    "period_month" integer NULL,
    "period_quarter" integer NULL,
    "created_at" datetime NOT NULL
);
```

---

## 4. Seeded Emission Factor Library

Loaded from `calculator/seed_data/emission_factors.json`. All values are
illustrative/representative for demo purposes.

| Category | Scope | Base Unit | Factor (kg CO2e / base unit) |
|---|---|---|---|
| Grid Electricity (India Avg) | Scope 2 | kWh | 0.716 |
| Diesel | Scope 1 | Litres | 2.68 |
| Petrol | Scope 1 | Litres | 2.31 |
| Piped Natural Gas (PNG) | Scope 1 | m3 | 2.02 |
| LPG | Scope 1 | kg | 2.98 |
| Coal | Scope 1 | kg | 2.42 |
| Purchased Water | Scope 3 | KL | 0.34 |
| Waste to Landfill | Scope 3 | kg | 0.58 |
| Business Air Travel | Scope 3 | unit (flight-hour) | 133.0 |

Each category also lists which alternate units are accepted (e.g.
Electricity accepts kWh/MWh/GJ) — the backend converts automatically.

---

## 5. Seeded Company Benchmark Data

Loaded from `calculator/seed_data/companies.json` — 8 well-known Indian
companies across sectors (Steel, Oil & Gas, Cement, FMCG, IT, Automotive),
each with sample Scope 1 / Scope 2 / Scope 3 figures (in tCO2e).

**⚠️ These are illustrative sample numbers created only to populate the
demo dashboard and benchmark chart. They are not sourced from, or
verified against, any company's actual sustainability disclosures.**
Before using this pattern for real reporting, replace this file with
verified figures from actual BRSR/CDP/annual reports.

---

## 6. API Reference

### GET /api/emission-factors/
Returns the built-in factor library (used to populate the Category
dropdown and auto-fill Scope/Unit/Factor).

```json
[
  {
    "id": 1,
    "category": "Grid Electricity (India Avg)",
    "scope": "Scope 2",
    "unit_type": "energy",
    "base_unit": "kWh",
    "factor_value": 0.716,
    "note": "Illustrative India grid average factor...",
    "compatible_units": ["kWh", "MWh", "GJ"]
  }
]
```

### GET /api/companies/
Returns the seeded sample companies.

### POST /api/calculate/

**Request**
```json
{
    "category_id": 1,
    "company_id": null,
    "activity_value": 5,
    "input_unit": "MWh",
    "period_type": "Monthly",
    "period_year": 2026,
    "period_month": 7
}
```

**Response**
```json
{
    "result": 3580.0,
    "result_tonnes": 3.58,
    "unit": "kg CO2e",
    "scope": "Scope 2",
    "converted_value": 5000.0,
    "base_unit": "kWh"
}
```
(5 MWh is converted to 5000 kWh, then multiplied by the 0.716 grid factor.)

### GET /api/history/
Returns every calculation, most recent first, including scope, company
name, and period.

### GET /api/dashboard/?year=2025
Returns aggregated numbers for the charts:

```json
{
    "selected_year": 2025,
    "scope_breakdown": [
        {"scope": "Scope 1", "total_tco2e": 108.93},
        {"scope": "Scope 2", "total_tco2e": 41.13}
    ],
    "yearly": [
        {"period_year": 2025, "total_tco2e": 84.93, "average_tco2e": 3.54},
        {"period_year": 2026, "total_tco2e": 65.13, "average_tco2e": 5.01}
    ],
    "monthly": [ {"period_month": 1, "total_tco2e": 4.06}, "..." ],
    "quarterly": [ {"period_quarter": 1, "total_tco2e": 23.71}, "..." ]
}
```

---

## 7. Business Context

This prototype demonstrates the calculation and visualization layer that
sits underneath larger ESG reporting frameworks (GRI, BRSR, CSRD, ISSB).
Real ESG platforms follow the same core structure shown here — an
emission-factor library, unit conversion, Scope 1/2/3 classification, and
time-series aggregation — but with far more rigorous factor sourcing
(national GHG inventories, DEFRA/EPA/IPCC libraries), validation, audit
trails, and multi-year comparability checks.
