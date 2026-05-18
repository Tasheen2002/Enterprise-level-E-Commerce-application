"use client";

import { useEffect } from "react";
import { Button } from "@tasheen/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center space-y-6">
      <h2 className="font-serif text-3xl text-charcoal italic uppercase tracking-[0.1em]">
        An Unexpected Error Occurred
      </h2>
      <p className="text-stone-400 text-xs uppercase tracking-widest max-w-md leading-relaxed">
        The catalog archive could not load. Our digital artisans have been notified.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="px-6 py-3 bg-charcoal text-cream text-[10px] uppercase font-bold tracking-widest rounded-none"
        >
          Try Again
        </Button>
        <a
          href="/"
          className="px-6 py-3 border border-sand/40 text-charcoal text-[10px] uppercase font-bold tracking-widest hover:border-charcoal transition-colors duration-300"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
