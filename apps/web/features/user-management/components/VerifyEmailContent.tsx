"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Mail,
  ArrowRight
} from "lucide-react";
import { Button, Input } from "@tasheen/ui";
import { toast } from "sonner";
import { useVerifyEmail } from "@/features/user-management/hooks/useVerifyEmail";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const verifyEmail = useVerifyEmail();
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    if (token && !verifyEmail.isSuccess && !verifyEmail.isError && !verifyEmail.isPending) {
      verifyEmail.mutate({ token });
    }
  }, [token, verifyEmail]);

  const handleResend = () => {
    toast.info("Please contact support or sign in to resend verification.");
  };

  return (
    <div className="max-w-md w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-stone-50 rounded-full shadow-sm">
            {verifyEmail.isPending ? (
              <Loader2 className="h-10 w-10 text-gold animate-spin" />
            ) : verifyEmail.isSuccess ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            ) : verifyEmail.isError ? (
              <AlertCircle className="h-10 w-10 text-burgundy" />
            ) : (
              <Mail className="h-10 w-10 text-stone-300" />
            )}
          </div>
        </div>
        <h1 className="font-serif text-4xl text-charcoal tracking-tight">
          {verifyEmail.isPending ? "Authenticating..." : 
           verifyEmail.isSuccess ? "Identity Confirmed" : 
           verifyEmail.isError ? "Verification Failed" : "Verify your email"}
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest font-medium">
          {verifyEmail.isPending ? "Confirming your artisanal heritage credentials." : 
           verifyEmail.isSuccess ? "Your Slipperze account is now fully activated." : 
           verifyEmail.isError ? "The link may have expired or is invalid." : (
             <>
               We've sent a secure link to <span className="text-charcoal font-bold lowercase tracking-normal">{email || "your inbox"}</span>.
             </>
           )}
        </p>
      </header>

      <div className="space-y-6">
        {verifyEmail.isSuccess && (
          <Button 
            className="w-full h-14 group" 
            onClick={() => router.push("/account")}
          >
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}

        {verifyEmail.isError && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full h-14"
              onClick={() => router.push("/sign-in")}
            >
              Back to Sign In
            </Button>
            <p className="text-[10px] text-center text-stone-400 uppercase tracking-[0.2em] pt-4">
              Need a new link? <button onClick={handleResend} className="text-gold hover:underline">Resend Email</button>
            </p>
          </div>
        )}

        {!token && !verifyEmail.isPending && (
          <div className="space-y-8 animate-in fade-in duration-1000 delay-300">
             <div className="p-8 bg-stone-50/50 border border-stone-100 rounded-sm space-y-6">
                <p className="text-xs text-stone-500 leading-loose text-center uppercase tracking-widest font-medium opacity-60">
                  Manual Entry
                </p>
                <div className="space-y-4">
                  <Input 
                    placeholder="PASTE TOKEN HERE" 
                    className="text-center tracking-[0.3em] font-mono text-xs h-12 bg-white border-stone-200 focus:border-gold transition-colors"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                  />
                  <Button 
                    variant="primary" 
                    className="w-full h-14 uppercase tracking-[0.3em] text-[10px] font-bold shadow-lg shadow-gold/10"
                    disabled={!manualToken || verifyEmail.isPending}
                    onClick={() => verifyEmail.mutate({ token: manualToken })}
                  >
                    {verifyEmail.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify Identity"
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-stone-100" />
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] text-stone-300">
                    <span className="bg-stone-50 px-4">Or check inbox</span>
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed text-center italic">
                  Check your spam folder if the artisanal link doesn't appear within a few moments.
                </p>
             </div>
             <div className="text-center">
               <Link href="/sign-in" className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-charcoal transition-colors underline underline-offset-8">
                 Return to Boutique
               </Link>
             </div>
          </div>
        )}
      </div>

      <footer className="pt-12 text-center">
        <p className="text-[9px] text-stone-300 uppercase tracking-[0.4em]">
          Secure Artisanal Authentication
        </p>
      </footer>
    </div>
  );
}
