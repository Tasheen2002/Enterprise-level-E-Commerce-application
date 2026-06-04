export default function DashboardLoading() {
  return (
    <div className="h-[70vh] w-full flex items-center justify-center bg-[#F5F1E8]">
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <h2 className="text-[13px] font-serif tracking-[0.25em] uppercase text-charcoal mb-1">
          Tasheen Admin
        </h2>
        <div className="flex justify-center">
          <div className="relative w-12 h-12">
            {/* Outer brand circle track */}
            <div className="absolute inset-0 rounded-full border border-stone-200/40" />
            {/* Primary burgundy spinner with editorial ease */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-burgundy animate-[spin_1.4s_cubic-bezier(0.22,1,0.36,1)_infinite]" />
            {/* Inner secondary gold spinner in reverse direction */}
            <div className="absolute inset-2 rounded-full border border-transparent border-b-gold/60 animate-[spin_0.9s_linear_infinite_reverse]" />
          </div>
        </div>
        <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-charcoal/60 leading-none">
          Syncing registry ledger...
        </p>
      </div>
    </div>
  );
}
