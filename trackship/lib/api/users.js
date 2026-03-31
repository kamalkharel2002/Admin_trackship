// services/users.js
import { ENDPOINTS, REQUEST_TIMEOUT, buildQueryString } from '@/lib/config';

/* ───────────── HELPERS ───────────── */

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      credentials: 'include',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    if (!res.ok) {
      const message =
        data?.error ||
        data?.message ||
        `Request failed (${res.status})`;

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

/* ───────────── NORMALIZERS ───────────── */

// ⚠️ Backend sends "Date_Created"
function normalizeUsers(raw) {
  const payload = Array.isArray(raw?.userData) ? raw.userData : [];

  return payload.map((u) => ({
    user_id: u.user_id,
    user_name: u.user_name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    created_at: u.Date_Created, // IMPORTANT FIX
  }));
}

function normalizeCounts(raw) {
  const payload = Array.isArray(raw?.userCount) ? raw.userCount : [];

  return payload.map((c) => ({
    role: c.role,
    user_count: Number(c.user_count ?? 0),
  }));
}

/* ───────────── API FUNCTIONS ───────────── */

// ✅ READ USERS
export async function getUsers(params = {}) {
  if (params.offset !== undefined) params.offset = Number(params.offset);
  if (params.limit !== undefined) params.limit = Number(params.limit);

  const url = ENDPOINTS.user.list + buildQueryString(params);
  const data = await request(url);

  return {
    users: normalizeUsers(data),
    counts: normalizeCounts(data),
  };
}

// ✅ CREATE USER
export async function createUser(payload) {
  return request(ENDPOINTS.user.list, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ✅ UPDATE USER
export async function updateUser(user_id, updates) {
  return request(`${ENDPOINTS.user.list}/${user_id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ✅ DELETE USER
export async function deleteUser(user_id) {
  return request(`${ENDPOINTS.user.list}/${user_id}`, {
    method: 'DELETE',
  });
}

// ✅ GET SINGLE USER
export async function getUserById(user_id) {
  const data = await request(ENDPOINTS.user.byId(user_id));

  // normalize like list
  return {
    user_id: data.user_id,
    user_name: data.user_name,
    phone: data.phone,
    email: data.email,
    role: data.role,
    created_at: data.Date_Created || data.created_at,
  };
}