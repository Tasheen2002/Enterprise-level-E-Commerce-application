"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, BarChart3, Megaphone, X } from "lucide-react";
import { Button, cn } from "@tasheen/ui";
import {
  useCookieConsent,
  type CookieConsentRecord,
} from "@/hooks/useCookieConsent";

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  {
    key: "essential",
    icon: ShieldCheck,
    title: "Strictly necessary",
    description:
      "Required for the boutique to function — keeps you signed in, secures your cart, and remembers your delivery preferences. These cannot be turned off.",
    locked: true,
  },
  {
    key: "analytics",
    icon: BarChart3,
    title: "Analytics & performance",
    description:
      "Anonymous measurements (page views, response times, errors) so we can understand how the boutique is used and improve it.",
    locked: false,
  },
  {
    key: "marketing",
    icon: Megaphone,
    title: "Marketing & personalisation",
    description:
      "Used to show you relevant collections on other sites and to measure the effectiveness of our advertising.",
    locked: false,
  },
] as const;

/**
 * Per-category opt-in/out modal. Initialises checkboxes from the user's
 * current saved consent if any (so reopening the modal doesn't lose
 * their previous choice). On Save, writes through `save()` which
 * triggers a same-tab `storage` event so the banner closes.
 */
export function CookiePreferencesModal({
  isOpen,
  onClose,
}: CookiePreferencesModalProps) {
  const { consent, save, acceptAll, rejectAll } = useCookieConsent();
  const initial = consent ?? defaultChoices();
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [marketing, setMarketing] = useState(initial.marketing);

  if (!isOpen) return null;

  const handleSave = () => {
    save({ analytics, marketing });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-charcoal/75 animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-2xl bg-white shadow-2xl rounded-sm animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between px-8 py-6 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="font-serif text-xl text-charcoal">Cookie preferences</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-1">
              Configure each category below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-charcoal transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 space-y-6">
          <p className="text-sm text-stone-500 leading-relaxed">
            We use cookies to keep the boutique secure and to understand how
            it&apos;s used. You can change these choices at any time from the
            footer. Read our{" "}
            <Link
              href="/legal/cookies"
              className="underline underline-offset-2 hover:text-charcoal"
            >
              cookie policy
            </Link>
            .
          </p>

          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const checked =
                cat.key === "essential"
                  ? true
                  : cat.key === "analytics"
                    ? analytics
                    : marketing;
              const onChange = (next: boolean) => {
                if (cat.key === "analytics") setAnalytics(next);
                if (cat.key === "marketing") setMarketing(next);
              };
              return (
                <div
                  key={cat.key}
                  className="border border-stone-100 p-5 flex gap-4 items-start"
                >
                  <div className="mt-1 p-2 bg-stone-50 text-stone-400 rounded-full shrink-0">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">
                        {cat.title}
                      </h3>
                      <Toggle
                        checked={checked}
                        disabled={cat.locked}
                        onChange={onChange}
                        label={cat.title}
                      />
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="flex flex-col sm:flex-row gap-3 px-8 py-6 border-t border-stone-100 shrink-0">
          <Button
            variant="ghost"
            onClick={() => {
              rejectAll();
              onClose();
            }}
          >
            Reject all
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              acceptAll();
              onClose();
            }}
          >
            Accept all
          </Button>
          <Button variant="primary" onClick={handleSave} className="sm:ml-auto">
            Save preferences
          </Button>
        </footer>
      </div>
    </div>
  );
}

function defaultChoices(): CookieConsentRecord {
  return {
    version: 1,
    decidedAt: 0,
    essential: true,
    analytics: false,
    marketing: false,
  };
}

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

function Toggle({ checked, disabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-charcoal" : "bg-stone-200",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
