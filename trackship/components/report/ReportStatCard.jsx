// components/report/ReportStatCard.jsx
'use client';
import styles from './ReportStatCard.module.css';

// SVG outline icon for Revenue (currency / coins)
const RevenueIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9.5C9 8.12 10.34 7 12 7s3 1.12 3 2.5c0 1.38-1.34 2.5-3 2.5S9 13.38 9 14.5C9 15.88 10.34 17 12 17s3-1.12 3-2.5" />
  </svg>
);

// SVG outline icon for Shipments (parcel / box)
const PackageIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="M3.29 7 12 12l8.71-5M12 22V12" />
    <path d="M7.5 4.27 12 7l4.5-2.73" />
  </svg>
);

// Map label → icon component
function CardIcon({ label, accent }) {
  const isRevenue = label?.toLowerCase().includes('revenue');
  return isRevenue
    ? <RevenueIcon color={accent} />
    : <PackageIcon color={accent} />;
}

export default function ReportStatCard({ icon, label, value, delta, sub, accent, loading }) {
  if (loading) return <div className={styles.skeleton} />;

  const isPositive = delta == null ? null : delta >= 0;
  const isShipment = label?.toLowerCase().includes('shipment') || label?.toLowerCase().includes('deliver');

  return (
    <div
      className={`${styles.card} ${isShipment ? styles.cardParcel : ''}`}
      style={{ '--acc': accent }}
    >
      {/* Parcel watermark — only on shipment card */}
      {isShipment && (
        <div className={styles.parcelBg} aria-hidden="true" />
      )}

      <div className={styles.accentBar} />
      <div className={styles.top}>
        <div className={styles.iconWrap}>
          <CardIcon label={label} accent={accent} />
        </div>
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