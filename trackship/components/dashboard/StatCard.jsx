'use client';
// components/StatCard/StatCard.jsx
// Reusable metric card — hero variant gets dark gradient background

import s from './StatCard.module.css';

export default function StatCard({
  icon,          // ReactNode — Lucide icon element
  label,         // string — e.g. "Total Shipments"
  value,         // string | number
  sub,           // optional subtitle line
  trend,         // optional { dir: 'up'|'down'|'neutral', text: '+12%' }
  hero = false,  // true → dark gradient style (first card)
  blobColor,     // CSS color for decorative blob
  iconBg,        // background of icon wrapper
}) {
  return (
    <div
      className={`${s.card} ${hero ? s.hero : ''}`}
      style={{ '--blob-color': blobColor }}
    >
      {icon && (
        <div className={s.iconWrap} style={{ background: iconBg ?? 'var(--cream)' }}>
          {icon}
        </div>
      )}
      <div className={s.label}>{label}</div>
      <div className={s.value}>{value ?? '—'}</div>
      {sub && <div className={s.sub}>{sub}</div>}
      {trend && (
        <span className={`${s.trend} ${s[trend.dir ?? 'neutral']}`}>
          {trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '•'} {trend.text}
        </span>
      )}
    </div>
  );
}