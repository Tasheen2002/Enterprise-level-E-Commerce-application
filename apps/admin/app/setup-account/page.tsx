"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, unwrap } from "../../lib/api-client";
import { setAuthToken } from "../../lib/auth";
import { Eye, EyeOff } from "lucide-react";

export default function SetupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token found. Please check your invitation link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Security key must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.POST("/api/v1/admin/invitations/accept", {
        body: {
          token: token as string,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }
      });

      const result = unwrap(response.data as any) as any;
      setAuthToken(result.accessToken);
      setIsSuccess(true);
      
      // Short delay before redirecting to dashboard
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to set up account. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] text-center">
          <div className="bg-[#EBE6D9] border border-[#333]/5 p-12 rounded-sm shadow-xl">
            <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif italic text-3xl text-[#333] mb-4">Credentials Commissioned</h1>
            <p className="text-sm text-[#333]/60 leading-relaxed">
              Your administrative identity has been verified and your access is now active. 
              Redirecting you to the Atelier...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-[500px]">
        {/* Branding */}
        <div className="text-center mb-12">
          <h1 className="font-serif italic text-4xl text-[#333] mb-2 tracking-tight">
            Atelier Setup
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#333]/60 font-bold">
            Commission Your Credentials
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-[#EBE6D9] border border-[#333]/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 rounded-sm">
          <p className="text-xs text-[#333]/60 mb-8 text-center leading-relaxed">
            Welcome to the Slipperze team. Please finalize your administrative profile below to gain access to the Atelier.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#333]/60 font-bold block">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white/50 border border-[#333]/10 px-4 py-3 text-sm focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm"
                  placeholder="Artisan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#333]/60 font-bold block">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white/50 border border-[#333]/10 px-4 py-3 text-sm focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm"
                  placeholder="Master"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#333]/60 font-bold block">New Security Key</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/50 border border-[#333]/10 px-4 py-3 text-sm focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm placeholder:text-[#333]/20 pr-10"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333]/40 hover:text-[#333] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#333]/60 font-bold block">Confirm Key</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-white/50 border border-[#333]/10 px-4 py-3 text-sm focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm placeholder:text-[#333]/20 pr-10"
                  placeholder="Repeat key"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333]/40 hover:text-[#333] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full bg-[#333] text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-[#333]/10"
            >
              {isLoading ? "Commissioning..." : "Finalize Profile"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#333]/5 text-center">
            <p className="text-[10px] text-[#333]/40 italic">
              Encrypted Credential Setup
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-[#333]/40 tracking-widest uppercase">
          Artisanal Excellence Since 2024
        </div>
      </div>
    </div>
  );
}
