"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, unwrap } from "../../lib/api-client";
import { setAuthToken } from "../../lib/auth";
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA challenge state
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use 'as any' to bypass temporary type drift between client and server
      const response = await (api as any).POST("/api/v1/auth/login", {
        body: {
          email,
          password,
        },
      });

      if (response.error) throw response.error;
      const result = unwrap(response.data as any) as any;
      
      // Handle 2FA challenge
      if (result.kind === "two_factor_required" && result.pendingToken) {
        setPendingToken(result.pendingToken);
        return;
      }

      // Ensure the user has a staff-level role
      if (!result.user || !["ADMIN", "INVENTORY_STAFF", "CUSTOMER_SERVICE", "ANALYST"].includes(result.user.role)) {
        setError("Access denied. This portal is reserved for Atelier staff.");
        return;
      }

      setAuthToken(result.accessToken);
      localStorage.setItem("lastLogin", new Date().toISOString());
      window.location.href = next;
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken || !totpCode) return;
    setIsVerifying2FA(true);
    setError(null);

    try {
      const response = await (api as any).POST("/api/v1/auth/2fa/verify", {
        body: {
          pendingToken,
          code: totpCode,
        },
      });

      if (response.error) throw response.error;
      const result = unwrap(response.data as any) as any;

      // Ensure the user has a staff-level role
      if (!result.user || !["ADMIN", "INVENTORY_STAFF", "CUSTOMER_SERVICE", "ANALYST"].includes(result.user.role)) {
        setError("Access denied. This portal is reserved for Atelier staff.");
        return;
      }

      setAuthToken(result.accessToken);
      localStorage.setItem("lastLogin", new Date().toISOString());
      window.location.href = next;
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again or use a backup code.");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleBack = () => {
    setPendingToken(null);
    setTotpCode("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-[440px]">
        {/* Branding */}
        <div className="text-center mb-12">
          <h1 className="font-serif italic text-4xl text-[#333] mb-2 tracking-tight">
            Atelier Boutique
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#333]/60 font-bold">
            Administrative Suite
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#EBE6D9] border border-[#333]/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 rounded-sm">
          
          {!pendingToken ? (
            <>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#333] mb-8 text-center">
                Sign In
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label 
                    htmlFor="email" 
                    className="text-[10px] uppercase tracking-wider text-[#333]/60 font-bold block"
                  >
                    Atelier Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/50 border border-[#333]/10 px-4 py-3 text-sm font-medium text-[#1c1917] focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm placeholder:text-[#333]/20"
                    placeholder="concierge@tasheen.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label 
                    htmlFor="password" 
                    className="text-[10px] uppercase tracking-wider text-[#333]/60 font-bold block"
                  >
                    Security Key
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/50 border border-[#333]/10 px-4 py-3 text-sm font-medium text-[#1c1917] focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm placeholder:text-[#333]/20 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333]/30 hover:text-[#333] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff size={16} strokeWidth={1.5} />
                      ) : (
                        <Eye size={16} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#333] text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-[#333]/10"
                >
                  {isLoading ? "Verifying..." : "Enter Atelier"}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* 2FA Challenge Step */}
              <div className="text-center mb-8 space-y-3">
                <ShieldCheck className="w-10 h-10 text-[#C5A059] mx-auto" strokeWidth={1.5} />
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#333]">
                  Two-Factor Verification
                </h2>
                <p className="text-[10px] text-[#333]/50 uppercase tracking-[0.2em] font-bold leading-relaxed">
                  Enter the code from your authenticator app — or a backup code.
                </p>
              </div>

              <form onSubmit={handle2FAVerify} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label 
                    htmlFor="totp-code" 
                    className="text-[10px] uppercase tracking-wider text-[#333]/60 font-bold block"
                  >
                    Authentication Code
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    inputMode="text"
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    required
                    maxLength={20}
                    className="w-full bg-white/50 border border-[#333]/10 px-4 py-3 text-center text-lg font-mono font-bold text-[#1c1917] focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm placeholder:text-[#333]/20 tracking-[0.3em]"
                    placeholder="123456"
                    autoFocus
                  />
                  <p className="text-[9px] text-[#333]/40 italic mt-1">
                    6-digit code or backup code (XXXX-XXXX)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying2FA || !totpCode}
                  className="w-full bg-[#333] text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-[#333]/10"
                >
                  {isVerifying2FA ? "Verifying..." : "Verify & Continue"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]/40 hover:text-[#333] transition-colors py-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Use a different account
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-8 border-t border-[#333]/5 text-center">
            <p className="text-[10px] text-[#333]/40 italic">
              Heritage Portfolio Access — Encrypted
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-[10px] text-[#333]/40 tracking-widest uppercase">
          &copy; 2024 Tasheen Boutique. All rights reserved.
        </div>
      </div>
    </div>
  );
}
