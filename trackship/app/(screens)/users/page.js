'use client';
import { useEffect, useState } from 'react';
import UsersHeader from '@/components/user/UsersHeader';
import UsersTable  from '@/components/user/UsersTable';
import { getUsers } from '@/lib/api/users';
import './UsersPage.css';

/* Accent palette cycling per card */
const ACCENTS = [
  { accent: '#F5B700', glow: 'rgba(245,183,0,0.09)'   },
  { accent: '#0EA5E9', glow: 'rgba(14,165,233,0.09)'  },
  { accent: '#22C55E', glow: 'rgba(34,197,94,0.09)'   },
  { accent: '#F97316', glow: 'rgba(249,115,22,0.09)'  },
  { accent: '#818CF8', glow: 'rgba(129,140,248,0.09)' },
];

export default function UsersPage() {
  const [selected, setSelected]             = useState([]);
  const [counts, setCounts]                 = useState([]);
  const [loadingCounts, setLoadingCounts]   = useState(true);

  useEffect(() => { fetchCounts(); }, []);

  async function fetchCounts() {
    try {
      setLoadingCounts(true);
      const data = await getUsers({ offset: 0, limit: 10 });
      setCounts(data.counts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCounts(false);
    }
  }

  const totalUsers = counts.reduce((sum, c) => sum + (Number(c.user_count) || 0), 0);

  return (
    <div className="users-page">

      {/* ── Top bar ─────────────────────────────── */}
      <div className="users-page-topbar">
        <div className="users-page-title-block">
          <h2 className="users-page-title">Users List</h2>
          <div className="users-page-breadcrumb">
            <span>Admin Dashboard</span>
            <span className="users-page-breadcrumb-sep">›</span>
            <span className="users-page-breadcrumb-current">Users List</span>
          </div>
        </div>
        <UsersHeader selected={selected} />
      </div>

      {/* ── Stat cards ──────────────────────────── */}
      {loadingCounts ? (
        <div className="users-page-counts-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="users-page-count-skeleton" />
          ))}
        </div>
      ) : counts.length > 0 ? (
        <div className="users-page-counts">
          {counts.map((c, i) => {
            const { accent, glow } = ACCENTS[i % ACCENTS.length];
            return (
              <div
                key={i}
                className="users-page-count-card"
                style={{
                  '--up-card-accent': accent,
                  '--up-card-glow':   glow,
                }}
              >
                <div className="users-page-count-role">{c.role}</div>
                <div className="users-page-count-number">{c.user_count}</div>
                <div className="users-page-count-sub">
                  <span className="users-page-count-pill">
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M5 1l4 8H1z"/>
                    </svg>
                  </span>
                  members
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="users-page-counts-empty">No role data available</div>
      )}

      {/* ── Table section ───────────────────────── */}
      <div className="users-page-table-section">
        <div className="users-page-section-label">
          <span className="users-page-section-title">All Members</span>
          <div className="users-page-section-right">
            {totalUsers > 0 && (
              <span className="users-page-total-pill">
                {totalUsers} total
              </span>
            )}
            <span className="users-page-section-count">
              {selected.length > 0 ? `${selected.length} selected` : ''}
            </span>
          </div>
        </div>
        <UsersTable selected={selected} setSelected={setSelected} />
      </div>

    </div>
  );
}