"use client";

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { getAuthToken, clearAuthToken } from "@/lib/auth";
import { api, unwrap } from "@/lib/api-client";

/**
 * Lightweight auth context. Wraps whatever underlying auth source is used
 * (NextAuth.js session, custom cookie, localStorage) so feature components
 * read a stable shape via `useAuth()`.
 */
export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthContextValue>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = getAuthToken();
      if (!token) {
        setState({ isAuthenticated: false, isLoading: false, user: null });
        return;
      }

      try {
        // We use the api-client directly
        const { data, error } = await api.GET("/api/v1/users/me", {});
        if (error) throw error;
        
        setState({ 
          isAuthenticated: true, 
          isLoading: false, 
          user: unwrap(data) 
        });
      } catch (err) {
        console.error("Auth fetch error:", err);
        clearAuthToken();
        setState({ isAuthenticated: false, isLoading: false, user: null });
      }
    };

    fetchUser();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
