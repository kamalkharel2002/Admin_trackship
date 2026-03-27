import Sidebar from '@/components/layout/Sidebar';

export default function ScreensLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}

