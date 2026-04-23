// paymentReportApi.js
import { ENDPOINTS, REQUEST_TIMEOUT, buildQueryString } from '@/lib/config';

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requestWithAuth(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
      ...options,
    });

    // For CSV exports, handle differently
    if (options.responseType === 'blob') {
      const blob = await res.blob();
      if (!res.ok) {
        const text = await blob.text();
        const data = parseJsonSafe(text);
        throw new Error(data?.message || `Export failed (${res.status})`);
      }
      return blob;
    }

    const text = await res.text();
    const data = parseJsonSafe(text);

    console.log("🌐 API RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    console.error("❌ API ERROR:", err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ───────── NORMALIZERS ───────── */

function normalizePaymentDashboardSummary(raw) {
  if (!raw) return null;

  return {
    totalCustomerCollections: Number(raw.total_customer_collections || 0),
    collectionsViaTransporter: Number(raw.collections_via_transporter || 0),
    collectionsViaHub: Number(raw.collections_via_hub || 0),
    totalTransporterSettlements: Number(raw.total_transporter_settlements || 0),
    unpaidShipmentsCount: Number(raw.unpaid_shipments_count || 0),
    unpaidShipmentsAmount: Number(raw.unpaid_shipments_amount || 0),
    totalHubCash: Number(raw.total_hub_cash || 0),
    hubCashBalances: (raw.hub_cash_balances || []).map(hub => ({
      hubId: hub.hub_id,
      name: hub.name,
      region: hub.region,
      currentCashBalance: Number(hub.current_cash_balance || 0)
    }))
  };
}

function normalizeCashLedgerTransaction(transaction) {
  return {
    id: transaction.id,
    shipmentId: transaction.shipment_id,
    shipmentCode: transaction.shipment_code || 'N/A',
    transporterId: transaction.transporter_id,
    transporterLicense: transaction.transporter_license || 'N/A',
    collectedFromUserId: transaction.collected_from_user_id,
    collectedFromUserName: transaction.collected_from_user_name || 'N/A',
    collectedByUserId: transaction.collected_by_user_id,
    collectedByUserName: transaction.collected_by_user_name || 'System',
    collectionHubId: transaction.collection_hub_id,
    hubName: transaction.hub_name || 'N/A',
    hubRegion: transaction.hub_region || 'N/A',
    amountCollected: Number(transaction.amount_collected || 0),
    transactionType: transaction.transaction_type,
    transactionDisplay: transaction.transaction_display || transaction.transaction_type,
    paymentMethod: transaction.payment_method || 'N/A',
    collectionTime: transaction.collection_time,
    description: transaction.description || '',
    deliveryMode: transaction.delivery_mode || 'N/A'
  };
}

function normalizeCashLedgerReport(raw) {
  if (!raw) return null;

  return {
    transactions: (raw.transactions || []).map(t => normalizeCashLedgerTransaction(t)),
    pagination: {
      currentPage: raw.pagination?.currentPage || 1,
      totalPages: raw.pagination?.totalPages || 1,
      totalItems: raw.pagination?.totalItems || 0,
      itemsPerPage: raw.pagination?.itemsPerPage || 50
    },
    summary: {
      byTransactionType: (raw.summary?.by_transaction_type || []).map(type => ({
        transactionType: type.transaction_type,
        transactionCount: Number(type.transaction_count || 0),
        totalAmount: Number(type.total_amount || 0)
      })),
      totalTransactions: raw.summary?.total_transactions || 0
    }
  };
}

function normalizePaymentReconciliationShipment(shipment) {
  return {
    shipmentId: shipment.shipment_id,
    shipmentCode: shipment.shipment_code,
    totalPrice: Number(shipment.total_price || 0),
    shipmentStatus: shipment.shipment_status || 'Unknown',
    sourceHubId: shipment.source_hub_id,
    sourceHubName: shipment.source_hub_name || 'N/A',
    destinationHubId: shipment.destination_hub_id,
    destinationHubName: shipment.destination_hub_name || 'N/A',
    createdAt: shipment.created_at,
    senderName: shipment.sender_external_name || 'N/A',
    senderPhone: shipment.sender_external_phone || 'N/A',
    receiverName: shipment.receiver_external_name || 'N/A',
    receiverPhone: shipment.receiver_external_phone || 'N/A',
    deliveryMode: shipment.delivery_mode || 'N/A',
    roadsidePointId: shipment.roadside_point_id,
    roadsidePointDescription: shipment.roadside_point_description,
    transporterId: shipment.transporter_id,
    transporterName: shipment.transporter_name || 'N/A',
    transporterLicense: shipment.transporter_license || 'N/A',
    overallPaymentStatus: shipment.overall_payment_status || 'Unknown',
    totalAmountPaid: Number(shipment.total_amount_paid || 0),
    remainingAmount: Number(shipment.remaining_amount || 0),
    
    // Transporter payment details (roadside)
    transporterPayment: {
      paymentId: shipment.payment_id,
      paymentStatus: shipment.pi_payment_status,
      amountPaid: Number(shipment.transporter_payment_amount || 0),
      paymentMethod: shipment.transporter_payment_method,
      paidAt: shipment.transporter_paid_at
    },
    
    // Hub payment details (direct)
    hubPayment: {
      cashLedgerId: shipment.cash_ledger_id,
      amountPaid: Number(shipment.hub_payment_amount || 0),
      paymentMethod: shipment.hub_payment_method,
      paidAt: shipment.hub_paid_at,
      transactionType: shipment.transaction_type
    }
  };
}

function normalizePaymentReconciliationReport(raw) {
  if (!raw) return null;

  return {
    shipments: (raw.shipments || []).map(s => normalizePaymentReconciliationShipment(s)),
    pagination: {
      currentPage: raw.pagination?.currentPage || 1,
      totalPages: raw.pagination?.totalPages || 1,
      totalItems: raw.pagination?.totalItems || 0,
      itemsPerPage: raw.pagination?.itemsPerPage || 50
    },
    summary: {
      totalShipments: Number(raw.summary?.total_shipments || 0),
      // Map backend fields to frontend expected fields
      paidToTransporterCount: Number(raw.summary?.paid_to_hub_count || 0), // Use hub count as transporter count
      paidToHubCount: Number(raw.summary?.paid_to_hub_count || 0),
      unpaidCount: Number(raw.summary?.unpaid_count || 0),
      roadsideDeliveries: Number(raw.summary?.roadside_deliveries || 0),
      hubDeliveries: Number(raw.summary?.hub_deliveries || 0),
      totalRevenue: Number(raw.summary?.total_revenue || 0),
      totalCollected: Number(raw.summary?.total_collected || 0),
      outstandingAmount: Number(raw.summary?.outstanding_amount || 0)
    }
  };
}

function normalizeHubCashBalance(raw) {
  if (!raw) return null;

  return {
    hubs: (raw.hubs || []).map(hub => ({
      hubId: hub.hub_id,
      name: hub.name,
      region: hub.region,
      currentCashBalance: Number(hub.current_cash_balance || 0),
      latitude: hub.latitude,
      longitude: hub.longitude,
      totalTransporterSettlements: Number(hub.total_transporter_settlements || 0),
      totalCustomerPayments: Number(hub.total_customer_payments || 0),
      shipmentsProcessed: Number(hub.shipments_processed || 0)
    })),
    summary: {
      totalHubs: raw.summary?.total_hubs || 0,
      totalCashBalance: Number(raw.summary?.total_cash_balance || 0),
      averageBalancePerHub: Number(raw.summary?.average_balance_per_hub || 0),
      totalTransporterSettlementsReceived: Number(raw.summary?.total_transporter_settlements_received || 0),
      totalCustomerPaymentsReceived: Number(raw.summary?.total_customer_payments_received || 0),
      totalCashInflow: Number(raw.summary?.total_cash_inflow || 0)
    }
  };
}

function normalizeFilterOptions(raw) {
  if (!raw) return null;

  return {
    hubs: (raw.hubs || []).map(hub => ({
      value: hub.hub_id,
      label: hub.name,
      region: hub.region
    })),
    transporters: (raw.transporters || []).map(t => ({
      value: t.transporter_id,
      label: t.user_name,
      licenseNo: t.license_no
    })),
    transactionTypes: (raw.transactionTypes || []).map(t => ({
      value: t.transaction_type,
      label: t.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    })),
    deliveryModes: (raw.deliveryModes || []).map(mode => ({
      value: mode.value,
      label: mode.label
    })),
    paymentStatuses: (raw.paymentStatuses || []).map(status => ({
      value: status.value,
      label: status.label
    }))
  };
}

/* ───────── MAIN API FUNCTIONS ───────── */

// Get dashboard summary for payments section
export async function getPaymentDashboardSummary(hubId = null) {
  const params = hubId ? { hubId } : {};
  const url = ENDPOINTS.paymentReports?.dashboardSummary
    ? ENDPOINTS.paymentReports.dashboardSummary + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Payment dashboard summary endpoint not configured');
  }

  const data = await requestWithAuth(url);
  return normalizePaymentDashboardSummary(data?.data);
}

