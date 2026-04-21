// lib/config.js

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://192.168.56.1:3000/api';

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
};

export function buildQueryString(params = {}) {
  const queryParams = {};
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate)   queryParams.endDate   = params.endDate;
  if (params.status)    queryParams.status    = params.status;
  if (params.page)      queryParams.page      = params.page;
  if (params.limit)     queryParams.limit     = params.limit;
  
  const filtered = Object.entries(queryParams).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!filtered.length) return '';
  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}