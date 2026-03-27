'use client';
// app/(screens)/layout.js
// Wraps all admin screens with the fixed Sidebar
// Sidebar needs: user (from localStorage), badgeCounts, onLogout

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import { getSessionUser, logoutUser } from '@/lib/api';

export default function ScreensLayout({ children }) {
  const router = useRouter();
  const user = getSessionUser();           // reads cached user from localStorage

  const handleLogout = async () => {
    await logoutUser();                    // clears session + calls logout endpoint
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Fixed sidebar — badgeCounts defaults to {} here;
          dashboard page passes real counts directly to its own Sidebar instance
          OR lift state here if you want badges globally */}
      <Sidebar
        user={user}
        badgeCounts={{}}
        onLogout={handleLogout}
      />

      {/* Main content offset by sidebar width */}
      <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1 }}>
        {children}
      </main>
    </div>
  );
}