// 1. Get Cash Ledger Report
export async function getCashLedgerReport(params = {}) {
  // Parse numeric parameters
  if (params.page) params.page = Number(params.page);
  if (params.limit) params.limit = Number(params.limit);
  if (params.hubId) params.hubId = Number(params.hubId);
  
  const url = ENDPOINTS.paymentReports?.cashLedger
    ? ENDPOINTS.paymentReports.cashLedger + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Cash ledger report endpoint not configured');
  }

  const data = await requestWithAuth(url);
  return normalizeCashLedgerReport(data?.data);
}

// 2. Get Payment Reconciliation Report
export async function getPaymentReconciliationReport(params = {}) {
  // Parse numeric parameters
  if (params.page) params.page = Number(params.page);
  if (params.limit) params.limit = Number(params.limit);
  if (params.sourceHubId) params.sourceHubId = Number(params.sourceHubId);
  if (params.destinationHubId) params.destinationHubId = Number(params.destinationHubId);
  
  const url = ENDPOINTS.paymentReports?.paymentReconciliation
    ? ENDPOINTS.paymentReports.paymentReconciliation + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Payment reconciliation report endpoint not configured');
  }

  const data = await requestWithAuth(url);
  return normalizePaymentReconciliationReport(data?.data);
}

// 3. Get Hub-wise Cash Balance Report
export async function getHubWiseCashBalance(params = {}) {
  const url = ENDPOINTS.paymentReports?.hubCashBalance
    ? ENDPOINTS.paymentReports.hubCashBalance + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Hub-wise cash balance endpoint not configured');
  }

  const data = await requestWithAuth(url);
  return normalizeHubCashBalance(data?.data);
}

