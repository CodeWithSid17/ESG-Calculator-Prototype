import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { getCompanies, getDashboardData } from "../api";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/*  A quiet "emissions ledger" palette — deep pine ink on soft paper,  */
/*  with the three scopes read as moss / sage / amber, low to high.   */
/* ------------------------------------------------------------------ */

const TOKENS = {
  ink: "#16231F",
  inkSoft: "#3F4B47",
  paper: "#F7F6F1",
  card: "#FFFFFF",
  hairline: "#E3E1D8",
  moss: "#33604F",
  sage: "#8FB6A4",
  amber: "#C3893D",
  muted: "#8A8E87",
};

const SCOPE_COLORS = {
  "Scope 1": TOKENS.moss,
  "Scope 2": TOKENS.sage,
  "Scope 3": TOKENS.amber,
};

const SCOPE_DESCRIPTIONS = {
  "Scope 1": "Direct emissions the company creates itself — vehicles, on-site fuel, refrigerant leaks.",
  "Scope 2": "Indirect emissions from purchased electricity, heating, or cooling the company consumes.",
  "Scope 3": "All other value-chain emissions — suppliers, business travel, shipping, product use.",
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const numberFmt = (n) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n);

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span
        className="text-[11px] font-medium tracking-[0.08em] uppercase"
        style={{ color: TOKENS.muted }}
      >
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="appearance-none rounded-md border bg-white pl-3 pr-8 py-2 text-sm font-medium
                     focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors"
          style={{
            borderColor: TOKENS.hairline,
            color: TOKENS.ink,
            ["--tw-ring-color"]: TOKENS.moss,
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          width="10" height="6" viewBox="0 0 10 6" fill="none"
        >
          <path d="M1 1L5 5L9 1" stroke={TOKENS.muted} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </label>
  );
}

function ChartCard({ title, caption, note, children }) {
  return (
    <div
      className="rounded-xl bg-white p-5 sm:p-6"
      style={{ border: `1px solid ${TOKENS.hairline}` }}
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold tracking-[0.04em] uppercase" style={{ color: TOKENS.inkSoft }}>
          {title}
        </h3>
        {caption && (
          <span className="text-xs" style={{ color: TOKENS.muted }}>
            {caption}
          </span>
        )}
      </div>
      {note && (
        <p className="mb-4 text-xs leading-snug" style={{ color: TOKENS.muted }}>
          {note}
        </p>
      )}
      {children}
    </div>
  );
}

