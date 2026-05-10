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

/** Client snapshot — read the real token from localStorage. */
function getSnapshot(): boolean {
  return Boolean(getAuthToken());
}

/** Server snapshot — no localStorage on the server, always false. */
function getServerSnapshot(): boolean {
  return false;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const isAuthenticated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // `isHydrated` flips to true after the first client effect runs. Until
  // then we report `isLoading: true` so consumers don't act on the
  // server-snapshot value (which is always `false` regardless of the real
  // localStorage token).
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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

