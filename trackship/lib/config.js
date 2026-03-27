export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.64:3000/api';

export const REQUEST_TIMEOUT = 15000;

export const ENDPOINTS = {
  auth: {
    login: `${API_BASE}/login`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
  },
  dashboard: {
    summary: `${API_BASE}/admin/dashboard/summary`,
    hubShipments: `${API_BASE}/admin/dashboard/hub-shipments`,
  },
};

export function buildQueryString(params = {}) {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!filtered.length) return '';
  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}