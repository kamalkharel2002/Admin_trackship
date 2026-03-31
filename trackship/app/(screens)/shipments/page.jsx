'use client';
import { useEffect, useState } from 'react';
import ShipmentsTable from '@/components/shipments/ShipmentsTable';
import { getShipments } from '@/lib/api'; 
import './Shipmentpage.css';

const STAT_META = [
  { key: 'Total',      icon: PackageIcon, colorClass: 'stat-blue' },
  { key: 'Delivered',  icon: CheckIcon,   colorClass: 'stat-green' },
  { key: 'In Transit', icon: TruckIcon,   colorClass: 'stat-teal' },
  { key: 'Pending',    icon: ClockIcon,   colorClass: 'stat-amber' },
  { key: 'Delayed',    icon: AlertIcon,   colorClass: 'stat-red' },
];

/* ── Icons ── */
function PackageIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="1" y="3" width="15" height="13"/>
      <circle cx="6" cy="18" r="2"/>
      <circle cx="18" cy="18" r="2"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return <div className="stat-card skeleton" />;
}

/* ── Stat card ── */
function StatCard({ label, value, colorClass, Icon }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-icon-wrap"><Icon /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">shipments</div>
    </div>
  );
}

/* ── Page ── */
export default function ShipmentsPage() {
  const [selected, setSelected] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const data = await getShipments({ offset: 0, limit: 10 });
      setStats(data.counts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const countByStatus = Object.fromEntries(
    (stats || []).map(s => [s.status, Number(s.count) || 0])
  );

  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="shipments-page">

      {/* ── Top bar ── */}
      <div className="shipments-topbar">
        <div className="shipments-title-group">
          <h2 className="shipments-title">Shipments & Parcels</h2>
          <nav className="shipments-breadcrumb">
            <span>Admin Dashboard</span>
            <span className="bc-sep">›</span>
            <span className="bc-active">Shipments</span>
          </nav>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="shipments-stats-grid">
        {loading
          ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
          : STAT_META.map(({ key, icon: Icon, colorClass }) => (
              <StatCard
                key={key}
                label={key}
                value={key === 'Total' ? total : (countByStatus[key] ?? 0)}
                colorClass={colorClass}
                Icon={Icon}
              />
            ))
        }
      </div>

      {/* ── Table ── */}
      <div className="shipments-table-section">
        <div className="shipments-section-header">
          <span className="section-title">All Shipments</span>
          <div className="section-pills">
            {total > 0 && <span className="pill pill-total">{total} total</span>}
            {selected.length > 0 && (
              <span className="pill pill-selected">{selected.length} selected</span>
            )}
          </div>
        </div>

        <ShipmentsTable selected={selected} setSelected={setSelected} />
      </div>

    </div>
  );
}