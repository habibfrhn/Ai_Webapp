// client/src/apiClient.ts
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  userId: string;
}

/**
 * A wrapper for fetch that checks token expiration,
 * attempts to refresh the token if expired, and retries requests.
 */
export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let token = localStorage.getItem('token');

  // If token exists, check expiration.
  if (token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded.exp * 1000 < Date.now()) {
        // Token expired; attempt refresh.
        token = await refreshToken(token);
      }
    } catch {
      // If token decoding fails, remove it.
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Invalid token');
    }
  }

  // Set authorization header if token exists.
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const newInit = { ...init, headers };

  let response = await fetch(input, newInit);

  // If unauthorized, try refreshing the token once.
  if (response.status === 401 && token) {
    token = await refreshToken(token);
    headers.set('Authorization', `Bearer ${token}`);
    response = await fetch(input, { ...newInit, headers });
  }
  return response;
}

/**
 * Refresh the token by calling the refresh endpoint.
 * Returns the new token, or redirects to login on failure.
 */
async function refreshToken(oldToken: string): Promise<string> {
  const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${oldToken}` },
  });
  if (refreshResponse.ok) {
    const data = await refreshResponse.json();
    const newToken = data.token;
    localStorage.setItem('token', newToken);
    return newToken;
  } else {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
}
