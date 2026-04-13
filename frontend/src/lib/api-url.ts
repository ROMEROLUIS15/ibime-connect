/**
 * Resolves the API base URL for frontend -> backend communication.
 * Shared across all frontend services to avoid duplication.
 */

import type { ApiResult } from '@shared/types/domain';

const DEFAULT_LOCAL_URL = 'http://localhost:3000/api';

/**
 * Returns the backend API base URL.
 * - In production: uses VITE_API_URL env var
 * - In development: prefers localhost:3000 when the frontend is served from localhost
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    return envUrl;
  }

  // In development, prefer localhost if the frontend is also on localhost
  if (import.meta.env.DEV) {
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalhost) {
      return DEFAULT_LOCAL_URL;
    }
  }

  return DEFAULT_LOCAL_URL;
}

/**
 * Builds a full API endpoint URL from a relative path.
 * Handles trailing slashes and '/api' prefixes.
 *
 * Examples:
 *   buildApiUrl('chat')          → 'http://localhost:3000/api/chat'
 *   buildApiUrl('/v1/chat')      → 'http://localhost:3000/api/v1/chat'
 *   buildApiUrl('contact')       → 'http://localhost:3000/api/contact'
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const normalizedBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}/${normalizedPath}`;
}

/**
 * Generic API fetch wrapper. Handles JSON serialization, error extraction,
 * and network error catching. Returns a typed ApiResult.
 *
 * @param path - Relative API path (e.g., 'contact', 'v1/chat')
 * @param options - Fetch options (method, headers, body, etc.)
 * @param fallbackError - Default error message if none provided by server
 */
export async function apiFetch<T = void>(
  path: string,
  options: RequestInit = {},
  fallbackError = 'Error de conexión. Intenta de nuevo.'
): Promise<ApiResult<T>> {
  const { headers, ...restOptions } = options;

  try {
    const endpoint = buildApiUrl(path);
    const response = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
      ...restOptions,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { ok: false, error: errorData.text || fallbackError };
    }

    // For void responses (204, or endpoints that return nothing useful)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { ok: true, data: undefined as T };
    }

    const data = await response.json() as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: fallbackError };
  }
}
