import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "tasheen.access_token";

/**
 * Edge-runtime auth gate for the account section. Runs before the page
 * renders, so anonymous visitors are redirected to `/sign-in` without
 * downloading the account JS bundle and without flashing a spinner.
 *
 * The cookie is set by `/api/auth/sync` (called from the client whenever
 * `setAuthToken` runs). The middleware only checks for the cookie's
 * presence — it does NOT validate the token. Validation happens at the
 * backend when the page actually fetches protected data.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (token) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const next = encodeURIComponent(pathname + search);
  const url = new URL(`/sign-in?next=${next}`, request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*"],
};
