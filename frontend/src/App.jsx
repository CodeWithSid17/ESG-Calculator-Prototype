// App.jsx
// Root component. Adds simple tab navigation between the three views:
// Calculator, Dashboard, and Company Benchmark.

import { useState } from 'react';
import Calculator from './components/Calculator';
import Dashboard from './components/Dashboard';
import CompanyBenchmark from './components/CompanyBenchmark';

const TABS = [
  { key: 'calculator', label: 'Calculator' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'benchmark', label: 'Company Benchmark' },
];

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4">

      {/* ---------- Title ---------- */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">ESG Calculator Prototype</h1>
      <p className="text-sm text-gray-500 mb-6">Scope 1 / Scope 2 / Scope 3 emissions calculator & dashboard demo</p>

      {/* ---------- Tab bar ---------- */}
      <div className="flex gap-2 mb-8 bg-white shadow rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------- Active tab content ---------- */}
      {activeTab === 'calculator' && <Calculator />}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'benchmark' && <CompanyBenchmark />}
    </div>
  );
}

export default App;
