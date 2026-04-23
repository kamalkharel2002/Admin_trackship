// components/report/StatusPieChart.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getShipmentStatusDistribution } from '@/lib/api';
import styles from './StatusPieChart.module.css';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();

// Transform backend { labels[], datasets[{ data[], backgroundColor[] }] }
// → [{ name, value, color }]
function transformPieData(backendData) {
  const labels = backendData?.labels ?? [];
  const values = backendData?.datasets?.[0]?.data ?? [];
  const colors = backendData?.datasets?.[0]?.backgroundColor ?? [];
  return labels.map((name, i) => ({
    name,
    value: values[i] ?? 0,
    color: colors[i] ?? '#94A3B8',
  })).filter((d) => d.value > 0);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className={styles.tooltip}>
      <span className={styles.ttDot} style={{ background: d.payload.color }} />
      <span className={styles.ttName}>{d.name}</span>
      <strong className={styles.ttVal}>{d.value.toLocaleString()}</strong>
    </div>
  );
};

export default function StatusPieChart() {
  const [month,   setMonth]   = useState(NOW.getMonth() + 1);
  const [year,    setYear]    = useState(CURRENT_YEAR);
  const [data,    setData]    = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback((m, y) => {
    setLoading(true);
    setError(null);
    getShipmentStatusDistribution({ month: m, year: y })
      .then((res) => {
        setData(transformPieData(res.data));
        setSummary(res.summary ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(month, year); }, [month, year, load]);

  const total = summary?.total_shipments ?? data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Shipment Status</h3>
          <p className={styles.sub}>{MONTHS_SHORT[month - 1]} {year}</p>
        </div>
        <div className={styles.filters}>
          <select
            className={styles.sel}
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className={styles.sel}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className={styles.skel} />}

      {!loading && error && (
        <div className={styles.errorBox}>⚠ {error}</div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className={styles.errorBox}>No data for this period.</div>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          {/* Donut chart with centre total */}
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={58} outerRadius={88}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className={styles.centre}>
              <span className={styles.centreNum}>{total.toLocaleString()}</span>
              <span className={styles.centreLabel}>Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {data.map((d, i) => {
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={i} className={styles.legendRow}>
                  <span className={styles.dot} style={{ background: d.color }} />
                  <span className={styles.legName}>{d.name}</span>
                  <span className={styles.legPct}>{pct}%</span>
                  <span className={styles.legCount}>{d.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          {/* Conversion summary from backend */}
          {summary?.conversion_rate && (
            <div className={styles.convRow}>
              <div className={styles.convItem}>
                <span className={styles.convDot} style={{ background: '#22C55E' }} />
                <span className={styles.convLabel}>Delivered</span>
                <strong>{summary.conversion_rate.to_delivered}</strong>
              </div>
              <div className={styles.convItem}>
                <span className={styles.convDot} style={{ background: '#9C27B0' }} />
                <span className={styles.convLabel}>Cancelled</span>
                <strong>{summary.conversion_rate.cancellation_rate}</strong>
              </div>
              <div className={styles.convItem}>
                <span className={styles.convDot} style={{ background: '#F44336' }} />
                <span className={styles.convLabel}>Rejected</span>
                <strong>{summary.conversion_rate.rejection_rate}</strong>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}