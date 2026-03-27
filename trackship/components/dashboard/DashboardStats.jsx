'use client';
import styles from './DashboardStats.module.css';

const STATS_CONFIG = [
  { key: 'total_shipments',    label: 'Total Shipments',  icon: '📦', color: 'blue'  },
  { key: 'delivered_shipments',label: 'Delivered',         icon: '✅', color: 'green' },
  { key: 'active_drivers',     label: 'Active Drivers',    icon: '🚛', color: 'cyan'  },
  { key: 'success_rate',       label: 'Success Rate',      icon: '📈', color: 'amber' },
];

function formatValue(key, val) {
  if (val === null || val === undefined) return '—';
  if (key === 'success_rate') {
    const n = parseFloat(val);
    // Backend may return "NaN" as a string; show a safe value.
    return isNaN(n) ? '0.0%' : `${n.toFixed(1)}%`;
  }
  return String(val);
}

export default function DashboardStats({ summary, loading }) {
  return (
    <div className={styles.grid}>
      {STATS_CONFIG.map((s, i) => (
        <div key={s.key} className={`${styles.card} card card-hover animate-fade-in a${i + 1}`}>
          <div className={styles.top}>
            <div className={`${styles.icon} ${styles[s.color]}`}>{s.icon}</div>
            <span className={`badge badge-neutral ${styles.tag}`}>All time</span>
          </div>
          <div className={styles.val}>
            {loading
              ? <span className={`skeleton ${styles.skeleton}`} />
              : formatValue(s.key, summary?.[s.key])}
          </div>
          <div className={styles.lbl}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}