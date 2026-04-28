// lib/api/settings.js

import { ENDPOINTS } from '@/lib/config';
import { request }   from '@/lib/api/client';

// ── Profile Details ───────────────────────────────────────

// GET /admin/profile/details
// Response: { details: { user_name, email, phone } }
export async function getProfileDetails() {
  const raw = await request(ENDPOINTS.setting.details);
  const d   = raw?.details ?? raw;
  return {
    fullName: d?.user_name ?? '',
    email:    d?.email     ?? '',
    phone:    d?.phone     ?? '',
  };
}

// ── Phone ─────────────────────────────────────────────────

export async function updatePhone(phone) {
  return request(ENDPOINTS.setting.phone, {
    method: 'PATCH',
    body: { phone },
  });
}

// ── Password ──────────────────────────────────────────────

export async function updatePassword(newPassword, confirmPassword) {
  if (!newPassword) {
    throw new Error('Password cannot be empty.');
  }

  if (newPassword !== confirmPassword) {
    throw new Error('New passwords do not match.');
  }

  return request(ENDPOINTS.setting.password, {
    method: 'PATCH',
    body: { password: newPassword },
  });
}