'use client';
// components/HubChart/HubChart.jsx
// Bar chart: shipment_count per hub — uses Recharts
// X-axis renders only hubs returned from API; horizontally scrollable if many hubs

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import s from './HubChart.module.css';

// Color palette cycles if > 4 hubs
const COLORS = ['#1A1A2E', '#F5B700', '#0EA5E9', '#22C55E', '#F97316', '#818CF8'];

// Custom tooltip card
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A1A2E', color: '#fff',
      borderRadius: 10, padding: '10px 16px',
      fontSize: 13, fontFamily: 'var(--font-head)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent-yellow)' }}>
        {payload[0].value} shipment{payload[0].value !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function HubChart({ data = [], loading = false }) {
  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.title}>Deliveries per Hub</div>
        <div className={s.legend}>
          <span className={s.legendDot}>
            <span className={s.dot} style={{ background: '#1A1A2E' }} />
            Shipments
          </span>
          <span className={s.legendDot}>
            <span className={s.dot} style={{ background: '#F5B700' }} />
            Hub total
          </span>
        </div>
      </div>

      {loading ? (
        <div className={s.skeleton} />
      ) : data.length === 0 ? (
        <div className={s.empty}>No hub data available</div>
      ) : (
        /* Overflow-x scroll so many hubs don't squish — min 60px per bar */
        <div
          className={s.chartArea}
          style={{ overflowX: data.length > 6 ? 'auto' : 'hidden' }}
        >
          <ResponsiveContainer
            width={Math.max(data.length * 80, 300)}
            height={220}
          >
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid vertical={false} stroke="var(--border-light)" strokeDasharray="4 4" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
              <Bar dataKey="shipment_count" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}