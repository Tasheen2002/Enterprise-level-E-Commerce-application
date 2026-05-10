/**
 * Streaming fallback for the account section. Mirrors the layout used by
 * `AccountDashboard` so the page shape is stable while the SSR prefetch
 * resolves — no layout shift when the real content streams in.
 *
 * Mobile sizing must stay in lockstep with `AccountDashboard.tsx` —
 * any padding/avatar/gap change there should be repeated here.
 */
export function AccountSkeleton() {
  return (
    <div className="flex-1 p-5 sm:p-8 lg:p-20 space-y-10 sm:space-y-16 animate-pulse">
      <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-10 lg:gap-12">
        <div className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 rounded-full bg-stone-100 ring-1 ring-sand/30" />
        <div className="space-y-3 flex-1 w-full">
          <div className="h-8 sm:h-10 lg:h-14 w-2/3 bg-stone-100 rounded" />
          <div className="h-3 w-40 bg-stone-50 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 sm:gap-y-8 pt-6 sm:pt-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 border-b border-sand/20 pb-2">
                <div className="h-2 w-24 bg-stone-100 rounded" />
                <div className="h-4 w-full bg-stone-50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6 sm:space-y-8">
        <div className="h-5 w-48 bg-stone-100 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-sand/30 bg-ivory/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 sm:h-40 border-b md:border-b-0 md:border-r border-sand/20 last:border-r-0 last:border-b-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
