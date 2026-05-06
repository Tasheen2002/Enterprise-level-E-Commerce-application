import { createApiClient, unwrap } from "@tasheen/api-client";
import { config } from "./config";
import { getAuthToken, onUnauthorized } from "./auth";

/**
 * Singleton API client used by every feature in the storefront. Reads the
 * auth token via `getAuthToken()` so the source of truth for the token
 * (cookie / localStorage / NextAuth session) can change without touching
 * call sites.
 */
export const api = createApiClient({
  baseUrl: config.apiBaseUrl,
  getToken: getAuthToken,
  onUnauthorized,
});

export { unwrap };
