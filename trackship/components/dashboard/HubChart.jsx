'use client';
// components/HubChart/HubChart.jsx

import { useRef, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import s from './HubChart.module.css';

const COLORS = ['#1A1A2E', '#F5B700', '#0EA5E9', '#22C55E', '#F97316', '#818CF8'];

function getSizing(count) {
  if (count <= 3)  return { barSize: 64, chartH: 460 };
  if (count <= 5)  return { barSize: 56, chartH: 460 };
  if (count <= 8)  return { barSize: 42, chartH: 480 };
  if (count <= 12) return { barSize: 30, chartH: 500 };
  return             { barSize: 22, chartH: 520 };
}

/**
 * Compute nice Y-axis ticks in multiples of 5.
 * e.g. max=7  → [0, 5, 10]
 *      max=23 → [0, 5, 10, 15, 20, 25]
 *      max=60 → [0, 10, 20, 30, 40, 50, 60]  (steps of 10 when range is large)
 */
function getYTicks(data) {
  const max = Math.max(...data.map(d => d.shipment_count ?? 0), 0);
  if (max === 0) return [0, 5, 10];

  // Choose a step size that keeps ticks ≤ 8
  let step = 5;
  if (max > 40)  step = 10;
  if (max > 100) step = 20;
  if (max > 200) step = 50;

  const ceiling = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= ceiling; v += step) ticks.push(v);
  return ticks;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A1A2E', color: '#fff',
      borderRadius: 10, padding: '10px 16px',
      fontSize: 13, fontFamily: 'var(--font-head)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      pointerEvents: 'none',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent-yellow)' }}>
        {payload[0].value} shipment{payload[0].value !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function HubChart({ data = [], loading = false }) {
  const wrapRef = useRef(null);
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const count = data.length;
  const { barSize, chartH } = getSizing(count);
  const minNeeded = count * (barSize + 28) + 60;
  const needsScroll = containerW > 0 && minNeeded > containerW;
  const yTicks = getYTicks(data);

  return (
    <div className={s.wrap} ref={wrapRef}>
      <div className={s.header}>
        <div className={s.title}>Deliveries per Hub</div>
        <div className={s.legend}>
          {data.slice(0, 3).map((hub, i) => (
            <span key={hub.hub_id ?? i} className={s.legendDot}>
              <span className={s.dot} style={{ background: COLORS[i % COLORS.length] }} />
              {hub.name}
            </span>
          ))}
          {count > 3 && (
            <span className={s.legendDot}>
              <span className={s.dot} style={{ background: '#94A3B8' }} />
              +{count - 3} more
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className={s.skeleton} />
      ) : count === 0 ? (
        <div className={s.empty}>No hub data available</div>
      ) : (
        <div
          className={s.chartArea}
          style={{ overflowX: needsScroll ? 'auto' : 'hidden', height: chartH }}
        >
          <div style={{ width: needsScroll ? minNeeded : '100%', height: chartH }}>
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart
                data={data}
                margin={{ top: 12, right: 16, left: -8, bottom: count > 8 ? 48 : 8 }}
                barSize={barSize}
                barCategoryGap={count > 8 ? '20%' : '30%'}
              >
                <CartesianGrid vertical={false} stroke="var(--border-light)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: count > 10 ? 10 : 12, fill: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                  axisLine={false} tickLine={false}
                  interval={0}
                  angle={count > 8 ? -35 : 0}
                  textAnchor={count > 8 ? 'end' : 'middle'}
                  height={count > 8 ? 50 : 28}
                />
                <YAxis
                  allowDecimals={false}
                  ticks={yTicks}                  /* ← multiples of 5, scales with data */
                  domain={[0, yTicks[yTicks.length - 1]]}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  axisLine={false} tickLine={false} width={32}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                <Bar dataKey="shipment_count" radius={[6, 6, 0, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {count > 0 && !loading && (
        <div className={s.footer}>
          {needsScroll && <span className={s.scrollHint}>scroll to see all →</span>}
        </div>
      )}
    </div>
  );
}