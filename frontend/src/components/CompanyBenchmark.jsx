// CompanyBenchmark.jsx
// Displays the seeded sample Indian companies with a Scope 1/Scope 2/Scope 3
// comparison chart and table - useful for demoing "how does our company
// compare" style benchmarking.

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getCompanies } from '../api';

function CompanyBenchmark() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    getCompanies().then((res) => setCompanies(res.data)).catch(console.error);
  }, []);

  // Convert tCO2e into thousands (kt CO2e) purely so the chart bars are readable
  // next to each other (raw values range from ~10K to ~40M).
  const chartData = companies.map((c) => ({
    name: c.name.replace(' Ltd', ''),
    'Scope 1': Number((c.scope1_tco2e / 1000).toFixed(1)),
    'Scope 2': Number((c.scope2_tco2e / 1000).toFixed(1)),
    'Scope 3': c.scope3_tco2e ? Number((c.scope3_tco2e / 1000).toFixed(1)) : 0,
  }));

  return (
    <div className="w-full max-w-5xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Company Benchmark (Sample Data)</h2>
      <p className="text-xs text-gray-500 mb-4">
        Illustrative sample figures for demo purposes only — not verified official disclosures.
      </p>

      {/* ---------- Chart ---------- */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Scope 1 / 2 / 3 Comparison (kt CO2e)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `${value} kt CO2e`} />
            <Legend />
            <Bar dataKey="Scope 1" fill="#2563eb" />
            <Bar dataKey="Scope 2" fill="#0ea5e9" />
            <Bar dataKey="Scope 3" fill="#93c5fd" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ---------- Table ---------- */}
      <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Sector</th>
              <th className="py-2 pr-4">Year</th>
              <th className="py-2 pr-4">Scope 1 (tCO2e)</th>
              <th className="py-2 pr-4">Scope 2 (tCO2e)</th>
              <th className="py-2 pr-4">Scope 3 (tCO2e)</th>
              <th className="py-2 pr-4">Scope 4 (tCO2e)</th>
              <th className="py-2 pr-4">Scope 5 (tCO2e)</th>
              <th className="py-2 pr-4">Scope 6 (tCO2e)</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">{c.name}</td>
                <td className="py-2 pr-4">{c.sector}</td>
                <td className="py-2 pr-4">{c.reporting_year}</td>
                <td className="py-2 pr-4">{c.scope1_tco2e.toLocaleString()}</td>
                <td className="py-2 pr-4">{c.scope2_tco2e.toLocaleString()}</td>
                <td className="py-2 pr-4">{c.scope3_tco2e ? c.scope3_tco2e.toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompanyBenchmark;
