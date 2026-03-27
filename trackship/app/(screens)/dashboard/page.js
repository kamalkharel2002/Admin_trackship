'use client';
// app/dashboard/page.jsx
// Dashboard orchestrator:
//   1. Fetches summary, hub shipments, pending transporters on mount
//   2. Refetches summary + hubs when selectedDate changes
//   3. Passes data down to StatCard, HubChart, RightPanel, TopBar, Sidebar

import { useState, useEffect, useCallback } from 'react';
import {
  Package, Truck, CheckCircle, TrendingUp, AlertCircle,
} from 'lucide-react';

import Sidebar       from '@/components/Sidebar/Sidebar';
import TopBar        from '@/components/dashboard/TopBar';
import StatCard      from '@/components/dashboard/StatCard';
import HubChart      from '@/components/dashboard/HubChart';
import RightPanel    from '@/components/dashboard/RightPanel';

import {
  getDashboardSummary,
  getHubShipments,
  getPendingTransporters,
  getSessionUser,
  logoutUser,
} from '@/lib/api';

import s from './dashboard.module.css';

export default function DashboardPage() {
  const user = getSessionUser();                  // read cached user from localStorage

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate]       = useState(null);  // 'YYYY-MM-DD' | null
  const [summary,      setSummary]            = useState(null);
  const [hubs,         setHubs]               = useState([]);
  const [transporters, setTransporters]       = useState([]);
  const [loadingMain,  setLoadingMain]        = useState(true);
  const [loadingT,     setLoadingT]           = useState(true);
  const [error,        setError]              = useState(null);

  // ── Fetch summary + hubs (re-runs when date changes) ──────────────────────
  const fetchMain = useCallback(async (date) => {
    setLoadingMain(true);
    setError(null);
    try {
      const params = date ? { date } : {};
      const [sum, hubData] = await Promise.all([
        getDashboardSummary(params),
        getHubShipments(params),
      ]);
      setSummary(sum);
      setHubs(hubData);
    } catch (err) {
      setError(err.message ?? 'Failed to load dashboard data');
    } finally {
      setLoadingMain(false);
    }
  }, []);

  // ── Fetch pending transporters once on mount ───────────────────────────────
  const fetchTransporters = useCallback(async () => {
    setLoadingT(true);
    try {
      setTransporters(await getPendingTransporters());
    } catch {
      setTransporters([]);
    } finally {
      setLoadingT(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchMain(null); fetchTransporters(); }, [fetchMain, fetchTransporters]);

  // Re-fetch when date changes
  useEffect(() => { fetchMain(selectedDate); }, [selectedDate, fetchMain]);

  // ── Date handler ──────────────────────────────────────────────────────────
  const handleDateChange = d => {
    // Toggle: clicking same date clears it
    setSelectedDate(prev => prev === d ? null : d);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const successPct = summary
    ? isNaN(Number(summary.success_rate)) ? '0%' : `${Number(summary.success_rate).toFixed(1)}%`
    : '—';

  // Badge counts passed to Sidebar
  const badgeCounts = { transporters: transporters.length };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/login';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={s.shell}>

      {/* Fixed left sidebar */}
      <Sidebar user={user} badgeCounts={badgeCounts} onLogout={handleLogout} />

      {/* Scrollable main content */}
      <main className={s.main}>

        {/* Inline top bar: title + bell + profile */}
        <TopBar
          user={user}
          title="Shipment Statistics"
          subtitle={selectedDate ? `Showing data for ${selectedDate}` : 'All-time overview'}
          hasNotifs={transporters.length > 0}
        />

        {/* Error banner */}
        {error && (
          <div className={s.error}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Two-column layout */}
        <div className={s.content}>

          {/* ── Left column ── */}
          <div className={s.left}>

            {/* Stat cards row */}
            <div className={s.statsRow}>
              {/* Hero card: total shipments */}
              <StatCard
                hero
                icon={<Package size={20} color="#F5B700" />}
                iconBg="rgba(245,183,0,0.15)"
                label="Total Shipments"
                value={loadingMain ? '…' : summary?.total_shipments ?? 0}
                sub="All registered shipments"
                blobColor="#F5B700"
              />

              {/* Delivered */}
              <StatCard
                icon={<CheckCircle size={20} color="#22C55E" />}
                iconBg="#DCFCE7"
                label="Delivered"
                value={loadingMain ? '…' : summary?.delivered_shipments ?? 0}
                sub="Successfully completed"
                blobColor="#22C55E"
              />

              {/* Active Drivers */}
              <StatCard
                icon={<Truck size={20} color="#0EA5E9" />}
                iconBg="#E0F2FE"
                label="Active Drivers"
                value={loadingMain ? '…' : summary?.active_drivers ?? 0}
                sub="Currently on routes"
                blobColor="#0EA5E9"
              />

              {/* Success Rate */}
              <StatCard
                icon={<TrendingUp size={20} color="#818CF8" />}
                iconBg="#EDE9FE"
                label="Success Rate"
                value={loadingMain ? '…' : successPct}
                sub="Delivery success %"
                blobColor="#818CF8"
              />
            </div>

            {/* Hub deliveries bar chart */}
            <HubChart data={hubs} loading={loadingMain} />

            {/* Placeholder — future table goes here */}
            <div className={s.spacer}>Shipment table — coming soon</div>

          </div>

          {/* ── Right column: calendar + pending transporters ── */}
          <div className={s.right}>
            <RightPanel
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              transporters={transporters}
              loadingT={loadingT}
            />
          </div>

        </div>
      </main>
    </div>
  );
}