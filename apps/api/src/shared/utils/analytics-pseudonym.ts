import { createHmac } from "node:crypto";

/**
 * Guest tokens open a guest's cart, checkout and orders, so analytics never
 * stores them: it stores a keyed hash instead, which still groups a guest's
 * events but cannot be used as a credential. Without a configured secret the
 * token is dropped.
 */
export function pseudonymizeGuestToken(token?: string | null): string | undefined {
  if (!token) return undefined;
  const secret = process.env.ANALYTICS_PSEUDONYM_SECRET || process.env.JWT_SECRET;
  if (!secret) return undefined;
  return `gt_${createHmac("sha256", secret).update(`analytics-guest:${token}`).digest("base64url")}`;
}
