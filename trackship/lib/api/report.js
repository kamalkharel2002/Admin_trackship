// lib/api/report.js
import { ENDPOINTS, buildQueryString } from '../config';
import { request } from './client';

/**
 * GET /admin/reports/revenue/total
 * @param {{ month?: number, year?: number }} params
 */
export async function getTotalRevenue(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.totalRevenue}${qs}`, { method: 'GET' });
}

/**
 * GET /admin/reports/shipments/delivered/total
 * @param {{ month?: number, year?: number }} params
 */
export async function getTotalDeliveredShipments(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.totalDelivered}${qs}`, { method: 'GET' });
}

/**
 * GET /admin/reports/transporter/count
 */
export async function getTransporterCount() {
  return request(ENDPOINTS.reports.transporterCount, { method: 'GET' });
}

/**
 * GET /admin/reports/revenue/monthly-graph
 * @param {{ year?: number }} params
 */
export async function getMonthlyRevenueGraph(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.monthlyRevenueGraph}${qs}`, { method: 'GET' });
}

/**
 * GET /admin/reports/shipments/status-distribution
 * @param {{ month?: number, year?: number }} params
 */
export async function getShipmentStatusDistribution(params = {}) {
  const qs = buildQueryString(params);
  return request(`${ENDPOINTS.reports.statusDistribution}${qs}`, { method: 'GET' });
}

/**
 * Download Revenue CSV
 * @param {{ start_date?: string, end_date?: string }} params
 */
export async function exportRevenueCSV(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${ENDPOINTS.reports.exportRevenueCSV}${qs}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Accept': 'text/csv',
    },
  });
  if (!res.ok) throw new Error('Failed to export revenue CSV');
  const blob = await res.blob();
  triggerDownload(blob, `revenue-report-${params.start_date ?? 'all'}-to-${params.end_date ?? 'all'}.csv`);
}

/**
 * Download Shipment CSV
 * @param {{ start_date?: string, end_date?: string }} params
 */
export async function exportShipmentCSV(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${ENDPOINTS.reports.exportShipmentCSV}${qs}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Accept': 'text/csv',
    },
  });
  if (!res.ok) throw new Error('Failed to export shipment CSV');
  const blob = await res.blob();
  triggerDownload(blob, `shipment-report-${params.start_date ?? 'all'}-to-${params.end_date ?? 'all'}.csv`);
}

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}