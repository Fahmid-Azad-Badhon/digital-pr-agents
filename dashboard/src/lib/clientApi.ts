'use client';

export const DASHBOARD_API_TOKEN_STORAGE_KEY = 'dashboard_api_token';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
};

type ApiFailureEnvelope = {
  success?: false;
  error?: string;
  code?: string;
  message?: string;
  details?: unknown;
};

export type ApiRequestOptions = {
  retries?: number;
  retryDelayMs?: number;
  retryStatuses?: number[];
};

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  requestId?: string;

  constructor(
    message: string,
    options: { status: number; code?: string; details?: unknown; requestId?: string }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

function mergeHeaders(headers?: HeadersInit): Headers {
  return new Headers(headers || {});
}

export function getDashboardApiToken(): string | null {
  const envToken = process.env.NEXT_PUBLIC_DASHBOARD_API_TOKEN?.trim();

  if (typeof window === 'undefined') {
    return envToken || null;
  }

  const stored = window.localStorage.getItem(DASHBOARD_API_TOKEN_STORAGE_KEY)?.trim();
  return stored || envToken || null;
}

export function withDashboardAuthHeaders(headers?: HeadersInit): Headers {
  const merged = mergeHeaders(headers);
  const token = getDashboardApiToken();

  if (!token) {
    return merged;
  }

  if (!merged.has('x-dashboard-token')) {
    merged.set('x-dashboard-token', token);
  }
  if (!merged.has('authorization')) {
    merged.set('authorization', `Bearer ${token}`);
  }

  return merged;
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: withDashboardAuthHeaders(init.headers),
  });
}

function getMethod(init?: RequestInit) {
  return (init?.method || 'GET').toUpperCase();
}

function shouldRetry(status: number, retryStatuses: Set<number>) {
  return retryStatuses.has(status);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryParseJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function buildErrorMessage(
  response: Response,
  body: ApiFailureEnvelope | null,
  requestId: string | null
) {
  const baseMessage =
    body?.message ||
    body?.error ||
    response.statusText ||
    `Request failed with status ${response.status}`;
  return requestId ? `${baseMessage} (request: ${requestId})` : baseMessage;
}

export function formatApiError(error: unknown, fallback = 'Request failed') {
  if (error instanceof ApiClientError) {
    const details =
      error.details !== undefined ? ` | details: ${JSON.stringify(error.details)}` : '';
    return `${error.message}${details}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: ApiRequestOptions = {}
): Promise<T> {
  const method = getMethod(init);
  const retries = options.retries ?? (MUTATION_METHODS.has(method) ? 2 : 0);
  const retryDelayMs = options.retryDelayMs ?? 350;
  const retryStatuses = new Set(options.retryStatuses ?? Array.from(DEFAULT_RETRY_STATUSES));

  let attempt = 0;
  let lastError: unknown = null;
  while (attempt <= retries) {
    try {
      const response = await apiFetch(input, init);
      const requestId = response.headers.get('x-request-id');
      const parsedSuccess = await tryParseJson<ApiSuccessEnvelope<T>>(response);

      if (response.ok && parsedSuccess?.success && 'data' in parsedSuccess) {
        return parsedSuccess.data;
      }

      const parsedFailure =
        (parsedSuccess as unknown as ApiFailureEnvelope | null) ||
        (await tryParseJson<ApiFailureEnvelope>(response));
      const message = buildErrorMessage(response, parsedFailure, requestId);
      const error = new ApiClientError(message, {
        status: response.status,
        code: parsedFailure?.code || parsedFailure?.error,
        details: parsedFailure?.details,
        requestId: requestId || undefined,
      });

      if (attempt < retries && shouldRetry(response.status, retryStatuses)) {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
        const delay = Number.isFinite(retryAfterMs)
          ? Math.max(retryDelayMs, Number(retryAfterMs))
          : retryDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        attempt += 1;
        continue;
      }

      throw error;
    } catch (error) {
      lastError = error;
      const isNetworkLikeError = !(error instanceof ApiClientError);
      if (attempt < retries && isNetworkLikeError) {
        const delay = retryDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        attempt += 1;
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Request failed with unknown error.');
}
