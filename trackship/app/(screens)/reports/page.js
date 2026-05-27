'use client';
import { useState, useEffect, useCallback } from 'react';
import { getTotalRevenue, getTotalDeliveredShipments, getDamagedDelayedCount } from '@/lib/api';
import ReportStatCard from '@/components/report/ReportStatCard';
import RevenueChart from '@/components/report/RevenueChart';
import StatusPieChart from '@/components/report/StatusPieChart';
import CSVExport from '@/components/report/CSVExport';
import styles from './report.module.css';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();

function fmtCurrency(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `Nu ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `Nu ${(n / 1_000).toFixed(1)}k`;
  return `Nu ${Number(n).toLocaleString()}`;
}

export default function ReportPage() {
  // pending = what's in the dropdowns
  const [selMonth, setSelMonth] = useState('');  // '' = all months
  const [selYear, setSelYear] = useState('');  // '' = all years (FIXED)

  // applied = what was last fetched
  const [appliedMonth, setAppliedMonth] = useState(null);
  const [appliedYear, setAppliedYear] = useState(null); // (FIXED)

  const [damaged, setDamaged] = useState(null);
  const [delayed, setDelayed] = useState(null);

  const [revenue, setRevenue] = useState(null);
  const [delivered, setDelivered] = useState(null);
  const [prevRevenue, setPrevRevenue] = useState(null);
  const [prevDelivered, setPrevDelivered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const isFiltered = appliedMonth !== null || appliedYear !== null;

  const load = useCallback(async (month, year, showLoading = true) => {
    if (showLoading) setLoading(true);

    // Don't include year if it's null/undefined
    const params = month
      ? { month, year }
      : year
        ? { year }
        : {}; // Empty params for all-time total

    // For previous period comparison
    const prevParams = month
      ? { month: month === 1 ? 12 : month - 1, year: month === 1 ? year - 1 : year }
      : year
        ? { year: year - 1 }
        : {}; // Empty for all-time comparison

    const [rev, del, pRev, pDel, dgmDly] = await Promise.allSettled([
      getTotalRevenue(params),
      getTotalDeliveredShipments(params),
      year ? getTotalRevenue(prevParams) : Promise.resolve(null), // Skip prev comparison for all-time
      year ? getTotalDeliveredShipments(prevParams) : Promise.resolve(null),
      getDamagedDelayedCount(params),
    ]);

    setRevenue(rev.status === 'fulfilled' ? rev.value?.data?.total_revenue ?? null : null);
    setDelivered(del.status === 'fulfilled' ? del.value?.data?.total_delivered ?? null : null);
    setPrevRevenue(pRev.status === 'fulfilled' ? pRev.value?.data?.total_revenue ?? null : null);
    setPrevDelivered(pDel.status === 'fulfilled' ? pDel.value?.data?.total_delivered ?? null : null);
    setDamaged(
      dgmDly.status === 'fulfilled'
        ? (dgmDly.value?.data?.damageData?.damageCount
          ?? dgmDly.value?.data?.damageData?.damagedCount
          ?? null)
        : null
    );
    setDelayed(dgmDly.status === 'fulfilled' ? dgmDly.value?.data?.delayedData?.delayCount ?? null : null);
    if (showLoading) setLoading(false);
  }, []);

  // Default: all-time totals (FIXED)
  useEffect(() => {
    load(null, null); // Pass null for both params to get all-time totals
  }, [load]);

  const handleApply = async () => {
    setIsApplying(true);
    const month = selMonth ? +selMonth : null;
    const year = selYear ? +selYear : null; // (FIXED)
    setAppliedMonth(month);
    setAppliedYear(year);
    await load(month, year);
    setIsApplying(false);
  };

  const handleClear = async () => {
    setSelMonth('');
    setSelYear(''); // (FIXED)
    setAppliedMonth(null);
    setAppliedYear(null);
    await load(null, null);
  };

  function calcDelta(curr, prev) {
    if (curr == null || prev == null || Number(prev) === 0) return null;
    return +(((Number(curr) - Number(prev)) / Number(prev)) * 100).toFixed(1);
  }

  const revDelta = calcDelta(revenue, prevRevenue);
  const delDelta = calcDelta(delivered, prevDelivered);

  // (FIXED) periodLabel and vsLabel
  const periodLabel = appliedMonth && appliedYear
    ? `${MONTHS_SHORT[appliedMonth - 1]} ${appliedYear}`
    : appliedMonth
      ? MONTHS_SHORT[appliedMonth - 1]
      : appliedYear
        ? `Full year ${appliedYear}`
        : 'All time';

  const vsLabel = appliedMonth
    ? `vs ${MONTHS_SHORT[(appliedMonth === 1 ? 12 : appliedMonth - 1) - 1]}`
    : appliedYear
      ? `vs ${appliedYear - 1}`
      : '';

  // Filter icon component
  const FilterIcon = () => (
    <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v2l-6 7v7l-4-2v-5l-6-7V4z" />
    </svg>
  );

  // Checkmark icon component
  const CheckIcon = () => (
    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  // Close icon component
  const CloseIcon = () => (
    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Reports &amp; Analytics</h1>
          <p className={styles.pageSub}>
            {NOW.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Enhanced Filter Bar */}
        <div className={`${styles.filterBar} ${isFiltered ? styles.hasFilter : ''}`}>
          <div className={styles.filterHeader}>
            <FilterIcon />
            <span className={styles.filterLabel}>Filter</span>
          </div>

          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label className={styles.filterGroupLabel}>Month</label>
              <select
                className={styles.sel}
                value={selMonth}
                onChange={(e) => setSelMonth(e.target.value)}
                aria-label="Select month"
              >
                <option value=''>All months</option>
                {MONTHS_FULL.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterGroupLabel}>Year</label>
              <select
                className={styles.sel}
                value={selYear}
                onChange={(e) => setSelYear(e.target.value ? +e.target.value : '')}
                aria-label="Select year"
              >
                <option value=''>All years</option> {/* (FIXED) Added option */}
                {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterActions}>
              <button
                className={`${styles.applyBtn} ${isApplying ? styles.loading : ''}`}
                onClick={handleApply}
                disabled={isApplying}
                aria-label="Apply filters"
              >
                <CheckIcon />
                Apply
              </button>

              {isFiltered && (
                <button
                  className={styles.clearBtn}
                  onClick={handleClear}
                  aria-label="Clear filters"
                >
                  <CloseIcon />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Filters Indicator ── */}
      {isFiltered && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Active filters:</span>
          {appliedMonth && (
            <span className={styles.filterTag}>
              {MONTHS_FULL[appliedMonth - 1]}
            </span>
          )}
          {appliedYear && ( /* (FIXED) Only show if year is set */
            <span className={styles.filterTag}>
              {appliedYear}
            </span>
          )}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        <ReportStatCard
          icon="💰"
          label="Total Revenue"
          value={fmtCurrency(revenue)}
          delta={revDelta}
          sub={revDelta != null ? `${revDelta >= 0 ? '+' : ''}${revDelta}% ${vsLabel}` : periodLabel}
          accent="var(--accent-yellow)"
          loading={loading}
        />
        <ReportStatCard
          icon="📦"
          label="Delivered Shipments"
          value={delivered != null ? Number(delivered).toLocaleString() : '—'}
          delta={delDelta}
          sub={delDelta != null ? `${delDelta >= 0 ? '+' : ''}${delDelta}% ${vsLabel}` : periodLabel}
          accent="var(--accent-green)"
          loading={loading}
        />
        <ReportStatCard
          icon="⚠️"
          label="Damaged Parcels"
          value={damaged != null ? Number(damaged).toLocaleString() : '—'}
          delta={null}
          sub={periodLabel}
          accent="var(--accent-red, #EF4444)"
          loading={loading}
        />
        <ReportStatCard
          icon="🕐"
          label="Delayed Parcels"
          value={delayed != null ? Number(delayed).toLocaleString() : '—'}
          delta={null}
          sub={periodLabel}
          accent="var(--accent-orange, #F97316)"
          loading={loading}
        />
      </div>

      {/* ── Charts ── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartMain}><RevenueChart /></div>
        <div className={styles.chartSide}><StatusPieChart /></div>
      </div>

      {/* ── CSV Export ── */}
      <CSVExport />

    </div>
  );
}