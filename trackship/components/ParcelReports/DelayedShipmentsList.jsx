'use client';
// components/ParcelReports/DelayedShipmentsList.jsx
import { Eye, Clock, AlertTriangle } from 'lucide-react';
import s from './DelayedShipmentsList.module.css';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_CFG = {
  unresolved: { color: '#DC2626', bg: '#FEF2F2', label: 'Unresolved' },
  resolved:   { color: '#059669', bg: '#ECFDF5', label: 'Resolved'   },
  excused:    { color: '#D97706', bg: '#FFFBEB', label: 'Excused'    },
};

function SkeletonRow() {
  return (
    <tr className={s.skeletonRow}>
      {[130, 120, 100, 85, 85, 75, 60].map((w, i) => (
        <td key={i}><div className={s.skeletonCell} style={{ width: w }} /></td>
      ))}
    </tr>
  );
}

export default function DelayedShipmentsList({ reports, loading, onSelect }) {
  return (
    <div className={s.section}>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Shipment</th>
              <th>Route</th>
              <th>Transporter</th>
              <th>Expected</th>
              <th>Detected</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map(i => <SkeletonRow key={i} />)
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className={s.empty}>
                    <div className={s.emptyIcon}><Clock size={26} /></div>
                    <div className={s.emptyText}>No delayed shipments</div>
                    <div className={s.emptySub}>All shipments are on schedule.</div>
                  </div>
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const cfg = STATUS_CFG[r.resolution_status] ?? STATUS_CFG.unresolved;
                return (
                  <tr key={r.delay_id} className={s.row} onClick={() => onSelect(r)}>
                    <td>
                      <span className={s.shipCode}>{r.shipment_code}</span>
                      <span className={s.deliveryMode}>{r.delivery_mode?.replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      <div className={s.route}>
                        <span className={s.hub}>{r.source_hub_name}</span>
                        <span className={s.arrow}>→</span>
                        <span className={s.hub}>{r.destination_hub_name}</span>
                      </div>
                    </td>
                    <td className={s.cell}>{r.transporter_name ?? '—'}</td>
                    <td><span className={s.dateText}>{fmtDate(r.expected_delivery_at)}</span></td>
                    <td><span className={s.dateText}>{fmtDate(r.detected_at)}</span></td>
                    <td>
                      <span className={s.statusBadge} style={{ color: cfg.color, background: cfg.bg }}>
                        <span className={s.statusDot} style={{ background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className={s.viewBtn}
                        onClick={(e) => { e.stopPropagation(); onSelect(r); }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}