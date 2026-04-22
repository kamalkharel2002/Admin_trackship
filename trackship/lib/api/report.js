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
 * GET /admin/reports/dashboard/summary
 */
export async function getReportDashboardSummary() {
  return request(ENDPOINTS.reports.dashboardSummary, { method: 'GET' });
}

/**
 * Download Revenue CSV
 * @param {{ startDate?: string, endDate?: string }} params
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
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `revenue-report-${params.startDate ?? 'all'}-${params.endDate ?? 'all'}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Download Shipment CSV
 * @param {{ startDate?: string, endDate?: string, status?: string }} params
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
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shipment-report-${params.startDate ?? 'all'}-${params.endDate ?? 'all'}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}