"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Key,
  Mail,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@tasheen/ui";
import { useCurrentIdentity } from "../hooks/useCurrentIdentity";
import { Modal } from "@/components/ui/Modal";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ChangeEmailForm } from "./ChangeEmailForm";

export function SecuritySettings() {
  // SSR-prefetched in `app/account/layout.tsx` and rehydrated via
  // HydrationBoundary, so first paint already has data. Middleware
  // ensures the user is authenticated by the time we render.
  const { data: identity } = useCurrentIdentity();
  const [activeModal, setActiveModal] = useState<"password" | "email" | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
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

      <div className="grid grid-cols-1 gap-0 border border-stone-100 bg-white shadow-sm divide-y divide-stone-100">
        {/* Authentication Card */}
        <section className="p-6 sm:p-10 lg:p-16 space-y-12">
          <div className="space-y-2">
            <h3 className="font-serif text-3xl text-charcoal italic">Authentication</h3>
            <p className="text-[9px] text-stone-400 uppercase tracking-[0.3em] font-bold">Primary Member Access</p>
          </div>

          <div className="divide-y divide-stone-50">
            {/* Password Item */}
            <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="flex items-start gap-5">
                <div className="mt-1 p-3 bg-stone-50 text-stone-400 rounded-full group-hover:bg-charcoal group-hover:text-gold transition-colors duration-500">
                  <Key className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-charcoal uppercase tracking-wider">Password</p>
                  <p className="text-sm text-stone-400">Regularly updating your password is recommended for optimal security.</p>
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
                className="self-start sm:self-center border border-stone-200 hover:border-gold hover:text-gold"
              >
                Update Password
              </Button>
            </div>

            {/* Email Item */}
            <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="flex items-start gap-5">
                <div className="mt-1 p-3 bg-stone-50 text-stone-400 rounded-full group-hover:bg-charcoal group-hover:text-gold transition-colors duration-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-charcoal uppercase tracking-[0.2em]">Email Correspondence</p>
                  <p className="text-sm text-charcoal font-serif italic">{identity?.email}</p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">Primary channel for artisanal notifications.</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setActiveModal("email")}
                className="self-start sm:self-center border border-stone-200 hover:border-gold hover:text-gold"
              >
                Change Email
              </Button>
            </div>
          </div>
        </section>

        {/* Account Integrity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-stone-100 border-t border-stone-100">
          {/* Recovery Card */}
          <div className="p-6 sm:p-10 lg:p-12 space-y-6 hover:bg-stone-50/50 transition-colors duration-700">
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
    </div>
  );
}
