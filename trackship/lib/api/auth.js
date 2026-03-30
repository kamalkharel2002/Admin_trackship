import { ENDPOINTS } from '@/lib/config';
import { request, parseJsonSafe } from '@/lib/api/client';

const USER_KEY = 'auth_user';

function hasWindow() {
  // Prevents localStorage access during Next.js SSR
  return typeof window !== 'undefined';
}

function normalizeUser(rawUser, fallbackEmail = '') {
  if (!rawUser || typeof rawUser !== 'object') return null;

  // Whitelist explicit fields — never spread rawUser to avoid
  // accidentally storing sensitive fields (e.g. password_hash) in localStorage
  return {
    id:    rawUser.user_id   ?? rawUser.id   ?? '',
    name:  rawUser.user_name ?? rawUser.name ?? 'Admin',
    role:  rawUser.role      ?? 'admin',
    email: rawUser.email     ?? fallbackEmail,
    phone: rawUser.phone     ?? '',
  };
}

export function getSessionUser() {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  return parseJsonSafe(raw);
}

export function setSession(user) {
  if (!hasWindow() || !user) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (!hasWindow()) return;
  localStorage.removeItem(USER_KEY);
}

export async function loginUser({ email, password }) {
  const raw = await request(ENDPOINTS.auth.login, {
    method: 'POST',
    body:   { email, password },
  });

  const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  const user    = normalizeUser(payload?.user, email);

  if (!user) throw new Error('Invalid user payload received from server');

  setSession(user);
  return { user };
}

export async function fetchMe() {
  try {
    const raw     = await request(ENDPOINTS.auth.me);
    const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
    const user    = normalizeUser(payload?.user || payload);
    // Route through setSession so the SSR guard is always respected
    if (user) setSession(user);
    return user;
  } catch {
    // Network error or 401 — fall back to whatever is cached locally
    return getSessionUser();
  }
}

export async function logoutUser() {
  try {
    await request(ENDPOINTS.auth.logout, { method: 'POST', body: {} });
  } finally {
    // Always clear local session even if the server call fails
    clearSession();
  }
}