// /lib/api/client.js — Generic API request handler with timeout and error parsing
import { REQUEST_TIMEOUT, API_BASE } from '@/lib/config';

export function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Token refresh handling
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed() {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

export async function request(url, { method = 'GET', body, retry = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'include',
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    // Handle 401 Unauthorized - try to refresh token
    if (res.status === 401 && retry && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed();
            // Retry original request
            return request(url, { method, body, retry: false });
          } else {
            // Refresh failed - redirect to login
            isRefreshing = false;
            window.location.href = '/login';
            throw new Error('Session expired');
          }
        } catch (error) {
          isRefreshing = false;
          window.location.href = '/login';
          throw error;
        }
      }
      
      // Wait for refresh to complete
      return new Promise((resolve, reject) => {
        addRefreshSubscriber(() => {
          request(url, { method, body, retry: false })
            .then(resolve)
            .catch(reject);
        });
      });
    }

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