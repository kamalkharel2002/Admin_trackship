// lib/api/damage.js
import { ENDPOINTS } from '@/lib/config';
import { request }   from '@/lib/api/client';

export const getDamageReports = async (hubId) => {
  const res = await request(hubId ? `${ENDPOINTS.damage.list}?hubId=${hubId}` : ENDPOINTS.damage.list);
  return Array.isArray(res) ? res : (res?.data ?? []);
};

export const getDamageById = (id) =>
  request(ENDPOINTS.damage.byId(id));

export const updateDamageStatus = (id, resolutionStatus, notes = '') =>
  request(ENDPOINTS.damage.status(id), {
    method: 'PATCH',
    body:   { resolutionStatus, notes },
  });