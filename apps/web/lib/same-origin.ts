/**
 * CSRF guard for cookie-mutating Route Handlers (Next.js only protects Server
 * Actions automatically).
 *
 * Browsers that send Fetch Metadata must report `Sec-Fetch-Site: same-origin`.
 * Older browsers fall back to comparing `Origin` with the public host
 * (`X-Forwarded-Host` behind a proxy, else `Host`). A request with neither
 * signal is refused.
 */
export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null) return fetchSite === "same-origin";

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === (host.split(",", 1)[0] ?? "").trim();
  } catch {
    return false;
  }
}
