'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import PaymentHeader from '@/components/payment/PaymentHeader';
import PaymentFilters from '@/components/payment/PaymentFilters';
import PaymentDashboard from '@/components/payment/PaymentDashboard';
import PaymentCashLedger from '@/components/payment/PaymentCashLedger';
import PaymentReconciliation from '@/components/payment/PaymentReconciliation';
import PaymentHubBalances from '@/components/payment/PaymentHubBalances';
import './PaymentReports.css';

import {
  getPaymentDashboardSummary,
  getCashLedgerReport,
  getPaymentReconciliationReport,
  getHubWiseCashBalance,
  getPaymentFilterOptions,
  exportCashLedgerCSV,
  exportPaymentReconciliationCSV,
} from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'dashboard',      label: 'Dashboard' },
  { key: 'cashLedger',     label: 'Cash Ledger' },
  { key: 'reconciliation', label: 'Reconciliation' },
  { key: 'hubBalances',    label: 'Hub Cash Balances' },
];

const DEFAULT_FILTERS = {
  startDate:            '',
  endDate:              '',
  hubId:                '',
  sourceHubId:          '',
  destinationHubId:     '',
  transactionType:      '',
  transporterId:        '',
  paymentStatus:        '',
  deliveryMode:         '',
  region:               '',
};

const AUTO_REFRESH_MS = 60_000;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentReports() {
  const [activeTab, setActiveTab]             = useState('dashboard');
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [exporting, setExporting]             = useState(false);
  const [error, setError]                     = useState(null);
  const [filters, setFilters]                 = useState(DEFAULT_FILTERS);
  const [dashboard, setDashboard]             = useState(null);
  const [cashLedger, setCashLedger]           = useState(null);
  const [reconciliation, setReconciliation]   = useState(null);
  const [hubBalances, setHubBalances]         = useState(null);
  const [filterOptions, setFilterOptions]     = useState(null);
  const [cashLedgerPage, setCashLedgerPage]   = useState(1);
  const [reconciliationPage, setReconciliationPage] = useState(1);

  const refreshTimerRef = useRef(null);

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchFilterOptions = useCallback(async () => {
    try {
      setFilterOptions(await getPaymentFilterOptions());
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(await getPaymentDashboardSummary(filters.hubId || null));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, [filters.hubId]);

  const fetchCashLedger = useCallback(async () => {
    try {
      setCashLedger(await getCashLedgerReport({
        startDate:       filters.startDate,
        endDate:         filters.endDate,
        hubId:           filters.hubId,
        transactionType: filters.transactionType,
        transporterId:   filters.transporterId,
        page:            cashLedgerPage,
        limit:           20,
      }));
    } catch (err) {
      console.error('Failed to load cash ledger:', err);
    }
  }, [filters, cashLedgerPage]);

  const fetchReconciliation = useCallback(async () => {
    try {
      setReconciliation(await getPaymentReconciliationReport({
        startDate:          filters.startDate,
        endDate:            filters.endDate,
        sourceHubId:        filters.sourceHubId,
        destinationHubId:   filters.destinationHubId,
        paymentStatus:      filters.paymentStatus,
        deliveryMode:       filters.deliveryMode,
        page:               reconciliationPage,
        limit:              20,
      }));
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    }
  }, [filters, reconciliationPage]);

  const fetchHubBalances = useCallback(async () => {
    try {
      setHubBalances(await getHubWiseCashBalance({
        region: filters.region,
        hubId:  filters.hubId,
      }));
    } catch (err) {
      console.error('Failed to load hub balances:', err);
    }
  }, [filters.region, filters.hubId]);

  const fetchAllData = useCallback(async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchDashboard(),
        fetchCashLedger(),
        fetchReconciliation(),
        fetchHubBalances(),
      ]);
    } catch {
      setError('Failed to load payment reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchDashboard, fetchCashLedger, fetchReconciliation, fetchHubBalances]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);
  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => fetchAllData(true), AUTO_REFRESH_MS);
    return () => clearInterval(refreshTimerRef.current);
  }, [fetchAllData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCashLedgerPage(1);
    setReconciliationPage(1);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCashLedgerPage(1);
    setReconciliationPage(1);
  };

  const handleExport = async (tabName) => {
    setExporting(true);
    try {
      if (tabName === 'cashLedger') {
        await exportCashLedgerCSV({
          startDate: filters.startDate,
          endDate: filters.endDate,
          hubId: filters.hubId,
          transactionType: filters.transactionType,
          transporterId: filters.transporterId,
        });
      } else if (tabName === 'reconciliation') {
        await exportPaymentReconciliationCSV({
          startDate: filters.startDate,
          endDate: filters.endDate,
          sourceHubId: filters.sourceHubId,
          destinationHubId: filters.destinationHubId,
          paymentStatus: filters.paymentStatus,
          deliveryMode: filters.deliveryMode,
        });
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── Loading screen ───────────────────────────────────────────────────────────

  const isFirstLoad = loading && !dashboard && !cashLedger && !reconciliation && !hubBalances;

  if (isFirstLoad) {
    return (
      <div className="pr-container">
        <div className="pr-loading">
          <div className="pr-spinner" />
          <span>Loading payment reports…</span>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="pr-container">
      <PaymentHeader
        onRefresh={() => fetchAllData(true)}
        refreshing={refreshing}
      />

      {/* Tabs */}
      <div className="pr-tabs" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={`pr-tab${activeTab === key ? ' active' : ''}`}
            onClick={() => handleTabChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <PaymentFilters
        activeTab={activeTab}
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        onExport={handleExport}
        exporting={exporting}
      />

      {/* Error */}
      {error && (
        <div className="pr-error" role="alert">
          {error}
          <button onClick={() => fetchAllData()}>Retry</button>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'dashboard' && (
        <PaymentDashboard data={dashboard} />
      )}

      {activeTab === 'cashLedger' && (
        <PaymentCashLedger
          data={cashLedger}
          page={cashLedgerPage}
          onPageChange={setCashLedgerPage}
        />
      )}

      {activeTab === 'reconciliation' && (
        <PaymentReconciliation
          data={reconciliation}
          page={reconciliationPage}
          onPageChange={setReconciliationPage}
        />
      )}

      {activeTab === 'hubBalances' && (
        <PaymentHubBalances data={hubBalances} />
      )}
    </div>
  );
}