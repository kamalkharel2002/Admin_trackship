// app/(screens)/report/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getTotalRevenue,
  getTotalDeliveredShipments,
  getTransporterCount,
} from '@/lib/api';
import ReportStatCard  from '@/components/report/ReportStatCard';
import RevenueChart    from '@/components/report/RevenueChart';
import StatusPieChart  from '@/components/report/StatusPieChart';
import CSVExport       from '@/components/report/CSVExport';
import styles from './report.module.css';

// ─── Format helpers ────────────────────────────────────────────────────────────
function fmtCurrency(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `Nu ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `Nu ${(n / 1_000).toFixed(1)}k`;
  return `Nu ${n.toLocaleString()}`;
}
function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Month/Year selectors at page level (shared between stat cards) ───────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW = new Date();
const CURRENT_YEAR  = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;

export default function ReportPage() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year,  setYear]  = useState(CURRENT_YEAR);

  // ── Stat card data ──
  const [revenue,       setRevenue]       = useState(null);
  const [delivered,     setDelivered]     = useState(null);
  const [transporters,  setTransporters]  = useState(null);
  const [loading,       setLoading]       = useState(true);

  // Previous period (for delta %) — previous month in same year, or Dec of prev year
  const [prevRevenue,   setPrevRevenue]   = useState(null);
  const [prevDelivered, setPrevDelivered] = useState(null);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  const loadStats = useCallback(async (m, y) => {
    setLoading(true);
    try {
      const [rev, del, trans, prevRev, prevDel] = await Promise.allSettled([
        getTotalRevenue({ month: m, year: y }),
        getTotalDeliveredShipments({ month: m, year: y }),
        getTransporterCount(),
        getTotalRevenue({ month: prevMonth, year: prevYear }),
        getTotalDeliveredShipments({ month: prevMonth, year: prevYear }),
      ]);

      setRevenue(      rev.status      === 'fulfilled' ? rev.value.data      : null);
      setDelivered(    del.status      === 'fulfilled' ? del.value.data      : null);
      setTransporters( trans.status    === 'fulfilled' ? trans.value.data    : null);
      setPrevRevenue(  prevRev.status  === 'fulfilled' ? prevRev.value.data  : null);
      setPrevDelivered(prevDel.status  === 'fulfilled' ? prevDel.value.data  : null);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadStats(month, year); }, [month, year, loadStats]);

  // ── Compute deltas ──
  function pctDelta(current, previous) {
    if (!current || !previous || previous === 0) return null;
    return +((( current - previous) / previous) * 100).toFixed(1);
  }

  const revenueDelta   = pctDelta(revenue?.total_revenue,   prevRevenue?.total_revenue);
  const deliveredDelta = pctDelta(delivered?.total_delivered, prevDelivered?.total_delivered);

  // ── Cards config ──
  const cards = [
    {
      icon:    '💰',
      label:   'Total Revenue',
      value:   fmtCurrency(revenue?.total_revenue),
      delta:   revenueDelta,
      sub:     revenueDelta !== null
                 ? `${revenueDelta >= 0 ? '+' : ''}${revenueDelta}% vs ${MONTHS_SHORT[prevMonth - 1]}`
                 : `For ${MONTHS_SHORT[month - 1]} ${year}`,
      accent: 'var(--accent-yellow)',
    },
    {
      icon:    '📦',
      label:   'Delivered Shipments',
      value:   fmtNum(delivered?.total_delivered),
      delta:   deliveredDelta,
      sub:     deliveredDelta !== null
                 ? `${deliveredDelta >= 0 ? '+' : ''}${deliveredDelta}% vs ${MONTHS_SHORT[prevMonth - 1]}`
                 : `For ${MONTHS_SHORT[month - 1]} ${year}`,
      accent: 'var(--accent-green)',
    },
    {
      icon:    '🚚',
      label:   'Active Transporters',
      value:   transporters?.count != null ? String(transporters.count) : '—',
      delta:   null,
      sub:     'Currently registered',
      accent: 'var(--accent-blue)',
    },
    {
      icon:    '📅',
      label:   'Report Period',
      value:   `${MONTHS_SHORT[month - 1]} ${year}`,
      delta:   null,
      sub:     'Adjust filters above',
      accent: 'var(--accent-purple)',
    },
  ];

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.topBar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Reports &amp; Analytics</h1>
          <p className={styles.pageSub}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        {/* Global month/year filter — drives the stat cards */}
        <div className={styles.periodPicker}>
          <span className={styles.pickerLabel}>Period</span>
          <select
            className={styles.sel}
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
          >
            {MONTHS_SHORT.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className={styles.sel}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className={styles.liveChip}>
            <span className={styles.liveDot} /> Live
          </span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        {cards.map((c) => (
          <ReportStatCard key={c.label} {...c} loading={loading} />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className={styles.chartsRow}>
        {/* Revenue area chart — has its own year picker inside */}
        <div className={styles.chartMain}>
          <RevenueChart />
        </div>
        {/* Pie chart — has its own month/year picker inside */}
        <div className={styles.chartSide}>
          <StatusPieChart />
        </div>
      </div>

      {/* ── CSV Export ── */}
      <CSVExport />
    </div>
  );
}