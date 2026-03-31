// lib/api/hubs.js
// CRUD for hubs: list, create, update, delete
// All calls go through shared request() from client.js

import { ENDPOINTS } from '@/lib/config';
import { request } from '@/lib/api/client';

// ── Normalizer: maps raw API hub → clean shape ───────────────────────────────
function normalizeHub(h) {
  return {
    id:           h.hub_id   ?? h.id   ?? '',
    name:         h.name     ?? '—',
    region:       h.region   ?? h.location ?? '—',
    latitude:     Number(h.latitude  ?? 0),
    longitude:    Number(h.longitude ?? 0),
    coordinators: Array.isArray(h.coordinators) ? h.coordinators : [],
    active_drivers: Number(h.active_drivers ?? 0),
    shipments:      Number(h.shipments      ?? h.shipment_count ?? 0),
  };
}

function normalizeList(raw) {
  const arr = Array.isArray(raw?.data) ? raw.data
            : Array.isArray(raw)       ? raw
            : [];
  return arr.map(normalizeHub);
}

// GET /admin/hub
export async function getHubs() {
  return normalizeList(await request(ENDPOINTS.hubs.list));
}

// POST /admin/hub  — body: { name, latitude, longitude, region }
export async function createHub(body) {
  const raw = await request(ENDPOINTS.hubs.list, { method: 'POST', body });
  const p   = raw?.data ?? raw;
  return normalizeHub(p);
}

// PUT /admin/hub/:id — body: { name, latitude, longitude, region }
export async function updateHub(id, body) {
  const url = ENDPOINTS.hubs.byId(id);
  const raw = await request(url, { method: 'PUT', body });
  const p   = raw?.data ?? raw;
  return normalizeHub(p);
}

// DELETE /admin/hub/:id
export async function deleteHub(id) {
  return request(ENDPOINTS.hubs.byId(id), { method: 'DELETE' });
}

// GET /admin/users?role=coordinator  — populates coordinator dropdown
export async function getCoordinators() {
  const raw = await request(ENDPOINTS.user.list + '?role=coordinator');
  const arr = Array.isArray(raw?.data) ? raw.data
            : Array.isArray(raw)       ? raw
            : [];
  return arr.map(u => ({
    id:   u.user_id ?? u.id ?? '',
    name: u.name    ?? u.user_name ?? 'Unknown',
  }));
}