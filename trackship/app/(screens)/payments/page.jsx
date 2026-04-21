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
} from '@/lib/api';

export default function PaymentReports() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    hubId: '',
    sourceHubId: '',
    destinationHubId: '',
    transactionType: '',
    transporterId: '',
    paymentStatus: '',
    deliveryMode: '',
    region: '',
  });

  const [dashboard, setDashboard] = useState(null);
  const [cashLedger, setCashLedger] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [hubBalances, setHubBalances] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);

  const [cashLedgerPage, setCashLedgerPage] = useState(1);
  const [reconciliationPage, setReconciliationPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const refreshTimerRef = useRef(null);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const options = await getPaymentFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getPaymentDashboardSummary(filters.hubId || null);
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, [filters.hubId]);

  const fetchCashLedger = useCallback(async () => {
    try {
      const data = await getCashLedgerReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        hubId: filters.hubId,
        transactionType: filters.transactionType,
        transporterId: filters.transporterId,
        page: cashLedgerPage,
        limit: 20,
      });
      setCashLedger(data);
    } catch (err) {
      console.error('Failed to load cash ledger:', err);
    }
  }, [filters, cashLedgerPage]);

  const fetchReconciliation = useCallback(async () => {
    try {
      const data = await getPaymentReconciliationReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        sourceHubId: filters.sourceHubId,
        destinationHubId: filters.destinationHubId,
        paymentStatus: filters.paymentStatus,
        deliveryMode: filters.deliveryMode,
        page: reconciliationPage,
        limit: 20,
      });
      setReconciliation(data);
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    }
  }, [filters, reconciliationPage]);

  const fetchHubBalances = useCallback(async () => {
    try {
      const data = await getHubWiseCashBalance({
        region: filters.region,
        hubId: filters.hubId,
      });
      setHubBalances(data);
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
    } catch (err) {
      setError('Failed to load payment reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchDashboard, fetchCashLedger, fetchReconciliation, fetchHubBalances]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => fetchAllData(true), 60000);
    return () => clearInterval(refreshTimerRef.current);
  }, [fetchAllData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCashLedgerPage(1);
    setReconciliationPage(1);
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      hubId: '',
      sourceHubId: '',
      destinationHubId: '',
      transactionType: '',
      transporterId: '',
      paymentStatus: '',
      deliveryMode: '',
      region: '',
    });
  };

  if (loading && !dashboard && !cashLedger && !reconciliation && !hubBalances) {
    return (
      <div className="pr-container">
        <div className="pr-loading">
          <div className="pr-spinner" />
          <span>Loading payment reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-container">
      <PaymentHeader 
        onRefresh={() => fetchAllData(true)} 
        refreshing={refreshing}
      />

      <div className="pr-tabs">
        <button
          className={`pr-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >Dashboard</button>
        <button
          className={`pr-tab ${activeTab === 'cashLedger' ? 'active' : ''}`}
          onClick={() => setActiveTab('cashLedger')}
        >Cash Ledger</button>
        <button
          className={`pr-tab ${activeTab === 'reconciliation' ? 'active' : ''}`}
          onClick={() => setActiveTab('reconciliation')}
        >Payment Reconciliation</button>
        <button
          className={`pr-tab ${activeTab === 'hubBalances' ? 'active' : ''}`}
          onClick={() => setActiveTab('hubBalances')}
        >Hub Cash Balances</button>
      </div>

      <PaymentFilters
        activeTab={activeTab}
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        onExport={() => {}}
        exporting={exporting}
      />

      {error && (
        <div className="pr-error">
          {error}
          <button onClick={() => fetchAllData()}>Retry</button>
        </div>
      )}

      {activeTab === 'dashboard' && <PaymentDashboard data={dashboard} />}
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
      {activeTab === 'hubBalances' && <PaymentHubBalances data={hubBalances} />}
    </div>
  );
}