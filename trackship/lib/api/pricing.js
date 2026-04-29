// lib/api/pricing.js
import { ENDPOINTS } from '@/lib/config';
import { request }   from '@/lib/api/client';

/**
 * GET /admin/pricing
 * Response: { success: true, data: [{ config_key, config_value, description, updated_at }] }
 */
export async function getPricingConfig() {
  return request(ENDPOINTS.pricing.list, { method: 'GET' });
}

/**
 * PATCH /admin/pricing/:key
 * Body: { value: number }
 * Response: { success: true, data: { config_key, config_value, description, updated_at } }
 */
export async function updatePricingConfig(key, value) {
  return request(ENDPOINTS.pricing.update(key), {
    method: 'PATCH',
    body: { value: Number(value) },   // plain object — request() handles JSON.stringify
  });
}