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
    pending: `${API_BASE}/admin/transporters/pending`,
  },
  hubs: {
    list:        `${API_BASE}/admin/hub`,            // GET list / POST create
    byId: (id) => `${API_BASE}/admin/hub/${id}`,    // PUT update / DELETE
  },
  user: {
    list:   `${API_BASE}/admin/users`,
    create: `${API_BASE}/admin/users`,
    update: (id) => `${API_BASE}/admin/users/${id}`,
    delete: (id) => `${API_BASE}/admin/users/${id}`,
  },
  shipments: {
    list: `${API_BASE}/admin/shipments`,
    byId: (id) => `${API_BASE}/admin/shipments/${id}`,
  },
};

export function buildQueryString(params = {}) {
  const queryParams = {};
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate)   queryParams.endDate   = params.endDate;
  const filtered = Object.entries(queryParams).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!filtered.length) return '';
  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}