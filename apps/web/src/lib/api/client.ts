/** Thin fetch client for the Loquia API. Cookies carry the session. */

export interface ApiErrorBody {
  error: { code: string; message: string; requestId: string; details?: unknown };
}

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiHttpError';
  }
}

export function apiBaseUrl(): string {
  // In the browser, call the API same-origin ('' → /api/...). A Next.js rewrite
  // (next.config.mjs) proxies /api/* to the real API, so the session cookie is
  // FIRST-PARTY to the site. That's what makes login work on mobile Safari/iOS,
  // which blocks third-party (cross-site) cookies — the earlier direct calls to
  // loquia-api.onrender.com were cross-site and had their cookie dropped.
  if (typeof window !== 'undefined') return '';
  // Server-side rendering needs an absolute URL.
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  del<T>(path: string): Promise<T>;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (parsed as ApiErrorBody | null)?.error;
    throw new ApiHttpError(res.status, err?.code ?? 'http_error', err?.message ?? res.statusText, err?.details);
  }
  return parsed as T;
}

export function createApiClient(): ApiClient {
  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    del: (path) => request('DELETE', path),
  };
}
