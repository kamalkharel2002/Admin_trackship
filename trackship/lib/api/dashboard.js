// lib/api/dashboard.js
// Fetches: summary stats, hub shipments, pending transporter requests

import { ENDPOINTS, REQUEST_TIMEOUT, buildQueryString } from '@/lib/config';
import { getAccessToken } from './auth';

// ── Safe JSON parse ──────────────────────────────────────────────────────────
function parseJsonSafe(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// ── Authenticated GET — aborts after REQUEST_TIMEOUT ms ──────────────────────
async function requestWithAuth(url) {
  const token = getAccessToken();
  if (!token) {
    const e = new Error('Not authenticated'); e.status = 401; throw e;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    const data = parseJsonSafe(await res.text());
    if (!res.ok) {
      const e = new Error(data?.message || `Request failed (${res.status})`);
      e.status = res.status; e.payload = data; throw e;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ── Normalizers: handles both { data: {...} } and flat shapes ─────────────────

function normalizeSummary(raw) {
  const p = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  const rate = parseFloat(p?.success_rate);
  return {
    total_shipments:     Number(p?.total_shipments     ?? 0),
    delivered_shipments: Number(p?.delivered_shipments ?? 0),
    active_drivers:      Number(p?.active_drivers      ?? 0),
    success_rate:        isNaN(rate) ? 0 : rate,   // 'NaN' string → 0
  };
}

function normalizeHubs(raw) {
  const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  return arr.map(h => ({
    hub_id:         h.hub_id,
    name:           h.name,
    shipment_count: Number(h.shipment_count ?? 0),
  }));
}

function normalizePendingTransporters(raw) {
  const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  return arr.map(t => ({
    id:        t.id ?? t.transporter_id ?? '',
    name:      t.name ?? t.user_name ?? 'Unknown',
    email:     t.email ?? '',
    phone:     t.phone ?? t.mobile ?? '',
    vehicle:   t.vehicle_type ?? t.vehicle ?? '—',
    submitted: t.created_at ?? t.submitted_at ?? '',
  }));
}

// ── Public exports ────────────────────────────────────────────────────────────

// params can be:
//   { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' } for date range
//   { startDate: 'YYYY-MM-DD' } for single date
export async function getDashboardSummary(params = {}) {
  const url = ENDPOINTS.dashboard.summary + buildQueryString(params);
  return normalizeSummary(await requestWithAuth(url));
}

// params can be:
//   { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' } for date range
//   { startDate: 'YYYY-MM-DD' } for single date
export async function getHubShipments(params = {}) {
  const url = ENDPOINTS.dashboard.hubShipments + buildQueryString(params);
  return normalizeHubs(await requestWithAuth(url));
}

// Always returns all pending transporter registration requests
export async function getPendingTransporters() {
  return normalizePendingTransporters(
    await requestWithAuth(ENDPOINTS.transporters.pending)
  );
}