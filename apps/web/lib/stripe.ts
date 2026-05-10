"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { config } from "./config";

/**
 * Singleton `loadStripe` wrapper. `loadStripe` lazy-loads Stripe.js (~50 KB
 * gzipped) from Stripe's CDN — calling it once and caching the promise
 * means subsequent <Elements> mounts hit the in-memory cache and don't
 * re-trigger the network request.
 *
 * Returns `null` (not a rejected promise) when the publishable key is
 * missing, so callers can degrade gracefully in environments where
 * Stripe is intentionally unconfigured (e.g. local dev without a key).
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = config.stripePublishableKey;
    if (!key) {
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}
