// components/report/ReportStatCard.jsx
'use client';
import styles from './ReportStatCard.module.css';

export default function ReportStatCard({ icon, label, value, delta, sub, accent, loading }) {
  if (loading) return <div className={styles.skeleton} />;

  const isPositive = delta == null ? null : delta >= 0;

  return (
    <div className={styles.card} style={{ '--acc': accent }}>
      <div className={styles.accentBar} />
      <div className={styles.top}>
        <div className={styles.iconWrap}>{icon}</div>
        {delta != null && (
          <span className={`${styles.delta} ${isPositive ? styles.up : styles.down}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className={styles.value}>{value ?? '—'}</p>
      <p className={styles.label}>{label}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
      {/* decorative blob */}
      <div className={styles.blob} />
    </div>
  );
}