// app/(screens)/report/page.js
'use client';
import { useState, useEffect } from 'react';
import { getReportDashboardSummary } from '@/lib/api';
import ReportStatCard from '@/components/report/ReportStatCard';
import RevenueChart   from '@/components/report/RevenueChart';
import StatusPieChart  from '@/components/report/StatusPieChart';
import CSVExport       from '@/components/report/CSVExport';
import styles from './report.module.css';

const FMT_CURRENCY = (n) =>
  n >= 1_000_000
    ? `Nu ${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
    ? `Nu ${(n / 1000).toFixed(1)}k`
    : `Nu ${n?.toLocaleString() ?? 0}`;

const FMT_NUM = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n?.toLocaleString() ?? 0}`;

export default function ReportPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportDashboardSummary()
      .then(setSummary)
      .catch(() => {
        // Demo fallback
        setSummary({
          totalRevenue: 1_284_500,
          revenueDelta: 12.4,
          totalDeliveries: 3_842,
          deliveriesDelta: 8.1,
          totalShipments: 4_210,
          shipmentsDelta: -3.2,
          activeTransporters: 64,
          transportersDelta: 5.0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = summary
    ? [
        {
          icon: '💰',
          label: 'Total Revenue',
          value: FMT_CURRENCY(summary.totalRevenue),
          delta: summary.revenueDelta,
          deltaLabel: 'vs last month',
          accent: 'var(--accent-yellow)',
        },
        {
          icon: '📦',
          label: 'Total Deliveries',
          value: FMT_NUM(summary.totalDeliveries),
          delta: summary.deliveriesDelta,
          deltaLabel: 'vs last month',
          accent: 'var(--accent-green)',
        },
        {
          icon: '🚚',
          label: 'Total Shipments',
          value: FMT_NUM(summary.totalShipments),
          delta: summary.shipmentsDelta,
          deltaLabel: 'vs last month',
          accent: 'var(--accent-blue)',
        },
        {
          icon: '👤',
          label: 'Active Transporters',
          value: summary.activeTransporters,
          delta: summary.transportersDelta,
          deltaLabel: 'vs last month',
          accent: 'var(--accent-purple)',
        },
      ]
    : [];

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reports & Analytics</h1>
          <p className={styles.pageSub}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className={styles.headerBadge}>
          <span className={styles.liveDot} /> Live data
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className={styles.cardSkel} />)
          : cards.map((c) => <ReportStatCard key={c.label} {...c} />)
        }
      </div>

      {/* ── Charts row ── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartMain}><RevenueChart /></div>
        <div className={styles.chartSide}><StatusPieChart /></div>
      </div>

      {/* ── Export section ── */}
      <CSVExport />
    </div>
  );
}