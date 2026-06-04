"use client";

import React, { Suspense } from "react";
import { SearchResultsContent } from "./SearchResultsContent";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 text-gold animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="font-serif italic text-xs tracking-widest text-stone-400">
              Loading Slipperze Search...
            </p>
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
