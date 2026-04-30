'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import TransporterHeader from '@/components/transporter/TransporterHeader';
import TransporterTable from '@/components/transporter/TransporterTable';
import { getTransporters, getAllPendingVehicleRequests } from '@/lib/api';
import './TransporterPage.css';

const ACCENTS = [
  { accent: '#F5B700', glow: 'rgba(245,183,0,0.09)'   },
  { accent: '#0EA5E9', glow: 'rgba(14,165,233,0.09)'  },
  { accent: '#22C55E', glow: 'rgba(34,197,94,0.09)'   },
  { accent: '#F97316', glow: 'rgba(249,115,22,0.09)'  },
  { accent: '#818CF8', glow: 'rgba(129,140,248,0.09)' },
];

export default function TransporterPage() {
  const [selected, setSelected] = useState([]);
  const [stats, setStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatuses, setActiveStatuses] = useState([]);
  const [pendingVehicleCount, setPendingVehicleCount] = useState(0);
  
  // Add ref to prevent multiple simultaneous fetches
  const fetchingStatsRef = useRef(false);
  const statsTimeoutRef = useRef(null);

  // Fetch pending vehicle count
  const fetchPendingVehicleCount = useCallback(async () => {
    try {
      const requests = await getAllPendingVehicleRequests();
      setPendingVehicleCount(requests?.length || 0);
    } catch (err) {
      console.error('Failed to fetch pending vehicle count:', err);
    }
  }, []);

  // Debounced stats fetch to prevent rapid updates
  const fetchStats = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingStatsRef.current) return;
    
    fetchingStatsRef.current = true;
    
    try {
      const data = await getTransporters();
      
      const statusCounts = {
        'PENDING_VERIFICATION': 0,
        'APPROVED': 0,
        'DECLINED': 0,
        'ACTIVE': 0
      };
      
      (data || []).forEach(t => {
        const status = t.verification_status || 'PENDING_VERIFICATION';
        if (statusCounts[status] !== undefined) {
          statusCounts[status]++;
        }
      });
      
      const approvedCount = statusCounts['APPROVED'] + statusCounts['ACTIVE'];
      
      const statsArray = [
        { status: 'Pending', key: 'PENDING_VERIFICATION', count: statusCounts['PENDING_VERIFICATION'], color: '#F97316' },
        { status: 'Approved', key: 'APPROVED', count: approvedCount, color: '#22C55E' },
        { status: 'Declined', key: 'DECLINED', count: statusCounts['DECLINED'], color: '#EF4444' }
      ];
      
      // Only update if stats actually changed
      setStats(prevStats => {
        const prevTotal = prevStats.reduce((sum, s) => sum + s.count, 0);
        const newTotal = statsArray.reduce((sum, s) => sum + s.count, 0);
        if (prevTotal !== newTotal) {
          return statsArray;
        }
        return prevStats;
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      fetchingStatsRef.current = false;
      setLoadingStats(false);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchStats(),
      fetchPendingVehicleCount()
    ]);
  }, [fetchStats, fetchPendingVehicleCount]);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Debounced handleStatusToggle to prevent rapid re-renders
  const handleStatusToggle = useCallback((statusId) => {
    if (statsTimeoutRef.current) {
      clearTimeout(statsTimeoutRef.current);
    }
    
    if (statusId === null) {
      setActiveStatuses([]);
      return;
    }
    
    setActiveStatuses(prev =>
      prev.includes(statusId)
        ? prev.filter(s => s !== statusId)
        : [...prev, statusId]
    );
  }, []);

  // Debounced search
  const handleSearch = useCallback((searchValue) => {
    if (statsTimeoutRef.current) {
      clearTimeout(statsTimeoutRef.current);
    }
    
    statsTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchValue);
    }, 300);
  }, []);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (statsTimeoutRef.current) {
        clearTimeout(statsTimeoutRef.current);
      }
    };
  }, []);

  const totalTransporters = stats.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

  // Memoize the update handler to prevent recreation
  const handleUpdate = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className="transporter-page">

      {/* ── Top bar ── */}
      <div className="transporter-page-topbar">
        <div className="transporter-page-title-block">
          <h2 className="transporter-page-title">Transporters</h2>
          <div className="transporter-page-breadcrumb">
            <span>Admin Dashboard</span>
            <span className="transporter-page-breadcrumb-sep">›</span>
            <span className="transporter-page-breadcrumb-current">Transporters</span>
          </div>
        </div>
      </div>

      {/* ── Stat cards with stable heights ── */}
      <div className="transporter-page-stats-container" style={{ minHeight: '120px' }}>
        {loadingStats ? (
          <div className="transporter-page-stats-loading">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="transporter-page-stat-skeleton" />
            ))}
          </div>
        ) : stats.length > 0 ? (
          <div className="transporter-page-stats">
            {stats.map((s, i) => {
              const { accent, glow } = ACCENTS[i % ACCENTS.length];
              return (
                <div 
                  key={s.key} 
                  className="transporter-page-stat-card"
                  style={{ '--tp-card-accent': accent, '--tp-card-glow': glow }}
                >
                  <div className="transporter-page-stat-status">{s.status}</div>
                  <div className="transporter-page-stat-number">{s.count}</div>
                  <div className="transporter-page-stat-sub">
                    <span className="transporter-page-stat-pill" style={{ background: `${s.color}15`, color: s.color }}>
                      <svg width="7" height="7" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M5 1l4 8H1z"/>
                      </svg>
                    </span>
                    transporters
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="transporter-page-stats-empty">No transporter data available</div>
        )}
      </div>

      {/* ── Table section ── */}
      <div className="transporter-page-table-section">
        <div className="transporter-page-section-label">
          <span className="transporter-page-section-title">All Transporters</span>
          <div className="transporter-page-section-right">
            {totalTransporters > 0 && (
              <span className="transporter-page-total-pill">{totalTransporters} total</span>
            )}
            {selected.length > 0 && (
              <span className="transporter-page-section-count">
                {selected.length} selected
              </span>
            )}
          </div>
        </div>

        <TransporterTable
          selected={selected}
          setSelected={setSelected}
          onUpdate={handleUpdate}
          searchQuery={searchQuery}
          statusFilter={activeStatuses}
          autoRefresh={true}
          refreshInterval={30000}
        />
      </div>

    </div>
  );
}