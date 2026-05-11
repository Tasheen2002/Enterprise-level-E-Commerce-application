"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { getAuthToken } from "@/lib/auth";
import {
  getAccessTokenExp,
  refreshAccessToken,
} from "@/lib/auth-refresh";

/**
 * Schedule the proactive refresh this many ms before the access token's
 * `exp`. Big enough to cover request latency + minor clock skew, small
 * enough that we still get most of the token's useful lifetime.
 */
const REFRESH_LEAD_MS = 30_000;

/**
 * Lightweight auth context. Wraps whatever underlying auth source is used
 * (NextAuth.js session, custom cookie, localStorage) so feature components
 * read a stable shape via `useAuth()`.
 *
 * Hydration model:
 * - Server has no localStorage, so SSR always renders as `isAuthenticated:
 *   false, isLoading: true` to avoid claiming a logged-out state we can't
 *   yet verify on the client.
 * - After mount, an effect flips `isLoading` to false; only then is
 *   `isAuthenticated` trustworthy. Consumers that gate redirects on
 *   `!isAuthenticated` MUST also check `!isLoading`, otherwise they will
 *   redirect on every hard refresh during the hydration window.
 */
export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
});

/** Subscribe to storage changes (cross-tab sync). */
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Client snapshot — return the actual token string (or null) rather
 * than a boolean so the proactive-refresh effect re-runs whenever the
 * token rotates, not just when auth presence flips. String equality is
 * value-based so React's Object.is check correctly skips re-renders
 * when the same token comes back.
 */
function getSnapshot(): string | null {
  return getAuthToken();
}

/** Server snapshot — no localStorage on the server. */
function getServerSnapshot(): string | null {
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const token = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isAuthenticated = Boolean(token);

  // `isHydrated` flips to true after the first client effect runs. Until
  // then we report `isLoading: true` so consumers don't act on the
  // server-snapshot value (which is always `false` regardless of the real
  // localStorage token).
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Proactive token rotation. Decode the JWT `exp` and schedule a
  // refresh `REFRESH_LEAD_MS` before it expires; re-runs whenever the
  // token changes (post-rotation, post-login, post-logout). Without
  // this, the access token would silently expire mid-session and the
  // next API call would 401 — the request retry in `api-client` saves
  // the session but loses that one request.
  useEffect(() => {
    if (!token) return;
    const exp = getAccessTokenExp(token);
    if (!exp) return;
    // Clamp to >=1s so an already-expired token rotates immediately
    // instead of firing synchronously and tripping React's effect rules.
    const delay = Math.max(1_000, exp * 1_000 - Date.now() - REFRESH_LEAD_MS);
    const timer = window.setTimeout(() => {
      void refreshAccessToken();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [token]);

  // Memoize so consumers reading via `useAuth()` (and React Query hooks
  // gated by `isAuthenticated`) only re-render when the actual auth state
  // changes — not on every parent render.
  const state = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, isLoading: !isHydrated }),
    [isAuthenticated, isHydrated],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

