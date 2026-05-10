"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Cookie consent state for the storefront.
 *
 * Categories follow the standard GDPR/ePrivacy taxonomy:
 *
 *   - `essential`   Always true. Auth + cart cookies — the site can't
 *                   function without them and they don't legally
 *                   require consent.
 *   - `analytics`   Page-view tracking, performance metrics, etc. —
 *                   Google Analytics, Plausible, PostHog, etc.
 *   - `marketing`   Re-targeting / advertising — Meta Pixel, Google
 *                   Ads, TikTok, etc.
 *
 * The consent record itself lives in localStorage (NOT a cookie — that
 * would be circular). When the user makes a choice, all browsers tabs
 * get notified via the `storage` event so banners hide everywhere at
 * once.
 *
 * To gate a tracking script on consent later:
 *   const consent = useCookieConsent();
 *   if (consent.consent?.analytics) loadAnalytics();
 */

const STORAGE_KEY = "tasheen.cookie_consent";
const CURRENT_VERSION = 1;

export interface CookieConsentRecord {
  version: number;
  /** Unix ms when the user made the choice. */
  decidedAt: number;
  essential: true;
  analytics: boolean;
  marketing: boolean;
}

export interface UseCookieConsentResult {
  /** `null` until the user has made a choice. */
  consent: CookieConsentRecord | null;
  /** `true` when there's no stored decision yet → show the banner. */
  needsDecision: boolean;
  /** `true` until the first client mount has read localStorage. */
  isHydrating: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choices: { analytics: boolean; marketing: boolean }) => void;
  clear: () => void;
}

function readStored(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    // Reject malformed or older versions — forces re-prompt after we
    // change the cookie taxonomy or add a new category.
    if (parsed.version !== CURRENT_VERSION) return null;
    if (typeof parsed.decidedAt !== "number") return null;
    return {
      version: CURRENT_VERSION,
      decidedAt: parsed.decidedAt,
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

function write(record: CookieConsentRecord | null): void {
  if (typeof window === "undefined") return;
  if (record === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }
  // Same-tab listeners don't get the native `storage` event — synthesize
  // it so other components in this tab also re-render.
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function subscribe(callback: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot(): string {
  return "";
}

export function useCookieConsent(): UseCookieConsentResult {
  // Subscribe to localStorage changes — useSyncExternalStore returns the
  // raw string, which we parse into a record below.
  const raw = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // SSR + the FIRST client render must produce identical output, otherwise
  // React throws a hydration mismatch. We can't use `typeof window` to
  // gate this — that flips between server and client by definition.
  // Instead, start as "still hydrating" on both sides, then flip to
  // hydrated after the first effect runs (client-only).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const consent = raw ? readStored() : null;
  const isHydrating = !hydrated;
  const needsDecision = hydrated && consent === null;

  const acceptAll = useCallback(() => {
    write({
      version: CURRENT_VERSION,
      decidedAt: Date.now(),
      essential: true,
      analytics: true,
      marketing: true,
    });
  }, []);

  const rejectAll = useCallback(() => {
    write({
      version: CURRENT_VERSION,
      decidedAt: Date.now(),
      essential: true,
      analytics: false,
      marketing: false,
    });
  }, []);

  const save = useCallback(
    (choices: { analytics: boolean; marketing: boolean }) => {
      write({
        version: CURRENT_VERSION,
        decidedAt: Date.now(),
        essential: true,
        analytics: choices.analytics,
        marketing: choices.marketing,
      });
    },
    [],
  );

  const clear = useCallback(() => write(null), []);

  return { consent, needsDecision, isHydrating, acceptAll, rejectAll, save, clear };
}
