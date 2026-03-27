'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSessionUser, logoutUser } from '@/lib/api';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/dashboard',     icon: '🏠' },
  { label: 'Users',         href: '/users',         icon: '👥' },
  { label: 'Shipments',     href: '/shipments',     icon: '📦' },
  { label: 'Hubs',          href: '/hubs',          icon: '🏭' },
  { label: 'Transporters',  href: '/transporters',  icon: '🚛' },
  { label: 'Payments',      href: '/payments',      icon: '💳' },
  { label: 'Reports',       href: '/reports',       icon: '📊' },
  { label: 'Settings',      href: '/settings',      icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
            <path d="M1 3h15v13H1z"/>
            <path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-logo-name">Trackship</div>
          <div className="sidebar-logo-sub">Logistics Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="avatar avatar-sm">{user.name?.charAt(0) || 'A'}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="nav-item w-full">
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>

      <style jsx>{`
        .sidebar-user {
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-info {
          flex: 1;
        }
        .user-name {
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .user-role {
          color: rgba(255,255,255,0.5);
          font-size: 0.7rem;
        }
      `}</style>
    </aside>
  );
}