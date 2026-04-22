// components/report/CSVExport.jsx
'use client';
import { useState } from 'react';
import { exportRevenueCSV, exportShipmentCSV } from '@/lib/api';
import styles from './CSVExport.module.css';

const STATUS_OPTIONS = ['', 'delivered', 'pending', 'in_transit', 'cancelled', 'failed'];

export default function CSVExport() {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  const [startDate, setStartDate]   = useState(monthAgo);
  const [endDate,   setEndDate]     = useState(today);
  const [status,    setStatus]      = useState('');
  const [loading,   setLoading]     = useState({ revenue: false, shipment: false });
  const [toast,     setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async (type) => {
    setLoading((p) => ({ ...p, [type]: true }));
    try {
      if (type === 'revenue') {
        await exportRevenueCSV({ startDate, endDate });
      } else {
        await exportShipmentCSV({ startDate, endDate, status });
      }
      showToast(`${type === 'revenue' ? 'Revenue' : 'Shipment'} CSV downloaded!`);
    } catch {
      showToast('Export failed. Try again.', 'error');
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  };

  return (
    <div className={styles.card}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastErr : ''}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Export Reports</h3>
          <p className={styles.sub}>Download filtered data as CSV</p>
        </div>
        <span className={styles.badge}>📥 CSV</span>
      </div>

      <div className={styles.grid}>
        {/* Date filters */}
        <div className={styles.field}>
          <label className={styles.label}>Start Date</label>
          <input
            type="date" className={styles.input}
            value={startDate} onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>End Date</label>
          <input
            type="date" className={styles.input}
            value={endDate} onChange={(e) => setEndDate(e.target.value)}
            min={startDate} max={today}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Shipment Status</label>
          <select className={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All Statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.btnYellow}`}
          onClick={() => handleExport('revenue')}
          disabled={loading.revenue}
        >
          {loading.revenue ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          )}
          Revenue CSV
        </button>

        <button
          className={`${styles.btn} ${styles.btnBlue}`}
          onClick={() => handleExport('shipment')}
          disabled={loading.shipment}
        >
          {loading.shipment ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          )}
          Shipments CSV
        </button>
      </div>
    </div>
  );
}