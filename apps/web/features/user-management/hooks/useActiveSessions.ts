import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";

export interface ActiveSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  createdAt: string;
  expiresAt: string;
}

export function useActiveSessions() {
  return useQuery({
    queryKey: ["active-sessions"],
    queryFn: async (): Promise<ActiveSession[]> => {
      const { data, error } = await api.GET("/api/v1/users/me/sessions", {});
      if (error) throw error;
      return unwrap(data) as ActiveSession[];
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await api.DELETE("/api/v1/users/me/sessions/{id}", {
        params: { path: { id: sessionId } }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
    },
  });
}
