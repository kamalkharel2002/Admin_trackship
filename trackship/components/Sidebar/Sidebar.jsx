'use client';
// components/Sidebar/Sidebar.jsx

import { useState, useEffect } from 'react'; // Add useEffect
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

export default function Sidebar({ user, badgeCounts = {}, onLogout }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // Add mounted state

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only compute initials after mount to avoid hydration mismatch
  let initials = 'AD';
  if (mounted && user?.name) {
    initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  // If not mounted yet, render a placeholder to avoid mismatch
  if (!mounted) {
    return (
      <>
        <button className={s.mobileToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <aside className={`${s.sidebar}`}>
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
        </aside>
      </>
    );
  }

  return (
    <>
      <button className={s.mobileToggle} onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && <div className={s.overlay} onClick={() => setOpen(false)} />}

      <aside className={`${s.sidebar} ${open ? s.open : ''}`}>
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
                onClick={() => setOpen(false)}
              >
                <Icon className={s.navIcon} size={18} />
                <span className={s.navText}>{label}</span>
                {count > 0 && <span className={s.badge}>{count}</span>}
              </Link>
            );
          })}
        </nav>

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