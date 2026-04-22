// lib/config.js

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.64:3000/api';

export const REQUEST_TIMEOUT = 15000;

export const ENDPOINTS = {
  auth: {
    login:  `${API_BASE}/admin/auth/login`,
    logout: `${API_BASE}/admin/auth/logout`,
  },
  dashboard: {
    summary:      `${API_BASE}/admin/dashboard/summary`,
    hubShipments: `${API_BASE}/admin/dashboard/hub-shipments`,
    adminProfile: `${API_BASE}/admin/dashboard/admin-profile`,
  },
  transporters: {
    pending:   `${API_BASE}/admin/transporters/pending`,
    list:      `${API_BASE}/admin/transporters`,
    documents: (id) => `${API_BASE}/admin/transporters/${id}/documents`,
    verify:    (id) => `${API_BASE}/admin/transporters/${id}/verify`,
  },
  hubs: {
    list:           `${API_BASE}/admin/hub`,
    byId:   (id) => `${API_BASE}/admin/hub/${id}`,
    coordinators:       `${API_BASE}/admin/hub-coordinator/list`,      
    coordinatorsByHub: (id) => `${API_BASE}/admin/hub/${id}/coordinators`, 
  },
  user: {
    list:           `${API_BASE}/admin/users`,
    create:         `${API_BASE}/admin/users`,
    update: (id) => `${API_BASE}/admin/users/${id}`,
    delete: (id) => `${API_BASE}/admin/users/${id}`,
  },
  shipments: {
    list: `${API_BASE}/admin/shipments`,
    byId: (id) => `${API_BASE}/admin/shipments/${id}`,
  },
  transporter: {
    profile: `${API_BASE}/transporter/profile`,
    documents: (id) => `${API_BASE}/transporter/${id}/documents`,
    uploadDocument: (id) => `${API_BASE}/transporter/${id}/documents/upload`,
    vehicles: (id) => `${API_BASE}/transporter/${id}/vehicles`,
    vehicleDocuments: (id) => `${API_BASE}/transporter/vehicles/${id}/documents`,
    uploadVehicleDocument: (id) => `${API_BASE}/transporter/vehicles/${id}/documents/upload`,
    shipments: `${API_BASE}/transporter/shipments`,
    shipmentDetails: (id) => `${API_BASE}/transporter/shipments/${id}`,
    updateShipmentStatus: (id) => `${API_BASE}/transporter/shipments/${id}/status`,
    earnings: `${API_BASE}/transporter/earnings`,
    earningsBreakdown: `${API_BASE}/transporter/earnings/breakdown`,
    updateProfile: `${API_BASE}/transporter/profile/update`,
  },
  paymentReports: {
    dashboardSummary:        `${API_BASE}/payment-reports/dashboard-summary`,
    cashLedger:              `${API_BASE}/payment-reports/cash-ledger`,
    paymentReconciliation:   `${API_BASE}/payment-reports/payment-reconciliation`,
    hubCashBalance:          `${API_BASE}/payment-reports/hub-cash-balance`,
    filterOptions:           `${API_BASE}/payment-reports/filter-options`,
    exportCashLedger:        `${API_BASE}/payment-reports/cash-ledger/export`,
    exportPaymentReconciliation: `${API_BASE}/payment-reports/payment-reconciliation/export`,
  },
  // ── Reports ──────────────────────────────────────────────────────────────
  reports: {
    totalRevenue:         `${API_BASE}/admin/reports/revenue/total`,
    totalDelivered:       `${API_BASE}/admin/reports/shipments/delivered/total`,
    monthlyRevenueGraph:  `${API_BASE}/admin/reports/revenue/monthly-graph`,
    statusDistribution:   `${API_BASE}/admin/reports/shipments/status-distribution`,
    exportRevenueCSV:     `${API_BASE}/admin/reports/export/revenue-csv`,
    exportShipmentCSV:    `${API_BASE}/admin/reports/export/shipment-csv`,
    dashboardSummary:     `${API_BASE}/admin/reports/dashboard/summary`,
  },
};

export function buildQueryString(params = {}) {
  const queryParams = {};
  
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate)   queryParams.endDate   = params.endDate;
  if (params.status)    queryParams.status    = params.status;
  if (params.page)      queryParams.page      = params.page;
  if (params.limit)     queryParams.limit     = params.limit;
  if (params.month)     queryParams.month     = params.month;
  if (params.year)      queryParams.year      = params.year;
  
  // Payment report specific params
  if (params.hubId)                queryParams.hubId = params.hubId;
  if (params.sourceHubId)          queryParams.sourceHubId = params.sourceHubId;
  if (params.destinationHubId)     queryParams.destinationHubId = params.destinationHubId;
  if (params.transactionType)      queryParams.transactionType = params.transactionType;
  if (params.transporterId)        queryParams.transporterId = params.transporterId;
  if (params.paymentStatus)        queryParams.paymentStatus = params.paymentStatus;
  if (params.deliveryMode)         queryParams.deliveryMode = params.deliveryMode;
  if (params.region)               queryParams.region = params.region;
  
  const filtered = Object.entries(queryParams).filter(
    ([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all'
  );
  
  if (!filtered.length) return '';
  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}