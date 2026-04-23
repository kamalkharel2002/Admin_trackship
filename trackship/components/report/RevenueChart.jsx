// components/report/RevenueChart.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { getMonthlyRevenueGraph } from '@/lib/api';
import styles from './RevenueChart.module.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS  = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

// Format backend: { labels: ['Jan',...], datasets: [{ data: [num,...] }] }
// → recharts-friendly: [{ month, revenue }, ...]
function transformGraphData(backendData) {
  const labels   = backendData?.labels   ?? [];
  const revenues = backendData?.datasets?.[0]?.data ?? [];
  return labels.map((month, i) => ({
    month,
    revenue: revenues[i] ?? 0,
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.ttMonth}>{label}</p>
      <p className={styles.ttRevenue}>
        Nu {(payload[0]?.value ?? 0).toLocaleString()}
      </p>
    </div>
  );
};

function SummaryPill({ label, value }) {
  return (
    <div className={styles.pill}>
      <span className={styles.pillLabel}>{label}</span>
      <span className={styles.pillVal}>{value}</span>
    </div>
  );
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function RevenueChart() {
  const [year,    setYear]    = useState(CURRENT_YEAR);
  const [chartData, setChartData] = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback((yr) => {
    setLoading(true);
    setError(null);
    getMonthlyRevenueGraph({ year: yr })
      .then((res) => {
        setChartData(transformGraphData(res.data));
        setSummary(res.summary ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(year); }, [year, load]);

  const fmtCurrency = (n) =>
    n >= 1_000_000
      ? `Nu ${(n / 1_000_000).toFixed(2)}M`
      : `Nu ${(n / 1000).toFixed(1)}k`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Revenue Overview</h3>
          <p className={styles.sub}>Monthly breakdown for {year}</p>
        </div>
        <div className={styles.yearTabs}>
          {YEAR_OPTIONS.map((y) => (
            <button
              key={y}
              className={`${styles.yearTab} ${year === y ? styles.active : ''}`}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills from backend /summary */}
      {summary && !loading && (
        <div className={styles.pills}>
          <SummaryPill label="Annual Total"   value={fmtCurrency(summary.total_annual_revenue)} />
          <SummaryPill label="Monthly Avg"    value={fmtCurrency(summary.average_monthly_revenue)} />
          <SummaryPill label="Peak Month"     value={MONTHS_SHORT[(summary.highest_month ?? 1) - 1]} />
          <SummaryPill label="Peak Revenue"   value={fmtCurrency(summary.highest_revenue)} />
        </div>
      )}

      {loading && <div className={styles.chartSkel} />}

      {!loading && error && (
        <div className={styles.errorBox}>
          <span>⚠</span> Could not load chart data. {error}
        </div>
      )}

      {!loading && !error && (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F5B700" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F5B700" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#94A3B8', fontFamily: 'var(--font-body)' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'var(--font-body)' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F5B700', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#F5B700"
              strokeWidth={2.5}
              fill="url(#revGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#F5B700', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}