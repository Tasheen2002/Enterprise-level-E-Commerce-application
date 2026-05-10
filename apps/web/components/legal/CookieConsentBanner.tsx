"use client";

import { useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@tasheen/ui";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { CookiePreferencesModal } from "./CookiePreferencesModal";

/**
 * Bottom-fixed cookie consent banner. Renders only after the client has
 * hydrated AND no consent decision exists. Mounts the preferences modal
 * lazily (only when "Customise" is clicked) so the modal's bundle isn't
 * downloaded on first paint for users who immediately Accept/Reject.
 */
export function CookieConsentBanner() {
  const { needsDecision, acceptAll, rejectAll } = useCookieConsent();
  const [prefsOpen, setPrefsOpen] = useState(false);

  // Suspense-safe: render nothing until we know whether the user already
  // decided (server-side: `false`; client-side after hydration: real
  // value). This avoids the "banner flashes then disappears" effect.
  if (!needsDecision && !prefsOpen) return null;

  return (
    <>
      {needsDecision && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[90] bg-white border-t border-stone-200 shadow-2xl animate-in slide-in-from-bottom-4 duration-500"
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="hidden sm:block p-3 bg-stone-50 text-gold rounded-full shrink-0">
                  <Cookie className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-charcoal">
                    A note on cookies
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-2xl">
                    We use cookies to keep you signed in and to understand how
                    the boutique is used. You can accept all, reject
                    non-essential, or pick categories. Learn more in our{" "}
                    <Link
                      href="/legal/cookies"
                      className="underline underline-offset-2 hover:text-charcoal"
                    >
                      cookie policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setPrefsOpen(true)}
                >
                  Customise
                </Button>
                <Button variant="ghost" size="md" onClick={rejectAll}>
                  Reject non-essential
                </Button>
                <Button variant="primary" size="md" onClick={acceptAll}>
                  Accept all
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CookiePreferencesModal
        isOpen={prefsOpen}
        onClose={() => setPrefsOpen(false)}
      />
    </>
  );
}
