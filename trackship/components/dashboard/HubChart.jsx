'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import styles from './HubChart.module.css';

const BAR_COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function HubChart({ data, loading, filtered, date }) {
  const chartData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map((h) => ({
      hub_id: h.hub_id ?? h.id ?? h.hubId,
      name: String(h.name ?? `Hub ${h.hub_id ?? ''}`),
      shipment_count: (() => {
        const n = Number(h.shipment_count ?? 0);
        return Number.isFinite(n) ? n : 0;
      })(),
    }));
  }, [data]);

  const subtitle = filtered ? date || 'Filtered' : 'All shipments distributed by hub';

  const maxY = useMemo(() => {
    const max = Math.max(1, ...chartData.map((d) => d.shipment_count || 0));
    return max;
  }, [chartData]);

  return (
    <div className={`card ${styles.wrap}`}>
      <div className={styles.header}>
        <div>
          <div className={`font-h font-700 ${styles.title}`}>Total Deliveries per Hub</div>
          <div className={`text-sm text-muted ${styles.sub}`}>{subtitle}</div>
        </div>

        {/* Small, non-blocking legend so the chart stays readable with many hubs */}
        <div className={styles.legend}>
          {chartData.slice(0, 6).map((h, i) => (
            <span key={h.hub_id ?? h.name} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
              {h.name}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading chart data…</div>
      ) : chartData.length === 0 ? (
        <div className={styles.loader}>No hub data available</div>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -8, bottom: 26 }}>
              <CartesianGrid stroke="rgba(203,213,225,0.5)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={70}
              />
              <YAxis
                domain={[0, maxY]}
                tick={{ fontSize: 11 }}
                width={36}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid var(--border)' }}
                formatter={(v) => {
                  const n = Number(v);
                  const safe = Number.isFinite(n) ? n : 0;
                  return [safe.toString(), 'Deliveries'];
                }}
              />
              <Bar
                dataKey="shipment_count"
                isAnimationActive
                animationDuration={900}
                animationEasing="cubic-bezier(0.34,1.56,0.64,1)"
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.hub_id ?? entry.name} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

