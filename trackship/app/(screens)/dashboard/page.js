'use client';
// app/(screens)/dashboard/page.jsx

import { useState, useEffect, useCallback } from 'react';
import { Package, Truck, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

import TopBar    from '@/components/Topbar/Topbar';
import StatCard  from '@/components/dashboard/StatCard';
import HubChart  from '@/components/dashboard/HubChart';
import RightPanel from '@/components/dashboard/RightPanel';

import {
  getDashboardSummary,
  getHubShipments,
  getDashboardPendingTransporters,   // ← correct export name from index.js
  getAdminProfile,
} from '@/lib/api';

import s from './dashboard.module.css';

export default function DashboardPage() {
  const [user,           setUser]           = useState(null);
  const [startDate,      setStartDate]      = useState(null);
  const [endDate,        setEndDate]        = useState(null);
  const [summary,        setSummary]        = useState(null);
  const [hubs,           setHubs]           = useState([]);
  const [transporters,   setTransporters]   = useState([]);
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [loadingMain,    setLoadingMain]    = useState(true);
  const [loadingT,       setLoadingT]       = useState(true);
  const [loadingV]                          = useState(false);   // no vehicle endpoint yet
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error,          setError]          = useState(null);

  // ── Profile ──
  useEffect(() => {
    getAdminProfile()
      .then(setUser)
      .catch((err) => console.error('Failed to fetch profile:', err))
      .finally(() => setLoadingProfile(false));
  }, []);

  // ── Main stats ──
  const buildParams = useCallback(() => {
    if (startDate && endDate) return { startDate, endDate };
    if (startDate)            return { startDate };
    return {};
  }, [startDate, endDate]);

  const fetchMain = useCallback(async () => {
    setLoadingMain(true);
    setError(null);
    try {
      const [sum, hubData] = await Promise.all([
        getDashboardSummary(buildParams()),
        getHubShipments(buildParams()),
      ]);
      setSummary(sum);
      setHubs(hubData);
    } catch (err) {
      setError(err.message ?? 'Failed to load dashboard data');
    } finally {
      setLoadingMain(false);
    }
  }, [buildParams]);

  // ── Pending transporters ──
  const fetchTransporters = useCallback(async () => {
    setLoadingT(true);
    try {
      const data = await getDashboardPendingTransporters();
      setTransporters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Transporters fetch error:', err);
      setTransporters([]);
    } finally {
      setLoadingT(false);   // ← always clears, even on error
    }
  }, []);

  useEffect(() => {
    fetchMain();
    fetchTransporters();
  }, [fetchMain, fetchTransporters]);

  useEffect(() => { fetchMain(); }, [startDate, endDate, fetchMain]);

  const handleRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const getSubtitle = () => {
    if (startDate && endDate) return `Showing data from ${startDate} to ${endDate}`;
    if (startDate)            return `Showing data for ${startDate}`;
    return 'All-time overview';
  };

  const successPct = summary
    ? isNaN(Number(summary.success_rate)) ? '0%' : `${Number(summary.success_rate).toFixed(1)}%`
    : '—';

  if (loadingProfile) {
    return (
      <main className={s.main}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading…
        </div>
      </main>
    );
  }

  return (
    <div className={s.shell}>
      <main className={s.main}>
        <TopBar
          user={user}
          title="Shipment Statistics"
          subtitle={getSubtitle()}
          hasNotifs={transporters.length > 0 || vehicleDocuments.length > 0}
        />

        {error && (
          <div className={s.error}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className={s.content}>
          <div className={s.left}>
            <div className={s.statsRow}>
              <StatCard
                hero
                icon={<Package size={20} color="#F5B700" />}
                iconBg="rgba(245,183,0,0.15)"
                label="Total Shipments"
                value={loadingMain ? '…' : summary?.total_shipments ?? 0}
                sub="All registered shipments"
                blobColor="#F5B700"
              />
              <StatCard
                icon={<CheckCircle size={20} color="#22C55E" />}
                iconBg="#DCFCE7"
                label="Shipment Delivered"
                value={loadingMain ? '…' : summary?.delivered_shipments ?? 0}
                sub="Successfully completed"
                blobColor="#22C55E"
              />
              <StatCard
                icon={<Truck size={20} color="#0EA5E9" />}
                iconBg="#E0F2FE"
                label="Active Drivers"
                value={loadingMain ? '…' : summary?.active_drivers ?? 0}
                sub="Currently on routes"
                blobColor="#0EA5E9"
              />
              <StatCard
                icon={<TrendingUp size={20} color="#818CF8" />}
                iconBg="#EDE9FE"
                label="Success Rate"
                value={loadingMain ? '…' : successPct}
                sub="Delivery success %"
                blobColor="#818CF8"
              />
            </div>

            <HubChart data={hubs} loading={loadingMain} />
          </div>

          <div className={s.right}>
            <RightPanel
              startDate={startDate}
              endDate={endDate}
              onRangeChange={handleRangeChange}
              transporters={transporters}
              vehicleDocuments={vehicleDocuments}
              loadingT={loadingT}
              loadingV={loadingV}
            />
          </div>
        </div>
      </main>
    </div>
  );
}