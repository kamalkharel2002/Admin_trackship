// lib/api/report.js
import { ENDPOINTS, buildQueryString } from '../config';
import { request } from './client';

export async function getTotalRevenue(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.totalRevenue}${qs}`, { method: 'GET' });
}

export async function getTotalDeliveredShipments(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.totalDelivered}${qs}`, { method: 'GET' });
}

export async function getMonthlyRevenueGraph(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.monthlyRevenueGraph}${qs}`, { method: 'GET' });
}

export async function getShipmentStatusDistribution(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.statusDistribution}${qs}`, { method: 'GET' });
}

/**
 * CSV exports — use fetch directly with credentials:'include' (same cookie auth
 * as the rest of the app) instead of going through request() which returns JSON.
 */
async function exportCSV(url, filename) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',   // ← sends the auth cookie, no localStorage needed
    cache: 'no-store',
  });

  if (res.status === 401) throw new Error('Session expired. Please log in again.');
  if (!res.ok) throw new Error(`Export failed (${res.status})`);

  const blob = await res.blob();
  const href = window.URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(href);
}

export function exportRevenueCSV(params = {}) {
  const qs = buildQueryString(params);
  const filename = `revenue-report-${params.start_date ?? 'all'}-to-${params.end_date ?? 'all'}.csv`;
  return exportCSV(`${ENDPOINTS.reports.exportRevenueCSV}${qs}`, filename);
}

export function exportShipmentCSV(params = {}) {
  const qs = buildQueryString(params);
  const filename = `shipment-report-${params.start_date ?? 'all'}-to-${params.end_date ?? 'all'}.csv`;
  return exportCSV(`${ENDPOINTS.reports.exportShipmentCSV}${qs}`, filename);
}