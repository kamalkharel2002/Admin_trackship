import { REQUEST_TIMEOUT } from '@/lib/config';

export function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function request(url, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body:        body ? JSON.stringify(body) : undefined,
      signal:      controller.signal,
      cache:       'no-store',
      credentials: 'include',   
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    if (!res.ok) {
      const message = data?.message || `Request failed (${res.status})`;
      const error   = new Error(message);
      error.status  = res.status;
      error.payload = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}