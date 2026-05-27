'use client';
// app/(screens)/parcel-reports/page.jsx
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import ParcelStats          from '@/components/ParcelReports/ParcelStats';
import ParcelReportsList    from '@/components/ParcelReports/ParcelReportsList';
import DamageDetailModal    from '@/components/ParcelReports/DamageDetailModal';
import ParcelFilters        from '@/components/ParcelReports/ParcelFilters';
import DelayFilters         from '@/components/ParcelReports/DelayFilters';
import DelayedShipmentsList from '@/components/ParcelReports/DelayedShipmentsList';
import DelayDetailModal     from '@/components/ParcelReports/DelayDetailModal';
import { getDamageReports, getDelayReports } from '@/lib/api';
import s from './page.module.css';

const PAGE_SIZE = 10;

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function PaginationFooter({ page, total, label, onPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (total === 0) return null;

  const from      = (page - 1) * PAGE_SIZE + 1;
  const to        = Math.min(page * PAGE_SIZE, total);
  const pageRange = getPageRange(page, totalPages);

  return (
    <div className={s.footer}>
      <span className={s.footerCount}>
        <strong>{from}–{to}</strong>
        <span> of {total} {label}</span>
      </span>
      <div className={s.pagination}>
        <button
          className={s.pageBtn}
          disabled={page === 1}
          onClick={() => onPage(p => Math.max(1, p - 1))}
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {pageRange.map((p, i) =>
          p === '…'
            ? <span key={`d${i}`} className={s.pageDots}>···</span>
            : <button
                key={p}
                className={`${s.pageBtn}${p === page ? ` ${s.active}` : ''}`}
                onClick={() => onPage(p)}
              >{p}</button>
        )}

        <button
          className={s.pageBtn}
          disabled={page === totalPages}
          onClick={() => onPage(p => Math.min(totalPages, p + 1))}
          aria-label="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ParcelReportsPage() {
  const [reports,       setReports]       = useState([]);
  const [delayReports,  setDelayReports]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [delayLoading,  setDelayLoading]  = useState(true);
  const [error,         setError]         = useState(null);

  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [damagePage,  setDamagePage]  = useState(1);

  const [delaySearch, setDelaySearch] = useState('');
  const [delayFilter, setDelayFilter] = useState('all');
  const [delayPage,   setDelayPage]   = useState(1);

  const [selected,      setSelected]      = useState(null);
  const [selectedDelay, setSelectedDelay] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDamageReports();
      setReports(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load damage reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDelays = useCallback(async () => {
    setDelayLoading(true);
    try {
      const res = await getDelayReports();
      setDelayReports(res?.data ?? []);
    } catch {
      // non-blocking
    } finally {
      setDelayLoading(false);
    }
  }, []);

  useEffect(() => { load(); loadDelays(); }, [load, loadDelays]);

  // Calculate stats based on current reports and delayReports
  // This will recalculate whenever reports or delayReports change
  const combinedStats = {
    damagedCount: reports.length,
    delayCount: delayReports.length,
    resolvedCount: 
      reports.filter(r => r.resolution_status === 'solved' || r.resolution_status === 'resolved').length +
      delayReports.filter(r => r.resolution_status === 'solved' || r.resolution_status === 'resolved').length,
  };

  // ── Damage filtering + pagination ────────────────────────────────────────
  const filtered = reports.filter(r => {
    const q           = search.toLowerCase();
    const matchStatus = filter === 'all' || r.resolution_status === filter;
    const matchSearch = !q ||
      r.shipment_code?.toLowerCase().includes(q)    ||
      r.reported_by_name?.toLowerCase().includes(q) ||
      r.transporter_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  useEffect(() => { setDamagePage(1); }, [search, filter]);

  const safeDamagePage = Math.min(damagePage, Math.ceil(filtered.length / PAGE_SIZE) || 1);
  const pagedDamage    = filtered.slice(
    (safeDamagePage - 1) * PAGE_SIZE,
    safeDamagePage * PAGE_SIZE,
  );

  // ── Delay filtering + pagination ─────────────────────────────────────────
  const filteredDelays = delayReports.filter(r => {
    const q           = delaySearch.toLowerCase();
    const matchStatus = delayFilter === 'all' || r.resolution_status === delayFilter;
    const matchSearch = !q ||
      r.shipment_code?.toLowerCase().includes(q)    ||
      r.reported_by_name?.toLowerCase().includes(q) ||
      r.transporter_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  useEffect(() => { setDelayPage(1); }, [delaySearch, delayFilter]);

  const safeDelayPage = Math.min(delayPage, Math.ceil(filteredDelays.length / PAGE_SIZE) || 1);
  const pagedDelays   = filteredDelays.slice(
    (safeDelayPage - 1) * PAGE_SIZE,
    safeDelayPage * PAGE_SIZE,
  );

  const handleResolved = (id, notes) => {
    setReports(prev =>
      prev.map(r => r.damage_id === id ? { ...r, resolution_status: 'solved', notes } : r)
    );
    setSelected(prev => prev ? { ...prev, resolution_status: 'solved', notes } : prev);
  };

  const handleDelayUpdated = (id, status, notes) => {
    setDelayReports(prev =>
      prev.map(r => r.delay_id === id
        ? { ...r, resolution_status: status, admin_notes: notes }
        : r
      )
    );
    setSelectedDelay(prev =>
      prev ? { ...prev, resolution_status: status, admin_notes: notes } : prev
    );
  };

  return (
    <div className={s.page}>

      {/* ── Page header ── */}
      <div className={s.pageHeader}>
        <div className={s.titleBlock}>
          <h1 className={s.pageTitle}>Parcel Reports</h1>
          <div className={s.pageSub}>Review and resolve reported parcel damage and delays across all shipments</div>
        </div>
      </div>

      {error && (
        <div className={s.error}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <ParcelStats
        stats={combinedStats}
        loading={loading || delayLoading}
      />

      {/* ════ Damaged Parcels ════ */}
      <div className={s.sectionDivider}>
        <h2 className={s.sectionTitle}>Damaged Parcels</h2>
        <div className={s.sectionSub}>Review and resolve reported parcel damage</div>
      </div>

      <ParcelFilters
        search={search}
        filter={filter}
        onSearch={setSearch}
        onFilter={setFilter}
      />

      <div className={s.listCard}>
        <ParcelReportsList
          reports={pagedDamage}
          loading={loading}
          onSelect={setSelected}
        />
        {!loading && filtered.length > 0 && (
          <PaginationFooter
            page={safeDamagePage}
            total={filtered.length}
            label="damage reports"
            onPage={setDamagePage}
          />
        )}
      </div>

      {/* ════ Delayed Shipments ════ */}
      <div className={s.sectionDivider}>
        <h2 className={s.sectionTitle}>Delayed Shipments</h2>
        <div className={s.sectionSub}>Track and resolve delayed shipment reports</div>
      </div>

      <DelayFilters
        search={delaySearch}
        filter={delayFilter}
        onSearch={setDelaySearch}
        onFilter={setDelayFilter}
      />

      <div className={s.listCard}>
        <DelayedShipmentsList
          reports={pagedDelays}
          loading={delayLoading}
          onSelect={setSelectedDelay}
        />
        {!delayLoading && filteredDelays.length > 0 && (
          <PaginationFooter
            page={safeDelayPage}
            total={filteredDelays.length}
            label="delayed shipments"
            onPage={setDelayPage}
          />
        )}
      </div>

      {selected && (
        <DamageDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onResolved={handleResolved}
        />
      )}

      {selectedDelay && (
        <DelayDetailModal
          report={selectedDelay}
          onClose={() => setSelectedDelay(null)}
          onUpdated={handleDelayUpdated}
        />
      )}

    </div>
  );
}