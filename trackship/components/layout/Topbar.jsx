'use client';

/**
 * Topbar — reusable across all pages.
 * Usage:
 *   <Topbar title="Dashboard" subtitle="All-time overview" />
 */
export default function Topbar({ title, subtitle }) {
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div className="topbar-right">
        {/* Notifications */}
        <button className="tb-icon-btn" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="tb-notif-badge">2</span>
        </button>

        {/* Profile */}
        <div className="tb-profile">
          <div className="tb-avatar">AD</div>
          <div>
            <div className="tb-name">Admin</div>
            <div className="tb-role">Super Admin</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  );
}