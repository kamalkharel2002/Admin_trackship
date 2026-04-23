// components/report/ReportStatCard.jsx
'use client';
import styles from './ReportStatCard.module.css';

/**
 * @param {object} props
 * @param {string}  props.icon        - emoji or svg string
 * @param {string}  props.label       - card title
 * @param {string}  props.value       - formatted main number
 * @param {number|null} props.delta   - % vs last month (null = no comparison)
 * @param {string}  props.sub         - secondary line below value
 * @param {string}  props.accent      - CSS color var
 * @param {boolean} props.loading
 */
export default function ReportStatCard({ icon, label, value, delta, sub, accent, loading }) {
  if (loading) return <div className={styles.skeleton} />;

  const isPositive = delta === null ? null : delta >= 0;

  return (
    <div className={styles.card} style={{ '--acc': accent }}>
      <div className={styles.accentBar} />
      <div className={styles.top}>
        <div className={styles.iconWrap}>{icon}</div>
        {delta !== null && delta !== undefined && (
          <span className={`${styles.delta} ${isPositive ? styles.up : styles.down}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className={styles.value}>{value ?? '—'}</p>
      <p className={styles.label}>{label}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}