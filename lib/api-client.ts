/**
 * API Client — handles authenticated requests to the backend.
 * Automatically includes auth cookies in all requests.
 */

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Auto-include cookies
  });

  return response;
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      return { success: true };
    } else {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function getSession(): Promise<{
  authenticated: boolean;
  user?: { username: string; role: string };
} | null> {
  try {
    const res = await apiFetch('/api/auth/me', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return { authenticated: true, user: data };
    }
  } catch (error) {
    // Session check failed
  }
  return null;
}
