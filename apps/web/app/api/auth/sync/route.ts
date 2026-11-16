import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSameOriginRequest } from "@/lib/same-origin";

/**
 * Mirrors the client-side access token into an httpOnly cookie. Called from
 * `setAuthToken` after every successful login / register / refresh so the
 * Next.js middleware (which can't read localStorage) can gate `/account/*`
 * at the edge — eliminating the spinner-then-redirect flicker — and so
 * Server Components can prefetch authenticated data via `cookies()`.
 *
 * The actual API still authenticates via the `Authorization: Bearer …`
 * header from localStorage on client requests; the cookie is purely a
 * server-side mirror. The refresh token stays client-side: nothing on the
 * server reads it, so it is not stored in a cookie.
 *
 * Only same-origin JSON requests are accepted. Without this, a cross-site
 * form could plant another account's token (login CSRF) and Server
 * Components would render that account's data.
 */
const TOKEN_COOKIE = "tasheen.access_token";
// Browsers cap a cookie (name + value + attributes) at about 4 KB.
const MAX_TOKEN_LENGTH = 4096;

/**
 * Decide whether to set the `Secure` flag on auth cookies. We can't trust
 * `NODE_ENV === "production"` for this — `next start` always sets that to
 * "production", but a local production build runs over plain HTTP and
 * browsers silently drop `Secure` cookies sent over HTTP. So we check the
 * actual request: direct HTTPS, or behind a TLS-terminating proxy that
 * sets `x-forwarded-proto: https`.
 */
function isSecureRequest(request: Request): boolean {
  if (request.url.startsWith("https://")) return true;
  return request.headers.get("x-forwarded-proto") === "https";
}

function isJsonRequest(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return (type.split(";", 1)[0] ?? "").trim().toLowerCase() === "application/json";
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request) || !isJsonRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { accessToken?: unknown } | null;
  const accessToken = body?.accessToken;
  if (
    typeof accessToken !== "string" ||
    accessToken.length === 0 ||
    accessToken.length > MAX_TOKEN_LENGTH
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const cookieStore = await cookies();

  // The access token JWT itself expires server-side after ~15m, but we
  // keep the cookie alive for the full refresh-token window so the
  // middleware doesn't bounce a returning user to /sign-in on a fresh
  // page load. Once they're in, the API client transparently rotates
  // the access token via the refresh token, and re-syncs this cookie.
  // 7d is a safe upper bound that matches the default refresh-token
  // lifetime ("remember me" extends the refresh token to 30d, but the
  // cookie still effectively lives until its content is rotated).
  cookieStore.set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
