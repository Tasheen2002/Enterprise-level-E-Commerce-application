/**
 * Shared TypeScript types across apps and packages.
 *
 * These are wire-level/UI-level types that both `apps/web` and `apps/admin`
 * consume. Domain entity DTOs are pulled in via `@tasheen/api-client` (the
 * generated OpenAPI SDK); types here are anything not driven by the API
 * (UI-only state shapes, route params, feature flags, etc.).
 */

// Re-exports of canonical wire vocabularies. Generated SDK should be the
// source of truth; this barrel is for ergonomic consumption.
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;

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
  data: T;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;
