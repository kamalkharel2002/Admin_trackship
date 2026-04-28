// /lib/api/client.js
import { REQUEST_TIMEOUT, API_BASE, ENDPOINTS } from '@/lib/config';

export function parseJsonSafe(text) {
  try { return JSON.parse(text); } catch { return null; }
}

let isRefreshing = false;
// Store resolve/reject pairs so ALL queued callers get retried or rejected
let refreshQueue = [];

function processQueue(error) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  refreshQueue = [];
}

export async function request(url, { method = 'GET', body, retry = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'include',
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    if (
      res.status === 401 &&
      retry &&
      !url.includes('/auth/refresh') &&
      !url.includes('/auth/login')
    ) {
      // If a refresh is already underway, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => request(url, { method, body, retry: false }));
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(ENDPOINTS.auth.refresh, {
          method: 'GET', 
          credentials: 'include',
          cache: 'no-store',
        });

        if (!refreshRes.ok) throw new Error('Refresh failed');

        processQueue(null);         // unblock queued requests
        isRefreshing = false;
        return request(url, { method, body, retry: false });

      } catch (refreshError) {
        processQueue(refreshError); // reject all queued requests
        isRefreshing = false;
        // ✅ Don't throw — just redirect. Callers don't need to handle this.
        window.location.href = '/login';
        // Return a promise that never resolves so in-flight UI updates stop cleanly
        return new Promise(() => { });
      }
    }

    if (!res.ok) {
      const message = data?.message ?? `Request failed (${res.status})`;
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