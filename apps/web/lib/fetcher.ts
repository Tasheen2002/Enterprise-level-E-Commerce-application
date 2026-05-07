import { api, unwrap } from "./api-client";

/**
 * Minimal fetcher abstraction for ad-hoc calls (Server Components, etc.)
 * that don't go through the typed `api` client. Always unwraps the
 * canonical envelope.
 */
export async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json();
  return unwrap<T>(body);
}

export { api };
