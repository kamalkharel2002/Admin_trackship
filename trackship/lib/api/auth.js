// /lib/api/auth.js — Authentication API client
import { ENDPOINTS } from '@/lib/config';
import { request } from '@/lib/api/client';

export async function loginUser({ email, password }) {
  const raw = await request(ENDPOINTS.auth.login, {
    method: 'POST',
    body: { email, password },
  });

  const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  const user = payload?.user || payload;

  if (!user?.user_id) throw new Error('Invalid user payload received from server');

  // Return user data (no localStorage storage needed)
  return { 
    user: {
      id: user.user_id,
      name: user.user_name || 'Admin',
      role: user.role || 'admin',
      email: user.email,
      phone: user.phone || '',
    }
  };
}

export async function logoutUser() {
  try {
    await request(ENDPOINTS.auth.logout, { method: 'POST', body: {} });
  } catch (error) {
    console.error('Logout error:', error);
    // Still consider logged out even if server call fails
  }
}

// No checkAuth needed! The middleware handles auth checks via cookies