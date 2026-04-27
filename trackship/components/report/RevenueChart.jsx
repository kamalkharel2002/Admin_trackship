// components/report/RevenueChart.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { getMonthlyRevenueGraph } from '@/lib/api';
import styles from './RevenueChart.module.css';

const NOW          = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

/**
 * Backend shape:
 * { success, data: { labels: string[], datasets: [{ label, data: number[] }] } }
 * Transform → [{ month: 'Jan', revenue: 0 }, ...]
 */
function transform(res) {
  const labels   = res?.data?.labels              ?? [];
  const revenues = res?.data?.datasets?.[0]?.data ?? [];
  return labels.map((month, i) => ({ month, revenue: revenues[i] ?? 0 }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.ttMonth}>{label}</p>
      <p className={styles.ttRevenue}>Nu {(payload[0]?.value ?? 0).toLocaleString()}</p>
    </div>
  );
};

export default function RevenueChart() {
  const [year,      setYear]      = useState(CURRENT_YEAR);
  const [chartData, setChartData] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback((yr) => {
    setLoading(true);
    setError(null);
    getMonthlyRevenueGraph({ year: yr })
      .then((res) => setChartData(transform(res)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(year); }, [year, load]);

  // derive quick stats from chart data
  const total   = chartData.reduce((s, d) => s + d.revenue, 0);
  const peak    = chartData.reduce((p, d) => d.revenue > p.revenue ? d : p, { month: '—', revenue: 0 });
  const avg     = chartData.length ? total / chartData.length : 0;
  const fmtN    = (n) => n >= 1000 ? `Nu ${(n / 1000).toFixed(1)}k` : `Nu ${n.toLocaleString()}`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Revenue Overview</h3>
          <p className={styles.sub}>Monthly breakdown · {year}</p>
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

      {/* Derived summary pills */}
      {!loading && !error && (
        <div className={styles.pills}>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>Annual Total</span>
            <span className={styles.pillVal}>{fmtN(total)}</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>Monthly Avg</span>
            <span className={styles.pillVal}>{fmtN(avg)}</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>Peak Month</span>
            <span className={styles.pillVal}>{peak.month}</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>Peak Revenue</span>
            <span className={styles.pillVal}>{fmtN(peak.revenue)}</span>
          </div>
        </div>
      )}

      {loading && <div className={styles.chartSkel} />}

      {!loading && error && (
        <div className={styles.errorBox}>⚠ Could not load chart — {error}</div>
      )}

      {!loading && !error && (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F5B700" stopOpacity={0.28} />
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
              width={42}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#F5B700', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#F5B700"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#F5B700', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}