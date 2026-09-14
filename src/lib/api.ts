const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  (import.meta.env.PROD
    ? 'https://xta.check-outnow.com/api/v1/xtrapay'
    : 'http://127.0.0.1:8000/api/v1/xtrapay');

const TOKEN_KEY = 'xtrapay_token';

export function getApiBase() {
  return API_BASE;
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let json: ApiEnvelope<T> | null = null;
  try {
    json = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const body = json as Record<string, unknown> | null;
    const errors = body?.errors as Record<string, string[] | string> | undefined;
    const firstFieldError =
      errors &&
      Object.values(errors)
        .flatMap(v => (Array.isArray(v) ? v : [v]))
        .find(Boolean);
    const msg =
      (typeof body?.message === 'string' && body.message) ||
      (typeof firstFieldError === 'string' && firstFieldError) ||
      `Request failed (${res.status})`;
    throw new ApiError(String(msg), res.status, json);
  }

  // Some APIs return HTTP 200 with { success: false, message }
  if (
    json &&
    typeof json === 'object' &&
    'success' in json &&
    (json as ApiEnvelope<T>).success === false
  ) {
    const msg =
      (typeof (json as ApiEnvelope<T>).message === 'string' &&
        (json as ApiEnvelope<T>).message) ||
      'Request failed';
    throw new ApiError(String(msg), res.status || 422, json);
  }

  if (json && 'data' in json && json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}
