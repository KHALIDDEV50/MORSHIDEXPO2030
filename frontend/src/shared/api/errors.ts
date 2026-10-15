/** Normalized error shape for every repository (api-contracts.md §1). */
export type ApiErrorCode =
  | 'NETWORK'
  /** No response in time (http-client timeout) */
  | 'TIMEOUT'
  /** The API base URL isn't set (NEXT_PUBLIC_API_BASE_URL) — not a server failure */
  | 'UNCONFIGURED'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'OUT_OF_CREDITS'
  /** The backend answered 5xx */
  | 'SERVER'
  | 'NOT_IMPLEMENTED'
  | 'ABORTED'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ApiErrorCode, message?: string, options: { status?: number; details?: Record<string, unknown>; cause?: unknown } = {}) {
    super(message ?? code, { cause: options.cause });
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Converts anything thrown (fetch, Zod, abort …) into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  if (error instanceof DOMException && error.name === 'TimeoutError') return new ApiError('TIMEOUT', 'The request timed out', { cause: error });
  if (error instanceof DOMException && error.name === 'AbortError') return new ApiError('ABORTED', 'Request aborted', { cause: error });
  if (error instanceof TypeError) return new ApiError('NETWORK', error.message, { cause: error });
  if (error && typeof error === 'object' && 'issues' in error) return new ApiError('VALIDATION', 'Response did not match the contract', { cause: error });
  return new ApiError('UNKNOWN', error instanceof Error ? error.message : String(error), { cause: error });
}

/** Thrown by HTTP repositories until the backend contract exists (architecture.md §3). */
export function notImplemented(method: string): never {
  throw new ApiError('NOT_IMPLEMENTED', `${method} has no backend yet — use NEXT_PUBLIC_DATA_SOURCE=mock`);
}
