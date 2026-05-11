import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Mirrors the client-side auth tokens into httpOnly cookies. Called from
 * `setAuthToken` after every successful login / register / refresh so the
 * Next.js middleware (which can't read localStorage) can gate `/account/*`
 * at the edge — eliminating the spinner-then-redirect flicker — and so
 * Server Components can prefetch authenticated data via `cookies()`.
 *
 * The actual API still authenticates via the `Authorization: Bearer …`
 * header from localStorage on client requests; the cookie is purely a
 * server-side mirror.
 */
const TOKEN_COOKIE = "tasheen.access_token";
const REFRESH_COOKIE = "tasheen.refresh_token";

interface SyncBody {
  accessToken?: string;
  refreshToken?: string;
}

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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SyncBody | null;
  const accessToken = body?.accessToken;
  const refreshToken = body?.refreshToken;

  if (!accessToken) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const cookieStore = await cookies();
  const secure = isSecureRequest(request);

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
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30d
    });
  }

  return NextResponse.json({ ok: true });
}
