"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Key,
  Mail,
  Phone,
  Smartphone,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@tasheen/ui";
import dynamic from "next/dynamic";
import { useCurrentIdentity } from "../hooks/useCurrentIdentity";
import { useUserProfile } from "../hooks/useUserProfile";
import { Modal } from "@/components/ui/Modal";
import { useQueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "../hooks/queryKeys";

const ChangePasswordForm = dynamic(() => import("./ChangePasswordForm").then(m => m.ChangePasswordForm), {
  loading: () => <div className="h-40 w-full animate-pulse bg-stone-50 rounded-xl" />
});

const ChangeEmailForm = dynamic(() => import("./ChangeEmailForm").then(m => m.ChangeEmailForm), {
  loading: () => <div className="h-32 w-full animate-pulse bg-stone-50 rounded-xl" />
});

const PhoneVerificationForm = dynamic(() => import("./PhoneVerificationForm").then(m => m.PhoneVerificationForm), {
  loading: () => <div className="h-48 w-full animate-pulse bg-stone-50 rounded-xl" />
});

const Setup2FAForm = dynamic(() => import("./Setup2FAForm").then(m => m.Setup2FAForm), {
  loading: () => <div className="h-64 w-full animate-pulse bg-stone-50 rounded-xl" />
});

const Disable2FAForm = dynamic(() => import("./Disable2FAForm").then(m => m.Disable2FAForm), {
  loading: () => <div className="h-32 w-full animate-pulse bg-stone-50 rounded-xl" />
});

const RegenerateBackupCodesForm = dynamic(() => import("./RegenerateBackupCodesForm").then(m => m.RegenerateBackupCodesForm), {
  loading: () => <div className="h-32 w-full animate-pulse bg-stone-50 rounded-xl" />
});

const ActiveSessionsList = dynamic(() => import("./ActiveSessionsList").then(m => m.ActiveSessionsList), {
  loading: () => <div className="h-20 w-full animate-pulse bg-stone-50 rounded-xl" />
});

export function SecuritySettings() {
  // SSR-prefetched in `app/account/layout.tsx` and rehydrated via
  // HydrationBoundary, so first paint already has data. Middleware
  // ensures the user is authenticated by the time we render.
  const { data: identity } = useCurrentIdentity();
  const { data: profile } = useUserProfile();
  const [activeModal, setActiveModal] = useState<
    | "password"
    | "email"
    | "phone"
    | "2fa-setup"
    | "2fa-disable"
    | "2fa-regenerate"
    | null
  >(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const twoFactorEnabled = !!(identity as any)?.twoFactorEnabled;

  const queryClient = useQueryClient();

  const handleSuccess = () => {
    // Invalidate identity (2FA status, verified flags) and profile (phone number)
    // to ensure the UI reflects the changes immediately after modal close.
    void queryClient.invalidateQueries({ queryKey: authQueryKeys.identity() });
    void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    
    setActiveModal(null);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 5000);
  };

  const formatExactDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Note: There is no dedicated `passwordChangedAt` field on the API.
  // We only show "Last updated" after the user explicitly changes their
  // password during this session (handled via `isSuccess` state below).

  return (
    <div className="max-w-4xl space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-gold">
          <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
          <h1 className="text-[9px] font-bold tracking-[0.4em] uppercase">Vault Security</h1>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-charcoal leading-tight italic">
          Security & Access
        </h2>
        <p className="text-stone-400 max-w-2xl text-[11px] uppercase tracking-[0.2em] font-bold leading-relaxed">
          Safeguard your artisanal credentials and review active member sessions.
        </p>
      </header>

      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Your security credentials have been updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-0 border border-sand/20 bg-ivory divide-y divide-sand/20 shadow-sm">
        {/* Authentication Card */}
        <section className="p-6 sm:p-10 lg:p-16 space-y-12">
          <div className="space-y-2">
            <h3 className="font-serif text-3xl text-charcoal italic">Authentication</h3>
            <p className="text-[9px] text-stone-400 uppercase tracking-[0.3em] font-bold">Primary Member Access</p>
          </div>

          <div className="divide-y divide-sand/10">
            {/* Password Item */}
            <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="flex items-start gap-5">
                <div className="mt-1 p-3 bg-white text-stone-400 rounded-full group-hover:bg-charcoal group-hover:text-gold transition-colors duration-500 shadow-sm">
                  <Key className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-charcoal uppercase tracking-[0.2em]">Password</p>
                  <p className="text-sm text-stone-400 max-w-sm leading-relaxed">Regularly updating your password is recommended for optimal security.</p>
                  {isSuccess && (
                    <p className="text-[10px] text-stone-300 font-medium italic mt-1 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Last updated: {formatExactDate(new Date().toISOString())}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setActiveModal("password")}
                className="self-start sm:self-center border border-sand/30 hover:border-gold hover:text-gold text-[10px] uppercase tracking-widest font-bold"
              >
                Update Password
              </Button>
            </div>

            {/* Email Item */}
            <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="flex items-start gap-5">
                <div className="mt-1 p-3 bg-white text-stone-400 rounded-full group-hover:bg-charcoal group-hover:text-gold transition-colors duration-500 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-charcoal uppercase tracking-[0.2em]">Email Correspondence</p>
                  <p className="text-sm text-charcoal font-serif italic">{identity?.email}</p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">Primary channel for artisanal notifications.</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setActiveModal("email")}
                className="self-start sm:self-center border border-sand/30 hover:border-gold hover:text-gold text-[10px] uppercase tracking-widest font-bold"
              >
                Change Email
              </Button>
            </div>

            {/* Phone Item */}
            <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="flex items-start gap-5">
                <div className="mt-1 p-3 bg-white text-stone-400 rounded-full group-hover:bg-charcoal group-hover:text-gold transition-colors duration-500 shadow-sm">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-charcoal uppercase tracking-[0.2em]">Mobile Number</p>
                  <p className="text-sm text-charcoal font-serif italic">
                    {profile?.phone && profile.phone.length > 0
                      ? profile.phone
                      : "Not set"}
                  </p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Verified mobile numbers unlock SMS-based account recovery and order alerts.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setActiveModal("phone")}
                className="self-start sm:self-center border border-sand/30 hover:border-gold hover:text-gold text-[10px] uppercase tracking-widest font-bold"
              >
                Verify Phone
              </Button>
            </div>

            {/* Two-Factor Authentication Item */}
            <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="flex items-start gap-5">
                <div className="mt-1 p-3 bg-white text-stone-400 rounded-full group-hover:bg-charcoal group-hover:text-gold transition-colors duration-500 shadow-sm">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-charcoal uppercase tracking-[0.2em]">
                      Two-Factor Authentication
                    </p>
                    {twoFactorEnabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-[0.15em]">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal font-serif italic">
                    {twoFactorEnabled
                      ? "Authenticator app + 10 single-use backup codes"
                      : "Off"}
                  </p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Adds a 6-digit code from your authenticator app on every sign-in.
                  </p>
                </div>
              </div>
              {twoFactorEnabled ? (
                <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setActiveModal("2fa-regenerate")}
                    className="border border-sand/30 hover:border-gold hover:text-gold text-[10px] uppercase tracking-widest font-bold"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                    New Codes
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setActiveModal("2fa-disable")}
                    className="border border-burgundy/20 text-burgundy/70 hover:border-burgundy hover:text-burgundy text-[10px] uppercase tracking-widest font-bold"
                  >
                    Disable
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setActiveModal("2fa-setup")}
                  className="self-start sm:self-center border border-sand/30 hover:border-gold hover:text-gold text-[10px] uppercase tracking-widest font-bold"
                >
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Account Integrity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-sand/20 border-t border-sand/20 bg-ivory/20">
          {/* Recovery Card */}
          <div className="p-6 sm:p-10 lg:p-12 space-y-6 hover:bg-ivory transition-colors duration-700">
             <div className="flex items-center gap-3 text-charcoal">
                <ShieldAlert className="h-5 w-5 stroke-[1.5]" />
                <h4 className="font-serif text-2xl italic text-charcoal">Account Integrity</h4>
             </div>
             <p className="text-[10px] text-stone-500 uppercase tracking-[0.15em] leading-relaxed font-bold">
               Monitor your member access logs and verify recovery protocols.
             </p>
             <button className="text-[9px] font-bold uppercase tracking-[0.3em] text-gold hover:text-charcoal transition-colors flex items-center gap-3 group">
               Review Security Log <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>

          {/* Deletion Card */}
          <div className="p-6 sm:p-10 lg:p-12 space-y-6 hover:bg-burgundy/[0.02] transition-colors duration-700">
             <div className="flex items-center gap-3 text-burgundy">
                <AlertTriangle className="h-5 w-5 stroke-[1.5]" />
                <h4 className="font-serif text-2xl italic">Privacy & Data</h4>
             </div>
             <p className="text-[10px] text-stone-500 uppercase tracking-[0.15em] leading-relaxed font-bold">
               Manage your artisanal preferences or permanently close your registry.
             </p>
             <Link 
               href="/account/delete"
               className="text-[9px] font-bold uppercase tracking-[0.3em] text-burgundy/60 hover:text-burgundy transition-colors flex items-center gap-3 group"
             >
               Account Deletion <ExternalLink className="h-3 w-3" />
             </Link>
          </div>
        </div>
      </div>

      {/* Active Sessions Section */}
      <div className="border border-sand/20 bg-ivory shadow-sm overflow-hidden">
        <div className="p-6 sm:p-10 lg:p-16 border-b border-sand/20 bg-ivory/20">
          <div className="space-y-2">
            <h3 className="font-serif text-3xl text-charcoal italic flex items-center gap-4">
              <Smartphone className="h-6 w-6 text-gold stroke-[1.5]" />
              Active Sessions
            </h3>
            <p className="mt-1 text-[9px] text-stone-500 uppercase tracking-[0.4em] font-bold">
              Current Member Access Registry
            </p>
          </div>
        </div>
        
        <div className="p-6 sm:p-10 lg:p-16">
          <ActiveSessionsList />
        </div>
      </div>

      {/* Modals — only mount when the matching modal is active so the
          form components and their RHF/zod subtree are not reconciled on
          every render. */}
      {activeModal === "password" && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="Update Security"
        >
          <ChangePasswordForm onSuccess={handleSuccess} />
        </Modal>
      )}

      {activeModal === "email" && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="Update Email Address"
        >
          <ChangeEmailForm onSuccess={handleSuccess} />
        </Modal>
      )}

      {activeModal === "phone" && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="Verify Phone Number"
        >
          <PhoneVerificationForm onSuccess={() => handleSuccess()} />
        </Modal>
      )}

      {activeModal === "2fa-setup" && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="Enable Two-Factor"
        >
          <Setup2FAForm onSuccess={handleSuccess} />
        </Modal>
      )}

      {activeModal === "2fa-disable" && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="Disable Two-Factor"
        >
          <Disable2FAForm onSuccess={handleSuccess} />
        </Modal>
      )}

      {activeModal === "2fa-regenerate" && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="New Backup Codes"
        >
          <RegenerateBackupCodesForm onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
}
