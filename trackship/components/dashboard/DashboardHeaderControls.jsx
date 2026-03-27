'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionUser, logoutUser } from '@/lib/api';
import styles from './DashboardHeaderControls.module.css';

export default function DashboardHeaderControls() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const initials = useMemo(() => {
    const name = user?.name || 'Admin';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [user]);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={styles.wrap}>
      <button className="tb-icon-btn" title="Notifications" type="button">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="tb-notif-badge">2</span>
      </button>

      <div className={styles.profileWrap}>
        <button
          type="button"
          className="tb-profile"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="tb-avatar">{initials}</div>
          <div className={styles.profileText}>
            <div className="tb-name">{user?.name || 'Admin'}</div>
            <div className="tb-role">{user?.role || 'Super Admin'}</div>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s var(--ease)' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className={styles.dropdown} role="menu">
            <button
              type="button"
              className={styles.item}
              onClick={() => {
                setOpen(false);
                router.push('/settings');
              }}
            >
              Profile & Settings
            </button>
            <button
              type="button"
              className={styles.itemDanger}
              onClick={async () => {
                await logoutUser();
                setOpen(false);
                router.replace('/login');
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

