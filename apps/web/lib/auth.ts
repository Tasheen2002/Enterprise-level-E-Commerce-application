/**
 * Auth helpers used by the API client and by feature code that needs to
 * inspect the current session. Currently a thin wrapper around localStorage
 * — swap in NextAuth.js / cookie-based sessions / your auth provider of
 * choice without touching the API client.
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
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
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
