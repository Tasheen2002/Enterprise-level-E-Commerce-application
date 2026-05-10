import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Clears the httpOnly auth cookies. Called from `clearAuthToken` and
 * `useLogout` so the middleware no longer sees a session and Server
 * Components stop returning authenticated data.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("tasheen.access_token");
  cookieStore.delete("tasheen.refresh_token");
  return NextResponse.json({ ok: true });
}
