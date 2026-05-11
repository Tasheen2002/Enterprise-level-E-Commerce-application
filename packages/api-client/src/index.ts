/**
 * Tasheen API Client
 *
 * Thin wrapper around `openapi-fetch` typed against the Fastify backend's
 * OpenAPI schema. The generated `schema.ts` (under `./generated/`) is
 * produced by running:
 *
 *     pnpm --filter @tasheen/api-client generate
 *
 * which fetches `/docs/json` from the running API and emits TypeScript
 * types for every route, request body, and response shape. The SDK below
 * adds the auth token forwarding + envelope unwrapping that the wire
 * format requires.
 */

import createClient, { type Middleware } from "openapi-fetch";
import type { ApiEnvelope } from "@tasheen/types";
import type { paths } from "./generated/schema";

// `paths` resolves to the generated OpenAPI typings after the first
// `pnpm --filter @tasheen/api-client generate` run; until then it falls
// back to the placeholder `Record<string, any>` in `generated/schema.ts`.
type Paths = paths;

export interface CreateApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  /**
   * Called on a 401 to try rotating the access token. Should return the
   * new access token string on success, or `null` to fall through to
   * `onUnauthorized`. The middleware then retries the original request
   * once with the new token.
   */
  refreshToken?: () => Promise<string | null>;
  onUnauthorized?: () => void | Promise<void>;
}

export function createApiClient(options: CreateApiClientOptions) {
  const client = createClient<Paths>({ baseUrl: options.baseUrl });

  // openapi-fetch's `onResponse` only sees the already-consumed Request,
  // so we stash a clone in `onRequest` (keyed by request id) and use it
  // to construct the retry. WeakMap on the Request object would also
  // work, but the `id` is the documented stable key.
  const retryClones = new Map<string, Request>();

  const authMiddleware: Middleware = {
    async onRequest({ request, id }) {
      const token = options.getToken?.();
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      // Stash a clone BEFORE the body stream is consumed by fetch — we
      // need an unconsumed body to be able to retry the request.
      if (options.refreshToken) {
        retryClones.set(id, request.clone());
      }
      return request;
    },
    async onResponse({ request, response, id }) {
      const clone = retryClones.get(id);
      retryClones.delete(id);

      if (response.status !== 401) return response;

      // No refresh hook configured — preserve the legacy behaviour of
      // immediately signing the user out.
      if (!options.refreshToken) {
        await options.onUnauthorized?.();
        return response;
      }

      const newToken = await options.refreshToken();
      if (!newToken || !clone) {
        await options.onUnauthorized?.();
        return response;
      }

      // Retry the original request once with the rotated token. We use
      // the global `fetch` (not the openapi-fetch client) so this retry
      // does NOT re-enter the middleware — preventing a refresh loop if
      // the retry itself comes back 401.
      const retryHeaders = new Headers(clone.headers);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryRequest = new Request(clone, { headers: retryHeaders });
      const retryResponse = await fetch(retryRequest);

      if (retryResponse.status === 401) {
        await options.onUnauthorized?.();
      }
      return retryResponse;
    },
  };

  client.use(authMiddleware);
  return client;
}

/**
 * Unwraps the canonical `{ success, statusCode, message, data }` envelope
 * to the bare `data` payload. Throws on `success: false` so React Query /
 * SWR error states fire correctly.
 */
export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) {
    const err = new Error(envelope.message) as Error & {
      code?: string;
      statusCode: number;
      details?: Record<string, unknown>;
    };
    err.statusCode = envelope.statusCode;
    err.code = envelope.code;
    err.details = envelope.details;
    throw err;
  }
  return envelope.data;
}

export type { ApiEnvelope, ApiSuccess, ApiError } from "@tasheen/types";
