// components/report/CSVExport.jsx
'use client';
import { useState } from 'react';
import { exportRevenueCSV, exportShipmentCSV } from '@/lib/api';
import styles from './CSVExport.module.css';

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

const TOAST_DURATION = 3500;

export default function CSVExport() {
  const today    = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate,   setEndDate]   = useState(today);
  const [busy,      setBusy]      = useState({ revenue: false, shipment: false });
  const [toast,     setToast]     = useState(null); // { msg, type: 'ok'|'err' }

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  const handleExport = async (type) => {
    if (!startDate || !endDate) {
      notify('Please select both start and end dates.', 'err');
      return;
    }
    if (startDate > endDate) {
      notify('Start date cannot be after end date.', 'err');
      return;
    }

    setBusy((p) => ({ ...p, [type]: true }));
    try {
      if (type === 'revenue') {
        await exportRevenueCSV({ start_date: startDate, end_date: endDate });
        notify('Revenue CSV downloaded successfully!');
      } else {
        await exportShipmentCSV({ start_date: startDate, end_date: endDate });
        notify('Shipment CSV downloaded successfully!');
      }
    } catch (err) {
      notify(err.message || 'Export failed. Please try again.', 'err');
    } finally {
      setBusy((p) => ({ ...p, [type]: false }));
    }
  };

  return (
    <div className={styles.card}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'err' ? styles.toastErr : styles.toastOk}`}>
          <span>{toast.type === 'ok' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Export Reports</h3>
          <p className={styles.sub}>Download filtered data as CSV files</p>
        </div>
        <div className={styles.headerIcon}>📥</div>
      </div>

      <div className={styles.body}>
        {/* Date range pickers */}
        <div className={styles.dateRow}>
          <div className={styles.field}>
            <label className={styles.label}>Start Date</label>
            <input
              type="date"
              className={styles.input}
              value={startDate}
              max={endDate || today}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.arrow}>→</div>
          <div className={styles.field}>
            <label className={styles.label}>End Date</label>
            <input
              type="date"
              className={styles.input}
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Selected range display */}
        {startDate && endDate && (
          <div className={styles.rangeInfo}>
            <span className={styles.rangeIcon}>📅</span>
            {startDate} &nbsp;–&nbsp; {endDate}
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnRevenue}`}
            onClick={() => handleExport('revenue')}
            disabled={busy.revenue || busy.shipment}
          >
            {busy.revenue
              ? <span className={styles.spin} />
              : <DownloadIcon />
            }
            Revenue Report
          </button>

          <button
            className={`${styles.btn} ${styles.btnShipment}`}
            onClick={() => handleExport('shipment')}
            disabled={busy.revenue || busy.shipment}
          >
            {busy.shipment
              ? <span className={styles.spin} />
              : <DownloadIcon />
            }
            Shipment Report
          </button>
        </div>

        {/* Column reference */}
        <div className={styles.colHints}>
          <div className={styles.hintBox}>
            <p className={styles.hintTitle}>Revenue CSV columns</p>
            <p className={styles.hintText}>
              Shipment Code · Created At · Status · Delivery Mode · Payment Method · Amount · Payment Status · Source Hub · Destination Hub
            </p>
          </div>
          <div className={styles.hintBox}>
            <p className={styles.hintTitle}>Shipment CSV columns</p>
            <p className={styles.hintText}>
              Shipment Code · Created At · Status · Delivery Type · Total Price · Sender · Receiver · Source Hub · Destination Hub · Vehicle No
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}