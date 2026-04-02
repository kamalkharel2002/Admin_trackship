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
    'at hub': 'At Hub',
    athub: 'At Hub',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };

  if (map[key]) return map[key];
  return String(value || 'Unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeShipments(raw) {
  if (!raw) return [];

  let shipments = raw.shipments || raw || [];

  return shipments.map((s) => ({
    shipment_id: s.shipment_id,
    shipment_code: s.shipment_code,

    sender_name: s.sender_name || 'Unknown',
    sender_phone: s.sender_phone || 'N/A',

    receiver_name: s.receiver_name || 'Unknown',
    receiver_phone: s.receiver_phone || 'N/A',

    source_hub_name: s.source_hub_name || 'N/A',
    destination_hub_name: s.destination_hub_name || 'N/A',

    status: formatStatus(s.status),

    transporter_name: s.transporter_name || 'Unassigned',
    transporter_phone: s.transporter_phone || 'N/A',

    vehicle_model: s.vehicle_model || 'N/A',
    vehicle_type: s.vehicle_type || 'N/A',
    vehicle_no: s.vehicle_no || 'N/A',

    delivery_mode: s.delivery_mode || 'N/A',
    total_price: s.total_price || '0',

    trip_id: s.trip_id ?? null,
    created_at: s.created_at,

    rejection_reason: s.rejection_reason,
    rejected_at: s.rejected_at,
  }));
}
function normalizeCounts(raw) {
  // Handle the count structure from your backend
  let counts = [];
  
  if (raw?.shipmentCount?.shipmentCount && Array.isArray(raw.shipmentCount.shipmentCount)) {
    counts = raw.shipmentCount.shipmentCount;
  } else if (raw?.shipmentCount && Array.isArray(raw.shipmentCount)) {
    counts = raw.shipmentCount;
  } else if (Array.isArray(raw)) {
    counts = raw;
  }

  return counts.map((c) => ({
    status: String(c.status || '').toLowerCase().replace(/\s+/g, '_'),
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

  // Extract total shipments count from the response
  let totalShipments = 0;
  if (data?.shipmentCount?.totalShipments?.count) {
    totalShipments = Number(data.shipmentCount.totalShipments.count);
  }

  return {
    shipments: normalizeShipments(data),
    counts: normalizeCounts(data),
    totalShipments: totalShipments,
    pagination: data?.pagination || {
      offset: params.offset || 0,
      limit: params.limit || 10
    },
  };
}

// Optional: Fetch detailed shipment for expanded view
export async function getShipmentById(shipmentId) {
  const url = ENDPOINTS.shipments?.byId 
    ? ENDPOINTS.shipments.byId(shipmentId)
    : null;

  if (!url) {
    throw new Error('Shipment detail endpoint not configured');
  }

  const data = await requestWithAuth(url);
  
  // Normalize detailed shipment data
  if (data?.shipment) {
    const s = data.shipment;
    return {
      shipment_code: s.shipment_code,
      sender_name: s.sender_name || 'Unknown',
      receiver_name: s.receiver_name || 'Unknown',
      sender_phone: s.sender_phone || 'N/A',
      receiver_phone: s.receiver_phone || 'N/A',
      sender_email: 'N/A', // Not in your backend
      receiver_email: 'N/A', // Not in your backend
      status: formatStatus(s.status),
      source_hub_name: s.source_hub_name,
      destination_hub_name: s.destination_hub_name,
      delivery_mode: s.delivery_mode || 'N/A',
      total_price: s.total_price || '0',
      transporter_name: s.transporter_name || 'Unassigned',
      transporter_phone: s.transporter_phone || 'N/A',
      vehicle_model: s.vehicle_model,
      vehicle_type: s.vehicle_type,
      vehicle_no: s.vehicle_no,
      point_name: s.point_name,
      rejection_reason: s.rejection_reason,
      rejected_at: s.rejected_at,
      created_at: s.created_at,
      trip_id: s.trip_id,
    };
  }
  
  return null;
}