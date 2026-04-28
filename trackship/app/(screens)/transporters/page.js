'use client';
import { useEffect, useState } from 'react';
import TransporterHeader from '@/components/transporter/TransporterHeader';
import TransporterTable from '@/components/transporter/TransporterTable';
import { getTransporters } from '@/lib/api';
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

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      setLoadingStats(true);
      const data = await getTransporters({ offset: 0, limit: 100 });
      
      // Calculate statistics from transporter data
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
      
      // Merge ACTIVE into APPROVED count for display (since they're functionally the same)
      const approvedCount = statusCounts['APPROVED'] + statusCounts['ACTIVE'];
      
      const statsArray = [
        { status: 'Pending', key: 'PENDING_VERIFICATION', count: statusCounts['PENDING_VERIFICATION'], color: '#F97316' },
        { status: 'Approved', key: 'APPROVED', count: approvedCount, color: '#22C55E' },
        { status: 'Declined', key: 'DECLINED', count: statusCounts['DECLINED'], color: '#EF4444' }
      ];
      
      setStats(statsArray);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  function handleStatusToggle(statusId) {
    if (statusId === null) {
      setActiveStatuses([]);
      return;
    }
    setActiveStatuses(prev =>
      prev.includes(statusId)
        ? prev.filter(s => s !== statusId)
        : [...prev, statusId]
    );
  }

  // Handle search from header
  function handleSearch(searchValue) {
    setSearchQuery(searchValue);
  }

  const totalTransporters = stats.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

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

      {/* ── Stat cards ── */}
      {loadingStats ? (
        <div className="transporter-page-stats-loading">
          {[...Array(3)].map((_, i) => <div key={i} className="transporter-page-stat-skeleton" />)}
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

      {/* ── Transporter Header with Search and Filter ── */}
      <TransporterHeader
        selected={selected}
        onSearch={handleSearch}
        activeStatuses={activeStatuses}
        onStatusToggle={handleStatusToggle}
      />

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
          onUpdate={fetchStats}
          searchQuery={searchQuery}
          statusFilter={activeStatuses}
        />
      </div>

    </div>
  );
}