import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-[70vh] w-full flex items-center justify-center bg-[#F5F1E8]">
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <h2 className="text-[13px] font-serif tracking-[0.25em] uppercase text-charcoal mb-1">
          Tasheen Admin
        </h2>
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 text-burgundy animate-spin stroke-[1.5]" />
        </div>
        <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-charcoal/60 leading-none">
          Syncing registry ledger...
        </p>
      </div>
    </div>
  );
}
