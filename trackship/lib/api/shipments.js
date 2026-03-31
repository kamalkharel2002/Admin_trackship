// services/shipments.js
import { ENDPOINTS, REQUEST_TIMEOUT, buildQueryString } from '@/lib/config';

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requestWithAuth(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
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

/* ─────────────────────────────────────
   NORMALIZERS (MATCH BACKEND)
───────────────────────────────────── */

function normalizeShipments(raw) {
  const payload = Array.isArray(raw?.shipments)
    ? raw.shipments
    : [];

  return payload.map((s) => ({
    shipment_id: s.shipment_id,
    shipment_code: s.shipment_code,
    sender: s.sender_name,
    receiver: s.receiver_name,
    route: `${s.source_hub} - ${s.destination_hub}`,
    status: s.status,
    transporter: s.transporter_name || 'N/A',
    created_at: s.created_at,
  }));
}

function normalizeCounts(raw) {
  const payload = Array.isArray(raw?.shipmentCount?.shipmentCount)
    ? raw.shipmentCount.shipmentCount
    : [];

  return payload.map((c) => ({
    status: c.status,
    count: Number(c.count ?? 0),
  }));
}

/* ─────────────────────────────────────
   MAIN API
───────────────────────────────────── */

export async function getShipments(params = {}) {
  if (params.offset !== undefined) params.offset = Number(params.offset);
  if (params.limit !== undefined) params.limit = Number(params.limit);

  const url = ENDPOINTS.shipment?.list
    ? ENDPOINTS.shipment.list + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Shipment endpoint not configured');
  }

  const data = await requestWithAuth(url);

  return {
    shipments: normalizeShipments(data),
    counts: normalizeCounts(data),
    pagination: data.pagination || {},
  };
}