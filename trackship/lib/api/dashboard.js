import { ENDPOINTS, buildQueryString } from '@/lib/config';
import { request } from '@/lib/api/client';

function normalizeSummary(raw) {
  const p    = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  const rate = parseFloat(p?.success_rate);
  return {
    total_shipments:     Number(p?.total_shipments     ?? 0),
    delivered_shipments: Number(p?.delivered_shipments ?? 0),
    active_drivers:      Number(p?.active_drivers      ?? 0),
    success_rate:        isNaN(rate) ? 0 : rate,
  };
}

function normalizeHubs(raw) {
  const arr = Array.isArray(raw?.data) ? raw.data
            : Array.isArray(raw)       ? raw
            : [];
  return arr.map(h => ({
    hub_id:         h.hub_id,
    name:           h.name,
    shipment_count: Number(h.shipment_count ?? 0),
  }));
}

function normalizePendingTransporters(raw) {
  const arr = Array.isArray(raw?.data) ? raw.data
            : Array.isArray(raw)       ? raw
            : [];
  return arr.map(t => ({
    id:        t.id           ?? t.transporter_id ?? '',
    name:      t.name         ?? t.user_name      ?? 'Unknown',
    email:     t.email        ?? '',
    phone:     t.phone        ?? t.mobile         ?? '',
    vehicle:   t.vehicle_type ?? t.vehicle        ?? '—',
    submitted: t.created_at   ?? t.submitted_at   ?? '',
  }));
}

export async function getDashboardSummary(params = {}) {
  const url = ENDPOINTS.dashboard.summary + buildQueryString(params);
  return normalizeSummary(await request(url));
}

export async function getHubShipments(params = {}) {
  const url = ENDPOINTS.dashboard.hubShipments + buildQueryString(params);
  return normalizeHubs(await request(url));
}

export async function getPendingTransporters() {
  return normalizePendingTransporters(
    await request(ENDPOINTS.transporters.pending)
  );
}