import { ENDPOINTS, REQUEST_TIMEOUT, buildQueryString } from '@/lib/config';
import { getAccessToken } from './auth';

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requestWithAuth(url) {
  const token = getAccessToken();
  if (!token) {
    const error = new Error('Not authenticated');
    error.status = 401;
    throw error;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    if (!res.ok) {
      const message = data?.message || `Request failed (${res.status})`;
      const error = new Error(message);
      error.status = res.status;
      error.payload = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeSummary(raw) {
  const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  return {
    total_shipments: Number(payload?.total_shipments ?? 0),
    delivered_shipments: Number(payload?.delivered_shipments ?? 0),
    active_drivers: Number(payload?.active_drivers ?? 0),
    success_rate: payload?.success_rate ?? 0,
  };
}

function normalizeHubs(raw) {
  const payload = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  return payload.map((hub) => ({
    hub_id: hub.hub_id,
    name: hub.name,
    shipment_count: Number(hub.shipment_count ?? 0),
  }));
}

export async function getDashboardSummary(params = {}) {
  const url = ENDPOINTS.dashboard.summary + buildQueryString(params);
  const data = await requestWithAuth(url);
  return normalizeSummary(data);
}

export async function getHubShipments(params = {}) {
  const url = ENDPOINTS.dashboard.hubShipments + buildQueryString(params);
  const data = await requestWithAuth(url);
  return normalizeHubs(data);
}