// Get filter options for dropdowns
export async function getPaymentFilterOptions() {
  const url = ENDPOINTS.paymentReports?.filterOptions
    ? ENDPOINTS.paymentReports.filterOptions
    : null;

  if (!url) {
    throw new Error('Payment filter options endpoint not configured');
  }

  const data = await requestWithAuth(url);
  return normalizeFilterOptions(data?.data);
}

// Export Cash Ledger to CSV
export async function exportCashLedgerCSV(params = {}) {
  if (params.hubId) params.hubId = Number(params.hubId);
  
  const url = ENDPOINTS.paymentReports?.exportCashLedger
    ? ENDPOINTS.paymentReports.exportCashLedger + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Cash ledger export endpoint not configured');
  }

  const blob = await requestWithAuth(url, { responseType: 'blob' });
  
  // Trigger download
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `cash_ledger_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
  
  return { success: true };
}

// Export Payment Reconciliation to CSV
export async function exportPaymentReconciliationCSV(params = {}) {
  if (params.sourceHubId) params.sourceHubId = Number(params.sourceHubId);
  if (params.destinationHubId) params.destinationHubId = Number(params.destinationHubId);
  
  const url = ENDPOINTS.paymentReports?.exportPaymentReconciliation
    ? ENDPOINTS.paymentReports.exportPaymentReconciliation + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Payment reconciliation export endpoint not configured');
  }

  const blob = await requestWithAuth(url, { responseType: 'blob' });
  
  // Trigger download
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `payment_reconciliation_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
  
  return { success: true };
}