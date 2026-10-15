import type { z } from 'zod';
import { env } from '@/shared/config/env';
import { ApiError, toApiError } from './errors';

type Query = Record<string, string | number | boolean | undefined | null | (string | number)[]>;

export type RequestOptions<S extends z.ZodType> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  /** Response contract — responses are validated, so a backend drift surfaces as VALIDATION */
  schema: S;
  /** Milliseconds before the request fails with TIMEOUT (default 15 s) */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/** Hook for the future auth session (bearer token or cookie mode — open backend question). */
let getAuthToken: () => string | null | undefined = () => null;
export function setAuthTokenProvider(provider: () => string | null | undefined) {
  getAuthToken = provider;
}

function buildUrl(path: string, query?: Query): string {
  const base = env.apiBaseUrl;
  if (!base) throw new ApiError('UNCONFIGURED', 'NEXT_PUBLIC_API_BASE_URL is not configured');
  const url = new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function statusToCode(status: number): ApiError['code'] {
  if (status === 400 || status === 422) return 'VALIDATION';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 402) return 'OUT_OF_CREDITS';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
}

/**
 * Typed fetch wrapper for HTTP repositories: base URL from env, auth header hook, AbortSignal,
 * JSON in/out, schema-validated responses and normalized ApiErrors.
 */
export async function request<S extends z.ZodType>(path: string, options: RequestOptions<S>): Promise<z.infer<S>> {
  const { method = 'GET', query, body, signal, schema, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  try {
    const token = getAuthToken();
    // The caller's AbortSignal (navigation, Stop) plus a timeout
    const timeout = AbortSignal.timeout(timeoutMs);
    const response = await fetch(buildUrl(path, query), {
      method,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'message' in payload ? String((payload as { message: unknown }).message) : response.statusText;
      throw new ApiError(statusToCode(response.status), message, { status: response.status, details: payload as Record<string, unknown> | undefined });
    }
    return schema.parse(payload);
  } catch (error) {
    throw toApiError(error);
  }
}
