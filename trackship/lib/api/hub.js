// lib/api/hubs.js

import { ENDPOINTS } from '@/lib/config';
import { request }   from '@/lib/api/client';

function normalizeHub(h) {
  return {
    id:             h.hub_id   ?? h.id   ?? '',
    name:           h.name     ?? '—',
    region:         h.region   ?? h.location ?? '—',
    latitude:       Number(h.latitude  ?? 0),
    longitude:      Number(h.longitude ?? 0),
    coordinators:   Array.isArray(h.coordinators) ? h.coordinators : [],
    active_drivers: Number(h.active_drivers ?? 0),
    shipments:      Number(h.shipments ?? h.shipment_count ?? 0),
  };
}

function normalizeList(raw) {
  const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  return arr.map(normalizeHub);
}

export async function getHubs() {
  return normalizeList(await request(ENDPOINTS.hubs.list));
}

export async function createHub(body) {
  const raw = await request(ENDPOINTS.hubs.list, { method: 'POST', body });
  const p   = raw?.data ?? raw;
  if (p?.name && (p?.latitude || p?.hub_id || p?.id)) return normalizeHub(p);
  const list = await getHubs();
  return list.find(h => h.name === body.name)
    ?? normalizeHub({ ...body, hub_id: p?.hub_id ?? p?.id ?? Date.now() });
}

export async function updateHub(id, body) {
  const raw = await request(ENDPOINTS.hubs.byId(id), { method: 'PUT', body });
  const p   = raw?.data ?? raw;
  if (p?.name && (p?.latitude || p?.hub_id || p?.id)) return normalizeHub(p);
  const list = await getHubs();
  return list.find(h => h.id === id || h.id === String(id))
    ?? normalizeHub({ ...body, hub_id: id });
}

export async function deleteHub(id) {
  return request(ENDPOINTS.hubs.byId(id), { method: 'DELETE' });
}

// GET /admin/hub-coordinator/list
export async function getCoordinators() {
  const raw = await request(ENDPOINTS.hubs.coordinators);

  let arr = [];
  if (Array.isArray(raw))                    arr = raw;
  else if (Array.isArray(raw?.data))         arr = raw.data;
  else if (Array.isArray(raw?.coordinators)) arr = raw.coordinators;
  else if (raw?.coordinators)                arr = [raw.coordinators];

  return arr.map(c => ({
    id:    c.user_id,       // ← user_id: matches hub_coordinator.user_id FK in DB
    name:  c.user_name ?? c.name ?? 'Unknown',
    phone: c.phone ?? '',
  })).filter(c => c.id);
}

// GET /admin/hub/{id}/coordinators
export async function getHubCoordinatorsForEdits(hubId) {
  const raw = await request(ENDPOINTS.hubs.coordinatorsByHub(hubId));
  
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw?.data)) arr = raw.data;
  else if (Array.isArray(raw?.coordinators)) arr = raw.coordinators;
  else if (raw?.coordinators) arr = [raw.coordinators];
  
  return arr.map(c => ({
    id: c.user_id,
    name: c.name ?? 'Unknown',
    email: c.email ?? '',
    phone: c.phone ?? '',
    is_assigned: c.is_assigned ?? false,
  })).filter(c => c.id);
}