'use client';
// app/(screens)/layout.js
// Wraps all admin screens with the fixed Sidebar

import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import { logoutUser } from '@/lib/api';

export default function ScreensLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  // Don't render sidebar on login page
  if (pathname === '/login') {
    return children;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        user={null}  // Will be populated by individual pages
        badgeCounts={{}}
        onLogout={handleLogout}
      />
      <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1 }}>
        {children}
      </main>
    </div>
  );
}