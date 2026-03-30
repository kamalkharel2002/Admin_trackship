// services/users.js
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
      const message = data?.error || `Request failed (${res.status})`;
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

function normalizeUsers(raw) {
  const payload = Array.isArray(raw?.userData) ? raw.userData : [];

  return payload.map((u) => ({
    user_name: u.user_name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    created_at: u.date_created || u.created_at,
  }));
}

function normalizeCounts(raw) {
  const payload = Array.isArray(raw?.userCount) ? raw.userCount : [];

  return payload.map((c) => ({
    role: c.role,
    user_count: Number(c.user_count ?? 0),
  }));
}

export async function getUsers(params = {}) {
  if (params.offset !== undefined) params.offset = Number(params.offset);
  if (params.limit !== undefined) params.limit = Number(params.limit);

  const url = ENDPOINTS.user.list + buildQueryString(params);

  const data = await requestWithAuth(url);

  return {
    users: normalizeUsers(data),
    counts: normalizeCounts(data),
  };
}