function TooltipShell({ active, payload, label, unit = "tCO2e" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ background: TOKENS.ink, color: TOKENS.paper }}
    >
      {label && <div className="mb-1 font-medium opacity-70">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="tabular-nums font-medium">
            {numberFmt(p.value)} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Signature element: a horizontal "ledger bar" showing the three
   scopes as proportioned segments, like a measurement strip rather
   than a pie of KPI cards. */
function ScopeLedgerBar({ breakdown }) {
  const total = breakdown.reduce((sum, s) => sum + s.total_tco2e, 0) || 1;
  return (
    <div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        style={{ background: TOKENS.paper }}
      >
        {breakdown.map((s) => (
          <div
            key={s.scope}
            style={{
              width: `${(s.total_tco2e / total) * 100}%`,
              background: SCOPE_COLORS[s.scope] || TOKENS.muted,
            }}
            title={`${s.scope}: ${numberFmt(s.total_tco2e)} tCO2e`}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {breakdown.map((s) => (
          <div key={s.scope} className="flex items-start gap-2.5">
            <span
              className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: SCOPE_COLORS[s.scope] || TOKENS.muted }}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span style={{ color: TOKENS.ink }} className="font-semibold">
                  {s.scope}
                </span>
                <span style={{ color: TOKENS.muted }} className="tabular-nums">
                  {numberFmt(s.total_tco2e)} t · {((s.total_tco2e / total) * 100).toFixed(0)}%
                </span>
              </div>
              {SCOPE_DESCRIPTIONS[s.scope] && (
                <p className="mt-0.5 text-xs leading-snug" style={{ color: TOKENS.muted }}>
                  {SCOPE_DESCRIPTIONS[s.scope]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScopeGlossary({ scopes }) {
  return (
    <div className="mt-4 flex flex-col gap-2.5" style={{ borderTop: `1px solid ${TOKENS.hairline}`, paddingTop: "14px" }}>
      {scopes.map((scope) => (
        <div key={scope} className="flex items-start gap-2.5">
          <span
            className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: SCOPE_COLORS[scope] || TOKENS.muted }}
          />
          <p className="text-xs leading-snug">
            <span style={{ color: TOKENS.ink }} className="font-semibold">
              {scope}:{" "}
            </span>
            <span style={{ color: TOKENS.muted }}>{SCOPE_DESCRIPTIONS[scope]}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function StatBlock({ label, value, unit, delta }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: TOKENS.muted }}>
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: TOKENS.ink, fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs" style={{ color: TOKENS.muted }}>
            {unit}
          </span>
        )}
      </div>
      {delta != null && (
        <span
          className="text-xs font-medium"
          style={{ color: delta <= 0 ? TOKENS.moss : TOKENS.amber }}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {numberFmt(Math.abs(delta))}% vs prior year
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

function Dashboard() {
  const [companies, setCompanies] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await getCompanies();
        setCompanies(res.data);
        if (res.data.length > 0) {
          setSelectedCompany(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;

    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await getDashboardData(selectedYear || undefined, selectedCompany);
        setDashboard(res.data);
        if (!selectedYear && res.data.selected_year) {
          setSelectedYear(res.data.selected_year);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [selectedCompany, selectedYear]);

  const monthlyChartData = useMemo(() => {
    if (!dashboard) return [];
    return MONTH_LABELS.map((label, index) => {
      const month = index + 1;
      const found = (dashboard.monthly || []).find((m) => m.period_month === month);
      return { month: label, total_tco2e: found ? Number(found.total_tco2e.toFixed(3)) : 0 };
    });
  }, [dashboard]);

  const quarterlyChartData = useMemo(() => {
    if (!dashboard) return [];
    return [1, 2, 3, 4].map((quarter) => {
      const found = (dashboard.quarterly || []).find((q) => q.period_quarter === quarter);
      return { quarter: `Q${quarter}`, total_tco2e: found ? Number(found.total_tco2e.toFixed(3)) : 0 };
    });
  }, [dashboard]);

  const yearlyChartData = useMemo(() => {
    if (!dashboard) return [];
    return (dashboard.yearly || []).map((item) => ({
      year: item.period_year,
      total_tco2e: Number(item.total_tco2e.toFixed(3)),
      average_tco2e: Number(item.average_tco2e.toFixed(3)),
    }));
  }, [dashboard]);

  const currentYearTotal = useMemo(() => {
    const match = yearlyChartData.find((y) => y.year === Number(selectedYear));
    return match ? match.total_tco2e : null;
  }, [yearlyChartData, selectedYear]);

  const yoyDelta = useMemo(() => {
    const idx = yearlyChartData.findIndex((y) => y.year === Number(selectedYear));
    if (idx <= 0) return null;
    const prev = yearlyChartData[idx - 1].total_tco2e;
    const cur = yearlyChartData[idx].total_tco2e;
    if (!prev) return null;
    return ((cur - prev) / prev) * 100;
  }, [yearlyChartData, selectedYear]);

  if (loading || !dashboard) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3"
        style={{ background: TOKENS.paper }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: TOKENS.hairline, borderTopColor: TOKENS.moss }}
        />
        <p className="text-sm" style={{ color: TOKENS.muted }}>
          Loading dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: TOKENS.paper }}>
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className="mb-1.5 text-[11px] font-medium tracking-[0.14em] uppercase"
              style={{ color: TOKENS.moss }}
            >
              Emissions ledger
            </p>
            <h1
              className="text-[28px] font-semibold leading-tight sm:text-3xl"
              style={{ color: TOKENS.ink }}
            >
              {dashboard.company?.name || "ESG Dashboard"}
            </h1>
            <p className="mt-1 text-sm" style={{ color: TOKENS.muted }}>
              {dashboard.company?.sector}
              {dashboard.company?.sector && " · "}
              Reporting year {dashboard.company?.reporting_year}
            </p>
          </div>

          <div className="flex gap-3">
            <FieldSelect
              label="Company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(Number(e.target.value))}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FieldSelect
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={yearlyChartData.map((y) => ({ value: y.year, label: String(y.year) }))}
            />
          </div>
        </div>

        {/* Ledger summary strip — the signature element */}
        <div
          className="mb-8 rounded-xl bg-white p-6"
          style={{ border: `1px solid ${TOKENS.hairline}` }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <StatBlock
                label={`Total emissions, ${selectedYear}`}
                value={currentYearTotal != null ? numberFmt(currentYearTotal) : "—"}
                unit="tCO2e"
                delta={yoyDelta}
              />
              {yearlyChartData.find((y) => y.year === Number(selectedYear)) && (
                <StatBlock
                  label="Monthly average"
                  value={numberFmt(
                    yearlyChartData.find((y) => y.year === Number(selectedYear)).average_tco2e
                  )}
                  unit="tCO2e / mo"
                />
              )}
            </div>

            <div className="lg:w-[420px]">
              <p
                className="mb-2 text-[11px] font-medium tracking-[0.08em] uppercase"
                style={{ color: TOKENS.muted }}
              >
                Scope breakdown
              </p>
              <ScopeLedgerBar breakdown={dashboard.scope_breakdown || []} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <ChartCard
            title="Scope composition"
            caption={String(selectedYear)}
            note="How this year's total emissions split across the three scopes."
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dashboard.scope_breakdown || []}
                  dataKey="total_tco2e"
                  nameKey="scope"
                  innerRadius={64}
                  outerRadius={98}
                  paddingAngle={2}
                  stroke={TOKENS.card}
                  strokeWidth={2}
                >
                  {(dashboard.scope_breakdown || []).map((item) => (
                    <Cell key={item.scope} fill={SCOPE_COLORS[item.scope] || TOKENS.muted} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipShell />} />
              </PieChart>
            </ResponsiveContainer>
            <ScopeGlossary scopes={(dashboard.scope_breakdown || []).map((s) => s.scope)} />
          </ChartCard>

          <ChartCard
            title="Average emissions by year"
            note="Average monthly emissions for each reporting year — useful for spotting long-term trends regardless of how many months of data exist per year."
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearlyChartData} barCategoryGap="32%">
                <CartesianGrid stroke={TOKENS.hairline} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: TOKENS.muted, fontSize: 12 }} axisLine={{ stroke: TOKENS.hairline }} tickLine={false} />
                <YAxis tick={{ fill: TOKENS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipShell unit="tCO2e/mo" />} cursor={{ fill: TOKENS.paper }} />
                <Bar dataKey="average_tco2e" fill={TOKENS.moss} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Monthly trend"
            caption={String(selectedYear)}
            note="Total emissions by month for the selected year — helps spot seasonal spikes or drops."
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid stroke={TOKENS.hairline} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: TOKENS.muted, fontSize: 12 }} axisLine={{ stroke: TOKENS.hairline }} tickLine={false} />
                <YAxis tick={{ fill: TOKENS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipShell />} cursor={{ stroke: TOKENS.hairline }} />
                <Line
                  type="monotone"
                  dataKey="total_tco2e"
                  stroke={TOKENS.moss}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: TOKENS.moss, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Quarterly trend"
            caption={String(selectedYear)}
            note="Total emissions grouped by quarter — a smoother view than monthly for comparing periods."
          >
           
           
          </ChartCard>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
