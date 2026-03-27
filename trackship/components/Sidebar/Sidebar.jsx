'use client';
// components/Sidebar/Sidebar.jsx
// Fixed sidebar — uses Sidebar.module.css exclusively
// Active link detection via usePathname(); badge count passed as prop

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Package, Warehouse,
  Truck, CreditCard, BarChart3, Settings,
  LogOut, Menu, X,
} from 'lucide-react';
import s from './Sidebar.module.css';
import logoPlaceholder from '../../assets/logo-placeholder.png'; 

// ── Nav definitions — href maps to app/(...)/page.jsx routes ────────────────
const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users',        icon: Users,           label: 'Users'     },
  { href: '/shipments',    icon: Package,         label: 'Shipments' },
  { href: '/hubs',         icon: Warehouse,       label: 'Hubs'      },
  { href: '/transporters', icon: Truck,           label: 'Transporters', badgeKey: 'transporters' },
  { href: '/payments',     icon: CreditCard,      label: 'Payments'  },
  { href: '/reports',      icon: BarChart3,       label: 'Reports'   },
  { href: '/settings',     icon: Settings,        label: 'Settings'  },
];

// badgeCounts: { transporters: 3 } — passed from parent (dashboard page)
export default function Sidebar({ user, badgeCounts = {}, onLogout }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);   // mobile drawer state

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <>
      {/* ── Mobile hamburger ───────────────────────────────── */}
      <button className={s.mobileToggle} onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Backdrop (mobile only) ─────────────────────────── */}
      {open && <div className={s.overlay} onClick={() => setOpen(false)} />}

      {/* ── Sidebar panel ─────────────────────────────────── */}
      <aside className={`${s.sidebar} ${open ? s.open : ''}`}>

        {/* Logo */}
        <div className={s.logo}>
          <Image
            src={logoPlaceholder} 
            alt="TrackShip"
            width={140}
            height={36}
            className={s.logoImg}
            priority
          />
        </div>

        {/* Navigation */}
        <nav className={s.nav}>
          <span className={s.navLabel}>Main Menu</span>

          {NAV.map(({ href, icon: Icon, label, badgeKey }) => {
            const isActive = path === href || path?.startsWith(href + '/');
            const count = badgeKey ? badgeCounts[badgeKey] : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`${s.navItem} ${isActive ? s.active : ''}`}
                onClick={() => setOpen(false)}   // close on mobile tap
              >
                <Icon className={s.navIcon} size={18} />
                <span className={s.navText}>{label}</span>
                {count > 0 && <span className={s.badge}>{count}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info + logout */}
        <div className={s.bottomUser} onClick={onLogout} title="Logout">
          <div className={s.avatar}>{initials}</div>
          <div className={s.userInfo}>
            <div className={s.userName}>{user?.name ?? 'Admin'}</div>
            <div className={s.userRole}>{user?.role ?? 'Administrator'}</div>
          </div>
          <LogOut size={15} color="var(--text-muted)" />
        </div>

      </aside>
    </>
  );
}