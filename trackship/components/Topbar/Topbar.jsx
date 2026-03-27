'use client';
// components/TopBar/TopBar.jsx
// Inline top bar — not fixed, sits inside the main content area
// Shows: page title, subtitle, notification bell, profile chip

import { Bell, ChevronDown } from 'lucide-react';
import s from './Topbar.module.css';

export default function TopBar({ user, title = 'Dashboard', subtitle, hasNotifs = false }) {
  const getInitials = (name) => {
  if (!name || name === 'Admin') return 'AD';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // For single word names, take first two characters
    return words[0].slice(0, 2).toUpperCase();
  }
  
  // For multiple words, take first character of first two words
  return words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

const initials = getInitials(user?.name);

  return (
    <div className={s.topbar}>
      {/* Page title block */}
      <div className={s.titleBlock}>
        <div className={s.pageTitle}>{title}</div>
        {subtitle && <div className={s.pageSubtitle}>{subtitle}</div>}
      </div>

      {/* Right: notification + profile */}
      <div className={s.actions}>
        {/* Bell */}
        <button className={s.notifBtn} aria-label="Notifications">
          <Bell size={17} />
          {hasNotifs && <span className={s.notifDot} />}
        </button>

        {/* Profile chip */}
        <div className={s.profileChip}>
          <div className={s.profileAvatar}>{initials}</div>
          <span className={s.profileName}>{user?.name ?? 'Admin'}</span>
          <ChevronDown size={14} className={s.chevron} />
        </div>
      </div>
    </div>
  );
}