/**
 * Access-token refresh helper.
 *
 * The backend issues short-lived access tokens (~15m) plus a long-lived
 * refresh token. This module is the single client-side entry point for
 * exchanging the refresh token for a fresh access token. Used in two
 * places:
 *
 * - Proactive: `AuthProvider` schedules a call ~30s before the access
 *   token's `exp`, so the token rotates before any request can 401.
 * - Reactive: the API client middleware calls this when a request 401s
 *   (clock drift, laptop sleep, race with rotation), retries the
 *   original request, and only signs the user out if refresh itself
 *   fails.
 *
 * Concurrent callers share a single in-flight Promise — without this,
 * a burst of parallel 401s would each fire their own refresh and the
 * later ones would invalidate the earlier rotated tokens.
 */
import { config } from "./config";
import {
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
  syncAuthCookies,
} from "./auth";

const REFRESH_PATH = "/api/v1/auth/refresh";

interface RefreshSuccess {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

let inFlight: Promise<string | null> | null = null;

/**
 * Try to rotate the access token. Returns the new access token on
 * success, or `null` if no refresh token is available or the backend
 * rejects the refresh (caller should then sign the user out).
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inFlight) return inFlight;
  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${REFRESH_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Network failure — don't sign the user out for transient errors.
    // The next request will retry.
    return null;
  }

  if (!response.ok) return null;

  type RefreshBody = { success: boolean; data?: RefreshSuccess };
  let body: RefreshBody | null = null;
  try {
    body = (await response.json()) as RefreshBody;
  } catch {
    return null;
  }

  if (!body?.success || !body.data?.accessToken) return null;

  setAuthToken(body.data.accessToken);
  if (body.data.refreshToken) {
    setRefreshToken(body.data.refreshToken);
  }
  void syncAuthCookies(body.data.accessToken, body.data.refreshToken);
  return body.data.accessToken;
}

/**
 * Read the `exp` claim (seconds since epoch) from a JWT without
 * verifying the signature. Used by the proactive scheduler to decide
 * when to rotate; verification still happens server-side on every API
 * call. Returns null for malformed input.
 */
export function getAccessTokenExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    // atob requires the base64 length to be a multiple of 4 - JWT's
    // base64url strips trailing `=` padding, so add it back.
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp : null;
  } catch {
    return null;
  }
}
