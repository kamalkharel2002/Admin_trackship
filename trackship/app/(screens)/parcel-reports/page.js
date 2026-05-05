'use client';
// app/(screens)/parcel-reports/page.jsx
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

import ParcelStats      from '@/components/ParcelReports/ParcelStats';
import ParcelReportsList from '@/components/ParcelReports/ParcelReportsList';
import DamageDetailModal from '@/components/ParcelReports/DamageDetailModal';
import ParcelFilters     from '@/components/ParcelReports/ParcelFilters';

import { getDamageReports } from '@/lib/api';

import s from './page.module.css';

export default function ParcelReportsPage() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  // Filter / search state
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');   // 'all' | 'pending' | 'solved'

  // Modal
  const [selected, setSelected] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
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

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = {
    total:   reports.length,
    pending: reports.filter(r => r.resolution_status === 'pending').length,
    solved:  reports.filter(r => r.resolution_status === 'solved').length,
  };

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = reports.filter(r => {
    const q           = search.toLowerCase();
    const matchStatus = filter === 'all' || r.resolution_status === filter;
    const matchSearch = !q ||
      r.shipment_code.toLowerCase().includes(q)     ||
      r.reported_by_name?.toLowerCase().includes(q) ||
      r.transporter_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Resolve callback — optimistic update ─────────────────────────────────
  const handleResolved = (id, notes) => {
    setReports(prev =>
      prev.map(r => r.damage_id === id ? { ...r, resolution_status: 'solved', notes } : r)
    );
    setSelected(prev => prev ? { ...prev, resolution_status: 'solved', notes } : prev);
  };

  return (
    <div className={s.page}>

      {/* ── Page header ── */}
      <div className={s.pageHeader}>
        <div className={s.titleBlock}>
          <h1 className={s.pageTitle}>Parcel Reports</h1>
          <div className={s.pageSub}>Review and resolve reported parcel damage across all shipments</div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className={s.error}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Stats row ── */}
      <ParcelStats stats={stats} loading={loading} />

      {/* ── Filters ── */}
      <ParcelFilters
        search={search}
        filter={filter}
        onSearch={setSearch}
        onFilter={setFilter}
      />

      {/* ── List ── */}
      <ParcelReportsList
        reports={filtered}
        loading={loading}
        onSelect={setSelected}
      />

      {/* ── Detail modal ── */}
      {selected && (
        <DamageDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onResolved={handleResolved}
        />
      )}

    </div>
  );
}