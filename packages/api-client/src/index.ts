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
  onUnauthorized?: () => void | Promise<void>;
}

export function createApiClient(options: CreateApiClientOptions) {
  const client = createClient<Paths>({ baseUrl: options.baseUrl });

  // Auth middleware: attach Bearer token from the supplied resolver.
  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const token = options.getToken?.();
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      return request;
    },
    async onResponse({ response }) {
      if (response.status === 401 && options.onUnauthorized) {
        await options.onUnauthorized();
      }
      return response;
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
