import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSameOriginRequest } from "@/lib/same-origin";

/**
 * Clears the httpOnly auth cookies. Called from `clearAuthToken` and
 * `useLogout` so the middleware no longer sees a session and Server
 * Components stop returning authenticated data. Cross-site requests are
 * refused so another site cannot force a logout.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete("tasheen.access_token");
  // No longer set; still removed so cookies issued by earlier builds expire.
  cookieStore.delete("tasheen.refresh_token");
  return NextResponse.json({ ok: true });
}
