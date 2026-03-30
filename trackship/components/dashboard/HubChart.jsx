'use client';
// components/HubChart/HubChart.jsx
// Fully responsive bar chart — scales bar width & height by hub count
// ≤6 hubs → fills container with ResponsiveContainer 100%
// >6 hubs → horizontally scrollable with comfortable fixed bar widths

import { useRef, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import s from './HubChart.module.css';

const COLORS = ['#1A1A2E', '#F5B700', '#0EA5E9', '#22C55E', '#F97316', '#818CF8'];

// Bar size + chart height scale by hub count
function getSizing(count) {
  if (count <= 3)  return { barSize: 52, chartH: 260 };
  if (count <= 5)  return { barSize: 44, chartH: 260 };
  if (count <= 8)  return { barSize: 32, chartH: 280 };
  if (count <= 12) return { barSize: 24, chartH: 300 };
  return             { barSize: 18, chartH: 320 };
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

  // Watch container width so we know when to enable scroll
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const count = data.length;
  const { barSize, chartH } = getSizing(count);

  // Min comfortable px needed for all bars
  const minNeeded = count * (barSize + 28) + 60;
  const needsScroll = containerW > 0 && minNeeded > containerW;

  return (
    <div className={s.wrap} ref={wrapRef}>

      {/* ── Header ── */}
      <div className={s.header}>
        <div className={s.title}>Deliveries per Hub</div>
        <div className={s.legend}>
          {/* Show up to 3 named legend dots then a "+N more" */}
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

      {/* ── Chart body ── */}
      {loading ? (
        <div className={s.skeleton} />
      ) : count === 0 ? (
        <div className={s.empty}>No hub data available</div>
      ) : (
        <div
          className={s.chartArea}
          style={{
            overflowX: needsScroll ? 'auto' : 'hidden',
            height: chartH,
          }}
        >
          {/*
            Inner wrapper width:
            - needsScroll → fixed px so bars have room
            - fits        → 100% so Recharts expands to fill card
          */}
          <div style={{
            width: needsScroll ? minNeeded : '100%',
            height: chartH,
          }}>
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart
                data={data}
                margin={{ top: 12, right: 16, left: -16, bottom: count > 8 ? 48 : 8 }}
                barSize={barSize}
                barCategoryGap={count > 8 ? '20%' : '28%'}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border-light)"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: count > 10 ? 10 : 12,
                    fill: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={count > 8 ? -35 : 0}
                  textAnchor={count > 8 ? 'end' : 'middle'}
                  height={count > 8 ? 50 : 28}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
                />
                <Bar dataKey="shipment_count" radius={[6, 6, 0, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Footer: hub count + scroll hint ── */}
      {count > 0 && !loading && (
        <div className={s.footer}>
          {needsScroll && (
            <span className={s.scrollHint}>scroll to see all →</span>
          )}
        </div>
      )}
    </div>
  );
}