/**
 * Shared TypeScript types across apps and packages.
 *
 * Generic JSON envelopes and UI utility types consumed by the API client.
 * Endpoint-specific DTOs come from its generated OpenAPI schema. These
 * declarations do not validate runtime input or describe empty HTTP 204 bodies.
 */

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;

// Wire aliases remain plain strings; validate them at the runtime boundary.
export type ISODateString = string;
export type UUID = string;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  /** Action acknowledgements may omit data; payload-bearing endpoints refine this field. */
  data?: T;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;
