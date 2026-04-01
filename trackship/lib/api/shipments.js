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
      cache: 'no-store',
      signal: controller.signal,
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    console.log("🌐 API RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    console.error("❌ API ERROR:", err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ───────── NORMALIZERS ───────── */

function formatStatus(value) {
  const key = String(value || '').toLowerCase().replace(/\s+/g, '_');

  const map = {
    delivered: 'Delivered',
    in_transit: 'In Transit',
    pending: 'Pending',
    delayed: 'Delayed',
    transporter_assigned: 'Transporter Assigned',
    received_at_hub: 'Received at Hub',
    verified_at_hub: 'Verified at Hub',
    delivered_at_hub: 'Delivered at Hub',
    request_accepted: 'Request Accepted',
  };

  if (map[key]) return map[key];
  return String(value || 'Unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeShipments(raw) {
  if (!raw) return [];

  const payload = Array.isArray(raw.shipments)
    ? raw.shipments
    : Array.isArray(raw)
    ? raw
    : [];

  return payload.map((s) => ({
    shipment_id: s.shipment_id,
    shipment_code: s.shipment_code,
    sender: s.sender_name || 'Unknown',
    receiver: s.receiver_name || 'Unknown',
    route: `${s.source_hub || 'N/A'} - ${s.destination_hub || 'N/A'}`,
    status: formatStatus(s.status),
    statusKey: String(s.status || '').toLowerCase().replace(/\s+/g, '_'),
    transporter: s.transporter_name || 'Unassigned',
    delivery_mode: s.delivery_mode || 'Unknown',
    trip_id: s.trip_id ?? null,
    created_at: s.created_at,
  }));
}

function normalizeCounts(raw) {
  const payload = Array.isArray(raw?.shipmentCount?.shipmentCount)
    ? raw.shipmentCount.shipmentCount
    : [];

  return payload.map((c) => ({
    status: String(c.status).toLowerCase().replace(/\s+/g, '_'),
    count: Number(c.count || 0),
  }));
}

/* ───────── MAIN API ───────── */

export async function getShipments(params = {}) {
  if (params.offset !== undefined) params.offset = Number(params.offset);
  if (params.limit !== undefined) params.limit = Number(params.limit);

  const url = ENDPOINTS.shipments?.list
    ? ENDPOINTS.shipments.list + buildQueryString(params)
    : null;

  if (!url) {
    throw new Error('Shipment endpoint not configured');
  }

  const data = await requestWithAuth(url);

  return {
    shipments: normalizeShipments(data),
    counts: normalizeCounts(data),
    totalShipments: Number(data?.shipmentCount?.totalShipments?.count || 0),
    pagination: data?.pagination || {},
  };
}