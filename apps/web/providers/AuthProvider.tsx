"use client";

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { getAuthToken } from "@/lib/auth";

/**
 * Lightweight auth context. Wraps whatever underlying auth source is used
 * (NextAuth.js session, custom cookie, localStorage) so feature components
 * read a stable shape via `useAuth()`.
 */
export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthContextValue>({
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = getAuthToken();
    setState({ isAuthenticated: Boolean(token), isLoading: false });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
