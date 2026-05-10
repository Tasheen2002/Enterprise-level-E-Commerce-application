import "server-only";

import { cookies } from "next/headers";
import { config } from "./config";
import type { UserIdentity, UserProfile } from "@/features/user-management/types";

const API_PREFIX = "/api/v1";
const TOKEN_COOKIE = "tasheen.access_token";

/**
 * Server-only fetch wrapper. Reads the httpOnly auth cookie via
 * `next/headers`, attaches it as a Bearer token, and unwraps the standard
 * `{ success, data }` envelope. Returns `null` when the user is not
 * authenticated or the API returns an error — callers decide how to fall
 * back (typically: hand off to the client to fetch with localStorage
 * Bearer, e.g. via React Query's normal cache miss path).
 */
async function serverRequest<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${config.apiBaseUrl}${API_PREFIX}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      // Per-request data — never share across users via the data cache.
      cache: "no-store",
    });

    if (!response.ok) return null;

    const text = await response.text();
    if (!text) return null;

    const body = JSON.parse(text) as { success?: boolean; data?: T };
    if (!body.success) return null;
    return (body.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function getCurrentUserServer(): Promise<UserIdentity | null> {
  return serverRequest<UserIdentity>("/auth/me");
}

export async function getUserProfileServer(): Promise<UserProfile | null> {
  return serverRequest<UserProfile>("/users/me/profile");
}
