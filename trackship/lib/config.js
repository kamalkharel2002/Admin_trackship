// lib/config.js

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://192.168.56.1:3000/api';

export const REQUEST_TIMEOUT = 15000;

export const ENDPOINTS = {
  auth: {
    login:  `${API_BASE}/admin/auth/login`,
    logout: `${API_BASE}/admin/auth/logout`,
    refresh: `${API_BASE}/admin/auth/refresh`,
  },
  dashboard: {
    summary:      `${API_BASE}/admin/dashboard/summary`,
    hubShipments: `${API_BASE}/admin/dashboard/hub-shipments`,
    adminProfile: `${API_BASE}/admin/dashboard/admin-profile`,
  },
  transporters: {
    pending:   `${API_BASE}/admin/transporters/pending`,
    all:       `${API_BASE}/admin/transporters/all`,
    list:      `${API_BASE}/admin/transporters`,
    documents: (id) => `${API_BASE}/admin/transporters/${id}/documents`,
    verify:    (id) => `${API_BASE}/admin/transporters/${id}/verify`,
    // Vehicle document endpoints
    pendingVehicleDocs: (id) => `${API_BASE}/admin/transporters/${id}/vehicle-documents/pending`,
    verifyVehicleDoc: (id) => `${API_BASE}/admin/vehicle-documents/${id}/verify`,
    // Optional batch endpoint (can be added to backend)
    allPendingVehicleDocs: `${API_BASE}/admin/transporters/vehicle-documents/pending/all`,
    checkVehicleStatus: (id) => `${API_BASE}/admin/vehicles/${id}/check-status`,
  },
  setting: {
    details: `${API_BASE}/admin/profile/details`,
    phone: `${API_BASE}/admin/profile/phone`,
    password: `${API_BASE}/admin/profile/password`
  },
  hubs: {
    list:                      `${API_BASE}/admin/hub`,
    byId:              (id) => `${API_BASE}/admin/hub/${id}`,
    coordinators:              `${API_BASE}/admin/hub-coordinator/list`,
    coordinatorsByHub: (id) => `${API_BASE}/admin/hub/${id}/coordinators`,
  },
  user: {
    list:           `${API_BASE}/admin/users`,
    create:         `${API_BASE}/admin/users`,
    update: (id) => `${API_BASE}/admin/users/${id}`,
    delete: (id) => `${API_BASE}/admin/users/${id}`,
  },
  shipments: {
    list:         `${API_BASE}/admin/shipments`,
    byId: (id) => `${API_BASE}/admin/shipments/${id}`,
  },
  transporter: {
    profile:                       `${API_BASE}/transporter/profile`,
    documents:             (id) => `${API_BASE}/transporter/${id}/documents`,
    uploadDocument:        (id) => `${API_BASE}/transporter/${id}/documents/upload`,
    vehicles:              (id) => `${API_BASE}/transporter/${id}/vehicles`,
    vehicleDocuments:      (id) => `${API_BASE}/transporter/vehicles/${id}/documents`,
    uploadVehicleDocument: (id) => `${API_BASE}/transporter/vehicles/${id}/documents/upload`,
    shipments:                     `${API_BASE}/transporter/shipments`,
    shipmentDetails:       (id) => `${API_BASE}/transporter/shipments/${id}`,
    updateShipmentStatus:  (id) => `${API_BASE}/transporter/shipments/${id}/status`,
    earnings:                      `${API_BASE}/transporter/earnings`,
    earningsBreakdown:             `${API_BASE}/transporter/earnings/breakdown`,
    updateProfile:                 `${API_BASE}/transporter/profile/update`,
  },
  paymentReports: {
    dashboardSummary:            `${API_BASE}/payment-reports/dashboard-summary`,
    cashLedger:                  `${API_BASE}/payment-reports/cash-ledger`,
    paymentReconciliation:       `${API_BASE}/payment-reports/payment-reconciliation`,
    hubCashBalance:              `${API_BASE}/payment-reports/hub-cash-balance`,
    filterOptions:               `${API_BASE}/payment-reports/filter-options`,
    exportCashLedger:            `${API_BASE}/payment-reports/cash-ledger/export`,
    exportPaymentReconciliation: `${API_BASE}/payment-reports/payment-reconciliation/export`,
  },
  reports: {
    totalRevenue:        `${API_BASE}/admin/report/revenue/total`,
    totalDelivered:      `${API_BASE}/admin/report/shipments/delivered/total`,
    monthlyRevenueGraph: `${API_BASE}/admin/report/revenue/monthly-graph`,
    statusDistribution:  `${API_BASE}/admin/report/shipments/status-distribution`,
    exportRevenueCSV:    `${API_BASE}/admin/report/export/revenue-csv`,
    exportShipmentCSV:   `${API_BASE}/admin/report/export/shipment-csv`,
  },
};

export function buildQueryString(params = {}) {
  const map = {
    startDate:        'startDate',
    endDate:          'endDate',
    start_date:       'start_date',
    end_date:         'end_date',
    status:           'status',
    page:             'page',
    limit:            'limit',
    month:            'month',
    year:             'year',
    hubId:            'hubId',
    sourceHubId:      'sourceHubId',
    destinationHubId: 'destinationHubId',
    transactionType:  'transactionType',
    transporterId:    'transporterId',
    paymentStatus:    'paymentStatus',
    deliveryMode:     'deliveryMode',
    region:           'region',
  };

  const filtered = Object.entries(params)
    .filter(([k, v]) => k in map && v !== undefined && v !== null && v !== '' && v !== 'all')
    .map(([k, v]) => [map[k], v]);

  if (!filtered.length) return '';
  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}