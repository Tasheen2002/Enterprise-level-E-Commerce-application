/**
 * Auth helpers used by the API client and by feature code that needs to
 * inspect the current session.
 *
 * Tokens live in two places:
 * - `localStorage` — read by the client-side API helper to add the
 *   `Authorization: Bearer …` header on outgoing requests.
 * - httpOnly cookies (set via `/api/auth/sync`) — read by the Next.js
 *   middleware (route gating) and by Server Components (`cookies()` from
 *   `next/headers`) so they can pre-render authenticated pages without
 *   waiting on a client-side fetch.
 */

const TOKEN_KEY = "tasheen.access_token";
const REFRESH_KEY = "tasheen.refresh_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_KEY }));
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_KEY, token);
}

/**
 * Mirror tokens into httpOnly cookies. Awaited at login/register/google-
 * login sites so the cookie is in place before the user is redirected
 * into a middleware-gated route. Failures here would leave the user with
 * a token in localStorage but no cookie — the middleware would then
 * redirect them to `/sign-in`, so callers should surface failures.
 */
export async function syncAuthCookies(
  accessToken: string,
  refreshToken?: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  await fetch("/api/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, refreshToken }),
    credentials: "same-origin",
  });
}

/**
 * Synchronously drop tokens from localStorage and notify same-tab
 * listeners (the AuthProvider's `useSyncExternalStore`). Does NOT touch
 * the httpOnly cookie — call `clearAuthCookies()` for that.
 */
export function clearLocalAuthTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_KEY }));
}

/**
 * Awaitable cookie clear. Useful when the caller is about to navigate
 * into / past a middleware-gated route and needs to be sure the cookie
 * is gone before the redirect happens.
 */
export async function clearAuthCookies(): Promise<void> {
  if (typeof window === "undefined") return;
  await fetch("/api/auth/clear", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => {});
}

/**
 * Clear both localStorage and the httpOnly cookie. Cookie clear is
 * fire-and-forget — used from non-blocking paths like `onUnauthorized`
 * where the redirect is via `window.location.href` (full page load) so
 * cookie state is re-read by the browser regardless.
 */
export function clearAuthToken(): void {
  clearLocalAuthTokens();
  void clearAuthCookies();
}

export async function onUnauthorized(): Promise<void> {
  // 401 from the API ⇒ session expired or revoked. Clear local state and
  // bounce to sign-in. The page-level guard rails will then redirect the
  // user back to where they were post-auth.
  clearAuthToken();
  if (typeof window !== "undefined") {
    const next = encodeURIComponent(window.location.pathname);
    window.location.href = `/sign-in?next=${next}`;
  }
}
