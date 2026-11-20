import { createHmac, timingSafeEqual } from "node:crypto";

// Unsubscribe links carry a token signed with a server secret, so only the
// recipient of a newsletter email can unsubscribe that address without
// signing in. Use createNewsletterUnsubscribeToken when building the link:
//   /api/v1/engagement/newsletter/unsubscribe?email=<email>&token=<token>

function signingSecret(): string | null {
  return process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || null;
}

function sign(secret: string, email: string): string {
  return createHmac("sha256", secret)
    .update(`newsletter-unsubscribe:${email.trim().toLowerCase()}`)
    .digest("base64url");
}

export function createNewsletterUnsubscribeToken(email: string): string {
  const secret = signingSecret();
  if (!secret) {
    throw new Error("No secret is configured for newsletter unsubscribe links");
  }
  return sign(secret, email);
}

export function isValidNewsletterUnsubscribeToken(email: string, token: string | undefined): boolean {
  const secret = signingSecret();
  if (!secret || !token) return false;
  const expected = Buffer.from(sign(secret, email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
