// Calculator.jsx
// The main calculator form. Unlike a basic version, this one is driven
// by the built-in Emission Factor library: selecting a "Category"
// auto-fills the Scope, the base unit, and the factor value - just like
// a real ESG tool. The user can still pick a different (but compatible)
// unit and the backend converts it automatically.

import { useState, useEffect } from 'react';
import { calculateEmission, getHistory, getEmissionFactors, getCompanies } from '../api';

function Calculator() {
  // ---------- Data loaded from the backend ----------
  const [factors, setFactors] = useState([]);       // emission factor library
  const [companies, setCompanies] = useState([]);    // seeded companies (optional link)
  const [history, setHistory] = useState([]);

  // ---------- Form state ----------
  const [categoryId, setCategoryId] = useState('');
  const [inputUnit, setInputUnit] = useState('');
  const [activityValue, setActivityValue] = useState('');
  const [companyId, setCompanyId] = useState('');

  const [periodType, setPeriodType] = useState('Monthly');
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodQuarter, setPeriodQuarter] = useState(1);

  // ---------- Result / error ----------
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Load dropdown data + history once when the page opens
  useEffect(() => {
    getEmissionFactors().then((res) => setFactors(res.data)).catch(console.error);
    getCompanies().then((res) => setCompanies(res.data)).catch(console.error);
    loadHistory();
  }, []);

  const loadHistory = () => {
    getHistory().then((res) => setHistory(res.data)).catch(console.error);
  };

  // The full factor object currently selected (or undefined if none)
  const selectedFactor = factors.find((f) => f.id === Number(categoryId));

  // Whenever the category changes, default the unit dropdown to the factor's base unit
  useEffect(() => {
    if (selectedFactor) {
      setInputUnit(selectedFactor.base_unit);
    }
  }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCalculate = () => {
    setErrorMessage('');
    setResult(null);

    if (!categoryId || !activityValue || !inputUnit) {
      setErrorMessage('Please select a category, unit, and enter an activity value.');
      return;
    }

    const payload = {
      category_id: Number(categoryId),
      company_id: companyId ? Number(companyId) : null,
      activity_value: activityValue,
      input_unit: inputUnit,
      period_type: periodType,
      period_year: Number(periodYear),
      period_month: periodType === 'Monthly' ? Number(periodMonth) : null,
      period_quarter: periodType === 'Quarterly' ? Number(periodQuarter) : null,
    };

    calculateEmission(payload)
      .then((res) => {
        setResult(res.data);
        loadHistory(); // refresh table with the new row
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage('Something went wrong. Please check your inputs.');
      });
  };

  return (
    <div className="flex flex-col items-center">

      {/* ---------- Calculator Card ---------- */}
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">New Calculation</h2>

        {/* Category dropdown - drives Scope / Unit / Factor auto-fill */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          className="w-full border border-gray-300 rounded p-2 mb-4"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">-- Select a category --</option>
          {factors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.category} ({f.scope})
            </option>
          ))}
        </select>

        {/* Auto-filled info box once a category is picked */}
        {selectedFactor && (
          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-sm text-gray-600 grid grid-cols-2 gap-2">
            <div><span className="font-medium text-gray-700">Scope:</span> {selectedFactor.scope}</div>
            <div><span className="font-medium text-gray-700">Factor:</span> {selectedFactor.factor_value} kgCO2e/{selectedFactor.base_unit}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Activity value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Value</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded p-2"
              value={activityValue}
              onChange={(e) => setActivityValue(e.target.value)}
              placeholder="e.g. 1000"
            />
          </div>

          {/* Unit dropdown - only compatible units for the selected category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              className="w-full border border-gray-300 rounded p-2"
              value={inputUnit}
              onChange={(e) => setInputUnit(e.target.value)}
              disabled={!selectedFactor}
            >
              {selectedFactor
                ? selectedFactor.compatible_units.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))
                : <option value="">Select a category first</option>}
            </select>
          </div>
        </div>

        {/* Optional company link, for benchmarking */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
        <select
          className="w-full border border-gray-300 rounded p-2 mb-4"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">-- Not linked to a company --</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Reporting period */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <select
            className="border border-gray-300 rounded p-2"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>

          <input
            type="number"
            className="border border-gray-300 rounded p-2"
            value={periodYear}
            onChange={(e) => setPeriodYear(e.target.value)}
            placeholder="Year"
          />

          {periodType === 'Monthly' && (
            <select
              className="border border-gray-300 rounded p-2"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>Month {m}</option>
              ))}
            </select>
          )}

          {periodType === 'Quarterly' && (
            <select
              className="border border-gray-300 rounded p-2"
              value={periodQuarter}
              onChange={(e) => setPeriodQuarter(e.target.value)}
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          )}
        </div>

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded"
        >
          Calculate
        </button>

        {errorMessage && <p className="text-red-600 text-sm mt-3">{errorMessage}</p>}

        {/* Result */}
        {result && !errorMessage && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">{result.scope}</div>
            <div className="text-xl font-semibold text-blue-700">
              {result.result_tonnes.toFixed(3)} tCO2e
            </div>
            <div className="text-xs text-gray-500">({result.result.toFixed(2)} kg CO2e)</div>
          </div>
        )}
      </div>

      {/* ---------- History Table ---------- */}
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-5xl mt-8 overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Calculation History</h2>

        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Scope</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Activity</th>
              <th className="py-2 pr-4">Factor</th>
              <th className="py-2 pr-4">Result (tCO2e)</th>
              <th className="py-2 pr-4">Period</th>
              <th className="py-2 pr-4">Created At</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">{item.calculator_type}</td>
                <td className="py-2 pr-4">{item.scope}</td>
                <td className="py-2 pr-4">{item.company_name || '-'}</td>
                <td className="py-2 pr-4">{item.activity_value} {item.input_unit}</td>
                <td className="py-2 pr-4">{item.emission_factor}</td>
                <td className="py-2 pr-4">{item.result_tonnes.toFixed(3)}</td>
                <td className="py-2 pr-4">
                  {item.period_type === 'Monthly' && `M${item.period_month}/${item.period_year}`}
                  {item.period_type === 'Quarterly' && `Q${item.period_quarter}/${item.period_year}`}
                  {item.period_type === 'Yearly' && `${item.period_year}`}
                </td>
                <td className="py-2 pr-4">{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {history.length === 0 && (
          <p className="text-gray-500 text-sm mt-4">No calculations yet.</p>
        )}
      </div>
    </div>
  );
}

export default Calculator;
