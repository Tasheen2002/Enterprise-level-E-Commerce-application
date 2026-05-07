import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VerifyEmailContent } from "../../../features/user-management/components/VerifyEmailContent";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
          <p className="text-[10px] text-stone-400 uppercase tracking-widest">Loading Boutique...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
