import { ENDPOINTS, REQUEST_TIMEOUT } from '@/lib/config';

const ACCESS_TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

function hasWindow() {
  return typeof window !== 'undefined';
}

function writeCookie(name, value, maxAgeSeconds = 86400) {
  if (!hasWindow()) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}${secure}; SameSite=Lax`;
}

function clearCookie(name) {
  if (!hasWindow()) return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeUser(rawUser, fallbackEmail = '') {
  if (!rawUser || typeof rawUser !== 'object') return null;
  return {
    id: rawUser.user_id ?? rawUser.id ?? '',
    name: rawUser.user_name ?? rawUser.name ?? 'Admin',
    role: rawUser.role ?? 'admin',
    email: rawUser.email ?? fallbackEmail,
    ...rawUser,
  };
}

async function request(url, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    if (!res.ok) {
      const message = data?.message || `Request failed (${res.status})`;
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

export function getAccessToken() {
  if (!hasWindow()) return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const tokenCookie = cookies.find((c) => c.startsWith(`${ACCESS_TOKEN_KEY}=`));
  if (tokenCookie) return decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getSessionUser() {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  return parseJsonSafe(raw);
}

export function setSession(accessToken, user) {
  if (!hasWindow() || !accessToken) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  writeCookie(ACCESS_TOKEN_KEY, accessToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (!hasWindow()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie(ACCESS_TOKEN_KEY);
}

export async function loginUser({ email, password }) {
  const raw = await request(ENDPOINTS.auth.login, {
    method: 'POST',
    body: { email, password },
  });

  // Supports both:
  // { access_token, user } and { success: true, data: { access_token, user } }
  const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  const accessToken = payload?.access_token;
  const user = normalizeUser(payload?.user, email);

  if (!accessToken) {
    const error = new Error('Login response does not contain access_token');
    error.payload = raw;
    throw error;
  }

  setSession(accessToken, user);
  return { access_token: accessToken, user };
}

export async function fetchMe() {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const raw = await request(ENDPOINTS.auth.me, { method: 'GET', token });
    const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
    const user = normalizeUser(payload?.user || payload);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    // Keep UI usable even if /auth/me route does not exist.
    return getSessionUser();
  }
}

export async function logoutUser() {
  const token = getAccessToken();
  try {
    if (token) {
      await request(ENDPOINTS.auth.logout, { method: 'POST', token, body: {} });
    }
  } finally {
    clearSession();
  }
}

export function isAuthenticated() {
  return !!getAccessToken();
}

