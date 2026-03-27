'use client';

import { useMemo, useState } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import HubChart from '@/components/dashboard/HubChart';
import DateFilterPanel from '@/components/dashboard/DateFilterPanel';
import DriverRequests from '@/components/dashboard/DriverRequests';
import DashboardHeaderControls from '@/components/dashboard/DashboardHeaderControls';
import { getDashboardSummary, getHubShipments } from '@/lib/api';
import { useEffect } from 'react';

export default function DashboardPage() {
  const [draft, setDraft] = useState({
    mode: 'single',
    date: '',
    startDate: '',
    endDate: '',
  });

  // Applied filter parameters sent to the dashboard endpoints.
  const [appliedFilter, setAppliedFilter] = useState(null);
  const [summary, setSummary] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setError('');
      try {
        const [s, h] = await Promise.all([
          getDashboardSummary(appliedFilter || {}),
          getHubShipments(appliedFilter || {}),
        ]);
        if (!alive) return;
        setSummary(s);
        setHubs(h);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || 'Failed to load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [appliedFilter]);

  const filtered = !!appliedFilter;

  const filteredLabel = useMemo(() => {
    if (!appliedFilter) return undefined;
    if (appliedFilter.mode === 'single') return `Filtered · ${appliedFilter.date}`;
    if (appliedFilter.mode === 'range')
      return `Filtered · ${appliedFilter.startDate} - ${appliedFilter.endDate}`;
    return 'Filtered';
  }, [appliedFilter]);

  const handleApply = () => {
    if (draft.mode === 'single') {
      if (!draft.date) return;
      setAppliedFilter({ mode: 'single', date: draft.date });
      return;
    }

    if (!draft.startDate || !draft.endDate) return;
    setAppliedFilter({
      mode: 'range',
      // Keys used by the backend endpoints wrapper.
      dateFrom: draft.startDate,
      dateTo: draft.endDate,
      // Keys used by the UI label.
      startDate: draft.startDate,
      endDate: draft.endDate,
    });
  };

  const handleClear = () => {
    setAppliedFilter(null);
    setDraft({ mode: 'single', date: '', startDate: '', endDate: '' });
  };

  return (
    <div className="page-body">
      {/* Top-right controls inside the main content (no global top bar). */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <DashboardHeaderControls />
      </div>

      <div style={{ display: 'flex', gap: 20, minWidth: 0, flex: 1 }}>
        {/* Main Content */}
        <div className="flex-1" style={{ minWidth: 0 }}>
          <DashboardStats summary={summary} loading={loading} />

          {error && (
            <div className="card card-pad-sm" style={{ marginBottom: 16, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          <HubChart
            data={hubs}
            loading={loading}
            filtered={filtered}
            date={filteredLabel}
          />

          {/* Intentionally blank placeholder below the graph for a future table */}
          <div
            style={{
              marginTop: 18,
              height: 140,
              borderRadius: 14,
              border: '2px dashed var(--border)',
              background: 'transparent',
            }}
          />
        </div>

        {/* Right Panel */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
            alignSelf: 'flex-start',
          }}
        >
          <DateFilterPanel
            draft={draft}
            appliedFilter={appliedFilter}
            summary={summary}
            onDraftChange={setDraft}
            onApply={handleApply}
            onClear={handleClear}
          />

          <div style={{ padding: 0 }}>
            <DriverRequests />
          </div>
        </div>
      </div>
    </div>
  );
}

