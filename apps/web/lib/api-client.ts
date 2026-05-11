import { createApiClient, unwrap } from "@tasheen/api-client";
import { config } from "./config";
import { getAuthToken, onUnauthorized } from "./auth";
import { refreshAccessToken } from "./auth-refresh";

/**
 * Singleton API client used by every feature in the storefront. Reads the
 * auth token via `getAuthToken()` so the source of truth for the token
 * (cookie / localStorage / NextAuth session) can change without touching
 * call sites.
 *
 * `refreshToken` lets the middleware rotate an expired access token and
 * retry the original request once before falling back to
 * `onUnauthorized` (which signs the user out).
 */
export const api = createApiClient({
  baseUrl: config.apiBaseUrl,
  getToken: getAuthToken,
  refreshToken: refreshAccessToken,
  onUnauthorized,
});

export { unwrap };
