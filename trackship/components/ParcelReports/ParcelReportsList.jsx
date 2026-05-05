'use client';
// components/ParcelReports/ParcelReportsList.jsx
import { Eye, AlertTriangle, Package } from 'lucide-react';
import s from './ParcelReportsList.module.css';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const SEV_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const SEV_BG    = { high: '#FEF2F2', medium: '#FFFBEB', low: '#F0FDF4' };

const maxSeverity = (parcels) => {
  if (!parcels?.length) return 'low';
  const order = { high: 3, medium: 2, low: 1 };
  return parcels.reduce(
    (max, p) => (order[p.damage_severity] || 0) > (order[max] || 0) ? p.damage_severity : max, 'low'
  );
};

function SkeletonRow() {
  return (
    <tr className={s.skeletonRow}>
      {[140, 110, 120, 70, 85, 95, 80, 60].map((w, i) => (
        <td key={i}><div className={s.skeletonCell} style={{ width: w }} /></td>
      ))}
    </tr>
  );
}

export default function ParcelReportsList({ reports, loading, onSelect }) {
  return (
    <div className={s.section}>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitle}>
          <Package size={14} /> All Reports
        </div>
        {!loading && (
          <span className={s.countBadge}>{reports.length} total</span>
        )}
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Shipment</th>
              <th>Reported By</th>
              <th>Transporter</th>
              <th>Parcels</th>
              <th>Severity</th>
              <th>Reported At</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.empty}>
                    <div className={s.emptyIcon}><AlertTriangle size={28} /></div>
                    <div className={s.emptyText}>No damage reports found</div>
                    <div className={s.emptySub}>All clear — no parcel damage has been reported.</div>
                  </div>
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const sev = maxSeverity(r.parcels);
                return (
                  <tr key={r.damage_id} className={s.row} onClick={() => onSelect(r)}>
                    <td>
                      <span className={s.shipCode}>{r.shipment_code}</span>
                      <span className={s.deliveryMode}>{r.delivery_mode?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className={s.cell}>{r.reported_by_name ?? '—'}</td>
                    <td className={s.cell}>{r.transporter_name ?? '—'}</td>
                    <td>
                      <span className={s.parcelCount}>
                        {r.parcels?.length ?? 0}
                        <span className={s.parcelLabel}> parcel{r.parcels?.length !== 1 ? 's' : ''}</span>
                      </span>
                    </td>
                    <td>
                      <span
                        className={s.sevBadge}
                        style={{ color: SEV_COLOR[sev], background: SEV_BG[sev], borderColor: `${SEV_COLOR[sev]}33` }}
                      >
                        <span className={s.sevDot} style={{ background: SEV_COLOR[sev] }} />
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </span>
                    </td>
                    <td><span className={s.dateText}>{fmtDate(r.reported_at)}</span></td>
                    <td>
                      <span className={`${s.statusBadge} ${s[r.resolution_status]}`}>
                        {r.resolution_status}
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