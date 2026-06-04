/**
 * Root-level loading skeleton — catches any top-level route transitions
 * (e.g. homepage → account, homepage → auth). Shows a minimal branded
 * loading state to prevent white flashes.
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <p className="font-serif text-3xl text-charcoal tracking-[0.2em] uppercase italic">
          Slipperze
        </p>
        <div className="flex justify-center">
          <div className="relative w-12 h-12">
            {/* Outer brand circle track */}
            <div className="absolute inset-0 rounded-full border border-stone-200/40" />
            {/* Primary gold spinner with editorial ease */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-[spin_1.4s_cubic-bezier(0.22,1,0.36,1)_infinite]" />
            {/* Inner secondary gold-deep spinner in reverse direction */}
            <div className="absolute inset-2 rounded-full border border-transparent border-b-gold-deep/60 animate-[spin_0.9s_linear_infinite_reverse]" />
          </div>
        </div>
        <p className="text-[9px] uppercase tracking-[0.4em] text-stone-400 font-bold">
          Preparing your experience
        </p>
      </div>
    </div>
  );
}
