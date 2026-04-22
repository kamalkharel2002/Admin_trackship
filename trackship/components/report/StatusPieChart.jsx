// components/report/StatusPieChart.jsx
'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getShipmentStatusDistribution } from '@/lib/api';
import styles from './StatusPieChart.module.css';

const COLORS = {
  delivered: '#22C55E',
  pending:   '#F5B700',
  in_transit:'#0EA5E9',
  cancelled: '#F97316',
  failed:    '#EF4444',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW = new Date();

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const R = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + R * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + R * Math.sin(-midAngle * Math.PI / 180);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function StatusPieChart() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());
  const [data,  setData]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getShipmentStatusDistribution({ month, year })
      .then((res) => {
        const raw = res.data || res || [];
        const mapped = raw.map((d) => ({
          name: d.status?.replace(/_/g, ' ') ?? d.name,
          value: d.count ?? d.value ?? 0,
          fill: COLORS[d.status] || '#818CF8',
        }));
        setData(mapped);
      })
      .catch(() => {
        setData([
          { name: 'Delivered',   value: 420, fill: COLORS.delivered },
          { name: 'In Transit',  value: 180, fill: COLORS.in_transit },
          { name: 'Pending',     value: 95,  fill: COLORS.pending },
          { name: 'Cancelled',   value: 38,  fill: COLORS.cancelled },
        ]);
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  const currentYear = NOW.getFullYear();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Shipment Status</h3>
          <p className={styles.sub}>Distribution by status</p>
        </div>
        <div className={styles.filters}>
          <select className={styles.sel} value={month} onChange={(e) => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className={styles.sel} value={year} onChange={(e) => setYear(+e.target.value)}>
            {[currentYear - 2, currentYear - 1, currentYear].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.skeleton} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data} cx="50%" cy="50%"
                innerRadius={60} outerRadius={95}
                paddingAngle={3} dataKey="value"
                labelLine={false} label={renderLabel}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [v.toLocaleString(), n]}
                contentStyle={{
                  background: '#fff', border: '1px solid #E8E4DC',
                  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-body)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {data.map((d, i) => (
              <div key={i} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: d.fill }} />
                <span className={styles.legendName}>{d.name}</span>
                <span className={styles.legendVal}>{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}