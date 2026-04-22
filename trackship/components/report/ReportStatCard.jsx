// components/report/ReportStatCard.jsx
'use client';
import styles from './ReportStatCard.module.css';

export default function ReportStatCard({ icon, label, value, delta, deltaLabel, accent }) {
  const isPositive = delta >= 0;

  return (
    <div className={styles.card} style={{ '--card-accent': accent }}>
      <div className={styles.top}>
        <div className={styles.iconWrap}>{icon}</div>
        <span className={`${styles.delta} ${isPositive ? styles.up : styles.down}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          <span className={styles.deltaLabel}> {deltaLabel}</span>
        </span>
      </div>
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
      <div className={styles.bar} />
    </div>
  );
}