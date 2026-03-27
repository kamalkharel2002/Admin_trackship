// lib/config.js — API base, all endpoints, timeout, query builder

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.64:3000/api';

export const REQUEST_TIMEOUT = 15000;

export const ENDPOINTS = {
  auth: {
    login:  `${API_BASE}/login`,
    logout: `${API_BASE}/auth/logout`,
    me:     `${API_BASE}/auth/me`,
  },
  dashboard: {
    summary:      `${API_BASE}/admin/dashboard/summary`,         // GET → summary stats
    hubShipments: `${API_BASE}/admin/dashboard/hub-shipments`,  // GET → per-hub bar chart
  },
  transporters: {
    pending: `${API_BASE}/admin/transporters/pending`,           // GET → pending driver requests
  },
};

// Converts params object to query string based on filter type
export function buildQueryString(params = {}) {
  // Handle date range or single date pattern
  const queryParams = {};
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  
  const filtered = Object.entries(queryParams).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  
  if (!filtered.length) return '';
  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}