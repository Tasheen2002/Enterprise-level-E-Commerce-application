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
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
        </div>
        <p className="text-[9px] uppercase tracking-[0.4em] text-stone-400 font-bold">
          Preparing your experience
        </p>
      </div>
    </div>
  );
}
