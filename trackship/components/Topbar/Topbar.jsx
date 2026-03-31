'use client';
// components/TopBar/TopBar.jsx
// Inline top bar — not fixed, sits inside the main content area
// Shows: page title, subtitle, notification bell, profile chip

import { useState } from 'react';
import { Bell, ChevronDown, User, Mail, Phone, Calendar} from 'lucide-react';
import s from './Topbar.module.css';

export default function TopBar({ user, title = 'Dashboard', subtitle, hasNotifs = false }) {
  const [showProfile, setShowProfile] = useState(false);

  const getInitials = (name) => {
    if (!name || name === 'Admin') return 'AD';
    
    const words = name.trim().split(/\s+/);
    
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const initials = getInitials(user?.name);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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

        {/* Profile chip with dropdown */}
        <div className={s.profileWrapper}>
          <div 
            className={s.profileChip} 
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className={s.profileAvatar}>{initials}</div>
            <span className={s.profileName}>{user?.name ?? 'Admin'}</span>
            <ChevronDown size={14} className={`${s.chevron} ${showProfile ? s.chevronRotated : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {showProfile && (
            <>
              <div className={s.dropdownOverlay} onClick={() => setShowProfile(false)} />
              <div className={s.dropdown}>
                <div className={s.dropdownHeader}>
                  <div className={s.dropdownAvatar}>{initials}</div>
                  <div className={s.dropdownUserInfo}>
                    <div className={s.dropdownName}>{user?.name || 'Admin'}</div>
                    <div className={s.dropdownRole}>{user?.role || 'Administrator'}</div>
                  </div>
                </div>
                
                <div className={s.dropdownDivider} />
                
                <div className={s.dropdownSection}>
                  <div className={s.dropdownItem}>
                    <Mail size={16} />
                    <span>{user?.email || 'admin@example.com'}</span>
                  </div>
                  {user?.phone && (
                    <div className={s.dropdownItem}>
                      <Phone size={16} />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user?.joined_date && (
                    <div className={s.dropdownItem}>
                      <Calendar size={16} />
                      <span>Joined {formatDate(user.joined_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}