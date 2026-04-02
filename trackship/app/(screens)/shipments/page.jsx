'use client';
import { useEffect, useState, useMemo } from 'react';
import ShipmentsTable from '@/components/shipments/ShipmentsTable';
import { getShipments } from '@/lib/api'; 
import { 
  Layers, 
  FilePlus, 
  CheckCircle, 
  Archive, 
  UserCheck, 
  Truck, 
  Building, 
  CheckCheck, 
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import './Shipmentpage.css';

const STAT_META = [
  {
    key: 'Total',
    statusKey: null,
    icon: Layers,
    colorClass: 'stat-slate',
    description: 'All shipments',
  },
  {
    key: 'Service Requested',
    statusKey: 'service_request',
    icon: FilePlus,
    colorClass: 'stat-indigo',
    description: 'Awaiting confirmation',
  },
  {
    key: 'Request Accepted',
    statusKey: 'request_accepted',
    icon: CheckCircle,
    colorClass: 'stat-green',
    description: 'Confirmed shipments',
  },
  {
    key: 'Received at Hub',
    statusKey: 'received_at_hub',
    icon: Archive,
    colorClass: 'stat-yellow',
    description: 'At origin hub',
  },
  {
    key: 'Transporter Assigned',
    statusKey: 'transporter_assigned',
    icon: UserCheck,
    colorClass: 'stat-blue',
    description: 'Driver assigned',
  },
  {
    key: 'In Transit',
    statusKey: 'in_transit',
    icon: Truck,
    colorClass: 'stat-teal',
    description: 'On the road',
  },
  {
    key: 'Delivered at Hub',
    statusKey: 'delivered_at_hub',
    icon: Building,
    colorClass: 'stat-purple',
    description: 'At destination hub',
  },
  {
    key: 'Verified at Hub',
    statusKey: 'verified_at_hub',
    icon: ShieldCheck,
    colorClass: 'stat-violet',
    description: 'Quality checked',
  },
  {
    key: 'Delivered',
    statusKey: 'delivered',
    icon: CheckCheck,
    colorClass: 'stat-emerald',
    description: 'Successfully delivered',
  },
];

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="stat-card skeleton">
      <div className="skeleton-icon" />
      <div className="skeleton-label" />
      <div className="skeleton-value" />
      <div className="skeleton-sub" />
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, colorClass, Icon, description, trend }) {
  const getTrendIcon = () => {
    if (!trend || trend === 0) return <Minus size={14} />;
    return trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
  };

  const getTrendClass = () => {
    if (!trend || trend === 0) return 'trend-neutral';
    return trend > 0 ? 'trend-up' : 'trend-down';
  };

  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card-header">
        <div className="stat-icon-wrap">
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value-group">
          <div className="stat-value">{value.toLocaleString()}</div>
          <div className="stat-sub">{description}</div>
        </div>
      </div>
      
      <div className="stat-card-glow" />
    </div>
  );
}

/* ── Page Header ── */
function PageHeader() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="shipments-topbar">
      <div className="shipments-title-group">
        <div className="title-main-row">
          <h1 className="shipments-title">Shipments & Parcels</h1>
        </div>
        <nav className="shipments-breadcrumb">
          <span className="bc-link">Admin Dashboard</span>
          <span className="bc-sep">›</span>
          <span className="bc-active">Shipments</span>
        </nav>
      </div>
    </div>
  );
}

/* ── Main Page Component ── */
export default function ShipmentsPage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);
      const data = await getShipments({ offset: 0, limit: 10 });
      setStats(data.counts || []);
    } catch (err) {
      console.error('Failed to fetch shipment stats:', err);
      setError('Failed to load shipment data');
    } finally {
      setLoading(false);
    }
  }

  const countByStatus = useMemo(() => {
    return Object.fromEntries(
      (stats || []).map(s => [
        String(s.status || '').toLowerCase().replace(/\s+/g, '_'), 
        Number(s.count) || 0
      ])
    );
  }, [stats]);

  const total = useMemo(() => {
    return Object.values(countByStatus).reduce((a, b) => a + b, 0);
  }, [countByStatus]);

  // Mock trend data - in real app, calculate from historical data
  const getTrendForStatus = (statusKey) => {
    const trends = {
      'service_request': 12,
      'request_accepted': 8,
      'in_transit': -5,
      'delivered': 15,
    };
    return trends[statusKey];
  };

  const renderStats = () => {
    if (loading && stats.length === 0) {
      return [...Array(9)].map((_, i) => <SkeletonCard key={i} />);
    }

    return STAT_META.map(({ key, statusKey, icon: Icon, colorClass, description }) => {
      const value = key === 'Total' ? total : (countByStatus[statusKey] ?? 0);
      const trend = statusKey ? getTrendForStatus(statusKey) : undefined;

      return (
        <StatCard
          key={key}
          label={key}
          value={value}
          colorClass={colorClass}
          Icon={Icon}
          description={description}
          trend={trend}
        />
      );
    });
  };

  return (
    <div className="shipments-page">
      <PageHeader />

      {/* ── Stats Overview ── */}
      <div className="shipments-stats-section">
        <div className="stats-section-header">
          <h2 className="stats-section-title">Overview</h2>
        </div>

        {error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            <button className="error-retry" onClick={fetchStats}>
              Retry
            </button>
          </div>
        ) : (
          <div className="shipments-stats-grid">
            {renderStats()}
          </div>
        )}
      </div>

      {/* ── Shipments Table ── */}
      <div className="shipments-table-section">
        <div className="shipments-section-header">
          <div className="section-title-group">
            <h3 className="section-title">All Shipments</h3>
            <div className="section-subtitle">
              {total > 0 ? `Showing ${total} shipments` : 'No shipments found'}
            </div>
          </div>
          <div className="section-pills">
            {total > 0 && (
              <div className="pill pill-total">
                <span className="pill-label">Total</span>
                <span className="pill-count">{total.toLocaleString()}</span>
              </div>
            )}
            {loading && (
              <div className="pill pill-loading">
                <span className="loading-spinner" />
                <span>Updating...</span>
              </div>
            )}
          </div>
        </div>

        <ShipmentsTable />
      </div>
    </div>
  );
}