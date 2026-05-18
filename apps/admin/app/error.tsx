"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Console Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex flex-col items-center justify-center p-6 text-center space-y-6 text-charcoal">
      <h2 className="font-serif text-3xl italic uppercase tracking-[0.1em] text-burgundy">
        System Operational Alert
      </h2>
      <p className="text-charcoal/60 text-xs uppercase tracking-widest max-w-md leading-relaxed font-semibold">
        A dashboard rendering runtime exception occurred. The system logs have recorded this event.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-charcoal text-cream text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-stone-700 transition-colors"
        >
          Reset Frame
        </button>
        <a
          href="/"
          className="px-6 py-3 border border-charcoal/20 text-charcoal text-[10px] uppercase font-bold tracking-[0.2em] hover:border-charcoal transition-colors"
        >
          Return to Overview
        </a>
      </div>
    </div>
  );
}
