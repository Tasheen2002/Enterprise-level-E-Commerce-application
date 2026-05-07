/**
 * Public runtime config. Centralised here so feature code never reads
 * `process.env` directly — easier to mock in tests and keeps a single
 * audit point for which env vars the client expects.
 */

const required = (name: string, value: string | undefined): string => {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const config = {
  apiBaseUrl: required(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ),
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  brand: process.env.NEXT_PUBLIC_BRAND ?? "Slipperze",
  imageCdn: process.env.NEXT_PUBLIC_IMAGE_CDN ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
} as const;

export type AppConfig = typeof config;
