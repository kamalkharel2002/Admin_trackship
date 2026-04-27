// lib/api/report.js
import { ENDPOINTS, buildQueryString } from '../config';
import { request } from './client';

/**
 * GET /admin/report/revenue/total
 * Response: { success: true, data: { total_revenue: number } }
 */
export async function getTotalRevenue(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.totalRevenue}${qs}`, { method: 'GET' });
}

/**
 * GET /admin/report/shipments/delivered/total
 * Response: { success: true, data: { total_delivered: number } }
 */
export async function getTotalDeliveredShipments(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.totalDelivered}${qs}`, { method: 'GET' });
}

/**
 * GET /admin/report/revenue/monthly-graph?year=
 * Response: {
 *   success: true,
 *   data: {
 *     labels: string[],
 *     datasets: [{ label, data: number[], backgroundColor, borderColor, ... }]
 *   }
 * }
 */
export async function getMonthlyRevenueGraph(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.monthlyRevenueGraph}${qs}`, { method: 'GET' });
}

/**
 * GET /admin/report/shipments/status-distribution?month=&year=
 * Response: {
 *   success: true,
 *   data: { labels: string[], datasets: [{ data: number[], backgroundColor: string[] }] },
 *   summary: { total_shipments: number, status_breakdown: [{ status, count }] }
 * }
 */
export async function getShipmentStatusDistribution(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.statusDistribution}${qs}`, { method: 'GET' });
}

/**
 * Download Revenue CSV — triggers browser download
 * GET /admin/report/export/revenue-csv?start_date=&end_date=
 */
export async function exportRevenueCSV(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${ENDPOINTS.reports.exportRevenueCSV}${qs}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      Accept: 'text/csv',
    },
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  _download(blob, `revenue-report-${params.start_date ?? 'all'}-to-${params.end_date ?? 'all'}.csv`);
}

/**
 * Download Shipment CSV — triggers browser download
 * GET /admin/report/export/shipment-csv?start_date=&end_date=
 */
export async function exportShipmentCSV(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${ENDPOINTS.reports.exportShipmentCSV}${qs}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      Accept: 'text/csv',
    },
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  _download(blob, `shipment-report-${params.start_date ?? 'all'}-to-${params.end_date ?? 'all'}.csv`);
}

function _download(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}